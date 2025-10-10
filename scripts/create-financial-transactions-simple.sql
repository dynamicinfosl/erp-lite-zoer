-- =============================================
-- CRIAR TABELA financial_transactions (SIMPLIFICADA)
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- Primeiro, vamos criar a tabela sem a referência de chave estrangeira
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL, -- Sem referência por enquanto
    user_id UUID NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receita', 'despesa')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    payment_method TEXT,
    reference_type TEXT, -- Ex: 'order', 'sale', 'invoice'
    reference_id TEXT,   -- ID da ordem/venda/fatura relacionada
    due_date DATE,
    paid_date DATE,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_tenant_id ON public.financial_transactions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_due_date ON public.financial_transactions (due_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON public.financial_transactions (status);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Política simples para bypass RLS (para testes)
CREATE POLICY "Allow all for authenticated users"
ON public.financial_transactions FOR ALL
TO authenticated
USING (true) WITH CHECK (true);

-- Verificar se a tabela foi criada
SELECT 'Tabela financial_transactions criada com sucesso!' as status;


