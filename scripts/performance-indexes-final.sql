-- ============================================
-- ÍNDICES FINAIS DE PERFORMANCE
-- ============================================
-- Complementa os índices já criados
-- Foca em filtros comuns que ainda faltam
-- Execute no Supabase SQL Editor

-- ============================================
-- SALES - Índices adicionais para filtros
-- ============================================

-- Índice para status (usado em filtros: paga, pendente, cancelada)
CREATE INDEX IF NOT EXISTS idx_sales_status 
ON sales(status)
WHERE status IS NOT NULL;

-- Índice para payment_method (usado em filtros: pix, dinheiro, cartão)
CREATE INDEX IF NOT EXISTS idx_sales_payment_method 
ON sales(payment_method)
WHERE payment_method IS NOT NULL;

-- Índice para sale_date (se for usado para filtros de período)
CREATE INDEX IF NOT EXISTS idx_sales_sale_date 
ON sales(sale_date DESC)
WHERE sale_date IS NOT NULL;

-- Índice composto para customer_id + created_at (histórico por cliente)
CREATE INDEX IF NOT EXISTS idx_sales_customer_created 
ON sales(customer_id, created_at DESC)
WHERE customer_id IS NOT NULL;

-- ============================================
-- CUSTOMERS - Índice adicional
-- ============================================

-- Índice para busca por documento (se não existir)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'document'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_customers_document 
        ON customers(document)
        WHERE document IS NOT NULL;
        RAISE NOTICE '✅ idx_customers_document criado';
    END IF;
END $$;

-- ============================================
-- PRODUCTS - Índice adicional
-- ============================================

-- Índice para status/is_active (produtos ativos)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_products_status 
        ON products(status)
        WHERE status IS NOT NULL;
        RAISE NOTICE '✅ idx_products_status criado';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'is_active'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_products_is_active 
        ON products(is_active);
        RAISE NOTICE '✅ idx_products_is_active criado';
    END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO FINAL COMPLETA
-- ============================================

-- Total de índices de performance criados
SELECT 
    '🎯 RESUMO FINAL' as titulo,
    COUNT(*) FILTER (WHERE indexname LIKE 'idx_%') as indices_performance,
    COUNT(*) FILTER (WHERE indexname LIKE '%_pkey') as primary_keys,
    COUNT(*) FILTER (WHERE indexname LIKE '%_key') as unique_constraints,
    COUNT(*) as total_indices
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('sales', 'sale_items', 'customers', 'products');

-- Listar todos os índices por tabela
SELECT 
    tablename,
    COUNT(*) as total_indices,
    STRING_AGG(indexname, ', ' ORDER BY indexname) as indices
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('sales', 'sale_items', 'customers', 'products')
GROUP BY tablename
ORDER BY tablename;

-- Detalhes dos índices de performance
SELECT 
    '📊 ÍNDICES DE PERFORMANCE CRIADOS' as categoria,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND tablename IN ('sales', 'sale_items', 'customers', 'products')
ORDER BY tablename, indexname;
