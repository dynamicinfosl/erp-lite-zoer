-- ============================================
-- ÍNDICES DE PERFORMANCE
-- Acelera consultas de membership e tenant
-- ============================================

-- 1. Índice em user_memberships para buscar por user_id rapidamente
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id 
ON user_memberships(user_id) 
WHERE is_active = true;

-- 2. Índice composto para query otimizada
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_tenant 
ON user_memberships(user_id, tenant_id, is_active);

-- 3. Índice em tenants para buscar por id
CREATE INDEX IF NOT EXISTS idx_tenants_id 
ON tenants(id);

-- 4. Verificar índices criados
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (tablename = 'user_memberships' OR tablename = 'tenants')
ORDER BY tablename, indexname;


