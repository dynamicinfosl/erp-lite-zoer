-- ============================================
-- DEBUG: Por que apenas 1 email foi adicionado?
-- ============================================
-- Este script investiga por que apenas alguns tenants receberam email

-- IMPORTANTE: Execute este script no Supabase SQL Editor

-- ============================================
-- 1. VERIFICAR TENANTS E SEUS IDs
-- ============================================

-- Mostrar todos os tenants
SELECT 
    'TENANTS' as tipo,
    id,
    email,
    created_at
FROM tenants 
ORDER BY created_at DESC;

-- ============================================
-- 2. VERIFICAR USUÁRIOS AUTH
-- ============================================

-- Mostrar todos os usuários do auth.users
SELECT 
    'AUTH_USERS' as tipo,
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC;

-- ============================================
-- 3. VERIFICAR CORRESPONDÊNCIA
-- ============================================

-- Verificar quais tenants têm correspondência em auth.users
SELECT 
    t.id as tenant_id,
    t.email as tenant_email,
    au.id as auth_user_id,
    au.email as auth_user_email,
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ TEM CORRESPONDÊNCIA'
        ELSE '❌ SEM CORRESPONDÊNCIA'
    END as status
FROM tenants t
LEFT JOIN auth.users au ON t.id::text = au.id::text
ORDER BY t.created_at DESC;

-- ============================================
-- 4. VERIFICAR TIPOS DE DADOS
-- ============================================

-- Verificar se os tipos de dados são compatíveis
SELECT 
    'TENANTS.ID' as coluna,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tenants' AND column_name = 'id';

SELECT 
    'AUTH_USERS.ID' as coluna,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id';

-- ============================================
-- 5. TENTAR CORRESPONDÊNCIA MANUAL
-- ============================================

-- Teste de correspondência direta (sem conversão)
SELECT 
    t.id as tenant_id,
    au.id as auth_user_id,
    t.id = au.id as correspondencia_direta,
    t.id::text = au.id::text as correspondencia_com_conversao
FROM tenants t
CROSS JOIN auth.users au
WHERE t.id = au.id OR t.id::text = au.id::text;

-- ============================================
-- 6. CONTAR CORRESPONDÊNCIAS
-- ============================================

-- Quantos tenants têm correspondência
SELECT 
    COUNT(*) as total_tenants,
    COUNT(au.id) as tenants_com_correspondencia,
    COUNT(*) - COUNT(au.id) as tenants_sem_correspondencia
FROM tenants t
LEFT JOIN auth.users au ON t.id::text = au.id::text;

-- ============================================
-- 7. SOLUÇÃO: ATUALIZAR TODOS OS TENANTS
-- ============================================

-- Se você quiser forçar a atualização de todos os tenants que têm correspondência
UPDATE tenants 
SET email = au.email
FROM auth.users au
WHERE tenants.id::text = au.id::text
  AND au.email IS NOT NULL
  AND tenants.email IS NULL;

-- ============================================
-- 8. VERIFICAR RESULTADO FINAL
-- ============================================

-- Mostrar resultado após atualização
SELECT 
    id,
    email,
    created_at,
    CASE 
        WHEN email IS NOT NULL THEN '✅ COM EMAIL'
        ELSE '❌ SEM EMAIL'
    END as status
FROM tenants 
ORDER BY created_at DESC;

-- ============================================
-- 9. MENSAGEM FINAL
-- ============================================

SELECT '🔍 Debug completo! Verifique os resultados acima.' as resultado;

