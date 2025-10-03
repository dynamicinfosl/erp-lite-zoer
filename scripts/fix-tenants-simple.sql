-- ===================================================================
-- Script SIMPLES para corrigir o erro da coluna 'address' na tabela tenants
-- Execute este script diretamente no painel do Supabase (SQL Editor)
-- ===================================================================

-- 1. Adicionar colunas que estão faltando na tabela tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS document VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS document_type VARCHAR(10);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS corporate_email VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS corporate_phone VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS fantasy_name VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS complement TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS state VARCHAR(2);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);

-- 2. Verificar se a tabela subscriptions existe, se não, criar
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'trial',
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Verificar se a tabela plans existe, se não, criar
CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  features TEXT[],
  max_users INTEGER DEFAULT 1,
  max_products INTEGER DEFAULT 100,
  max_customers INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Inserir planos básicos se não existirem
INSERT INTO plans (id, name, description, price, features, max_users, max_products, max_customers) VALUES
('basic', 'Básico', 'Ideal para pequenas empresas', 29.90, 
 ARRAY['Gestão de produtos', 'Gestão de clientes', 'Relatórios básicos', 'Suporte por email'], 
 1, 100, 1000),
('professional', 'Profissional', 'Para empresas em crescimento', 59.90, 
 ARRAY['Tudo do Básico', 'Múltiplos usuários', 'Relatórios avançados', 'Integração com APIs', 'Suporte prioritário'], 
 5, 1000, 10000),
('enterprise', 'Enterprise', 'Solução completa para grandes empresas', 99.90, 
 ARRAY['Tudo do Profissional', 'Usuários ilimitados', 'Produtos ilimitados', 'Clientes ilimitados', 'Suporte 24/7', 'Customizações'], 
 -1, -1, -1)
ON CONFLICT (id) DO NOTHING;

-- 5. Habilitar RLS nas tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- 6. Verificar se as colunas foram adicionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;
