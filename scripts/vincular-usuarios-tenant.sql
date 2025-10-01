-- =============================================
-- VINCULAR USUÁRIOS AO TENANT DE DESENVOLVIMENTO
-- Execute no SQL Editor do Supabase
-- =============================================

-- Primeiro, vamos ver todos os usuários cadastrados
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- =============================================
-- AGORA VINCULE OS USUÁRIOS QUE VOCÊ QUER
-- Copie os IDs da query acima e cole abaixo
-- =============================================

-- Vincular gabrieldecousa100@gmail.com (OWNER)
INSERT INTO public.user_memberships (user_id, tenant_id, role, is_active)
SELECT 
    id,
    '11111111-1111-1111-1111-111111111111',
    'owner',
    true
FROM auth.users
WHERE email = 'gabrieldecousa100@gmail.com'
ON CONFLICT (user_id, tenant_id) 
DO UPDATE SET 
    role = 'owner',
    is_active = true,
    updated_at = NOW();

-- Vincular outros usuários como operadores (se quiser)
-- Descomente e ajuste os emails conforme necessário:

/*
INSERT INTO public.user_memberships (user_id, tenant_id, role, is_active)
SELECT 
    id,
    '11111111-1111-1111-1111-111111111111',
    'operator',
    true
FROM auth.users
WHERE email IN (
    'admin@jujga.com',
    'admin@erpsite.com', 
    'mataeuscoderph@gmail.com'
)
ON CONFLICT (user_id, tenant_id) 
DO UPDATE SET 
    is_active = true,
    updated_at = NOW();
*/

-- =============================================
-- VERIFICAR RESULTADO
-- =============================================

SELECT 
    um.id,
    um.role,
    um.is_active,
    u.email as user_email,
    u.created_at as user_created,
    u.last_sign_in_at as last_login,
    t.name as tenant_name,
    t.status as tenant_status,
    t.email as tenant_email
FROM public.user_memberships um
JOIN auth.users u ON u.id = um.user_id
JOIN public.tenants t ON t.id = um.tenant_id
ORDER BY um.created_at DESC;

-- =============================================
-- SE TUDO ESTIVER OK, VOCÊ DEVE VER:
-- - Seu email (gabrieldecousa100@gmail.com)
-- - Role: owner
-- - Tenant: JUGA - Desenvolvimento
-- - Status: active
-- =============================================


