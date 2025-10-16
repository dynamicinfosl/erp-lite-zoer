-- Adicionar dados de exemplo para tenants vazios
-- Este script adiciona produtos, clientes e vendas de exemplo para tenants que não têm dados

-- ============================================
-- 1. ADICIONAR PRODUTOS DE EXEMPLO
-- ============================================

-- Produtos para mars@gmail.com
INSERT INTO products (name, description, price, cost, stock, sku, tenant_id, user_id, created_at, updated_at)
SELECT 
    'Produto Exemplo 1',
    'Produto de demonstração',
    25.90,
    15.00,
    50,
    'PROD-001',
    '7e1f7be1-06be-4c81-8494-6a58151f7d91',
    '7e1f7be1-06be-4c81-8494-6a58151f7d91',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products WHERE tenant_id = '7e1f7be1-06be-4c81-8494-6a58151f7d91'
);

-- Produtos para mateuscodersilva@gmail.com
INSERT INTO products (name, description, price, cost, stock, sku, tenant_id, user_id, created_at, updated_at)
SELECT 
    'Notebook Dell',
    'Notebook para trabalho',
    2500.00,
    1800.00,
    5,
    'NOTE-001',
    '744d088f-3e84-4d66-848f-c52a686bb98d',
    '744d088f-3e84-4d66-848f-c52a686bb98d',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products WHERE tenant_id = '744d088f-3e84-4d66-848f-c52a686bb98d'
);

-- Produtos para admin@juga.com
INSERT INTO products (name, description, price, cost, stock, sku, tenant_id, user_id, created_at, updated_at)
SELECT 
    'Smartphone Samsung',
    'Smartphone Android',
    800.00,
    600.00,
    20,
    'SMAR-001',
    '293d5aa9-294a-467e-8c34-1fe4939ec140',
    '293d5aa9-294a-467e-8c34-1fe4939ec140',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products WHERE tenant_id = '293d5aa9-294a-467e-8c34-1fe4939ec140'
);

-- ============================================
-- 2. ADICIONAR CLIENTES DE EXEMPLO
-- ============================================

-- Cliente para mars@gmail.com
INSERT INTO customers (name, email, phone, document, city, type, is_active, tenant_id, user_id, created_at, updated_at)
SELECT 
    'Cliente Exemplo',
    'cliente@exemplo.com',
    '(11) 99999-9999',
    '123.456.789-00',
    'São Paulo',
    'PF',
    true,
    '7e1f7be1-06be-4c81-8494-6a58151f7d91',
    '7e1f7be1-06be-4c81-8494-6a58151f7d91',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM customers WHERE tenant_id = '7e1f7be1-06be-4c81-8494-6a58151f7d91'
);

-- Cliente para mateuscodersilva@gmail.com
INSERT INTO customers (name, email, phone, document, city, type, is_active, tenant_id, user_id, created_at, updated_at)
SELECT 
    'João Silva',
    'joao@empresa.com',
    '(11) 88888-8888',
    '987.654.321-00',
    'Rio de Janeiro',
    'PF',
    true,
    '744d088f-3e84-4d66-848f-c52a686bb98d',
    '744d088f-3e84-4d66-848f-c52a686bb98d',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM customers WHERE tenant_id = '744d088f-3e84-4d66-848f-c52a686bb98d'
);

-- Cliente para admin@juga.com
INSERT INTO customers (name, email, phone, document, city, type, is_active, tenant_id, user_id, created_at, updated_at)
SELECT 
    'Maria Santos',
    'maria@empresa.com',
    '(11) 77777-7777',
    '456.789.123-00',
    'Belo Horizonte',
    'PF',
    true,
    '293d5aa9-294a-467e-8c34-1fe4939ec140',
    '293d5aa9-294a-467e-8c34-1fe4939ec140',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM customers WHERE tenant_id = '293d5aa9-294a-467e-8c34-1fe4939ec140'
);

-- ============================================
-- 3. VERIFICAR RESULTADO
-- ============================================

-- Mostrar dados por tenant após inserção
SELECT 
    'DADOS APÓS INSERÇÃO' as info,
    t.id as tenant_id,
    t.name as tenant_name,
    t.email as tenant_email,
    (SELECT COUNT(*) FROM products p WHERE p.tenant_id = t.id) as produtos,
    (SELECT COUNT(*) FROM customers c WHERE c.tenant_id = t.id) as clientes,
    (SELECT COUNT(*) FROM sales s WHERE s.tenant_id = t.id) as vendas
FROM tenants t
ORDER BY t.created_at DESC
LIMIT 10;

-- ============================================
-- 4. MENSAGEM DE SUCESSO
-- ============================================

SELECT '✅ Dados de exemplo adicionados para tenants vazios!' as resultado;

