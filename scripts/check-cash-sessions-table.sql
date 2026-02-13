-- Script para verificar se a tabela cash_sessions existe e suas colunas
-- Execute este script no Supabase SQL Editor para diagnosticar

-- 1. Verificar se a tabela existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'cash_sessions'
        ) 
        THEN '✅ Tabela cash_sessions EXISTE'
        ELSE '❌ Tabela cash_sessions NÃO EXISTE'
    END AS status_tabela;

-- 2. Se existir, listar todas as colunas e seus tipos
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cash_sessions'
ORDER BY ordinal_position;

-- 3. Verificar índices da tabela (se existir)
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'cash_sessions';

-- 4. Verificar constraints (chaves primárias, foreign keys, checks)
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.cash_sessions'::regclass
ORDER BY contype, conname;

-- 5. Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'cash_sessions';

-- 6. Contar registros (se a tabela existir)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'cash_sessions'
        ) 
        THEN (SELECT COUNT(*) FROM cash_sessions)::text
        ELSE 'Tabela não existe'
    END AS total_registros;

-- 7. Verificar se há RLS (Row Level Security) habilitado
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'cash_sessions'
        ) 
        THEN (
            SELECT 
                CASE 
                    WHEN relrowsecurity THEN '✅ RLS HABILITADO'
                    ELSE '⚠️ RLS DESABILITADO'
                END
            FROM pg_class
            WHERE relname = 'cash_sessions'
        )
        ELSE 'Tabela não existe'
    END AS rls_status;

-- 8. Verificar políticas RLS (se existirem)
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
WHERE schemaname = 'public'
  AND tablename = 'cash_sessions';












