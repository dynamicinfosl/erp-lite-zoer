-- ===================================================================
-- DEBUG: VERSÃO CORRIGIDA PARA UUID
-- COPIE E COLE NO SQL EDITOR DO SUPABASE
-- ===================================================================

-- 1. Verificar se o membership existe (usando CAST para UUID)
SELECT 
    'MEMBERSHIP DIRETO' as tipo,
    * 
FROM public.user_memberships 
WHERE user_id = '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01'::uuid;

-- 2. Verificar com JOIN
SELECT 
    'MEMBERSHIP COM JOIN' as tipo,
    um.*,
    t.name as tenant_name,
    t.id as tenant_id_full
FROM public.user_memberships um
LEFT JOIN public.tenants t ON t.id = um.tenant_id
WHERE um.user_id = '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01'::uuid
AND um.is_active = true;

-- 3. Verificar tipos de dados (SEM length para UUID)
SELECT 
    'TIPOS DE DADOS' as info,
    pg_typeof(user_id) as tipo_user_id,
    user_id::text as user_id_texto,
    pg_typeof(tenant_id) as tipo_tenant_id
FROM public.user_memberships 
WHERE user_id = '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01'::uuid;

-- 4. Buscar TODOS os memberships para comparar (converter UUID para texto)
SELECT 
    'TODOS OS MEMBERSHIPS' as tipo,
    id,
    user_id::text as user_id_string,
    tenant_id::text as tenant_id_string,
    role,
    is_active,
    created_at
FROM public.user_memberships 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Testar a query com formato de string normal (sem cast)
SELECT 
    'TESTE STRING NORMAL' as tipo,
    um.*
FROM public.user_memberships um
WHERE um.user_id::text = '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01'
AND um.is_active = true;


