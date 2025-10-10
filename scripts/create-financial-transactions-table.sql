-- =============================================
-- CRIAR TABELA FINANCIAL_TRANSACTIONS
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Criar tabela financial_transactions
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  tenant_id UUID NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('receita', 'despesa')),
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  payment_method VARCHAR(50),
  reference_type VARCHAR(50),
  reference_id VARCHAR(100),
  due_date DATE,
  paid_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_financial_transactions_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_tenant_id ON public.financial_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON public.financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_created_at ON public.financial_transactions(created_at);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Criar política RLS simples para permitir todas as operações
CREATE POLICY "Allow all for authenticated users" ON public.financial_transactions 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

-- 5. Verificar se a tabela foi criada
SELECT * FROM information_schema.tables WHERE table_name = 'financial_transactions' AND table_schema = 'public';


