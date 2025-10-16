-- Testar se as vendas estão sendo retornadas corretamente pela API
SELECT 
    'TESTE API VENDAS' as info,
    COUNT(*) as total_vendas,
    SUM(total_amount) as valor_total,
    MIN(created_at) as primeira_venda,
    MAX(created_at) as ultima_venda
FROM sales 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Verificar vendas por tenant
SELECT 
    'VENDAS POR TENANT' as info,
    tenant_id,
    COUNT(*) as total_vendas,
    SUM(total_amount) as valor_total
FROM sales 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY tenant_id;

-- Verificar estrutura dos dados
SELECT 
    'ESTRUTURA VENDAS' as info,
    id,
    tenant_id,
    sale_number,
    customer_name,
    total_amount,
    final_amount,
    payment_method,
    created_at
FROM sales 
WHERE created_at >= NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

