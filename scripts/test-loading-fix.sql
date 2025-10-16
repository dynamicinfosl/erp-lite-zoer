-- Teste rápido para verificar se o sistema está funcionando
SELECT 
    'SISTEMA FUNCIONANDO' as status,
    NOW() as timestamp,
    'Loading fix aplicado' as descricao;

-- Verificar se há dados para mostrar
SELECT 
    'DADOS DISPONIVEIS' as info,
    (SELECT COUNT(*) FROM sales) as total_vendas,
    (SELECT COUNT(*) FROM products) as total_produtos,
    (SELECT COUNT(*) FROM customers) as total_clientes,
    (SELECT COUNT(*) FROM tenants) as total_tenants;

