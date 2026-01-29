-- ============================================
-- DIAGNÓSTICO DE TABELAS E COLUNAS
-- ============================================
-- Este script verifica quais tabelas e colunas existem no banco
-- Execute no Supabase SQL Editor para ver o que está disponível

-- ============================================
-- 1. VERIFICAR TABELAS PRINCIPAIS
-- ============================================

SELECT 
    '📊 TABELAS EXISTENTES' as diagnostico,
    table_name,
    CASE 
        WHEN table_name IN ('sales', 'sale_items', 'customers', 'deliveries', 'products') THEN '✅ Crítica'
        WHEN table_name IN ('branch_customers', 'stock_movements', 'delivery_manifests') THEN '⚠️ Importante'
        ELSE '📝 Outras'
    END as prioridade
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        'sales', 'sale_items', 'customers', 'deliveries', 
        'products', 'branch_customers', 'stock_movements', 
        'subscriptions', 'delivery_manifests', 'delivery_drivers'
    )
ORDER BY 
    CASE 
        WHEN table_name IN ('sales', 'sale_items', 'customers', 'deliveries', 'products') THEN 1
        WHEN table_name IN ('branch_customers', 'stock_movements', 'delivery_manifests') THEN 2
        ELSE 3
    END,
    table_name;

-- ============================================
-- 2. VERIFICAR COLUNAS DA TABELA SALES
-- ============================================

SELECT 
    '🔍 COLUNAS DA TABELA SALES' as diagnostico,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('tenant_id', 'created_at', 'branch_id', 'customer_id', 'sale_source', 'total_amount') THEN '✅'
        ELSE '📝'
    END as necessaria_para_indice
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'sales'
    AND column_name IN (
        'id', 'tenant_id', 'created_at', 'branch_id', 'customer_id', 
        'sale_source', 'total_amount', 'sale_type', 'sale_number'
    )
ORDER BY 
    CASE column_name
        WHEN 'tenant_id' THEN 1
        WHEN 'created_at' THEN 2
        WHEN 'branch_id' THEN 3
        WHEN 'customer_id' THEN 4
        WHEN 'sale_source' THEN 5
        ELSE 99
    END;

-- ============================================
-- 3. VERIFICAR COLUNAS DA TABELA SALE_ITEMS
-- ============================================

SELECT 
    '🔍 COLUNAS DA TABELA SALE_ITEMS' as diagnostico,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('sale_id', 'tenant_id') THEN '✅'
        ELSE '📝'
    END as necessaria_para_indice
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'sale_items'
    AND column_name IN ('id', 'sale_id', 'tenant_id', 'product_id')
ORDER BY column_name;

-- ============================================
-- 4. VERIFICAR COLUNAS DA TABELA CUSTOMERS
-- ============================================

SELECT 
    '🔍 COLUNAS DA TABELA CUSTOMERS' as diagnostico,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('tenant_id', 'created_at_branch_id', 'phone') THEN '✅'
        ELSE '📝'
    END as necessaria_para_indice
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'customers'
    AND column_name IN ('id', 'tenant_id', 'created_at_branch_id', 'name', 'phone', 'document')
ORDER BY column_name;

-- ============================================
-- 5. VERIFICAR COLUNAS DA TABELA DELIVERIES
-- ============================================

SELECT 
    '🔍 COLUNAS DA TABELA DELIVERIES' as diagnostico,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('tenant_id', 'sale_id', 'status') THEN '✅'
        ELSE '📝'
    END as necessaria_para_indice
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'deliveries'
    AND column_name IN ('id', 'tenant_id', 'sale_id', 'status', 'manifest_id', 'driver_id')
ORDER BY column_name;

-- ============================================
-- 6. VERIFICAR COLUNAS DA TABELA PRODUCTS
-- ============================================

SELECT 
    '🔍 COLUNAS DA TABELA PRODUCTS' as diagnostico,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('tenant_id', 'sku', 'is_active') THEN '✅'
        ELSE '📝'
    END as necessaria_para_indice
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'products'
    AND column_name IN ('id', 'tenant_id', 'sku', 'is_active', 'name', 'status')
ORDER BY column_name;

-- ============================================
-- 7. ÍNDICES JÁ EXISTENTES
-- ============================================

SELECT 
    '📋 ÍNDICES JÁ EXISTENTES' as diagnostico,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'sales', 'sale_items', 'customers', 'deliveries', 
        'products', 'branch_customers', 'stock_movements', 
        'subscriptions', 'delivery_manifests'
    )
ORDER BY tablename, indexname;

-- ============================================
-- 8. RESUMO GERAL
-- ============================================

SELECT 
    '📊 RESUMO GERAL' as tipo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('sales', 'sale_items', 'customers', 'deliveries', 'products')) as tabelas_criticas,
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE schemaname = 'public' 
     AND tablename IN ('sales', 'sale_items', 'customers', 'deliveries', 'products')
     AND indexname LIKE 'idx_%') as indices_customizados,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = 'sales' 
     AND column_name = 'tenant_id') as sales_tem_tenant_id,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = 'sale_items' 
     AND column_name = 'tenant_id') as sale_items_tem_tenant_id;

-- ============================================
-- 9. RECOMENDAÇÕES
-- ============================================

-- Esta query gera recomendações baseadas no que existe
WITH tabelas_faltantes AS (
    SELECT UNNEST(ARRAY['sales', 'sale_items', 'customers', 'deliveries', 'products']) AS tabela_esperada
    EXCEPT
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
)
SELECT 
    '⚠️ RECOMENDAÇÕES' as tipo,
    CASE 
        WHEN EXISTS (SELECT 1 FROM tabelas_faltantes) THEN 
            '❌ Faltam tabelas críticas: ' || string_agg((SELECT tabela_esperada FROM tabelas_faltantes), ', ')
        ELSE 
            '✅ Todas as tabelas críticas existem'
    END as status_tabelas
FROM tabelas_faltantes
HAVING COUNT(*) > 0
UNION ALL
SELECT 
    '⚠️ RECOMENDAÇÕES' as tipo,
    '✅ Todas as tabelas críticas existem' as status_tabelas
WHERE NOT EXISTS (SELECT 1 FROM tabelas_faltantes);
