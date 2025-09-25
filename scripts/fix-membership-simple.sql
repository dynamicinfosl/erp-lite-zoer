-- ===================================================================
-- SOLUÇÃO SIMPLES: CRIAR MEMBERSHIP MANUAL
-- COPIE E COLE NO SQL EDITOR DO SUPABASE
-- ===================================================================

-- 1. Ver todos os tenants que existem
SELECT id, name, slug, created_at FROM public.tenants 
ORDER BY created_at DESC;

-- 2. Ver se já existe membership para este usuário
SELECT * FROM public.user_memberships 
WHERE user_id = '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01';

-- 3. MÉTODO MANUAL - Substituir TENANT_ID_AQUI pelo ID real do tenant
-- Copie o ID do tenant da query 1 e cole aqui:

-- EXEMPLO (SUBSTITUA pelo ID real):
-- INSERT INTO public.user_memberships (
--     user_id, 
--     tenant_id, 
--     role, 
--     is_active
-- ) VALUES (
--     '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01',
--     'COLE_O_ID_DO_TENANT_AQUI',
--     'owner',
--     true
-- );

-- 4. OU CRIAR UM TENANT NOVO E MEMBERSHIP JUNTOS:
-- Primeiro criar o tenant
INSERT INTO public.tenants (name, slug, status, trial_ends_at) VALUES
('Teste Gabriel', 'teste-gabriel', 'trial', NOW() + INTERVAL '30 days')
RETURNING id;

-- Depois criar o membership (substitua o ID que apareceu acima)
INSERT INTO public.user_memberships (
    user_id, 
    tenant_id, 
    role, 
    is_active
) VALUES (
    '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01',
    (SELECT id FROM public.tenants WHERE slug = 'teste-gabriel' LIMIT 1),
    'owner',
    true
);

-- 5. Verificar se funcionou
SELECT 
    um.*,
    t.name as tenant_name
FROM public.user_memberships um
JOIN public.tenants t ON t.id = um.tenant_id
WHERE um.user_id = '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01';


