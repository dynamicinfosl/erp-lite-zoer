-- FIX: Restringir funções SECURITY DEFINER executáveis por anon/authenticated
-- Projeto: lfxietcasaooenffdodr
-- Aplicar apenas após validação e aprovação do usuário

-- ============================================================
-- 1. Funções usadas por RLS e login: manter EXECUTE para authenticated,
--    revogar de anon. Adicionar proteção interna onde possível.
-- ============================================================

-- is_superadmin() e get_current_tenant_id() são usadas em dezenas de policies RLS.
-- Se revogar de authenticated, todas as policies de tenant param de funcionar.
REVOKE EXECUTE ON FUNCTION public.is_superadmin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_superadmin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_current_tenant_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_current_tenant_id() FROM anon;

-- get_user_tenant() é chamada pelo AuthContext.tsx no login (supabase.rpc).
-- Mantém EXECUTE para authenticated, mas só pode consultar o próprio usuário.
REVOKE EXECUTE ON FUNCTION public.get_user_tenant(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_tenant(uuid) FROM anon;

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
  -- Só permite consultar o próprio tenant, evitando vazamento entre usuários
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

-- ============================================================
-- 2. Funções administrativas/internas: revogar de anon e authenticated.
--    Devem ser executadas apenas por postgres/service_role.
-- ============================================================

-- link_user_to_tenant: vincula qualquer usuário a qualquer tenant.
REVOKE EXECUTE ON FUNCTION public.link_user_to_tenant(text, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.link_user_to_tenant(text, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.link_user_to_tenant(text, uuid, text) FROM authenticated;

-- auto_create_subscription: trigger interno na tabela tenants.
REVOKE EXECUTE ON FUNCTION public.auto_create_subscription() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_create_subscription() FROM anon;
REVOKE EXECUTE ON FUNCTION public.auto_create_subscription() FROM authenticated;

-- check_expired_subscriptions: função de cron/job externo; atualiza subscriptions.
REVOKE EXECUTE ON FUNCTION public.check_expired_subscriptions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_expired_subscriptions() FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_expired_subscriptions() FROM authenticated;

-- get_all_system_users: retorna todos os usuários de todos os tenants.
REVOKE EXECUTE ON FUNCTION public.get_all_system_users() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_all_system_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_all_system_users() FROM authenticated;

-- ============================================================
-- 3. Garantir que postgres e service_role continuam executando
-- ============================================================
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO postgres;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO postgres;
GRANT EXECUTE ON FUNCTION public.get_user_tenant(uuid) TO postgres;
GRANT EXECUTE ON FUNCTION public.link_user_to_tenant(text, uuid, text) TO postgres;
GRANT EXECUTE ON FUNCTION public.auto_create_subscription() TO postgres;
GRANT EXECUTE ON FUNCTION public.check_expired_subscriptions() TO postgres;
GRANT EXECUTE ON FUNCTION public.get_all_system_users() TO postgres;

GRANT EXECUTE ON FUNCTION public.is_superadmin() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_tenant(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.link_user_to_tenant(text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_create_subscription() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_expired_subscriptions() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_all_system_users() TO service_role;
