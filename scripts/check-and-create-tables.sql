-- =============================================
-- VERIFICAR E CRIAR TABELAS NECESSÁRIAS
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. VERIFICAR SE A TABELA TENANTS EXISTE
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants')
        THEN 'Tabela tenants EXISTE'
        ELSE 'Tabela tenants NÃO EXISTE'
    END as status_tenants;

-- 2. SE NÃO EXISTIR, CRIAR A TABELA TENANTS
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

-- 3. INSERIR TENANT PADRÃO SE NÃO EXISTIR
INSERT INTO public.tenants (id, name, slug, status, trial_ends_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Empresa Teste', 'empresa-teste', 'trial', NOW() + INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- 4. CRIAR TABELA FINANCIAL_TRANSACTIONS (SEM REFERÊNCIA DE CHAVE ESTRANGEIRA)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL, -- Sem referência de FK por enquanto
    user_id UUID NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receita', 'despesa')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    payment_method TEXT,
    reference_type TEXT,
    reference_id TEXT,
    due_date DATE,
    paid_date DATE,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_financial_transactions_tenant_id ON public.financial_transactions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_due_date ON public.financial_transactions (due_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON public.financial_transactions (status);

-- 6. HABILITAR RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR POLÍTICA SIMPLES
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.financial_transactions;
CREATE POLICY "Allow all for authenticated users"
ON public.financial_transactions FOR ALL
TO authenticated
USING (true) WITH CHECK (true);

-- 8. VERIFICAR SE AS TABELAS FORAM CRIADAS
SELECT 'SUCESSO: Tabelas criadas!' as resultado;
SELECT COUNT(*) as total_tenants FROM public.tenants;
SELECT COUNT(*) as total_transactions FROM public.financial_transactions;


