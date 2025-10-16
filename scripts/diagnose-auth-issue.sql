-- =============================================
-- DIAGNÓSTICO DE PROBLEMAS DE AUTENTICAÇÃO
-- =============================================
-- Este script verifica se as tabelas necessárias existem
-- e se há problemas que podem causar travamento no loading

-- 1. Verificar se as tabelas principais existem
SELECT 'VERIFICANDO EXISTÊNCIA DAS TABELAS:' as status;

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'user_memberships', 'subscriptions', 'plans')
ORDER BY table_name;

-- 2. Verificar estrutura da tabela tenants
SELECT 'ESTRUTURA DA TABELA tenants:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tenants'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela user_memberships
SELECT 'ESTRUTURA DA TABELA user_memberships:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_memberships'
ORDER BY ordinal_position;

-- 4. Verificar se há dados nas tabelas
SELECT 'CONTAGEM DE REGISTROS:' as status;

-- Contar tenants
SELECT 
    'tenants' as tabela,
    COUNT(*) as registros
FROM public.tenants
UNION ALL
-- Contar user_memberships
SELECT 
    'user_memberships' as tabela,
    COUNT(*) as registros
FROM public.user_memberships
UNION ALL
-- Contar subscriptions (se existir)
SELECT 
    'subscriptions' as tabela,
    COUNT(*) as registros
FROM public.subscriptions
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions' AND table_schema = 'public');

-- 5. Verificar constraints e índices
SELECT 'VERIFICANDO CONSTRAINTS:' as status;
SELECT 
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public' 
AND tc.table_name IN ('tenants', 'user_memberships', 'subscriptions')
ORDER BY tc.table_name, tc.constraint_type;

-- 6. Verificar se há problemas de RLS (Row Level Security)
SELECT 'VERIFICANDO RLS:' as status;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'user_memberships', 'subscriptions')
ORDER BY tablename;

-- 7. Verificar políticas RLS
SELECT 'VERIFICANDO POLÍTICAS RLS:' as status;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'user_memberships', 'subscriptions')
ORDER BY tablename, policyname;

SELECT '✅ DIAGNÓSTICO CONCLUÍDO!' as resultado;



