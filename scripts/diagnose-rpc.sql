-- ============================================
-- DIAGNÓSTICO COMPLETO DA RPC
-- ============================================

-- 1. Verificar se a função existe
SELECT 
  routine_name,
  routine_type,
  security_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_user_tenant';

-- 2. Verificar permissões da função
SELECT 
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'get_user_tenant';

-- 3. Verificar RLS nas tabelas
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_memberships', 'tenants');

-- 4. Testar a função diretamente
SELECT * FROM get_user_tenant('5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01');

-- 5. Verificar se há políticas RLS ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_memberships', 'tenants');


