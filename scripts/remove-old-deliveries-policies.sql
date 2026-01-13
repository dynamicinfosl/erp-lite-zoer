-- =============================================
-- REMOVER POLÍTICAS ANTIGAS DE deliveries
-- =============================================
-- Remove as políticas antigas que dependem de auth.uid()
-- e mantém apenas as políticas baseadas em tenant_id

-- Remover políticas antigas que verificam user_id = auth.uid()
DROP POLICY IF EXISTS "deliveries_delete_policy" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_insert_policy" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_select_policy" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_update_policy" ON public.deliveries;

-- Verificar políticas restantes (devem ser apenas as baseadas em tenant_id)
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
WHERE tablename = 'deliveries'
ORDER BY policyname;

-- Resultado esperado: apenas 4 políticas baseadas em tenant_id:
-- - Enable delete access for deliveries by tenant
-- - Enable insert access for deliveries by tenant
-- - Enable read access for deliveries by tenant
-- - Enable update access for deliveries by tenant
