-- ============================================
-- VERIFICAR TENANT ESPECÍFICO - VERSÃO SIMPLES
-- ============================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor

-- 1. Verificar se o tenant existe
SELECT 
    'TENANT INFO' as tipo,
    id,
    name,
    email,
    created_at
FROM tenants 
WHERE id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565';

-- 2. Verificar se o usuário auth existe
SELECT 
    'AUTH USER INFO' as tipo,
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565';

-- 3. Contar produtos para este tenant
SELECT 
    'PRODUTOS COUNT' as tipo,
    COUNT(*) as total,
    'produtos encontrados' as descricao
FROM products 
WHERE tenant_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
   OR user_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565';

-- 4. Contar clientes para este tenant
SELECT 
    'CLIENTES COUNT' as tipo,
    COUNT(*) as total,
    'clientes encontrados' as descricao
FROM customers 
WHERE tenant_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
   OR user_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565';

-- 5. Mostrar alguns produtos (se existirem)
SELECT 
    'PRODUTO SAMPLE' as tipo,
    id,
    name,
    sku,
    tenant_id,
    user_id
FROM products 
WHERE tenant_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
   OR user_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
ORDER BY created_at DESC
LIMIT 3;

-- 6. Mostrar alguns clientes (se existirem)
SELECT 
    'CLIENTE SAMPLE' as tipo,
    id,
    name,
    email,
    tenant_id,
    user_id
FROM customers 
WHERE tenant_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
   OR user_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
ORDER BY created_at DESC
LIMIT 3;

