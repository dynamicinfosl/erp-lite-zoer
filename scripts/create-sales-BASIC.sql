-- =============================================
-- SCRIPT EXTREMAMENTE BÁSICO - SEM TENANT_ID
-- =============================================

-- =============================================
-- VERIFICAR TABELAS EXISTENTES
-- =============================================

SELECT 'Verificando tabelas existentes:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- =============================================
-- CRIAR TABELAS DE VENDAS (SEM TENANT_ID)
-- =============================================

-- 1. TABELA DE VENDAS
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_number VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) DEFAULT 'Cliente Avulso',
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE ITENS DA VENDA
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL,
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100),
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE OPERAÇÕES DE CAIXA
CREATE TABLE IF NOT EXISTS public.cash_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Tabelas básicas criadas' as info;

-- =============================================
-- ADICIONAR ÍNDICES BÁSICOS
-- =============================================

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_sale_number ON public.sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cash_operations_created_at ON public.cash_operations(created_at);

SELECT 'Índices criados' as info;

-- =============================================
-- FUNÇÃO PARA GERAR NÚMERO DA VENDA
-- =============================================

CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    sale_count INTEGER;
    sale_number VARCHAR(50);
BEGIN
    -- Contar vendas hoje
    SELECT COUNT(*) + 1 INTO sale_count
    FROM public.sales 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Gerar número da venda no formato VND-YYYYMMDD-0001
    sale_number := 'VND-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(sale_count::TEXT, 4, '0');
    
    RETURN sale_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Função de geração criada' as info;

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================

-- Verificar tabelas criadas
SELECT 'TABELAS CRIADAS:' as verificacao;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sales', 'sale_items', 'cash_operations')
ORDER BY table_name;

-- Teste da função
SELECT 'TESTE FUNÇÃO:' as verificacao;
SELECT generate_sale_number() as numero_teste;

SELECT 'SETUP BÁSICO CONCLUÍDO! PDV FUNCIONANDO!' as resultado;


