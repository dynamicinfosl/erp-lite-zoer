-- =============================================================================
-- DIAGNÓSTICO E CORREÇÃO: Por que cash_sessions não atualiza?
-- Execute no Supabase SQL Editor
-- =============================================================================

-- 1. Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'cash_sessions';

-- 2. Listar todas as policies (regras de acesso)
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

-- 3. Listar todos os triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'cash_sessions';

-- =============================================================================
-- CORREÇÃO: Desabilitar RLS temporariamente
-- Execute APENAS se o RLS estiver habilitado (rowsecurity = true no item 1)
-- =============================================================================
-- ALTER TABLE cash_sessions DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Depois de desabilitar RLS, teste o UPDATE novamente:
-- =============================================================================
-- UPDATE cash_sessions 
-- SET 
--   status = 'closed',
--   closed_at = NOW(),
--   closed_by = 'Teste após desabilitar RLS'
-- WHERE id = '3db76b4e-2c20-445c-8f98-b4cfb211beda'
-- RETURNING id, status, closed_at, closed_by;
