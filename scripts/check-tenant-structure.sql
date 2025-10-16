-- =============================================
-- VERIFICAR ESTRUTURA DE TENANTS E MEMBERSHIPS
-- =============================================
-- Este script verifica se as tabelas de tenants e user_memberships existem e têm dados

-- 1. Verificar se tabela tenants existe
SELECT 'TABELA TENANTS EXISTE?' as status;
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'tenants' 
    AND table_schema = 'public'
) as tenants_exists;

-- 2. Verificar se tabela user_memberships existe
SELECT 'TABELA USER_MEMBERSHIPS EXISTE?' as status;
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'user_memberships' 
    AND table_schema = 'public'
) as user_memberships_exists;

-- 3. Se tenants existe, verificar dados
SELECT 'DADOS NA TABELA TENANTS:' as status;
SELECT 
    id,
    name,
    status,
    created_at
FROM public.tenants 
ORDER BY created_at DESC
LIMIT 10;

-- 4. Se user_memberships existe, verificar dados
SELECT 'DADOS NA TABELA USER_MEMBERSHIPS:' as status;
SELECT 
    id,
    user_id,
    tenant_id,
    is_active,
    created_at
FROM public.user_memberships 
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar estrutura da tabela tenants
SELECT 'ESTRUTURA DA TABELA TENANTS:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar estrutura da tabela user_memberships
SELECT 'ESTRUTURA DA TABELA USER_MEMBERSHIPS:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_memberships' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '✅ VERIFICAÇÃO CONCLUÍDA!' as resultado;



