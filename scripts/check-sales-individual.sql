-- ============================================
-- EXECUTE CADA CONSULTA SEPARADAMENTE
-- ============================================

-- 1. ESTRUTURA DA TABELA SALES
SELECT 
    'ESTRUTURA TABELA SALES' as tipo,
    column_name as col1,
    data_type as col2,
    is_nullable as col3,
    column_default as col4
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY ordinal_position;

-- 2. VENDAS RECENTES (7 dias)
SELECT 
    'VENDAS RECENTES' as tipo,
    COUNT(*)::text as col1,
    MIN(created_at)::text as col2,
    MAX(created_at)::text as col3,
    NULL as col4
FROM sales 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 3. VENDAS POR TENANT
SELECT 
    'VENDAS POR TENANT' as tipo,
    tenant_id::text as col1,
    COUNT(*)::text as col2,
    MIN(created_at)::text as col3,
    MAX(created_at)::text as col4
FROM sales 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY tenant_id;

-- 4. VENDAS DE HOJE
SELECT 
    'VENDAS DE HOJE' as tipo,
    id::text as col1,
    tenant_id::text as col2,
    sale_number as col3,
    customer_name as col4
FROM sales 
WHERE DATE(created_at) = CURRENT_DATE;

-- 5. VENDAS SEM TENANT
SELECT 
    'VENDAS SEM TENANT' as tipo,
    COUNT(*)::text as col1,
    NULL as col2,
    NULL as col3,
    NULL as col4
FROM sales 
WHERE tenant_id IS NULL OR tenant_id = '00000000-0000-0000-0000-000000000000';

-- 6. VENDAS SEM ITENS
SELECT 
    'VENDAS SEM ITENS' as tipo,
    COUNT(*)::text as col1,
    NULL as col2,
    NULL as col3,
    NULL as col4
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE si.id IS NULL;

