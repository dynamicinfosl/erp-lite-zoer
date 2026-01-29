-- Script para corrigir os tipos de colunas incorretos na tabela cash_sessions
-- Execute no Supabase SQL Editor

-- 1. Alterar opened_by de UUID para TEXT
DO $$
BEGIN
    -- Verificar o tipo atual
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' 
          AND column_name = 'opened_by' 
          AND data_type = 'uuid'
    ) THEN
        -- Alterar para TEXT
        ALTER TABLE cash_sessions 
        ALTER COLUMN opened_by TYPE TEXT;
        
        RAISE NOTICE '✅ Coluna opened_by alterada de UUID para TEXT';
    ELSE
        RAISE NOTICE '⚠️ Coluna opened_by já é TEXT ou não existe';
    END IF;
END $$;

-- 2. Alterar closed_by de UUID para TEXT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' 
          AND column_name = 'closed_by' 
          AND data_type = 'uuid'
    ) THEN
        ALTER TABLE cash_sessions 
        ALTER COLUMN closed_by TYPE TEXT;
        
        RAISE NOTICE '✅ Coluna closed_by alterada de UUID para TEXT';
    ELSE
        RAISE NOTICE '⚠️ Coluna closed_by já é TEXT ou não existe';
    END IF;
END $$;

-- 3. Alterar register_id de UUID para VARCHAR(50)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' 
          AND column_name = 'register_id' 
          AND data_type = 'uuid'
    ) THEN
        -- Primeiro, precisamos limpar dados inválidos se houver
        -- Definir um valor padrão para registros existentes
        UPDATE cash_sessions 
        SET register_id = '00000000-0000-0000-0000-000000000001'::uuid
        WHERE register_id IS NULL;
        
        -- Alterar para VARCHAR
        ALTER TABLE cash_sessions 
        ALTER COLUMN register_id TYPE VARCHAR(50) 
        USING CAST(register_id AS TEXT);
        
        -- Atualizar valores padrão para '1'
        UPDATE cash_sessions 
        SET register_id = '1' 
        WHERE register_id LIKE '00000000%' OR register_id = '';
        
        RAISE NOTICE '✅ Coluna register_id alterada de UUID para VARCHAR(50)';
    ELSE
        RAISE NOTICE '⚠️ Coluna register_id já é VARCHAR ou não existe';
    END IF;
END $$;

-- 4. Garantir que user_id existe (opcional, UUID)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' 
          AND column_name = 'user_id'
    ) THEN
        ALTER TABLE cash_sessions 
        ADD COLUMN user_id UUID;
        
        RAISE NOTICE '✅ Coluna user_id adicionada (UUID, opcional)';
    ELSE
        RAISE NOTICE '⚠️ Coluna user_id já existe';
    END IF;
END $$;

-- Verificar resultado final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cash_sessions'
  AND column_name IN ('user_id', 'opened_by', 'closed_by', 'register_id')
ORDER BY column_name;


