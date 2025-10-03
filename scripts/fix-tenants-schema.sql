-- ===================================================================
-- Script para corrigir schema da tabela tenants
-- Adiciona colunas que estão faltando para o cadastro completo
-- ===================================================================

-- 1. Verificar estrutura atual da tabela tenants
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- 2. Adicionar colunas que estão faltando
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

-- 3. Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- 4. Atualizar RLS se necessário
-- Garantir que a tabela tenants tem RLS habilitado
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 5. Verificar se existe a tabela subscriptions
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'subscriptions'
) as subscriptions_exists;

-- 6. Se não existir, criar tabela subscriptions
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

-- 7. Habilitar RLS na tabela subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 8. Criar política RLS para subscriptions
CREATE POLICY IF NOT EXISTS "Users can view their tenant subscriptions" ON subscriptions
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM user_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- 9. Verificar se existe a tabela plans
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'plans'
) as plans_exists;

-- 10. Se não existir, criar tabela plans básica
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

-- 11. Inserir planos básicos se não existirem
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

-- 12. Habilitar RLS na tabela plans
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- 13. Criar política RLS para plans (todos podem ver)
CREATE POLICY IF NOT EXISTS "Everyone can view active plans" ON plans
  FOR SELECT USING (is_active = true);

-- 14. Verificar estrutura final
SELECT 'tenants' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
UNION ALL
SELECT 'subscriptions' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions'
UNION ALL
SELECT 'plans' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'plans'
ORDER BY table_name, column_name;
