-- =============================================
-- CORRIGIR RLS DA TABELA ORDENS
-- =============================================

-- 1. Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their tenant orders" ON public.ordens;
DROP POLICY IF EXISTS "Users can insert orders for their tenant" ON public.ordens;
DROP POLICY IF EXISTS "Users can update their tenant orders" ON public.ordens;
DROP POLICY IF EXISTS "Users can delete their tenant orders" ON public.ordens;

-- 2. Política simples para desenvolvimento - permitir tudo para usuários autenticados
CREATE POLICY "Allow all for authenticated users" ON public.ordens 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

-- 3. Verificar se RLS está habilitado
ALTER TABLE public.ordens ENABLE ROW LEVEL SECURITY;

-- 4. Teste - verificar se existem dados
SELECT COUNT(*) as total_ordens FROM public.ordens;

-- 5. Mostrar políticas ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'ordens';
