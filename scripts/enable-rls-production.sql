-- =============================================
-- ATIVAR RLS PARA PRODUÇÃO
-- ⚠️ EXECUTAR APENAS QUANDO FOR PARA PRODUÇÃO
-- =============================================

-- =============================================
-- 1. ATIVAR RLS EM TODAS AS TABELAS
-- =============================================

ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. POLÍTICAS PARA USER_MEMBERSHIPS
-- =============================================

CREATE POLICY "Users can view own memberships" ON public.user_memberships
    FOR SELECT
    USING (user_id = auth.uid());

-- =============================================
-- 3. POLÍTICAS PARA TENANTS
-- =============================================

CREATE POLICY "Users can view own tenant" ON public.tenants
    FOR SELECT
    USING (
        id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =============================================
-- 4. POLÍTICAS PARA CUSTOMERS
-- =============================================

CREATE POLICY "Users can view own tenant customers" ON public.customers
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can insert own tenant customers" ON public.customers
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can update own tenant customers" ON public.customers
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can delete own tenant customers" ON public.customers
    FOR DELETE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =============================================
-- 5. POLÍTICAS PARA PRODUCTS
-- =============================================

CREATE POLICY "Users can view own tenant products" ON public.products
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can insert own tenant products" ON public.products
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can update own tenant products" ON public.products
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can delete own tenant products" ON public.products
    FOR DELETE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =============================================
-- 6. CRIAR ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índice para acelerar verificação de memberships (usado nas políticas)
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_active 
ON public.user_memberships(user_id, tenant_id) 
WHERE is_active = true;

-- Índices compostos para queries frequentes
CREATE INDEX IF NOT EXISTS idx_customers_tenant_active 
ON public.customers(tenant_id) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_tenant_active 
ON public.products(tenant_id) 
WHERE is_active = true;

-- =============================================
-- 7. TESTAR ISOLAMENTO
-- =============================================

-- Verificar se RLS está ativo
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_memberships', 'tenants', 'customers', 'products');

-- Deve mostrar rowsecurity = true para todas

-- =============================================
-- ⚠️ LEMBRETE IMPORTANTE
-- =============================================
-- Após ativar RLS, TESTAR:
-- 1. Login com diferentes usuários
-- 2. Verificar que cada um vê apenas seus dados
-- 3. Tentar acessar dados de outro tenant (deve dar erro)
-- =============================================


