-- =============================================
-- DESABILITAR RLS NA TABELA deliveries
-- =============================================
-- Execute este script no Supabase SQL Editor para permitir
-- inserção de entregas via API usando service_role key

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view deliveries from their tenant" ON public.deliveries;
DROP POLICY IF EXISTS "Users can insert deliveries in their tenant" ON public.deliveries;
DROP POLICY IF EXISTS "Users can update deliveries from their tenant" ON public.deliveries;
DROP POLICY IF EXISTS "Users can delete deliveries from their tenant" ON public.deliveries;

-- 2. Desabilitar RLS
ALTER TABLE public.deliveries DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se foi desabilitado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'deliveries';

-- 4. Verificar se não há mais políticas
SELECT COUNT(*) as remaining_policies
FROM pg_policies 
WHERE tablename = 'deliveries';

-- Resultado esperado:
-- - rls_enabled deve ser false
-- - remaining_policies deve ser 0
