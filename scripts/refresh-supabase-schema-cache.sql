-- =============================================
-- ATUALIZAR SCHEMA CACHE DO SUPABASE
-- =============================================
-- Este script força a atualização do schema cache do PostgREST
-- Execute no Supabase SQL Editor após adicionar/modificar colunas

-- Nota: O Supabase atualiza o schema cache automaticamente,
-- mas pode levar alguns minutos. Este script ajuda a garantir
-- que as mudanças sejam reconhecidas.

-- 1. Verificar se a coluna tenant_id existe na tabela deliveries
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'deliveries' 
  AND column_name = 'tenant_id';

-- 2. Verificar todos os índices relacionados
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'deliveries'
  AND indexdef LIKE '%tenant_id%';

-- 3. Verificar se há políticas RLS que podem estar bloqueando
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'deliveries';

-- 4. Se necessário, recriar o índice para forçar atualização do cache
DROP INDEX IF EXISTS idx_deliveries_tenant;
CREATE INDEX IF NOT EXISTS idx_deliveries_tenant 
  ON public.deliveries(tenant_id);

-- 5. Verificar estrutura completa da tabela deliveries
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'deliveries'
ORDER BY ordinal_position;
