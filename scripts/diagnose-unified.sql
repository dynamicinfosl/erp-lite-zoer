-- ============================================
-- DIAGNÓSTICO UNIFICADO: Todos os dados de uma vez
-- ============================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor

WITH diagnostic_data AS (
    -- 1. Contar produtos por tenant
    SELECT 
        'produtos_por_tenant' as tipo,
        tenant_id::text as tenant_id,
        COUNT(*)::text as quantidade,
        'produtos' as categoria
    FROM products 
    GROUP BY tenant_id
    
    UNION ALL
    
    -- 2. Contar clientes por tenant
    SELECT 
        'clientes_por_tenant' as tipo,
        tenant_id::text as tenant_id,
        COUNT(*)::text as quantidade,
        'clientes' as categoria
    FROM customers 
    GROUP BY tenant_id
    
    UNION ALL
    
    -- 3. Contar vendas por tenant
    SELECT 
        'vendas_por_tenant' as tipo,
        tenant_id::text as tenant_id,
        COUNT(*)::text as quantidade,
        'vendas' as categoria
    FROM sales 
    GROUP BY tenant_id
    
    UNION ALL
    
    -- 4. Verificar consistência produtos
    SELECT 
        'produtos_inconsistentes' as tipo,
        'inconsistentes' as tenant_id,
        COUNT(*)::text as quantidade,
        'produtos com tenant_id != user_id' as categoria
    FROM products 
    WHERE tenant_id != user_id OR tenant_id IS NULL OR user_id IS NULL
    
    UNION ALL
    
    -- 5. Verificar consistência clientes
    SELECT 
        'clientes_inconsistentes' as tipo,
        'inconsistentes' as tenant_id,
        COUNT(*)::text as quantidade,
        'clientes com tenant_id != user_id' as categoria
    FROM customers 
    WHERE tenant_id != user_id OR tenant_id IS NULL OR user_id IS NULL
    
    UNION ALL
    
    -- 6. Verificar consistência vendas
    SELECT 
        'vendas_inconsistentes' as tipo,
        'inconsistentes' as tenant_id,
        COUNT(*)::text as quantidade,
        'vendas com tenant_id != user_id' as categoria
    FROM sales 
    WHERE tenant_id != user_id OR tenant_id IS NULL OR user_id IS NULL
    
    UNION ALL
    
    -- 7. Total de usuários auth
    SELECT 
        'total_usuarios_auth' as tipo,
        'auth' as tenant_id,
        COUNT(*)::text as quantidade,
        'usuários auth' as categoria
    FROM auth.users
    
    UNION ALL
    
    -- 8. Total de tenants
    SELECT 
        'total_tenants' as tipo,
        'tenants' as tenant_id,
        COUNT(*)::text as quantidade,
        'tenants criados' as categoria
    FROM tenants
)

SELECT 
    tipo,
    tenant_id,
    quantidade,
    categoria,
    CASE 
        WHEN tipo = 'produtos_por_tenant' THEN '📦 Produtos no tenant ' || tenant_id || ': ' || quantidade
        WHEN tipo = 'clientes_por_tenant' THEN '👥 Clientes no tenant ' || tenant_id || ': ' || quantidade
        WHEN tipo = 'vendas_por_tenant' THEN '💰 Vendas no tenant ' || tenant_id || ': ' || quantidade
        WHEN tipo = 'produtos_inconsistentes' THEN '❌ Produtos inconsistentes: ' || quantidade
        WHEN tipo = 'clientes_inconsistentes' THEN '❌ Clientes inconsistentes: ' || quantidade
        WHEN tipo = 'vendas_inconsistentes' THEN '❌ Vendas inconsistentes: ' || quantidade
        WHEN tipo = 'total_usuarios_auth' THEN '👤 Total usuários auth: ' || quantidade
        WHEN tipo = 'total_tenants' THEN '🏢 Total tenants: ' || quantidade
        ELSE tipo || ': ' || quantidade
    END as resultado
FROM diagnostic_data
ORDER BY 
    CASE tipo
        WHEN 'total_usuarios_auth' THEN 1
        WHEN 'total_tenants' THEN 2
        WHEN 'produtos_por_tenant' THEN 3
        WHEN 'clientes_por_tenant' THEN 4
        WHEN 'vendas_por_tenant' THEN 5
        WHEN 'produtos_inconsistentes' THEN 6
        WHEN 'clientes_inconsistentes' THEN 7
        WHEN 'vendas_inconsistentes' THEN 8
        ELSE 9
    END,
    tenant_id;

