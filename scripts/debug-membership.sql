-- ===================================================================
-- DEBUG: VERIFICAR EXATAMENTE O QUE ESTÁ ACONTECENDO
-- COPIE E COLE NO SQL EDITOR DO SUPABASE
-- ===================================================================

-- 1. Verificar se o membership existe
SELECT 
    'MEMBERSHIP DIRETO' as tipo,
    * 
FROM public.user_memberships 
WHERE user_id = '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01';

-- 2. Verificar com JOIN (como a query do código faz)
SELECT 
    'MEMBERSHIP COM JOIN' as tipo,
    um.*,
    t.name as tenant_name,
    t.id as tenant_id_full
FROM public.user_memberships um
LEFT JOIN public.tenants t ON t.id = um.tenant_id
WHERE um.user_id = '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01'
AND um.is_active = true;

-- 3. Testar a query EXATA que o código está fazendo (com tenants(*))
SELECT 
    'QUERY EXATA DO CODIGO' as tipo,
    um.*
FROM public.user_memberships um
WHERE um.user_id = '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01'
AND um.is_active = true;

-- 4. Verificar se é problema de tipo de dados
SELECT 
    'TIPOS DE DADOS' as info,
    pg_typeof(user_id) as tipo_user_id,
    user_id,
    length(user_id) as tamanho_user_id
FROM public.user_memberships 
WHERE user_id = '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01';

-- 5. Buscar TODOS os memberships para comparar
SELECT 
    'TODOS OS MEMBERSHIPS' as tipo,
    *
FROM public.user_memberships 
ORDER BY created_at DESC 
LIMIT 5;


