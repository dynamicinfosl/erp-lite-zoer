-- Script simples para verificar vendas
SELECT 
    'ESTRUTURA TABELA SALES' as info,
    column_name as total_vendas,
    data_type as total_valor,
    is_nullable as primeira_venda,
    column_default as ultima_venda,
    NULL as extra6
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY ordinal_position

UNION ALL

SELECT 
    'VENDAS RECENTES (7 dias)' as info,
    COUNT(*)::text as total_vendas,
    'Verificar coluna total' as total_valor,
    MIN(created_at)::text as primeira_venda,
    MAX(created_at)::text as ultima_venda,
    NULL as extra6
FROM sales 
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'VENDAS POR TENANT' as info,
    tenant_id::text as total_vendas,
    COUNT(*)::text as total_valor,
    MIN(created_at)::text as primeira_venda,
    MAX(created_at)::text as ultima_venda,
    NULL as extra6
FROM sales 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY tenant_id

UNION ALL

SELECT 
    'VENDAS DE HOJE' as info,
    tenant_id::text as total_vendas,
    sale_number as total_valor,
    customer_name as primeira_venda,
    created_at::text as ultima_venda,
    payment_method as extra6
FROM sales 
WHERE DATE(created_at) = CURRENT_DATE

UNION ALL

SELECT 
    'VENDAS SEM TENANT_ID' as info,
    COUNT(*)::text as total_vendas,
    NULL as total_valor,
    NULL as primeira_venda,
    NULL as ultima_venda,
    NULL as extra6
FROM sales 
WHERE tenant_id IS NULL OR tenant_id = '00000000-0000-0000-0000-000000000000'

UNION ALL

SELECT 
    'VENDAS SEM ITENS' as info,
    COUNT(*)::text as total_vendas,
    NULL as total_valor,
    NULL as primeira_venda,
    NULL as ultima_venda,
    NULL as extra6
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE si.id IS NULL

UNION ALL

SELECT 
    'CONTAGEM GERAL' as info,
    (SELECT COUNT(*) FROM sales)::text as total_vendas,
    (SELECT COUNT(*) FROM sale_items)::text as total_valor,
    (SELECT COUNT(DISTINCT tenant_id) FROM sales)::text as primeira_venda,
    NULL as ultima_venda,
    NULL as extra6

UNION ALL

SELECT 
    '✅ VERIFICAÇÃO CONCLUÍDA' as info,
    'Verifique a estrutura da tabela acima' as total_vendas,
    'e ajuste o script conforme necessário' as total_valor,
    NULL as primeira_venda,
    NULL as ultima_venda,
    NULL as extra6;

