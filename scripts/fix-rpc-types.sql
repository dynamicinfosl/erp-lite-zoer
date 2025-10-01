-- ============================================
-- CORRIGIR TIPOS DA RPC
-- ============================================

-- Deletar função com tipo errado
DROP FUNCTION IF EXISTS get_user_tenant(uuid);

-- Criar com tipos corretos (VARCHAR ao invés de TEXT)
CREATE OR REPLACE FUNCTION get_user_tenant(p_user_id uuid)
RETURNS TABLE (
  tenant_id uuid,
  tenant_name varchar(255),
  tenant_slug varchar(255),
  tenant_status varchar(50),
  tenant_trial_ends_at timestamp with time zone,
  user_role varchar(50),
  membership_id uuid
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant_id uuid;
  v_membership_id uuid;
  v_user_role varchar(50);
BEGIN
  -- Primeira query: buscar membership (COM ÍNDICE)
  SELECT um.tenant_id, um.id, um.role
  INTO v_tenant_id, v_membership_id, v_user_role
  FROM user_memberships um
  WHERE um.user_id = p_user_id
    AND um.is_active = true
  LIMIT 1;
  
  -- Se não encontrou, retornar vazio
  IF v_tenant_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Segunda query: buscar tenant (COM ÍNDICE)
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

-- Conceder todas as permissões
GRANT EXECUTE ON FUNCTION get_user_tenant(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_user_tenant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tenant(uuid) TO service_role;

-- Testar com seu usuário
SELECT * FROM get_user_tenant('5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01');


