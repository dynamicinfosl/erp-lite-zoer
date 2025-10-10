-- =============================================
-- ADICIONAR CAMPO TENANT_ID À TABELA FINANCIAL_TRANSACTIONS
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Adicionar coluna tenant_id
ALTER TABLE public.financial_transactions 
ADD COLUMN tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- 2. Adicionar foreign key constraint
ALTER TABLE public.financial_transactions 
ADD CONSTRAINT fk_financial_transactions_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_tenant_id 
ON public.financial_transactions(tenant_id);

-- 4. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'financial_transactions'
ORDER BY ordinal_position;

-- 5. Verificar se há dados na tabela
SELECT COUNT(*) as total_transactions FROM public.financial_transactions;

