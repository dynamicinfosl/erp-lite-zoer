-- =============================================
-- DESABILITAR RLS COMPLETAMENTE (DESENVOLVIMENTO)
-- Execute no SQL Editor do Supabase
-- =============================================

-- Desabilitar RLS em todas as tabelas para desenvolvimento
ALTER TABLE public.user_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Verificar se desabilitou
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_memberships', 'tenants', 'customers', 'products');

-- Deve mostrar rowsecurity = false para todas


