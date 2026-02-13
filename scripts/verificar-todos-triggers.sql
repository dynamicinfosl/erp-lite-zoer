-- Script completo para verificar TODOS os triggers na tabela cash_sessions
-- Execute no Supabase SQL Editor

-- 1. Verificar TODOS os triggers (mais detalhado)
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    t.action_timing,
    t.action_statement,
    t.action_orientation
FROM information_schema.triggers t
WHERE t.event_object_table = 'cash_sessions'
ORDER BY t.trigger_name;

-- 2. Ver detalhes completos dos triggers (incluindo função)
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM information_schema.triggers t
LEFT JOIN pg_proc p ON t.action_statement LIKE '%' || p.proname || '%'
WHERE t.event_object_table = 'cash_sessions';

-- 3. Verificar se há algum trigger que modifica user_id
SELECT 
    trigger_name,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'cash_sessions'
  AND (
    action_statement ILIKE '%user_id%' 
    OR action_statement ILIKE '%auth.uid%'
    OR action_statement ILIKE '%current_user%'
  );

-- 4. Se encontrar triggers problemáticos, você pode desabilitá-los:
-- DROP TRIGGER IF EXISTS nome_do_trigger ON cash_sessions CASCADE;

-- 5. Verificar se há defaults na coluna user_id que possam estar causando problema
SELECT 
    column_name,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cash_sessions'
  AND column_name = 'user_id';










