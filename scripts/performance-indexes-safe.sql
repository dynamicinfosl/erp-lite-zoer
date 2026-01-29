-- ============================================
-- ÍNDICES PARA OTIMIZAÇÃO DE PERFORMANCE (VERSÃO SEGURA)
-- ============================================
-- Este script verifica a existência de tabelas e colunas antes de criar índices
-- Execute no Supabase SQL Editor

-- ============================================
-- SALES - Índices para vendas
-- ============================================

-- Verificar se a tabela sales existe e criar índices
DO $$
BEGIN
    -- Índice composto para listagem de vendas por tenant
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'tenant_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_sales_tenant_created_at 
        ON sales(tenant_id, created_at DESC);
        RAISE NOTICE '✅ Índice idx_sales_tenant_created_at criado';
    ELSE
        RAISE NOTICE '⚠️ Tabela sales não tem coluna tenant_id';
    END IF;

    -- Índice para filtro por filial
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'branch_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_sales_branch_id 
        ON sales(branch_id);
        RAISE NOTICE '✅ Índice idx_sales_branch_id criado';
    END IF;

    -- Índice para busca por cliente
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'customer_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_sales_customer_id 
        ON sales(customer_id);
        RAISE NOTICE '✅ Índice idx_sales_customer_id criado';
    END IF;

    -- Índice composto para listagem por tenant + filial
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'sales'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_sales_tenant_branch_created 
        ON sales(tenant_id, branch_id, created_at DESC);
        RAISE NOTICE '✅ Índice idx_sales_tenant_branch_created criado';
    END IF;

    -- Índice para detecção de duplicatas (API externa)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'sale_source'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_sales_duplicate_check 
        ON sales(tenant_id, sale_source, total_amount, created_at DESC);
        RAISE NOTICE '✅ Índice idx_sales_duplicate_check criado';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao criar índices de sales: %', SQLERRM;
END $$;

-- ============================================
-- SALE_ITEMS - Índices para itens de venda
-- ============================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'sale_items'
    ) THEN
        -- Índice para buscar itens por venda (FK)
        CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id 
        ON sale_items(sale_id);
        RAISE NOTICE '✅ Índice idx_sale_items_sale_id criado';
        
        -- Índice composto para busca por tenant + venda
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'sale_items' 
            AND column_name = 'tenant_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_sale_items_tenant_sale 
            ON sale_items(tenant_id, sale_id);
            RAISE NOTICE '✅ Índice idx_sale_items_tenant_sale criado';
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao criar índices de sale_items: %', SQLERRM;
END $$;

-- ============================================
-- CUSTOMERS - Índices para clientes
-- ============================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'customers'
    ) THEN
        -- Índice parcial para clientes da matriz (branch_id null)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'customers' 
            AND column_name = 'created_at_branch_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_customers_tenant_branch_null 
            ON customers(tenant_id, created_at_branch_id) 
            WHERE created_at_branch_id IS NULL;
            RAISE NOTICE '✅ Índice idx_customers_tenant_branch_null criado';
            
            -- Índice para busca por filial de criação
            CREATE INDEX IF NOT EXISTS idx_customers_created_at_branch_id 
            ON customers(created_at_branch_id);
            RAISE NOTICE '✅ Índice idx_customers_created_at_branch_id criado';
        END IF;
        
        -- Índice para busca por tenant
        CREATE INDEX IF NOT EXISTS idx_customers_tenant_id 
        ON customers(tenant_id);
        RAISE NOTICE '✅ Índice idx_customers_tenant_id criado';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao criar índices de customers: %', SQLERRM;
END $$;

-- ============================================
-- DELIVERIES - Índices para entregas
-- ============================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'deliveries'
    ) THEN
        -- Índice para relacionamento com vendas (FK)
        CREATE INDEX IF NOT EXISTS idx_deliveries_sale_id 
        ON deliveries(sale_id);
        RAISE NOTICE '✅ Índice idx_deliveries_sale_id criado';
        
        -- Índice composto para filtro por tenant + status
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'deliveries' 
            AND column_name = 'status'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_deliveries_tenant_status 
            ON deliveries(tenant_id, status);
            RAISE NOTICE '✅ Índice idx_deliveries_tenant_status criado';
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao criar índices de deliveries: %', SQLERRM;
END $$;

-- ============================================
-- PRODUCTS - Índices para produtos
-- ============================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'products'
    ) THEN
        -- Índice único para SKU por tenant
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'products' 
            AND column_name = 'sku'
        ) THEN
            CREATE UNIQUE INDEX IF NOT EXISTS idx_products_tenant_sku 
            ON products(tenant_id, sku);
            RAISE NOTICE '✅ Índice idx_products_tenant_sku criado';
        END IF;
        
        -- Índice para busca por tenant + ativo
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'products' 
            AND column_name = 'is_active'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_products_tenant_active 
            ON products(tenant_id, is_active);
            RAISE NOTICE '✅ Índice idx_products_tenant_active criado';
        END IF;
        
        -- Índice para busca por tenant
        CREATE INDEX IF NOT EXISTS idx_products_tenant_id 
        ON products(tenant_id);
        RAISE NOTICE '✅ Índice idx_products_tenant_id criado';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao criar índices de products: %', SQLERRM;
END $$;

-- ============================================
-- BRANCH_CUSTOMERS - Índices para compartilhamento
-- ============================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'branch_customers'
    ) THEN
        -- Índice composto para busca por filial + status
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'branch_customers' 
            AND column_name = 'is_active'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_branch_customers_branch_active 
            ON branch_customers(branch_id, is_active);
            RAISE NOTICE '✅ Índice idx_branch_customers_branch_active criado';
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao criar índices de branch_customers: %', SQLERRM;
END $$;

-- ============================================
-- STOCK_MOVEMENTS - Índices para movimentações
-- ============================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'stock_movements'
    ) THEN
        -- Índice composto para listagem por tenant
        CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_created 
        ON stock_movements(tenant_id, created_at DESC);
        RAISE NOTICE '✅ Índice idx_stock_movements_tenant_created criado';
        
        -- Índice composto para busca por tenant + filial
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'stock_movements' 
            AND column_name = 'branch_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_branch 
            ON stock_movements(tenant_id, branch_id);
            RAISE NOTICE '✅ Índice idx_stock_movements_tenant_branch criado';
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao criar índices de stock_movements: %', SQLERRM;
END $$;

-- ============================================
-- SUBSCRIPTIONS - Índices para assinaturas
-- ============================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'subscriptions'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions' 
        AND column_name = 'tenant_id'
    ) THEN
        -- Índice para busca por tenant
        CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id 
        ON subscriptions(tenant_id);
        RAISE NOTICE '✅ Índice idx_subscriptions_tenant_id criado';
        
        -- Índice composto para busca por tenant + status
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'subscriptions' 
            AND column_name = 'status'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_status 
            ON subscriptions(tenant_id, status);
            RAISE NOTICE '✅ Índice idx_subscriptions_tenant_status criado';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Tabela subscriptions não existe ou não tem coluna tenant_id';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao criar índices de subscriptions: %', SQLERRM;
END $$;

-- ============================================
-- DELIVERY_MANIFESTS - Índices para romaneios
-- ============================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'delivery_manifests'
    ) THEN
        -- Índice para busca por entregador
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'delivery_manifests' 
            AND column_name = 'driver_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_delivery_manifests_driver_id 
            ON delivery_manifests(driver_id);
            RAISE NOTICE '✅ Índice idx_delivery_manifests_driver_id criado';
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao criar índices de delivery_manifests: %', SQLERRM;
END $$;

-- ============================================
-- VERIFICAÇÃO DOS ÍNDICES CRIADOS
-- ============================================

SELECT 
    '✅ ÍNDICES CRIADOS COM SUCESSO' as status,
    COUNT(*) as total_indices
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND tablename IN (
        'sales', 'sale_items', 'customers', 'deliveries', 
        'products', 'branch_customers', 'stock_movements', 
        'subscriptions', 'delivery_manifests'
    );

-- Listar todos os índices criados
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND tablename IN (
        'sales', 'sale_items', 'customers', 'deliveries', 
        'products', 'branch_customers', 'stock_movements', 
        'subscriptions', 'delivery_manifests'
    )
ORDER BY tablename, indexname;
