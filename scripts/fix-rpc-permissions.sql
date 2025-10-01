-- ============================================
-- FIX: Permissões da função get_user_tenant
-- ============================================

-- 1. RECRIAR a função com SECURITY DEFINER
-- Isso faz a função rodar com permissões do criador (admin)
DROP FUNCTION IF EXISTS get_user_tenant(uuid);

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
SECURITY DEFINER  -- ← IMPORTANTE: Roda com permissões elevadas
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,
    t.status as tenant_status,
    t.trial_ends_at as tenant_trial_ends_at,
    um.role as user_role,
    um.id as membership_id
  FROM user_memberships um
  INNER JOIN tenants t ON t.id = um.tenant_id
  WHERE um.user_id = p_user_id
    AND um.is_active = true
  LIMIT 1;
END;
$$;

-- 2. Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION get_user_tenant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tenant(uuid) TO anon;

-- 3. Conceder permissões de SELECT nas tabelas necessárias
GRANT SELECT ON user_memberships TO authenticated;
GRANT SELECT ON tenants TO authenticated;

-- 4. Confirmar criação
SELECT 'Função get_user_tenant criada com sucesso!' as status;


