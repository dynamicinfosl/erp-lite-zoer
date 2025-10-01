-- =============================================
-- CRIAR TABELA PLANS SIMPLES
-- =============================================

-- Criar tabela plans se não existir
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    features JSONB DEFAULT '[]',
    max_users INTEGER DEFAULT 1,
    max_products INTEGER DEFAULT 100,
    max_customers INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Limpar dados existentes
DELETE FROM public.plans;

-- Inserir planos padrão
INSERT INTO public.plans (name, description, price, billing_cycle, features, max_users, max_products, max_customers, is_active) VALUES
('Básico', 'Plano ideal para pequenas empresas', 29.90, 'monthly', 
 '["Gestão de produtos", "Gestão de clientes", "Relatórios básicos", "Suporte por email"]', 
 1, 100, 1000, true),

('Profissional', 'Para empresas em crescimento', 59.90, 'monthly', 
 '["Tudo do Básico", "Múltiplos usuários", "Relatórios avançados", "Integração com APIs", "Suporte prioritário"]', 
 5, 1000, 10000, true),

('Enterprise', 'Solução completa para grandes empresas', 99.90, 'monthly', 
 '["Tudo do Profissional", "Usuários ilimitados", "Produtos ilimitados", "Clientes ilimitados", "Suporte 24/7", "Customizações"]', 
 -1, -1, -1, true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON public.plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_name ON public.plans(name);

-- Verificar se funcionou
SELECT 'Tabela plans criada com sucesso!' as status;
SELECT COUNT(*) as total_plans FROM public.plans;
SELECT name, price, billing_cycle FROM public.plans ORDER BY price;
