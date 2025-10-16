-- Verificar dados por tenant para confirmar que estão sendo filtrados corretamente
SELECT 
    'DADOS POR TENANT' as info,
    t.id as tenant_id,
    t.name as tenant_name,
    t.email as tenant_email,
    (SELECT COUNT(*) FROM products p WHERE p.tenant_id = t.id) as produtos,
    (SELECT COUNT(*) FROM customers c WHERE c.tenant_id = t.id) as clientes,
    (SELECT COUNT(*) FROM sales s WHERE s.tenant_id = t.id) as vendas,
    (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s WHERE s.tenant_id = t.id) as valor_total_vendas
FROM tenants t
ORDER BY t.created_at DESC
LIMIT 10;

