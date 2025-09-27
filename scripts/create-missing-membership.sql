-- ===================================================================
-- CRIAR MEMBERSHIP PARA O USUÁRIO QUE ESTÁ FALTANDO
-- COPIE E COLE NO SQL EDITOR DO SUPABASE
-- ===================================================================

-- 1. Verificar se o usuário existe e qual tenant foi criado para ele
SELECT 
    u.id as user_id,
    u.email,
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug
FROM auth.users u
LEFT JOIN public.tenants t ON t.created_at > u.created_at 
WHERE u.email = 'gabrieldesouza100@gmail.com'
ORDER BY t.created_at DESC
LIMIT 1;

-- 2. Verificar se já existe membership para este usuário
SELECT * FROM public.user_memberships 
WHERE user_id = '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01';

-- 3. Se não existir membership, criar um (ajuste o tenant_id conforme necessário)
-- Primeiro, vamos ver qual tenant foi criado:
SELECT id, name, slug, created_at FROM public.tenants 
ORDER BY created_at DESC 
LIMIT 3;

-- 4. Criar o membership (substitua o tenant_id pelo correto da query acima)
-- Exemplo: se o tenant_id for 'abc123...', use ele aqui:
INSERT INTO public.user_memberships (
    user_id, 
    tenant_id, 
    role, 
    is_active
) VALUES (
    '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01',
    (SELECT id FROM public.tenants WHERE name = 'Teste 1' ORDER BY created_at DESC LIMIT 1),
    'owner',
    true
)
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- 5. Verificar se foi criado corretamente
SELECT 
    um.*,
    t.name as tenant_name
FROM public.user_memberships um
JOIN public.tenants t ON t.id = um.tenant_id
WHERE um.user_id = '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01';


