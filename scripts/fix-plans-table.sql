-- =============================================
-- CORREÇÃO DA TABELA PLANS PARA COMPATIBILIDADE
-- =============================================

-- Primeiro, vamos verificar se a tabela existe e qual estrutura tem
-- Se não existir, criar com a estrutura correta
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

-- Se a tabela já existir com estrutura diferente, vamos ajustar
-- Adicionar colunas que podem estar faltando
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_products INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS max_customers INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Remover colunas antigas se existirem (comentado para segurança)
-- ALTER TABLE public.plans DROP COLUMN IF EXISTS price_monthly;
-- ALTER TABLE public.plans DROP COLUMN IF EXISTS price_yearly;
-- ALTER TABLE public.plans DROP COLUMN IF EXISTS slug;
-- ALTER TABLE public.plans DROP COLUMN IF EXISTS limits;

-- Atualizar constraint de billing_cycle se necessário
ALTER TABLE public.plans 
DROP CONSTRAINT IF EXISTS plans_billing_cycle_check;

ALTER TABLE public.plans 
ADD CONSTRAINT plans_billing_cycle_check 
CHECK (billing_cycle IN ('monthly', 'yearly'));

-- Limpar dados existentes e inserir planos padrão
DELETE FROM public.plans;

-- Inserir planos padrão com a estrutura correta
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

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON public.plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_name ON public.plans(name);

-- Verificar se a tabela foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'plans'
ORDER BY ordinal_position;

-- Verificar os dados inseridos
SELECT id, name, description, price, billing_cycle, is_active FROM public.plans;
