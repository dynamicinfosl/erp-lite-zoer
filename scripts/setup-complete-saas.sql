-- =============================================
-- SETUP COMPLETO SAAS MULTI-TENANT
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- =============================================
-- 1. CRIAR TABELAS PRINCIPAIS
-- =============================================

-- 1.1 TABELA DE TENANTS (empresas/clientes do sistema)
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

-- Adicionar colunas se não existirem
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS document VARCHAR(50);

-- 1.2 TABELA DE MEMBROS POR TENANT (usuários que pertencem a cada empresa)
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

-- 1.3 TABELA DE PLANOS
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{"max_users": 1, "max_products": 100, "max_customers": 100}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 TABELA DE ASSINATURAS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. ADICIONAR tenant_id ÀS TABELAS EXISTENTES
-- =============================================

-- Customers
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- =============================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON public.user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_tenant_id ON public.user_memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);

-- =============================================
-- 4. INSERIR PLANOS PADRÃO
-- =============================================

INSERT INTO public.plans (name, slug, description, price_monthly, price_yearly, is_active, features, limits) VALUES
('Trial', 'trial', 'Período de teste gratuito por 30 dias', 0, 0, true, 
 '{"users": "1 usuário", "products": "Até 100 produtos", "customers": "Até 100 clientes", "support": "Email"}',
 '{"max_users": 1, "max_products": 100, "max_customers": 100}'
),
('Básico', 'basic', 'Ideal para pequenas empresas', 29.90, 299.00, true, 
 '{"users": "Até 3 usuários", "products": "Até 1.000 produtos", "customers": "Até 1.000 clientes", "support": "Email e Chat"}',
 '{"max_users": 3, "max_products": 1000, "max_customers": 1000}'
),
('Profissional', 'professional', 'Para empresas em crescimento', 59.90, 599.00, true, 
 '{"users": "Até 10 usuários", "products": "Até 10.000 produtos", "customers": "Até 10.000 clientes", "support": "Prioritário"}',
 '{"max_users": 10, "max_products": 10000, "max_customers": 10000}'
),
('Enterprise', 'enterprise', 'Para grandes empresas', 99.90, 999.00, true, 
 '{"users": "Usuários ilimitados", "products": "Produtos ilimitados", "customers": "Clientes ilimitados", "support": "Dedicado 24/7"}',
 '{"max_users": 9999, "max_products": 999999, "max_customers": 999999}'
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 5. CONFIGURAR RLS (Row Level Security)
-- =============================================

-- Ativar RLS nas tabelas
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Políticas para CUSTOMERS
DROP POLICY IF EXISTS "Users can view own tenant customers" ON public.customers;
CREATE POLICY "Users can view own tenant customers" ON public.customers
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can insert own tenant customers" ON public.customers;
CREATE POLICY "Users can insert own tenant customers" ON public.customers
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can update own tenant customers" ON public.customers;
CREATE POLICY "Users can update own tenant customers" ON public.customers
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Políticas para PRODUCTS
DROP POLICY IF EXISTS "Users can view own tenant products" ON public.products;
CREATE POLICY "Users can view own tenant products" ON public.products
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can insert own tenant products" ON public.products;
CREATE POLICY "Users can insert own tenant products" ON public.products
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can update own tenant products" ON public.products;
CREATE POLICY "Users can update own tenant products" ON public.products
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =============================================
-- 6. CRIAR TENANT DE DESENVOLVIMENTO
-- =============================================

-- Inserir tenant de desenvolvimento (usando apenas as colunas básicas primeiro)
INSERT INTO public.tenants (id, name, slug, status, trial_ends_at) VALUES
('11111111-1111-1111-1111-111111111111', 'JUGA - Desenvolvimento', 'juga-dev', 'active', NOW() + INTERVAL '365 days')
ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    trial_ends_at = NOW() + INTERVAL '365 days';

-- Atualizar com o email se a coluna existir
UPDATE public.tenants 
SET email = 'gabrieldecousa100@gmail.com' 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Buscar o plano Profissional
DO $$
DECLARE
    v_plan_id UUID;
    v_tenant_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    -- Buscar ID do plano Profissional
    SELECT id INTO v_plan_id FROM public.plans WHERE slug = 'professional' LIMIT 1;
    
    -- Criar assinatura ativa para o tenant de desenvolvimento
    IF v_plan_id IS NOT NULL THEN
        INSERT INTO public.subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end, trial_end)
        VALUES (
            v_tenant_id,
            v_plan_id,
            'active',
            NOW(),
            NOW() + INTERVAL '1 year',
            NOW() + INTERVAL '30 days'
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =============================================
-- 7. FUNÇÃO PARA VINCULAR USUÁRIO AO TENANT
-- =============================================

-- Esta função será chamada via script Node.js para vincular o usuário atual

CREATE OR REPLACE FUNCTION link_user_to_tenant(
    p_user_email TEXT,
    p_tenant_id UUID,
    p_role TEXT DEFAULT 'owner'
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    -- Buscar o user_id pelo email
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = p_user_email 
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Usuário não encontrado com o email: ' || p_user_email
        );
    END IF;
    
    -- Inserir ou atualizar membership
    INSERT INTO public.user_memberships (user_id, tenant_id, role, is_active)
    VALUES (v_user_id, p_tenant_id, p_role, true)
    ON CONFLICT (user_id, tenant_id) 
    DO UPDATE SET 
        role = p_role,
        is_active = true,
        updated_at = NOW();
    
    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'tenant_id', p_tenant_id,
        'role', p_role,
        'message', 'Usuário vinculado com sucesso!'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FIM DO SCRIPT
-- =============================================

-- Verificar o que foi criado
SELECT 'Tenants criados:' as info, COUNT(*) as total FROM public.tenants
UNION ALL
SELECT 'Planos criados:', COUNT(*) FROM public.plans
UNION ALL
SELECT 'Memberships criados:', COUNT(*) FROM public.user_memberships
UNION ALL
SELECT 'Assinaturas criadas:', COUNT(*) FROM public.subscriptions;

