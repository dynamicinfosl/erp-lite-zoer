-- ============================================
-- ÍNDICES ESSENCIAIS DE PERFORMANCE (VERSÃO MÍNIMA)
-- ============================================
-- Este script cria apenas os índices mais críticos
-- que certamente vão melhorar a performance imediatamente
-- Execute no Supabase SQL Editor

-- ============================================
-- SALES - Índices essenciais
-- ============================================

-- Índice para listagem de vendas (mais usado)
CREATE INDEX IF NOT EXISTS idx_sales_created_at 
ON sales(created_at DESC);

-- Índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_sales_customer_id 
ON sales(customer_id)
WHERE customer_id IS NOT NULL;

-- Se tenant_id existe, criar índice composto
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'tenant_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_sales_tenant_created 
        ON sales(tenant_id, created_at DESC);
        RAISE NOTICE '✅ idx_sales_tenant_created criado';
    END IF;
END $$;

-- Se sale_source existe, criar índice
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'sale_source'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_sales_sale_source 
        ON sales(sale_source);
        RAISE NOTICE '✅ idx_sales_sale_source criado';
    END IF;
END $$;

-- ============================================
-- SALE_ITEMS - Índice essencial (já existe)
-- ============================================

-- Este índice já foi criado, mas garantir que existe
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id 
ON sale_items(sale_id);

-- ============================================
-- CUSTOMERS - Índices essenciais
-- ============================================

-- Índice para busca por telefone (já existe)
CREATE INDEX IF NOT EXISTS idx_customers_phone 
ON customers(phone);

-- Índice para busca por nome (muito usado)
CREATE INDEX IF NOT EXISTS idx_customers_name 
ON customers(name);

-- Índice para busca por documento (CPF/CNPJ)
CREATE INDEX IF NOT EXISTS idx_customers_document 
ON customers(document)
WHERE document IS NOT NULL;

-- Se tenant_id existe, criar índice
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'tenant_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_customers_tenant 
        ON customers(tenant_id);
        RAISE NOTICE '✅ idx_customers_tenant criado';
    END IF;
END $$;

-- ============================================
-- DELIVERIES - Índices essenciais
-- ============================================
-- NOTA: Tabela deliveries não existe neste ambiente
-- Os índices serão criados apenas se a tabela existir

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'deliveries'
    ) THEN
        -- Índice para relacionamento com vendas
        CREATE INDEX IF NOT EXISTS idx_deliveries_sale_id 
        ON deliveries(sale_id);
        RAISE NOTICE '✅ idx_deliveries_sale_id criado';
        
        -- Índice para status
        CREATE INDEX IF NOT EXISTS idx_deliveries_status 
        ON deliveries(status);
        RAISE NOTICE '✅ idx_deliveries_status criado';
        
        -- Índice para manifest_id (romaneio)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'deliveries' 
            AND column_name = 'manifest_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_deliveries_manifest_id 
            ON deliveries(manifest_id)
            WHERE manifest_id IS NOT NULL;
            RAISE NOTICE '✅ idx_deliveries_manifest_id criado';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Tabela deliveries não existe - índices não criados';
    END IF;
END $$;

-- ============================================
-- PRODUCTS - Índices essenciais
-- ============================================

-- Índice para busca por SKU
CREATE INDEX IF NOT EXISTS idx_products_sku 
ON products(sku);

-- Índice para busca por nome
CREATE INDEX IF NOT EXISTS idx_products_name 
ON products(name);

-- Se tenant_id existe, criar índice composto único para SKU
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'tenant_id'
    ) THEN
        -- Tentar criar índice único, se falhar, criar normal
        BEGIN
            CREATE UNIQUE INDEX IF NOT EXISTS idx_products_tenant_sku_unique 
            ON products(tenant_id, sku);
            RAISE NOTICE '✅ idx_products_tenant_sku_unique criado';
        EXCEPTION
            WHEN OTHERS THEN
                CREATE INDEX IF NOT EXISTS idx_products_tenant_sku 
                ON products(tenant_id, sku);
                RAISE NOTICE '✅ idx_products_tenant_sku criado (não único)';
        END;
    END IF;
END $$;

-- ============================================
-- DELIVERY_MANIFESTS - Índice essencial
-- ============================================

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'delivery_manifests'
    ) THEN
        -- Índice para driver_id
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'delivery_manifests' 
            AND column_name = 'driver_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_delivery_manifests_driver 
            ON delivery_manifests(driver_id);
            RAISE NOTICE '✅ idx_delivery_manifests_driver criado';
        END IF;
        
        -- Índice para status
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'delivery_manifests' 
            AND column_name = 'status'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_delivery_manifests_status 
            ON delivery_manifests(status);
            RAISE NOTICE '✅ idx_delivery_manifests_status criado';
        END IF;
    END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

SELECT 
    '✅ ÍNDICES CRIADOS' as status,
    COUNT(*) as total
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND tablename IN ('sales', 'sale_items', 'customers', 'products', 'delivery_manifests');

-- Listar índices criados
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND tablename IN ('sales', 'sale_items', 'customers', 'products', 'delivery_manifests')
ORDER BY tablename, indexname;
