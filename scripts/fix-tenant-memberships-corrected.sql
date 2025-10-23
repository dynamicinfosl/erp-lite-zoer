-- Script corrigido para memberships - criar tenants primeiro
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, criar tenants para todos os usuários que não têm
INSERT INTO tenants (id, name, slug, status, email, phone, document, address, city, state, zip_code, created_at, updated_at)
SELECT 
    u.id as id,
    COALESCE(
        SPLIT_PART(u.email, '@', 1),  -- Usar parte antes do @ do email
        'Minha Empresa'
    ) as name,
    'tenant-' || SUBSTRING(u.id::text, 1, 8) as slug,
    'trial' as status,
    u.email,
    NULL as phone,
    NULL as document,
    NULL as address,
    NULL as city,
    NULL as state,
    NULL as zip_code,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM tenants t WHERE t.id = u.id
);

-- 2. Verificar quantos tenants foram criados
SELECT COUNT(*) as tenants_created
FROM tenants t
WHERE t.id IN (SELECT id FROM auth.users);

-- 3. Agora criar memberships para usuários que não têm
INSERT INTO user_memberships (user_id, tenant_id, role, is_active, created_at, updated_at)
SELECT 
    u.id as user_id,
    u.id as tenant_id,  -- Usar user_id como tenant_id (padrão)
    'owner' as role,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_memberships um 
    WHERE um.user_id = u.id AND um.is_active = true
)
AND EXISTS (
    SELECT 1 FROM tenants t WHERE t.id = u.id
);

-- 4. Verificar resultado - todos os usuários devem ter membership
SELECT 
    u.id as user_id,
    u.email,
    t.name as tenant_name,
    um.role,
    um.is_active,
    um.created_at as membership_created
FROM auth.users u
LEFT JOIN user_memberships um ON um.user_id = u.id AND um.is_active = true
LEFT JOIN tenants t ON t.id = um.tenant_id
ORDER BY u.created_at;

-- 5. Verificar se há usuários sem membership (deve retornar 0)
SELECT COUNT(*) as users_without_membership
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_memberships um 
    WHERE um.user_id = u.id AND um.is_active = true
);

-- 6. Verificar se há tenants órfãos (sem membership)
SELECT COUNT(*) as tenants_without_membership
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM user_memberships um 
    WHERE um.tenant_id = t.id AND um.is_active = true
);
