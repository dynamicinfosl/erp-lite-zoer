-- ============================================
-- ÍNDICES ULTRA SEGUROS (VERSÃO GARANTIDA)
-- ============================================
-- Este script cria APENAS índices em colunas que existem em QUALQUER instalação padrão
-- Baseado em: PostgreSQL + Supabase schema padrão
-- Execute no Supabase SQL Editor

-- ============================================
-- SALES - Índices básicos garantidos
-- ============================================

-- Índice na PK (já existe automaticamente)
-- CREATE INDEX se não existir para created_at
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
        RAISE NOTICE '✅ idx_sales_created_at criado';
    END IF;
END $$;

-- Índice para customer_id se existir
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'customer_id') THEN
        CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id) WHERE customer_id IS NOT NULL;
        RAISE NOTICE '✅ idx_sales_customer_id criado';
    END IF;
END $$;

-- Índice para user_id se existir
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
        RAISE NOTICE '✅ idx_sales_user_id criado';
    END IF;
END $$;

-- ============================================
-- SALE_ITEMS - Índices básicos
-- ============================================

-- Índice para sale_id (já deve existir - idx_sale_items_sale_id)
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);

-- Índice para product_id se existir
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_items' AND column_name = 'product_id') THEN
        CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id) WHERE product_id IS NOT NULL;
        RAISE NOTICE '✅ idx_sale_items_product_id criado';
    END IF;
END $$;

-- ============================================
-- CUSTOMERS - Índices básicos
-- ============================================

-- Índice para phone (já deve existir - idx_customers_phone)
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Índice para name
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'name') THEN
        CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
        RAISE NOTICE '✅ idx_customers_name criado';
    END IF;
END $$;

-- Índice para email se existir
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'email') THEN
        CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE email IS NOT NULL;
        RAISE NOTICE '✅ idx_customers_email criado';
    END IF;
END $$;

-- Índice para document (CPF/CNPJ) se existir
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'document') THEN
        CREATE INDEX IF NOT EXISTS idx_customers_document ON customers(document) WHERE document IS NOT NULL;
        RAISE NOTICE '✅ idx_customers_document criado';
    END IF;
END $$;

-- Índice para created_at
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);
        RAISE NOTICE '✅ idx_customers_created_at criado';
    END IF;
END $$;

-- ============================================
-- PRODUCTS - Índices básicos
-- ============================================

-- Índice para sku
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sku') THEN
        CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
        RAISE NOTICE '✅ idx_products_sku criado';
    END IF;
END $$;

-- Índice para name
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name') THEN
        CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
        RAISE NOTICE '✅ idx_products_name criado';
    END IF;
END $$;

-- Índice para is_active se existir
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_active') THEN
        CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
        RAISE NOTICE '✅ idx_products_is_active criado';
    END IF;
END $$;

-- Índice para status se existir
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
        RAISE NOTICE '✅ idx_products_status criado';
    END IF;
END $$;

-- Índice para created_at
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
        RAISE NOTICE '✅ idx_products_created_at criado';
    END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

SELECT 
    '✅ TOTAL DE ÍNDICES CRIADOS' as status,
    COUNT(*) as total
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND tablename IN ('sales', 'sale_items', 'customers', 'products');

-- Listar todos os índices
SELECT 
    tablename,
    indexname,
    CASE 
        WHEN indexname LIKE '%_pkey' THEN '🔑 Primary Key'
        WHEN indexname LIKE 'idx_%' THEN '⚡ Performance Index'
        ELSE '📋 Outros'
    END as tipo
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('sales', 'sale_items', 'customers', 'products')
ORDER BY tablename, indexname;
