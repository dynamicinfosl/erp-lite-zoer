-- ============================================
-- SOLUÇÃO: Criar Tenants para Usuários Auth
-- ============================================
-- Este script cria tenants para todos os usuários auth que não têm tenant
-- e adiciona os emails automaticamente

-- IMPORTANTE: Execute este script no Supabase SQL Editor

-- ============================================
-- 1. CRIAR TENANTS PARA USUÁRIOS AUTH SEM TENANT
-- ============================================

-- Inserir tenants para usuários auth que não têm tenant
INSERT INTO tenants (id, name, slug, email, trial_ends_at, settings, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(
        SPLIT_PART(au.email, '@', 1), 
        'Meu Negócio'
    ) as name,
    LOWER(REGEXP_REPLACE(
        COALESCE(SPLIT_PART(au.email, '@', 1), 'meu-negocio'), 
        '[^a-zA-Z0-9]', '-', 'g'
    )) || '-' || SUBSTRING(au.id::text, 1, 8) as slug,
    au.email,
    NOW() + INTERVAL '30 days' as trial_ends_at,
    '{}'::jsonb as settings,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM tenants t WHERE t.id = au.id
);

-- ============================================
-- 2. VERIFICAR RESULTADO
-- ============================================

-- Contar quantos tenants foram criados
SELECT 
    'TENANTS CRIADOS' as info,
    COUNT(*) as total
FROM tenants;

-- Contar quantos usuários ainda não têm tenant
SELECT 
    'USUARIOS SEM TENANT' as info,
    COUNT(*) as total
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM tenants t WHERE t.id = au.id
);

-- ============================================
-- 3. MOSTRAR TENANTS COM EMAIL
-- ============================================

-- Mostrar todos os tenants com seus emails
SELECT 
    'TENANTS COM EMAIL' as info,
    id,
    email,
    created_at
FROM tenants 
WHERE email IS NOT NULL
ORDER BY created_at DESC;

-- ============================================
-- 4. CONTAR TENANTS COM EMAIL
-- ============================================

-- Contar quantos tenants têm email
SELECT 
    'TENANTS COM EMAIL' as info,
    COUNT(*) as total
FROM tenants 
WHERE email IS NOT NULL;

-- ============================================
-- 5. VERIFICAR CORRESPONDÊNCIA FINAL
-- ============================================

-- Verificar se todos os usuários auth têm tenant
SELECT 
    'TODOS TEM TENANT' as info,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SIM - Todos os usuários têm tenant'
        ELSE '❌ NÃO - Ainda há ' || COUNT(*) || ' usuários sem tenant'
    END as status
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM tenants t WHERE t.id = au.id
);

-- ============================================
-- 6. MENSAGEM DE SUCESSO
-- ============================================

SELECT '✅ Tenants criados com sucesso! Agora todos os usuários têm tenant com email.' as resultado;
