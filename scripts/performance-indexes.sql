-- ============================================
-- ÍNDICES PARA OTIMIZAÇÃO DE PERFORMANCE
-- ============================================
-- Execute este script no Supabase SQL Editor para criar índices
-- que vão melhorar significativamente a performance do sistema

-- ============================================
-- SALES - Índices para vendas
-- ============================================

-- Índice composto para listagem de vendas por tenant
CREATE INDEX IF NOT EXISTS idx_sales_tenant_created_at 
ON sales(tenant_id, created_at DESC);

-- Índice para filtro por filial
CREATE INDEX IF NOT EXISTS idx_sales_branch_id 
ON sales(branch_id);

-- Índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_sales_customer_id 
ON sales(customer_id);

-- Índice composto para listagem por tenant + filial
CREATE INDEX IF NOT EXISTS idx_sales_tenant_branch_created 
ON sales(tenant_id, branch_id, created_at DESC);

-- Índice para detecção de duplicatas (API externa)
CREATE INDEX IF NOT EXISTS idx_sales_duplicate_check 
ON sales(tenant_id, sale_source, total_amount, created_at DESC);

-- ============================================
-- SALE_ITEMS - Índices para itens de venda
-- ============================================

-- Índice para buscar itens por venda (FK)
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id 
ON sale_items(sale_id);

-- Índice composto para busca por tenant + venda
CREATE INDEX IF NOT EXISTS idx_sale_items_tenant_sale 
ON sale_items(tenant_id, sale_id);

-- ============================================
-- CUSTOMERS - Índices para clientes
-- ============================================

-- Índice parcial para clientes da matriz (branch_id null)
CREATE INDEX IF NOT EXISTS idx_customers_tenant_branch_null 
ON customers(tenant_id, created_at_branch_id) 
WHERE created_at_branch_id IS NULL;

-- Índice para busca por filial de criação
CREATE INDEX IF NOT EXISTS idx_customers_created_at_branch_id 
ON customers(created_at_branch_id);

-- Índice para busca por tenant
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id 
ON customers(tenant_id);

-- ============================================
-- DELIVERIES - Índices para entregas
-- ============================================

-- Índice para relacionamento com vendas (FK)
CREATE INDEX IF NOT EXISTS idx_deliveries_sale_id 
ON deliveries(sale_id);

-- Índice composto para filtro por tenant + status
CREATE INDEX IF NOT EXISTS idx_deliveries_tenant_status 
ON deliveries(tenant_id, status);

-- ============================================
-- PRODUCTS - Índices para produtos
-- ============================================

-- Índice único para SKU por tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_tenant_sku 
ON products(tenant_id, sku);

-- Índice para busca por tenant + ativo
CREATE INDEX IF NOT EXISTS idx_products_tenant_active 
ON products(tenant_id, is_active);

-- Índice para busca por tenant
CREATE INDEX IF NOT EXISTS idx_products_tenant_id 
ON products(tenant_id);

-- ============================================
-- BRANCH_CUSTOMERS - Índices para compartilhamento
-- ============================================

-- Índice composto para busca por filial + status
CREATE INDEX IF NOT EXISTS idx_branch_customers_branch_active 
ON branch_customers(branch_id, is_active);

-- ============================================
-- STOCK_MOVEMENTS - Índices para movimentações
-- ============================================

-- Índice composto para listagem por tenant
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_created 
ON stock_movements(tenant_id, created_at DESC);

-- Índice composto para busca por tenant + filial
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_branch 
ON stock_movements(tenant_id, branch_id);

-- ============================================
-- SUBSCRIPTIONS - Índices para assinaturas
-- ============================================

-- Índice para busca por tenant
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id 
ON subscriptions(tenant_id);

-- Índice composto para busca por tenant + status
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_status 
ON subscriptions(tenant_id, status);

-- ============================================
-- DELIVERY_MANIFESTS - Índices para romaneios
-- ============================================

-- Índice para busca por entregador
CREATE INDEX IF NOT EXISTS idx_delivery_manifests_driver_id 
ON delivery_manifests(driver_id);

-- ============================================
-- ANÁLISE DE ÍNDICES CRIADOS
-- ============================================

-- Consulta para verificar os índices criados
SELECT 
    schemaname,
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
-- ESTATÍSTICAS DE TABELAS
-- ============================================

-- Ver tamanho das tabelas e índices
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'sales', 'sale_items', 'customers', 'deliveries', 
        'products', 'branch_customers', 'stock_movements', 
        'subscriptions', 'delivery_manifests'
    )
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
