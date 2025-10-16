-- Script unificado para verificar vendas
SELECT 
    'ESTRUTURA TABELA SALES' as tipo,
    column_name as col1,
    data_type as col2,
    is_nullable as col3,
    column_default as col4,
    NULL as col5,
    NULL as col6
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY ordinal_position

UNION ALL

SELECT 
    'VENDAS RECENTES' as tipo,
    COUNT(*)::text as col1,
    MIN(created_at)::text as col2,
    MAX(created_at)::text as col3,
    NULL as col4,
    NULL as col5,
    NULL as col6
FROM sales 
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'VENDAS POR TENANT' as tipo,
    tenant_id::text as col1,
    COUNT(*)::text as col2,
    MIN(created_at)::text as col3,
    MAX(created_at)::text as col4,
    NULL as col5,
    NULL as col6
FROM sales 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY tenant_id

UNION ALL

SELECT 
    'VENDAS DE HOJE' as tipo,
    id::text as col1,
    tenant_id::text as col2,
    sale_number as col3,
    customer_name as col4,
    payment_method as col5,
    created_at::text as col6
FROM sales 
WHERE DATE(created_at) = CURRENT_DATE

UNION ALL

SELECT 
    'PROBLEMAS' as tipo,
    'VENDAS SEM TENANT' as col1,
    COUNT(*)::text as col2,
    NULL as col3,
    NULL as col4,
    NULL as col5,
    NULL as col6
FROM sales 
WHERE tenant_id IS NULL OR tenant_id = '00000000-0000-0000-0000-000000000000'

UNION ALL

SELECT 
    'PROBLEMAS' as tipo,
    'VENDAS SEM ITENS' as col1,
    COUNT(*)::text as col2,
    NULL as col3,
    NULL as col4,
    NULL as col5,
    NULL as col6
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE si.id IS NULL

UNION ALL

SELECT 
    'CONTAGEM GERAL' as tipo,
    'TOTAL VENDAS' as col1,
    (SELECT COUNT(*) FROM sales)::text as col2,
    'TOTAL ITENS' as col3,
    (SELECT COUNT(*) FROM sale_items)::text as col4,
    'TENANTS' as col5,
    (SELECT COUNT(DISTINCT tenant_id) FROM sales)::text as col6;

