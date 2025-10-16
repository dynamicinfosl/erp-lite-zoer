-- ============================================
-- DEBUG SIMPLES: Verificar Tenants vs Auth Users
-- ============================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor

-- ============================================
-- 1. CONTAR TENANTS
-- ============================================

SELECT 'TENANTS COUNT' as info, COUNT(*) as total FROM tenants;

-- ============================================
-- 2. CONTAR USUÁRIOS AUTH
-- ============================================

SELECT 'AUTH USERS COUNT' as info, COUNT(*) as total FROM auth.users;

-- ============================================
-- 3. VER PRIMEIROS 5 TENANTS
-- ============================================

SELECT 'FIRST 5 TENANTS' as info, id, email FROM tenants LIMIT 5;

-- ============================================
-- 4. VER PRIMEIROS 5 USUÁRIOS AUTH
-- ============================================

SELECT 'FIRST 5 AUTH USERS' as info, id, email FROM auth.users LIMIT 5;

-- ============================================
-- 5. VERIFICAR SE EXISTE CORRESPONDÊNCIA
-- ============================================

-- Verificar se algum tenant.id existe em auth.users
SELECT 
    'TENANTS COM CORRESPONDENCIA' as info,
    COUNT(*) as total
FROM tenants t
WHERE EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id::text = t.id::text
);

-- ============================================
-- 6. VERIFICAR TIPOS DE DADOS
-- ============================================

-- Tipo da coluna id em tenants
SELECT 
    'TENANTS.ID TYPE' as info,
    data_type
FROM information_schema.columns 
WHERE table_name = 'tenants' AND column_name = 'id';

-- Tipo da coluna id em auth.users
SELECT 
    'AUTH.USERS.ID TYPE' as info,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id';

-- ============================================
-- 7. TESTE SIMPLES DE CORRESPONDÊNCIA
-- ============================================

-- Tentar encontrar pelo menos uma correspondência
SELECT 
    'CORRESPONDENCIA TEST' as info,
    t.id as tenant_id,
    au.id as auth_user_id,
    t.email as tenant_email,
    au.email as auth_email
FROM tenants t
INNER JOIN auth.users au ON t.id = au.id
LIMIT 1;

-- ============================================
-- 8. SE NÃO HOUVER CORRESPONDÊNCIA, CRIAR
-- ============================================

-- Verificar se precisamos criar tenants para os usuários auth
SELECT 
    'USUARIOS SEM TENANT' as info,
    au.id,
    au.email
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM tenants t 
    WHERE t.id = au.id
)
LIMIT 5;

-- ============================================
-- 9. RESUMO FINAL
-- ============================================

SELECT 'DEBUG COMPLETO' as resultado;

