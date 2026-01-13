-- =============================================
-- DESABILITAR RLS NA TABELA delivery_manifests
-- =============================================
-- Execute este script no Supabase SQL Editor para permitir
-- inserção de romaneios via API usando service_role key

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view delivery_manifests from their tenant" ON public.delivery_manifests;
DROP POLICY IF EXISTS "Users can insert delivery_manifests in their tenant" ON public.delivery_manifests;
DROP POLICY IF EXISTS "Users can update delivery_manifests from their tenant" ON public.delivery_manifests;
DROP POLICY IF EXISTS "Users can delete delivery_manifests from their tenant" ON public.delivery_manifests;
DROP POLICY IF EXISTS "delivery_manifests_select_policy" ON public.delivery_manifests;
DROP POLICY IF EXISTS "delivery_manifests_insert_policy" ON public.delivery_manifests;
DROP POLICY IF EXISTS "delivery_manifests_update_policy" ON public.delivery_manifests;
DROP POLICY IF EXISTS "delivery_manifests_delete_policy" ON public.delivery_manifests;
DROP POLICY IF EXISTS "Enable read access for delivery_manifests by tenant" ON public.delivery_manifests;
DROP POLICY IF EXISTS "Enable insert access for delivery_manifests by tenant" ON public.delivery_manifests;
DROP POLICY IF EXISTS "Enable update access for delivery_manifests by tenant" ON public.delivery_manifests;
DROP POLICY IF EXISTS "Enable delete access for delivery_manifests by tenant" ON public.delivery_manifests;

-- 2. Desabilitar RLS
ALTER TABLE public.delivery_manifests DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se foi desabilitado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'delivery_manifests';

-- 4. Verificar se não há mais políticas
SELECT COUNT(*) as remaining_policies
FROM pg_policies 
WHERE tablename = 'delivery_manifests';

-- Resultado esperado:
-- - rls_enabled deve ser false
-- - remaining_policies deve ser 0
