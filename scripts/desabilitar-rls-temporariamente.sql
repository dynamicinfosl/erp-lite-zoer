-- ============================================
-- DESABILITAR RLS TEMPORARIAMENTE (APENAS PARA TESTE)
-- ============================================
-- ATENÇÃO: Use apenas para diagnóstico. Reabilite após verificar o problema.

-- Desabilitar RLS na tabela plans
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS na tabela subscriptions
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Verificar status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('plans', 'subscriptions');

-- ============================================
-- REABILITAR RLS (APÓS DIAGNÓSTICO)
-- ============================================

-- Reabilitar RLS na tabela plans
-- ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Reabilitar RLS na tabela subscriptions
-- ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

