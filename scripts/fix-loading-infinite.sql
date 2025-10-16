-- 🔧 CORREÇÃO DO LOADING INFINITO
-- Execute este script no Supabase SQL Editor para corrigir o problema

-- 1. Garantir que todos os tenants tenham pelo menos alguns dados
-- Adicionar dados de exemplo para tenants vazios

-- Primeiro, vamos verificar quais tenants não têm dados
WITH tenants_sem_dados AS (
    SELECT t.id, t.name, t.email
    FROM tenants t
    LEFT JOIN customers c ON c.tenant_id = t.id
    LEFT JOIN products p ON p.tenant_id = t.id
    WHERE c.id IS NULL AND p.id IS NULL
)
-- Adicionar cliente de exemplo para tenants vazios
INSERT INTO customers (
    id,
    tenant_id,
    user_id,
    name,
    email,
    phone,
    document,
    city,
    address,
    neighborhood,
    state,
    zipcode,
    notes,
    is_active,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    t.id,
    t.id,
    'Cliente Exemplo',
    'cliente@exemplo.com',
    '(11) 99999-9999',
    '123.456.789-00',
    'São Paulo',
    'Rua Exemplo, 123',
    'Centro',
    'SP',
    '01234-567',
    'Cliente de exemplo para teste',
    true,
    NOW(),
    NOW()
FROM tenants_sem_dados t
WHERE NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.tenant_id = t.id
);

-- 2. Adicionar produto de exemplo para tenants vazios
INSERT INTO products (
    id,
    tenant_id,
    user_id,
    name,
    description,
    price,
    cost,
    stock,
    min_stock,
    category,
    brand,
    sku,
    barcode,
    is_active,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    t.id,
    t.id,
    'Produto Exemplo',
    'Produto de exemplo para teste',
    100.00,
    50.00,
    10,
    5,
    'Geral',
    'Marca Exemplo',
    'PROD-001',
    '1234567890123',
    true,
    NOW(),
    NOW()
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM products p WHERE p.tenant_id = t.id
);

-- 3. Verificar se a correção funcionou
SELECT 
    'CORREÇÃO APLICADA' as status,
    (SELECT COUNT(*) FROM customers) as total_clientes,
    (SELECT COUNT(*) FROM products) as total_produtos,
    (SELECT COUNT(*) FROM tenants) as total_tenants,
    (SELECT COUNT(DISTINCT tenant_id) FROM customers) as tenants_com_clientes,
    (SELECT COUNT(DISTINCT tenant_id) FROM products) as tenants_com_produtos;

