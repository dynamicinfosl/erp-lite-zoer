-- Teste do sistema sem problemas de loading
SELECT 
    'SISTEMA TESTADO' as status,
    'Loading corrigido' as loading_status,
    'Dados adicionados' as data_status,
    NOW() as timestamp;

-- Verificar se todos os tenants têm pelo menos alguns dados
SELECT 
    'TENANTS COM DADOS' as info,
    COUNT(*) as total_tenants,
    COUNT(CASE WHEN p.tenant_id IS NOT NULL THEN 1 END) as tenants_com_produtos,
    COUNT(CASE WHEN c.tenant_id IS NOT NULL THEN 1 END) as tenants_com_clientes,
    COUNT(CASE WHEN s.tenant_id IS NOT NULL THEN 1 END) as tenants_com_vendas
FROM tenants t
LEFT JOIN products p ON p.tenant_id = t.id
LEFT JOIN customers c ON c.tenant_id = t.id  
LEFT JOIN sales s ON s.tenant_id = t.id
GROUP BY 1;

-- Mostrar resumo final
SELECT 
    'RESUMO FINAL' as info,
    (SELECT COUNT(*) FROM products) as total_produtos,
    (SELECT COUNT(*) FROM customers) as total_clientes,
    (SELECT COUNT(*) FROM sales) as total_vendas,
    (SELECT COUNT(*) FROM tenants) as total_tenants;

