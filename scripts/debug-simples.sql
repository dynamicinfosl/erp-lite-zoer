-- ============================================
-- DEBUG SIMPLES: Verificar Tenants vs Auth Users
-- ============================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor

-- 1. Contar tenants
SELECT 'TENANTS COUNT' as info, COUNT(*) as total FROM tenants;

-- 2. Contar usuários auth
SELECT 'AUTH USERS COUNT' as info, COUNT(*) as total FROM auth.users;

-- 3. Ver primeiros 3 tenants
SELECT 'TENANT SAMPLE' as info, id, email FROM tenants ORDER BY created_at DESC LIMIT 3;

-- 4. Ver primeiros 3 usuários auth
SELECT 'AUTH USER SAMPLE' as info, id, email FROM auth.users ORDER BY created_at DESC LIMIT 3;

-- 5. Verificar correspondências
SELECT 
    'CORRESPONDENCIA' as info,
    COUNT(*) as tenants_com_match
FROM tenants t
WHERE EXISTS (SELECT 1 FROM auth.users au WHERE au.id::text = t.id::text);

-- 6. Verificar tipos de dados
SELECT 'TENANTS ID TYPE' as info, data_type FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'id';
SELECT 'AUTH ID TYPE' as info, data_type FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id';

-- 7. Usuários sem tenant
SELECT 'USERS WITHOUT TENANT' as info, COUNT(*) as total FROM auth.users au WHERE NOT EXISTS (SELECT 1 FROM tenants t WHERE t.id = au.id);

-- 8. Teste de correspondência
SELECT 
    'MATCH TEST' as info,
    t.id as tenant_id,
    au.id as auth_user_id,
    t.email as tenant_email,
    au.email as auth_email
FROM tenants t
INNER JOIN auth.users au ON t.id = au.id
LIMIT 1;

