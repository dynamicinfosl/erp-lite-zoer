-- ===========================================
-- COMANDO 1: CRIAR TABELA TENANTS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended', 'canceled')),
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- COMANDO 2: CRIAR TABELA USER_MEMBERSHIPS
-- ===========================================
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

-- ===========================================
-- COMANDO 3: CRIAR TABELA PLANS
-- ===========================================
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
    limits JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- COMANDO 4: INSERIR PLANOS
-- ===========================================
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
 '{"max_users": -1, "max_customers": -1, "max_products": -1, "max_sales_per_month": -1}')
ON CONFLICT (slug) DO NOTHING;

-- ===========================================
-- COMANDO 5: ADICIONAR TENANT_ID NAS TABELAS EXISTENTES
-- ===========================================
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- ===========================================
-- COMANDO 6: CRIAR ÍNDICES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON public.user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_tenant_id ON public.user_memberships(tenant_id);

-- ===========================================
-- COMANDO 7: HABILITAR RLS
-- ===========================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- VERIFICAÇÃO FINAL
-- ===========================================
SELECT 'Tabelas criadas com sucesso!' as status;
SELECT COUNT(*) as total_planos FROM public.plans;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('tenants', 'user_memberships', 'plans');


