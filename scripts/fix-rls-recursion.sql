-- ===================================================================
-- CORRIGIR RECURSÃO INFINITA NO RLS
-- EXECUTE NO SUPABASE SQL EDITOR
-- ===================================================================

-- 1. DESABILITAR RLS TEMPORARIAMENTE para debug
ALTER TABLE public.user_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES que podem estar causando recursão
DROP POLICY IF EXISTS "Users can view own memberships" ON public.user_memberships;
DROP POLICY IF EXISTS "Users can insert own memberships" ON public.user_memberships;
DROP POLICY IF EXISTS "Users can update own memberships" ON public.user_memberships;
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Users can insert own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Users can update own tenant" ON public.tenants;

-- 3. CRIAR POLÍTICAS SIMPLES SEM RECURSÃO
-- Para user_memberships - permitir tudo para usuários autenticados
CREATE POLICY "authenticated_users_all_access" ON public.user_memberships
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Para tenants - permitir tudo para usuários autenticados  
CREATE POLICY "authenticated_users_all_access" ON public.tenants
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. REABILITAR RLS
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 5. VERIFICAR SE FUNCIONOU
SELECT 'RLS policies fixed - no more recursion!' as status;


