-- =============================================
-- SETUP SAAS MULTI-TENANT DATABASE
-- =============================================

-- 1. TABELA DE TENANTS (empresas/clientes)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended', 'canceled')),
    trial_ends_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE MEMBROS POR TENANT
CREATE TABLE IF NOT EXISTS public.user_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'operator' CHECK (role IN ('superadmin', 'owner', 'admin', 'operator')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- 3. PLANOS DE ASSINATURA
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}', -- ex: {"max_users": 5, "max_products": 1000}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ASSINATURAS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.plans(id),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'unpaid')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id) -- um tenant tem uma assinatura ativa
);

-- 5. LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'login', etc
    entity_type VARCHAR(50), -- 'customer', 'product', 'sale', etc
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INSERIR PLANOS PADRÃO
-- =============================================

INSERT INTO public.plans (name, slug, description, price_monthly, price_yearly, features, limits) VALUES
('Gratuito', 'free', 'Plano trial com limitações', 0, 0, 
 '{"basic_features": true, "reports": false, "integrations": false}',
 '{"max_users": 1, "max_customers": 50, "max_products": 100, "max_sales_per_month": 100}'),
 
('Básico', 'basic', 'Ideal para pequenos negócios', 29.90, 299.90,
 '{"basic_features": true, "reports": true, "integrations": false, "support": "email"}',
 '{"max_users": 3, "max_customers": 500, "max_products": 1000, "max_sales_per_month": 1000}'),
 
('Profissional', 'pro', 'Para empresas em crescimento', 59.90, 599.90,
 '{"basic_features": true, "reports": true, "integrations": true, "support": "priority"}',
 '{"max_users": 10, "max_customers": 5000, "max_products": 10000, "max_sales_per_month": 10000}'),
 
('Enterprise', 'enterprise', 'Solução completa para grandes empresas', 149.90, 1499.90,
 '{"basic_features": true, "reports": true, "integrations": true, "support": "phone", "white_label": true}',
 '{"max_users": -1, "max_customers": -1, "max_products": -1, "max_sales_per_month": -1}');

-- =============================================
-- ATUALIZAR TABELAS EXISTENTES COM TENANT_ID
-- =============================================

-- Adicionar tenant_id nas tabelas existentes
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Se existem outras tabelas como sales, stock_movements, etc, adicionar também
-- ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
-- ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON public.user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_tenant_id ON public.user_memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);

-- =============================================
-- FUNCTIONS ÚTEIS
-- =============================================

-- Função para obter tenant_id do usuário atual
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

-- Função para verificar se usuário tem permissão no tenant
CREATE OR REPLACE FUNCTION public.user_has_tenant_access(tenant_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 
        FROM public.user_memberships um 
        WHERE um.user_id = auth.uid() 
        AND um.tenant_id = tenant_uuid 
        AND um.is_active = true
    );
END;
$$;

-- Função para verificar se usuário é superadmin
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

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS para TENANTS
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
);

-- RLS para USER_MEMBERSHIPS
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
);

-- RLS para SUBSCRIPTIONS
DROP POLICY IF EXISTS "Tenant owners can view subscriptions" ON public.subscriptions;
CREATE POLICY "Tenant owners can view subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM public.user_memberships 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
    OR public.is_superadmin()
);

-- RLS para PLANS (público para leitura)
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;
CREATE POLICY "Anyone can view active plans"
ON public.plans FOR SELECT
TO authenticated
USING (is_active = true OR public.is_superadmin());

-- RLS para AUDIT_LOGS
DROP POLICY IF EXISTS "Users can view audit logs of their tenant" ON public.audit_logs;
CREATE POLICY "Users can view audit logs of their tenant"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM public.user_memberships 
        WHERE user_id = auth.uid() AND is_active = true
    )
    OR public.is_superadmin()
);

-- =============================================
-- ATUALIZAR RLS DAS TABELAS EXISTENTES
-- =============================================

-- RLS para CUSTOMERS (multi-tenant)
DROP POLICY IF EXISTS "Users can manage customers of their tenant" ON public.customers;
CREATE POLICY "Users can manage customers of their tenant"
ON public.customers
FOR ALL
TO authenticated
USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_superadmin()
)
WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    OR public.is_superadmin()
);

-- RLS para PRODUCTS (multi-tenant)
DROP POLICY IF EXISTS "Users can manage products of their tenant" ON public.products;
CREATE POLICY "Users can manage products of their tenant"
ON public.products
FOR ALL
TO authenticated
USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_superadmin()
)
WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    OR public.is_superadmin()
);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

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

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- =============================================
-- SEED DATA INICIAL (OPCIONAL)
-- =============================================

-- Criar um superadmin tenant para gerenciamento
INSERT INTO public.tenants (id, name, slug, status) VALUES 
('00000000-0000-0000-0000-000000000001', 'SuperAdmin', 'superadmin', 'active')
ON CONFLICT (id) DO NOTHING;

COMMIT;


