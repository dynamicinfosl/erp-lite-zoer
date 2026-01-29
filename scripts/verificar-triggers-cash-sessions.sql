-- Script para verificar triggers e policies na tabela cash_sessions
-- Execute no Supabase SQL Editor

-- 1. Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'cash_sessions';

-- 2. Verificar policies (RLS)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'cash_sessions';

-- 3. Verificar se RLS está habilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'cash_sessions';

-- 4. Verificar estrutura da coluna user_id
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cash_sessions'
  AND column_name = 'user_id';

-- 5. Se houver triggers problemáticos, você pode desabilitá-los temporariamente:
-- DROP TRIGGER IF EXISTS nome_do_trigger ON cash_sessions;

-- 6. Se RLS estiver causando problemas, você pode desabilitá-lo temporariamente:
-- ALTER TABLE cash_sessions DISABLE ROW LEVEL SECURITY;



