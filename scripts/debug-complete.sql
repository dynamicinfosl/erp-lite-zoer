-- ============================================
-- DEBUG COMPLETO: Todos os dados de uma vez
-- ============================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor

WITH debug_info AS (
    -- 1. Contar tenants
    SELECT 'tenants_count' as tipo, COUNT(*)::text as valor, '' as extra FROM tenants
    
    UNION ALL
    
    -- 2. Contar usuários auth
    SELECT 'auth_users_count' as tipo, COUNT(*)::text as valor, '' as extra FROM auth.users
    
    UNION ALL
    
    -- 3. Verificar correspondências
    SELECT 
        'tenants_with_match' as tipo, 
        COUNT(*)::text as valor,
        '' as extra
    FROM tenants t
    WHERE EXISTS (SELECT 1 FROM auth.users au WHERE au.id::text = t.id::text)
    
    UNION ALL
    
    -- 4. Verificar tipos de dados
    SELECT 
        'tenants_id_type' as tipo,
        data_type as valor,
        '' as extra
    FROM information_schema.columns 
    WHERE table_name = 'tenants' AND column_name = 'id'
    
    UNION ALL
    
    SELECT 
        'auth_users_id_type' as tipo,
        data_type as valor,
        '' as extra
    FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id'
    
    UNION ALL
    
    -- 5. Verificar se há usuários sem tenant
    SELECT 
        'users_without_tenant' as tipo,
        COUNT(*)::text as valor,
        '' as extra
    FROM auth.users au
    WHERE NOT EXISTS (SELECT 1 FROM tenants t WHERE t.id = au.id)
    
    UNION ALL
    
    -- 6. Mostrar alguns tenants
    SELECT 
        'tenant_sample' as tipo,
        id::text as valor,
        COALESCE(email, 'NULL') as extra
    FROM tenants 
    ORDER BY created_at DESC
    LIMIT 3
    
    UNION ALL
    
    -- 7. Mostrar alguns usuários auth
    SELECT 
        'auth_user_sample' as tipo,
        id::text as valor,
        email as extra
    FROM auth.users 
    ORDER BY created_at DESC
    LIMIT 3
    
    UNION ALL
    
    -- 8. Verificar se existe pelo menos uma correspondência
    SELECT 
        'has_any_match' as tipo,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM tenants t 
                INNER JOIN auth.users au ON t.id = au.id
            ) THEN 'YES' 
            ELSE 'NO' 
        END as valor,
        '' as extra
)

SELECT 
    tipo,
    valor,
    extra,
    CASE 
        WHEN tipo = 'tenants_count' THEN '📊 Total de tenants: ' || valor
        WHEN tipo = 'auth_users_count' THEN '👥 Total de usuários auth: ' || valor
        WHEN tipo = 'tenants_with_match' THEN '🔗 Tenants com correspondência: ' || valor
        WHEN tipo = 'tenants_id_type' THEN '🏷️ Tipo ID tenants: ' || valor
        WHEN tipo = 'auth_users_id_type' THEN '🏷️ Tipo ID auth users: ' || valor
        WHEN tipo = 'users_without_tenant' THEN '⚠️ Usuários sem tenant: ' || valor
        WHEN tipo = 'tenant_sample' THEN '🏢 Tenant: ' || valor || ' (email: ' || extra || ')'
        WHEN tipo = 'auth_user_sample' THEN '👤 User: ' || valor || ' (email: ' || extra || ')'
        WHEN tipo = 'has_any_match' THEN '✅ Tem correspondência: ' || valor
        ELSE tipo || ': ' || valor || ' (' || extra || ')'
    END as resultado
FROM debug_info
ORDER BY 
    CASE tipo
        WHEN 'tenants_count' THEN 1
        WHEN 'auth_users_count' THEN 2
        WHEN 'tenants_with_match' THEN 3
        WHEN 'tenants_id_type' THEN 4
        WHEN 'auth_users_id_type' THEN 5
        WHEN 'users_without_tenant' THEN 6
        WHEN 'has_any_match' THEN 7
        WHEN 'tenant_sample' THEN 8
        WHEN 'auth_user_sample' THEN 9
        ELSE 10
    END;

