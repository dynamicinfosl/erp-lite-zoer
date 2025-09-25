-- ===================================================================
-- DESABILITAR RLS TEMPORARIAMENTE PARA RESOLVER RECURSÃO
-- EXECUTE NO SUPABASE SQL EDITOR
-- ===================================================================

-- DESABILITAR RLS COMPLETAMENTE EM TODAS AS TABELAS
ALTER TABLE public.user_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements DISABLE ROW LEVEL SECURITY;

-- REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.user_memberships;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.tenants;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.customers;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.products;
DROP POLICY IF EXISTS "Users can view own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can insert own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can update own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can view own stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can insert own stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can update own stock_movements" ON public.stock_movements;

-- VERIFICAR STATUS - RLS DEVE ESTAR DESABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_memberships', 'tenants', 'customers', 'products', 'sales', 'stock_movements')
ORDER BY tablename;

SELECT 'RLS DESABILITADO TEMPORARIAMENTE - SEM RECURSÃO!' as status;


