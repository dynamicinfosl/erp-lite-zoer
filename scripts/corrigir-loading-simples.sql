-- 🔧 CORREÇÃO SIMPLES DO LOADING INFINITO
-- Execute este script no Supabase SQL Editor

-- 1. Verificar situação atual
SELECT 
    'SITUAÇÃO ATUAL' as info,
    (SELECT COUNT(*) FROM tenants) as total_tenants,
    (SELECT COUNT(*) FROM customers) as total_clientes,
    (SELECT COUNT(*) FROM products) as total_produtos;

-- 2. Adicionar apenas UM cliente de exemplo para cada tenant que não tem dados
INSERT INTO customers (
    tenant_id,
    user_id,
    name,
    email,
    phone,
    document,
    city,
    is_active,
    created_at,
    updated_at
)
SELECT 
    t.id,
    t.id,
    'Cliente Exemplo',
    'cliente@exemplo.com',
    '(11) 99999-9999',
    '123.456.789-00',
    'São Paulo',
    true,
    NOW(),
    NOW()
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.tenant_id = t.id
)
LIMIT 1; -- Apenas 1 cliente por tenant

-- 3. Adicionar apenas UM produto de exemplo para cada tenant que não tem dados
INSERT INTO products (
    tenant_id,
    user_id,
    name,
    description,
    sale_price,
    is_active,
    created_at,
    updated_at
)
SELECT 
    t.id,
    t.id,
    'Produto Exemplo',
    'Produto de exemplo para teste',
    100.00,
    true,
    NOW(),
    NOW()
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM products p WHERE p.tenant_id = t.id
)
LIMIT 1; -- Apenas 1 produto por tenant

-- 4. Verificar resultado
SELECT 
    'CORREÇÃO APLICADA' as status,
    (SELECT COUNT(*) FROM customers) as total_clientes,
    (SELECT COUNT(*) FROM products) as total_produtos,
    (SELECT COUNT(DISTINCT tenant_id) FROM customers) as tenants_com_clientes,
    (SELECT COUNT(DISTINCT tenant_id) FROM products) as tenants_com_produtos;
