-- 🔧 GARANTIR DADOS PARA CLIENTES
-- Execute este script no Supabase SQL Editor para garantir que há dados

-- 1. Verificar se existem tenants
SELECT 'VERIFICANDO TENANTS' as status, COUNT(*) as total FROM tenants;

-- 2. Verificar se existem clientes
SELECT 'VERIFICANDO CLIENTES' as status, COUNT(*) as total FROM customers;

-- 3. Se não há clientes, adicionar dados de exemplo para todos os tenants
INSERT INTO customers (
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
    t.id,
    t.id,
    'Cliente Exemplo - ' || COALESCE(t.name, 'Empresa'),
    'cliente@' || COALESCE(SPLIT_PART(t.email, '@', 2), 'exemplo.com'),
    '(11) 99999-9999',
    '123.456.789-00',
    'São Paulo',
    'Rua Exemplo, 123',
    'Centro',
    'SP',
    '01234-567',
    'Cliente de exemplo para teste do sistema',
    true,
    NOW(),
    NOW()
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.tenant_id = t.id
);

-- 4. Verificar resultado final
SELECT 
    'RESULTADO FINAL' as status,
    (SELECT COUNT(*) FROM tenants) as total_tenants,
    (SELECT COUNT(*) FROM customers) as total_clientes,
    (SELECT COUNT(DISTINCT tenant_id) FROM customers) as tenants_com_clientes;
