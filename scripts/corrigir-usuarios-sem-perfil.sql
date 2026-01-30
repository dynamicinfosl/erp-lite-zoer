-- Script para corrigir usuários que não têm user_profiles ou têm role_type incorreto
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar usuários sem user_profiles
SELECT 
    um.user_id,
    um.tenant_id,
    um.role as membership_role,
    au.email,
    up.role_type as profile_role_type,
    up.name as profile_name
FROM user_memberships um
JOIN auth.users au ON au.id = um.user_id
LEFT JOIN user_profiles up ON up.user_id = um.user_id
WHERE um.is_active = true
ORDER BY um.created_at DESC;

-- 2. Criar user_profiles para usuários que não têm
-- IMPORTANTE: Execute este script para criar perfis para todos os usuários sem profile

-- Criar user_profiles para usuários que não têm
-- Usando NOT EXISTS para evitar duplicatas (mais seguro que ON CONFLICT)
INSERT INTO user_profiles (user_id, name, role_type, is_active)
SELECT 
    um.user_id,
    COALESCE(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name',
        SPLIT_PART(au.email, '@', 1),
        'Usuário'
    ) as name,
    CASE 
        WHEN um.role = 'owner' THEN 'admin'
        WHEN um.role = 'admin' THEN 'admin' -- Admins são admin
        ELSE 'vendedor' -- Assumir operador por padrão para outros
    END as role_type,
    true as is_active
FROM user_memberships um
JOIN auth.users au ON au.id = um.user_id
WHERE um.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.user_id = um.user_id
);

-- 4. Verificar quantos perfis foram criados
SELECT COUNT(*) as perfis_criados
FROM user_profiles
WHERE created_at > NOW() - INTERVAL '1 minute';

-- 5. Atualizar role_type de usuários que têm 'admin' mas deveriam ser 'vendedor' (operador)
-- IMPORTANTE: Isso só deve ser feito se você tem certeza de quais usuários são operadores
-- Descomente e ajuste conforme necessário:

/*
UPDATE user_profiles
SET role_type = 'vendedor'
WHERE role_type = 'admin'
AND user_id IN (
    -- Lista de IDs de usuários que você sabe que são operadores
    -- Exemplo: SELECT user_id FROM user_memberships WHERE ...
);
*/
