-- ROLLBACK: Restaurar permissões originais das funções SECURITY DEFINER
-- Projeto: lfxietcasaooenffdodr
-- Executar caso a migration 03d cause problemas

-- Reverte as proteções de EXECUTE (inclui PUBLIC para restaurar o comportamento original do schema)
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_tenant(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_tenant(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_tenant(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.link_user_to_tenant(text, uuid, text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_user_to_tenant(text, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.link_user_to_tenant(text, uuid, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.auto_create_subscription() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.auto_create_subscription() TO anon;
GRANT EXECUTE ON FUNCTION public.auto_create_subscription() TO authenticated;

GRANT EXECUTE ON FUNCTION public.check_expired_subscriptions() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_expired_subscriptions() TO anon;
GRANT EXECUTE ON FUNCTION public.check_expired_subscriptions() TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_all_system_users() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_system_users() TO anon;
GRANT EXECUTE ON FUNCTION public.get_all_system_users() TO authenticated;

-- Remove a proteção interna de auth.uid() de get_user_tenant
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
