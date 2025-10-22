-- Script para criar memberships para tenants órfãos
-- Execute este script no SQL Editor do Supabase

-- 1. Criar memberships para todos os tenants que não têm
INSERT INTO user_memberships (user_id, tenant_id, role, is_active, created_at, updated_at)
SELECT 
    t.id as user_id,  -- Usar tenant_id como user_id
    t.id as tenant_id,
    'owner' as role,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM user_memberships um 
    WHERE um.tenant_id = t.id AND um.is_active = true
)
AND t.id IN (SELECT id FROM auth.users);  -- Só para tenants que são usuários

-- 2. Verificar quantos memberships foram criados
SELECT COUNT(*) as memberships_created
FROM user_memberships um
WHERE um.created_at > NOW() - INTERVAL '1 minute';

-- 3. Verificar se ainda há tenants sem membership
SELECT COUNT(*) as tenants_without_membership
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM user_memberships um 
    WHERE um.tenant_id = t.id AND um.is_active = true
);

-- 4. Verificar se ainda há usuários sem membership
SELECT COUNT(*) as users_without_membership
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_memberships um 
    WHERE um.user_id = u.id AND um.is_active = true
);

-- 5. Mostrar todos os memberships ativos
SELECT 
    um.user_id,
    um.tenant_id,
    um.role,
    um.is_active,
    u.email,
    t.name as tenant_name
FROM user_memberships um
JOIN auth.users u ON u.id = um.user_id
JOIN tenants t ON t.id = um.tenant_id
WHERE um.is_active = true
ORDER BY um.created_at DESC
LIMIT 10;
