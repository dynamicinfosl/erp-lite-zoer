-- Script para corrigir usuários que foram criados como 'admin' mas deveriam ser 'vendedor' (operador)
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar usuários que têm role_type 'admin' mas não são owners
SELECT 
    up.user_id,
    au.email,
    up.name,
    up.role_type,
    um.role as membership_role,
    um.tenant_id
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
LEFT JOIN user_memberships um ON um.user_id = up.user_id AND um.is_active = true
WHERE up.role_type = 'admin'
AND (um.role IS NULL OR um.role != 'owner')
ORDER BY up.created_at DESC;

-- 2. ATENÇÃO: Antes de executar, identifique quais usuários devem ser operadores
-- Por padrão, vamos assumir que usuários que NÃO são owners devem ser operadores
-- EXCETO se você souber especificamente quais são admins

-- 3. Atualizar para 'vendedor' (operador) - DESCOMENTE APENAS SE TIVER CERTEZA
-- IMPORTANTE: Ajuste a condição WHERE conforme necessário

/*
UPDATE user_profiles
SET role_type = 'vendedor'
WHERE role_type = 'admin'
AND user_id IN (
    -- Lista de user_ids que você sabe que são operadores
    -- Exemplo para os 2 usuários mencionados:
    SELECT user_id FROM auth.users 
    WHERE email IN (
        'gabrieldesouza112@gmail.com',
        'gabrieldesouza1001@gmail.com'
    )
);
*/

-- 4. OU: Atualizar TODOS os não-owners para operador (CUIDADO!)
-- Descomente apenas se TODOS os usuários não-owners devem ser operadores:

/*
UPDATE user_profiles up
SET role_type = 'vendedor'
WHERE up.role_type = 'admin'
AND EXISTS (
    SELECT 1 FROM user_memberships um
    WHERE um.user_id = up.user_id
    AND um.is_active = true
    AND um.role != 'owner'
);
*/
