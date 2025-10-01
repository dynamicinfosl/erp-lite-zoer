-- =============================================
-- VINCULAR USUÁRIO MANUALMENTE AO TENANT
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- Verificar usuários disponíveis
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- =============================================
-- IMPORTANTE: Copie o ID do usuário gabrieldecousa100@gmail.com
-- e substitua no comando abaixo
-- =============================================

-- Exemplo: Se o ID for c96cb3f7-a371-4ab2-8a94-df881810f766
-- Vincular ao tenant de desenvolvimento
INSERT INTO public.user_memberships (user_id, tenant_id, role, is_active)
VALUES (
    'c96cb3f7-a371-4ab2-8a94-df881810f766', -- ⬅️ SUBSTITUA PELO ID CORRETO
    '11111111-1111-1111-1111-111111111111',  -- Tenant de desenvolvimento
    'owner',
    true
)
ON CONFLICT (user_id, tenant_id) 
DO UPDATE SET 
    role = 'owner',
    is_active = true,
    updated_at = NOW();

-- Verificar se funcionou
SELECT 
    um.id,
    um.role,
    um.is_active,
    u.email as user_email,
    t.name as tenant_name,
    t.status as tenant_status
FROM public.user_memberships um
JOIN auth.users u ON u.id = um.user_id
JOIN public.tenants t ON t.id = um.tenant_id
WHERE um.tenant_id = '11111111-1111-1111-1111-111111111111';


