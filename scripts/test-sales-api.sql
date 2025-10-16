-- Testar se as vendas estão sendo retornadas corretamente
SELECT 
    'TESTE VENDAS POR TENANT' as info,
    tenant_id,
    COUNT(*) as total_vendas,
    SUM(total_amount) as valor_total,
    MIN(created_at) as primeira_venda,
    MAX(created_at) as ultima_venda
FROM sales 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY tenant_id;

-- Testar vendas de hoje
SELECT 
    'VENDAS DE HOJE' as info,
    id,
    tenant_id,
    sale_number,
    customer_name,
    total_amount,
    final_amount,
    payment_method,
    created_at
FROM sales 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

