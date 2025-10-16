-- ============================================
-- VERIFICAR DADOS DO TENANT ESPECÍFICO - UNIFICADO
-- ============================================
-- Este script verifica os dados do tenant que está logado no sistema

-- IMPORTANTE: Execute este script no Supabase SQL Editor

WITH tenant_data AS (
    -- 1. Verificar tenant
    SELECT 
        'tenant_info' as tipo,
        'tenant' as categoria,
        id::text as id_info,
        name as nome_email,
        email as extra_info,
        created_at::text as timestamp_info
    FROM tenants 
    WHERE id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
    
    UNION ALL
    
    -- 2. Verificar usuário auth
    SELECT 
        'auth_user_info' as tipo,
        'auth' as categoria,
        id::text as id_info,
        email as nome_email,
        created_at::text as extra_info,
        COALESCE(last_sign_in_at::text, 'nunca') as timestamp_info
    FROM auth.users 
    WHERE id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
    
    UNION ALL
    
    -- 3. Contar produtos do tenant
    SELECT 
        'produtos_count' as tipo,
        'produtos' as categoria,
        COUNT(*)::text as id_info,
        'produtos encontrados' as nome_email,
        '' as extra_info,
        '' as timestamp_info
    FROM products 
    WHERE tenant_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
       OR user_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
    
    UNION ALL
    
    -- 4. Contar clientes do tenant
    SELECT 
        'clientes_count' as tipo,
        'clientes' as categoria,
        COUNT(*)::text as id_info,
        'clientes encontrados' as nome_email,
        '' as extra_info,
        '' as timestamp_info
    FROM customers 
    WHERE tenant_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
       OR user_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
    
    UNION ALL
    
    -- 5. Contar vendas do tenant
    SELECT 
        'vendas_count' as tipo,
        'vendas' as categoria,
        COUNT(*)::text as id_info,
        'vendas encontradas' as nome_email,
        '' as extra_info,
        '' as timestamp_info
    FROM sales 
    WHERE tenant_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
       OR user_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
    
    UNION ALL
    
    -- 6. Mostrar alguns produtos do tenant (se existirem)
    SELECT 
        'produto_sample' as tipo,
        'produto' as categoria,
        id::text as id_info,
        name as nome_email,
        sku as extra_info,
        created_at::text as timestamp_info
    FROM products 
    WHERE (tenant_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
           OR user_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565')
      AND id IS NOT NULL
    LIMIT 3
    
    UNION ALL
    
    -- 7. Mostrar alguns clientes do tenant (se existirem)
    SELECT 
        'cliente_sample' as tipo,
        'cliente' as categoria,
        id::text as id_info,
        name as nome_email,
        COALESCE(email, 'sem email') as extra_info,
        created_at::text as timestamp_info
    FROM customers 
    WHERE (tenant_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565'
           OR user_id = '5305296a-c1a1-4b9d-8934-e7b8bfc82565')
      AND id IS NOT NULL
    LIMIT 3
)

SELECT 
    tipo,
    categoria,
    id_info,
    nome_email,
    extra_info,
    timestamp_info,
    CASE 
        WHEN tipo = 'tenant_info' THEN '🏢 TENANT: ' || nome_email || ' (' || id_info || ') - Email: ' || extra_info
        WHEN tipo = 'auth_user_info' THEN '👤 USUÁRIO: ' || nome_email || ' (' || id_info || ') - Último login: ' || timestamp_info
        WHEN tipo = 'produtos_count' THEN '📦 PRODUTOS: ' || id_info || ' produtos encontrados para este tenant'
        WHEN tipo = 'clientes_count' THEN '👥 CLIENTES: ' || id_info || ' clientes encontrados para este tenant'
        WHEN tipo = 'vendas_count' THEN '💰 VENDAS: ' || id_info || ' vendas encontradas para este tenant'
        WHEN tipo = 'produto_sample' THEN '📦 PRODUTO: ' || nome_email || ' (SKU: ' || extra_info || ') - ID: ' || id_info
        WHEN tipo = 'cliente_sample' THEN '👥 CLIENTE: ' || nome_email || ' (Email: ' || extra_info || ') - ID: ' || id_info
        ELSE tipo || ': ' || id_info
    END as resultado
FROM tenant_data
ORDER BY 
    CASE tipo
        WHEN 'tenant_info' THEN 1
        WHEN 'auth_user_info' THEN 2
        WHEN 'produtos_count' THEN 3
        WHEN 'clientes_count' THEN 4
        WHEN 'vendas_count' THEN 5
        WHEN 'produto_sample' THEN 6
        WHEN 'cliente_sample' THEN 7
        ELSE 8
    END;
