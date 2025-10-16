-- ============================================
-- SCRIPT: Verificar Vendas - Passo a Passo
-- ============================================
-- Execute cada consulta separadamente

-- 1. VERIFICAR ESTRUTURA DA TABELA SALES
SELECT 
    'ESTRUTURA TABELA SALES' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY ordinal_position;

-- 2. VERIFICAR VENDAS RECENTES (7 dias)
SELECT 
    'VENDAS RECENTES (7 dias)' as info,
    COUNT(*) as total_vendas,
    MIN(created_at) as primeira_venda,
    MAX(created_at) as ultima_venda
FROM sales 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 3. VERIFICAR VENDAS POR TENANT
SELECT 
    'VENDAS POR TENANT' as info,
    tenant_id,
    COUNT(*) as total_vendas,
    MIN(created_at) as primeira_venda,
    MAX(created_at) as ultima_venda
FROM sales 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY tenant_id;

-- 4. VERIFICAR VENDAS DE HOJE
SELECT 
    'VENDAS DE HOJE' as info,
    id,
    tenant_id,
    sale_number,
    customer_name,
    created_at,
    payment_method
FROM sales 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- 5. VERIFICAR VENDAS SEM TENANT_ID
SELECT 
    'VENDAS SEM TENANT_ID' as info,
    COUNT(*) as total
FROM sales 
WHERE tenant_id IS NULL OR tenant_id = '00000000-0000-0000-0000-000000000000';

-- 6. VERIFICAR VENDAS SEM ITENS
SELECT 
    'VENDAS SEM ITENS' as info,
    COUNT(*) as total
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE si.id IS NULL;

-- 7. CONTAGEM GERAL
SELECT 
    'CONTAGEM GERAL' as info,
    (SELECT COUNT(*) FROM sales) as total_vendas,
    (SELECT COUNT(*) FROM sale_items) as total_itens,
    (SELECT COUNT(DISTINCT tenant_id) FROM sales) as tenants_com_vendas;

