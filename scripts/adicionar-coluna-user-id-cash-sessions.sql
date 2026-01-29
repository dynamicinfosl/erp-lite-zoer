-- Script para adicionar a coluna user_id na tabela cash_sessions
-- Execute no Supabase SQL Editor

-- Verificar se a coluna user_id existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions'
          AND column_name = 'user_id'
    ) THEN
        -- Adicionar coluna user_id (UUID, opcional)
        ALTER TABLE cash_sessions 
        ADD COLUMN user_id UUID;
        
        RAISE NOTICE '✅ Coluna user_id adicionada com sucesso!';
    ELSE
        RAISE NOTICE '⚠️ Coluna user_id já existe';
    END IF;
END $$;

-- Verificar o resultado
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cash_sessions'
  AND column_name = 'user_id';

-- Mostrar estrutura completa da tabela
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cash_sessions'
ORDER BY ordinal_position;



