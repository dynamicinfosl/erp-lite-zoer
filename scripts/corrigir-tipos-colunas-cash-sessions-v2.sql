-- Script CORRIGIDO para alterar tipos de colunas em cash_sessions
-- Este script remove constraints antes de alterar os tipos
-- Execute no Supabase SQL Editor

-- PASSO 1: Remover foreign key constraint de register_id
DO $$
BEGIN
    -- Verificar e remover constraint fk_cash_session_register se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_cash_session_register'
          AND table_name = 'cash_sessions'
    ) THEN
        ALTER TABLE cash_sessions 
        DROP CONSTRAINT fk_cash_session_register;
        
        RAISE NOTICE '✅ Constraint fk_cash_session_register removida';
    ELSE
        RAISE NOTICE '⚠️ Constraint fk_cash_session_register não existe';
    END IF;
END $$;

-- PASSO 2: Alterar opened_by de UUID para TEXT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' 
          AND column_name = 'opened_by' 
          AND data_type = 'uuid'
    ) THEN
        ALTER TABLE cash_sessions 
        ALTER COLUMN opened_by TYPE TEXT
        USING CAST(opened_by AS TEXT);
        
        RAISE NOTICE '✅ Coluna opened_by alterada de UUID para TEXT';
    ELSE
        RAISE NOTICE '⚠️ Coluna opened_by já é TEXT ou não existe';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao alterar opened_by: %', SQLERRM;
END $$;

-- PASSO 3: Alterar closed_by de UUID para TEXT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' 
          AND column_name = 'closed_by' 
          AND data_type = 'uuid'
    ) THEN
        ALTER TABLE cash_sessions 
        ALTER COLUMN closed_by TYPE TEXT
        USING CAST(closed_by AS TEXT);
        
        RAISE NOTICE '✅ Coluna closed_by alterada de UUID para TEXT';
    ELSE
        RAISE NOTICE '⚠️ Coluna closed_by já é TEXT ou não existe';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao alterar closed_by: %', SQLERRM;
END $$;

-- PASSO 4: Alterar register_id de UUID para VARCHAR(50)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' 
          AND column_name = 'register_id' 
          AND data_type = 'uuid'
    ) THEN
        -- Limpar dados existentes se necessário
        UPDATE cash_sessions 
        SET register_id = '00000000-0000-0000-0000-000000000001'::uuid
        WHERE register_id IS NULL;
        
        -- Alterar para VARCHAR
        ALTER TABLE cash_sessions 
        ALTER COLUMN register_id TYPE VARCHAR(50) 
        USING CAST(register_id AS TEXT);
        
        -- Atualizar valores padrão
        UPDATE cash_sessions 
        SET register_id = '1' 
        WHERE register_id LIKE '00000000%' OR register_id = '';
        
        RAISE NOTICE '✅ Coluna register_id alterada de UUID para VARCHAR(50)';
    ELSE
        RAISE NOTICE '⚠️ Coluna register_id já é VARCHAR ou não existe';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao alterar register_id: %', SQLERRM;
END $$;

-- PASSO 5: Adicionar user_id (UUID, opcional)
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
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao adicionar user_id: %', SQLERRM;
END $$;

-- PASSO 6: Definir valores padrão mais amigáveis
DO $$
BEGIN
    -- Definir default para register_id
    ALTER TABLE cash_sessions 
    ALTER COLUMN register_id SET DEFAULT '1';
    
    RAISE NOTICE '✅ Default definido para register_id = ''1''';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Não foi possível definir default para register_id';
END $$;

-- VERIFICAÇÃO FINAL: Mostrar estrutura das colunas alteradas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cash_sessions'
  AND column_name IN ('user_id', 'opened_by', 'closed_by', 'register_id')
ORDER BY column_name;

-- Listar constraints restantes
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint 
WHERE conrelid = 'cash_sessions'::regclass;



