-- ===================================================================
-- COPIE E COLE ESTE CÓDIGO NO SQL EDITOR DO SUPABASE PARA CORRIGIR O RLS
-- ===================================================================

-- 1. CRIAR FUNÇÕES ÚTEIS PRIMEIRO
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT um.tenant_id 
        FROM public.user_memberships um 
        WHERE um.user_id = auth.uid() 
        AND um.is_active = true 
        LIMIT 1
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 
        FROM public.user_memberships um 
        WHERE um.user_id = auth.uid() 
        AND um.role = 'superadmin'
        AND um.is_active = true
    );
END;
$$;

-- 2. CRIAR POLÍTICAS PARA TENANTS (permitir INSERT para usuários autenticados)
DROP POLICY IF EXISTS "Allow authenticated users to insert tenants" ON public.tenants;
CREATE POLICY "Allow authenticated users to insert tenants"
ON public.tenants FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their tenants" ON public.tenants;
CREATE POLICY "Users can view their tenants"
ON public.tenants FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT tenant_id 
        FROM public.user_memberships 
        WHERE user_id = auth.uid() AND is_active = true
    )
    OR public.is_superadmin()
);

DROP POLICY IF EXISTS "Owners can update their tenant" ON public.tenants;
CREATE POLICY "Owners can update their tenant"
ON public.tenants FOR UPDATE
TO authenticated
USING (
    id IN (
        SELECT tenant_id 
        FROM public.user_memberships 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
    OR public.is_superadmin()
)
WITH CHECK (
    id IN (
        SELECT tenant_id 
        FROM public.user_memberships 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
    OR public.is_superadmin()
);

-- 3. CRIAR POLÍTICAS PARA USER_MEMBERSHIPS (permitir INSERT para usuários autenticados)
DROP POLICY IF EXISTS "Allow authenticated users to insert memberships" ON public.user_memberships;
CREATE POLICY "Allow authenticated users to insert memberships"
ON public.user_memberships FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view memberships of their tenants" ON public.user_memberships;
CREATE POLICY "Users can view memberships of their tenants"
ON public.user_memberships FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM public.user_memberships 
        WHERE user_id = auth.uid() AND is_active = true
    )
    OR public.is_superadmin()
    OR user_id = auth.uid()
);

-- 4. CRIAR POLÍTICAS PARA PLANS (permitir leitura para todos os usuários autenticados)
DROP POLICY IF EXISTS "Allow authenticated users to view plans" ON public.plans;
CREATE POLICY "Allow authenticated users to view plans"
ON public.plans FOR SELECT
TO authenticated
USING (is_active = true OR public.is_superadmin());

-- 5. ATUALIZAR POLÍTICAS PARA CUSTOMERS (multi-tenant)
DROP POLICY IF EXISTS "Users can manage customers of their tenant" ON public.customers;
CREATE POLICY "Users can manage customers of their tenant"
ON public.customers
FOR ALL
TO authenticated
USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_superadmin()
    OR tenant_id IS NULL  -- Permitir acesso a dados sem tenant_id temporariamente
)
WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    OR public.is_superadmin()
    OR tenant_id IS NULL  -- Permitir inserção sem tenant_id temporariamente
);

-- 6. ATUALIZAR POLÍTICAS PARA PRODUCTS (multi-tenant)
DROP POLICY IF EXISTS "Users can manage products of their tenant" ON public.products;
CREATE POLICY "Users can manage products of their tenant"
ON public.products
FOR ALL
TO authenticated
USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_superadmin()
    OR tenant_id IS NULL  -- Permitir acesso a dados sem tenant_id temporariamente
)
WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    OR public.is_superadmin()
    OR tenant_id IS NULL  -- Permitir inserção sem tenant_id temporariamente
);

-- 7. TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_user_memberships_updated_at ON public.user_memberships;
CREATE TRIGGER update_user_memberships_updated_at
    BEFORE UPDATE ON public.user_memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 8. VERIFICAÇÃO FINAL
SELECT 'Políticas RLS criadas com sucesso!' as resultado;

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'user_memberships', 'plans', 'customers', 'products')
ORDER BY tablename, policyname;


