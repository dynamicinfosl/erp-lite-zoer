-- ===================================================================
-- DESABILITAR RLS COMPLETAMENTE PARA DEBUG
-- EXECUTE NO SUPABASE SQL EDITOR
-- ===================================================================

-- DESABILITAR RLS EM TODAS AS TABELAS PROBLEMÁTICAS
ALTER TABLE public.user_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "authenticated_users_all_access" ON public.user_memberships;
DROP POLICY IF EXISTS "authenticated_users_all_access" ON public.tenants;
DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;

-- VERIFICAR STATUS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_memberships', 'tenants', 'customers', 'products')
ORDER BY tablename;

SELECT 'RLS completely disabled - no more recursion!' as status;


