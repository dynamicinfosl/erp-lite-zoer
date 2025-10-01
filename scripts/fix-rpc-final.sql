-- ============================================
-- SOLUÇÃO DEFINITIVA: RPC sem RLS
-- ============================================

-- 1. DELETAR função anterior
DROP FUNCTION IF EXISTS get_user_tenant(uuid);

-- 2. CRIAR função com bypass de RLS
CREATE OR REPLACE FUNCTION get_user_tenant(p_user_id uuid)
RETURNS TABLE (
  tenant_id uuid,
  tenant_name text,
  tenant_slug text,
  tenant_status text,
  tenant_trial_ends_at timestamp with time zone,
  user_role text,
  membership_id uuid
)
SECURITY DEFINER  -- Roda com permissões do criador
SET search_path = public, pg_temp  -- Segurança
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant_id uuid;
  v_tenant_name text;
  v_tenant_slug text;
  v_tenant_status text;
  v_tenant_trial_ends_at timestamp with time zone;
  v_user_role text;
  v_membership_id uuid;
BEGIN
  -- Desabilitar RLS temporariamente para esta função
  -- Como a função roda como SECURITY DEFINER, ela tem permissão de admin
  
  -- Buscar membership
  SELECT um.id, um.tenant_id, um.role
  INTO v_membership_id, v_tenant_id, v_user_role
  FROM public.user_memberships um
  WHERE um.user_id = p_user_id
    AND um.is_active = true
  LIMIT 1;
  
  -- Se não encontrou membership, retornar vazio
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Buscar tenant
  SELECT t.name, t.slug, t.status, t.trial_ends_at
  INTO v_tenant_name, v_tenant_slug, v_tenant_status, v_tenant_trial_ends_at
  FROM public.tenants t
  WHERE t.id = v_tenant_id;
  
  -- Se não encontrou tenant, retornar vazio
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Retornar dados
  tenant_id := v_tenant_id;
  tenant_name := v_tenant_name;
  tenant_slug := v_tenant_slug;
  tenant_status := v_tenant_status;
  tenant_trial_ends_at := v_tenant_trial_ends_at;
  user_role := v_user_role;
  membership_id := v_membership_id;
  
  RETURN NEXT;
END;
$$;

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION get_user_tenant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tenant(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_user_tenant(uuid) TO service_role;

-- 4. Testar a função
SELECT * FROM get_user_tenant('5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01');


