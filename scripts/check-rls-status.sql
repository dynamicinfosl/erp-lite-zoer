-- =============================================
-- VERIFICAR STATUS DO RLS (Row Level Security)
-- =============================================

-- 1. Verificar quais tabelas têm RLS ativo
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS ATIVO'
    ELSE '🔓 RLS DESATIVADO'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Verificar políticas RLS existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ Leitura'
    WHEN cmd = 'INSERT' THEN '➕ Inserção'
    WHEN cmd = 'UPDATE' THEN '✏️ Atualização'
    WHEN cmd = 'DELETE' THEN '🗑️ Exclusão'
    ELSE cmd
  END as operation_type
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Contar políticas por tabela
SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 4. Resumo geral
SELECT 
  COUNT(DISTINCT tablename) as total_tables_with_rls,
  COUNT(*) as total_policies,
  STRING_AGG(DISTINCT tablename, ', ') as tables
FROM pg_policies 
WHERE schemaname = 'public';

-- =============================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- =============================================
-- 
-- Se RLS estiver DESATIVADO (🔓):
--   ✅ Melhor para desenvolvimento
--   ✅ Mais fácil de debugar
--   ⚠️ Menos seguro
--
-- Se RLS estiver ATIVO (🔒):
--   ✅ Máxima segurança
--   ⚠️ Mais difícil de debugar
--   ⚠️ Pode impactar performance
--
-- RECOMENDAÇÃO:
--   - Desenvolvimento: RLS DESATIVADO
--   - Produção: RLS ATIVO
-- =============================================

