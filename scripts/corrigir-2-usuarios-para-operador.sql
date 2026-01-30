-- Script para corrigir os 2 usuários específicos para Operador
-- Execute este script no SQL Editor do Supabase

-- Atualizar os 2 usuários mencionados para 'vendedor' (operador)
UPDATE user_profiles
SET role_type = 'vendedor'
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
        'gabrieldesouza112@gmail.com',
        'gabrieldesouza1001@gmail.com'
    )
)
AND role_type = 'admin';

-- Verificar se foi atualizado corretamente
SELECT 
    up.user_id,
    au.email,
    up.name,
    up.role_type,
    um.role as membership_role
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
LEFT JOIN user_memberships um ON um.user_id = up.user_id AND um.is_active = true
WHERE au.email IN (
    'gabrieldesouza112@gmail.com',
    'gabrieldesouza1001@gmail.com'
);
