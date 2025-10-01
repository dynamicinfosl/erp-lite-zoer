-- =============================================
-- ATUALIZAÇÃO COMPLETA DO SCHEMA DE TENANTS
-- =============================================

-- Adicionar campos que faltam na tabela tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS fantasy_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS corporate_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS corporate_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS document_type VARCHAR(10) DEFAULT 'CNPJ' CHECK (document_type IN ('CNPJ', 'CPF')),
ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100),
ADD COLUMN IF NOT EXISTS complement VARCHAR(255);

-- Adicionar campos do responsável na tabela auth.users (metadata)
-- Estes campos serão armazenados no campo raw_user_meta_data do Supabase Auth

-- Criar tabela de planos se não existir
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

-- Inserir planos padrão se não existirem
INSERT INTO public.plans (name, description, price, billing_cycle, features, max_users, max_products, max_customers) VALUES
('Básico', 'Plano ideal para pequenas empresas', 29.90, 'monthly', '["Gestão de produtos", "Gestão de clientes", "Relatórios básicos", "Suporte por email"]', 1, 100, 1000),
('Profissional', 'Para empresas em crescimento', 59.90, 'monthly', '["Tudo do Básico", "Múltiplos usuários", "Relatórios avançados", "Integração com APIs", "Suporte prioritário"]', 5, 1000, 10000),
('Enterprise', 'Solução completa para grandes empresas', 99.90, 'monthly', '["Tudo do Profissional", "Usuários ilimitados", "Produtos ilimitados", "Clientes ilimitados", "Suporte 24/7", "Customizações"]', -1, -1, -1)
ON CONFLICT (name) DO NOTHING;

-- Atualizar tabela subscriptions para incluir trial
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tenants_document ON public.tenants(document);
CREATE INDEX IF NOT EXISTS idx_tenants_corporate_email ON public.tenants(corporate_email);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON public.plans(is_active);

-- Comentários para documentação
COMMENT ON COLUMN public.tenants.fantasy_name IS 'Nome fantasia da empresa';
COMMENT ON COLUMN public.tenants.corporate_email IS 'Email corporativo da empresa';
COMMENT ON COLUMN public.tenants.corporate_phone IS 'Telefone corporativo da empresa';
COMMENT ON COLUMN public.tenants.document_type IS 'Tipo de documento: CNPJ ou CPF';
COMMENT ON COLUMN public.tenants.neighborhood IS 'Bairro da empresa';
COMMENT ON COLUMN public.tenants.complement IS 'Complemento do endereço';

-- Verificar se as alterações foram aplicadas
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tenants'
AND column_name IN ('fantasy_name', 'corporate_email', 'corporate_phone', 'document_type', 'neighborhood', 'complement')
ORDER BY column_name;
