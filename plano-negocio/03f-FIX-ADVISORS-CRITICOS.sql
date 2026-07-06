-- FIX: Advisors críticos e search_path de funções SECURITY DEFINER
-- Projeto: lfxietcasaooenffdodr
-- Aplicar apenas após validação e aprovação do usuário

-- ============================================================
-- 1. Remover view SECURITY DEFINER não utilizada
-- ============================================================
DROP VIEW IF EXISTS public.cash_sessions_audit_view;

-- ============================================================
-- 2. Corrigir policies RLS permissivas
-- ============================================================

-- 2.1 tenants: não permitir INSERT irrestrito por authenticated
DROP POLICY IF EXISTS "Allow authenticated users to insert tenants" ON public.tenants;

-- 2.2 orders: substituir policy aberta por policy de tenant
DROP POLICY IF EXISTS "Allow all operations" ON public.orders;

CREATE POLICY "orders_tenant_policy" ON public.orders
  FOR ALL TO authenticated
  USING (tenant_id = get_current_tenant_id() OR is_superadmin())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_superadmin());

-- 2.3 tabelas legacy: remover policies permissivas
DROP POLICY IF EXISTS "refresh_tokens_access_policy" ON public.refresh_tokens;
DROP POLICY IF EXISTS "sessions_access_policy" ON public.sessions;
DROP POLICY IF EXISTS "user_passcode_access_policy" ON public.user_passcode;
DROP POLICY IF EXISTS "users_access_policy" ON public.users;

-- ============================================================
-- 3. Adicionar SET search_path às funções SECURITY DEFINER
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1
        FROM public.user_memberships um
        WHERE um.user_id = auth.uid()
        AND um.role = 'superadmin'
        AND um.is_active = true
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN (
        SELECT um.tenant_id
        FROM public.user_memberships um
        WHERE um.user_id = auth.uid()
        AND um.is_active = true
        LIMIT 1
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant(p_user_id uuid)
RETURNS TABLE(
  tenant_id uuid,
  tenant_name character varying,
  tenant_slug character varying,
  tenant_status character varying,
  tenant_trial_ends_at timestamp with time zone,
  user_role character varying,
  membership_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_id uuid;
  v_membership_id uuid;
  v_user_role varchar(50);
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN;
  END IF;

  SELECT um.tenant_id, um.id, um.role
  INTO v_tenant_id, v_membership_id, v_user_role
  FROM user_memberships um
  WHERE um.user_id = p_user_id
    AND um.is_active = true
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.slug,
    t.status,
    t.trial_ends_at,
    v_user_role,
    v_membership_id
  FROM tenants t
  WHERE t.id = v_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_user_to_tenant(p_user_email text, p_tenant_id uuid, p_role text DEFAULT 'owner'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_user_email
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Usuário não encontrado com o email: ' || p_user_email
        );
    END IF;

    INSERT INTO public.user_memberships (user_id, tenant_id, role, is_active)
    VALUES (v_user_id, p_tenant_id, p_role, true)
    ON CONFLICT (user_id, tenant_id)
    DO UPDATE SET
        role = p_role,
        is_active = true,
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'tenant_id', p_tenant_id,
        'role', p_role,
        'message', 'Usuário vinculado com sucesso!'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_create_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trial_plan_id UUID;
BEGIN
  SELECT id INTO trial_plan_id FROM plans WHERE slug = 'trial' AND is_active = true LIMIT 1;

  IF trial_plan_id IS NULL THEN
    RAISE WARNING 'Plano trial não encontrado, subscription não criada para tenant %', NEW.id;
    RETURN NEW;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM subscriptions WHERE tenant_id = NEW.id) THEN
    INSERT INTO subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end, trial_end)
    VALUES (
      NEW.id,
      trial_plan_id,
      'trial',
      now(),
      now() + INTERVAL '3 days',
      now() + INTERVAL '3 days'
    );

    INSERT INTO subscription_history (tenant_id, action, plan_id_to, period_start, period_end, notes)
    VALUES (
      NEW.id,
      'trial_started',
      trial_plan_id,
      now(),
      now() + INTERVAL '3 days',
      'Trial automático criado no cadastro do tenant'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_expired_subscriptions()
RETURNS TABLE(
  tenant_id uuid,
  tenant_name character varying,
  subscription_id uuid,
  old_status character varying,
  new_status character varying,
  expired_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec RECORD;
  grace_period INTERVAL := '7 days';
BEGIN
  FOR rec IN
    SELECT s.id as sub_id, s.tenant_id, s.status as sub_status,
           s.current_period_end, t.name as t_name
    FROM subscriptions s
    JOIN tenants t ON t.id = s.tenant_id
    WHERE s.status = 'active'
      AND s.current_period_end IS NOT NULL
      AND s.current_period_end < now()
  LOOP
    IF rec.current_period_end + grace_period < now() THEN
      UPDATE subscriptions SET status = 'canceled', updated_at = now()
      WHERE id = rec.sub_id;

      UPDATE tenants SET status = 'suspended', updated_at = now()
      WHERE id = rec.tenant_id;

      INSERT INTO subscription_history (subscription_id, tenant_id, action, notes)
      VALUES (rec.sub_id, rec.tenant_id, 'suspended',
              'Suspensão automática: período expirado em ' || rec.current_period_end::text || ' + 7 dias de carência');

      tenant_id := rec.tenant_id;
      tenant_name := rec.t_name;
      subscription_id := rec.sub_id;
      old_status := rec.sub_status;
      new_status := 'suspended';
      expired_at := rec.current_period_end;
      RETURN NEXT;
    ELSE
      UPDATE subscriptions SET status = 'past_due', updated_at = now()
      WHERE id = rec.sub_id AND status = 'active';

      IF rec.sub_status = 'active' THEN
        INSERT INTO subscription_history (subscription_id, tenant_id, action, notes)
        VALUES (rec.sub_id, rec.tenant_id, 'expired',
                'Expiração detectada: período expirou em ' || rec.current_period_end::text || '. Período de carência de 7 dias.');
      END IF;

      tenant_id := rec.tenant_id;
      tenant_name := rec.t_name;
      subscription_id := rec.sub_id;
      old_status := rec.sub_status;
      new_status := 'past_due';
      expired_at := rec.current_period_end;
      RETURN NEXT;
    END IF;
  END LOOP;

  FOR rec IN
    SELECT s.id as sub_id, s.tenant_id, s.status as sub_status,
           s.trial_end, t.name as t_name
    FROM subscriptions s
    JOIN tenants t ON t.id = s.tenant_id
    WHERE s.status = 'trialing'
      AND s.trial_end IS NOT NULL
      AND s.trial_end < now()
  LOOP
    UPDATE subscriptions SET status = 'past_due', updated_at = now()
    WHERE id = rec.sub_id;

    INSERT INTO subscription_history (subscription_id, tenant_id, action, notes)
    VALUES (rec.sub_id, rec.tenant_id, 'trial_expired',
            'Trial expirado em ' || rec.trial_end::text);

    tenant_id := rec.tenant_id;
    tenant_name := rec.t_name;
    subscription_id := rec.sub_id;
    old_status := rec.sub_status;
    new_status := 'trial_expired';
    expired_at := rec.trial_end;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_system_users()
RETURNS TABLE(
  id text,
  name text,
  email text,
  role text,
  status text,
  "lastLogin" text,
  "createdAt" text,
  phone text,
  department text,
  permissions text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        um.user_id::TEXT,
        COALESCE(t.name::TEXT, 'Usuário'::TEXT),
        COALESCE(t.email::TEXT, u.email::TEXT, 'Email não disponível'::TEXT),
        um.role::TEXT,
        CASE
            WHEN um.is_active AND (t.status = 'active' OR t.status = 'trial') THEN 'active'::TEXT
            ELSE 'inactive'::TEXT
        END,
        COALESCE(u.last_sign_in_at::TEXT, u.created_at::TEXT),
        u.created_at::TEXT,
        COALESCE((u.raw_user_meta_data->>'phone')::TEXT, ''::TEXT),
        COALESCE(t.slug::TEXT, 'N/A'::TEXT),
        ARRAY[]::TEXT[]
    FROM public.user_memberships um
    JOIN auth.users u ON u.id = um.user_id
    LEFT JOIN public.tenants t ON t.id = um.tenant_id
    ORDER BY u.created_at DESC;
END;
$$;
