-- Script para corrigir memberships de todos os usuários
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar usuários sem membership ativo
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created_at,
    COUNT(um.id) as membership_count
FROM auth.users u
LEFT JOIN user_memberships um ON um.user_id = u.id AND um.is_active = true
GROUP BY u.id, u.email, u.created_at
HAVING COUNT(um.id) = 0;

-- 2. Criar memberships para usuários que não têm
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
);

-- 3. Criar tenants para usuários que não têm (se necessário)
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

-- 6. Criar função para garantir membership em novos usuários
CREATE OR REPLACE FUNCTION create_user_membership()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar tenant para o novo usuário
    INSERT INTO tenants (id, name, slug, status, email, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(SPLIT_PART(NEW.email, '@', 1), 'Minha Empresa'),
        'tenant-' || SUBSTRING(NEW.id::text, 1, 8),
        'trial',
        NEW.email,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Criar membership para o novo usuário
    INSERT INTO user_memberships (user_id, tenant_id, role, is_active, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.id,  -- Usar user_id como tenant_id
        'owner',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, tenant_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para novos usuários
DROP TRIGGER IF EXISTS trigger_create_user_membership ON auth.users;
CREATE TRIGGER trigger_create_user_membership
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_membership();

-- 8. Verificar se o trigger foi criado
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_user_membership';
