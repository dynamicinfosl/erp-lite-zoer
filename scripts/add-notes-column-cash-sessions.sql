-- Script para adicionar a coluna 'notes' na tabela cash_sessions
-- Execute este script no Supabase SQL Editor
-- 
-- ERRO: "Could not find the 'notes' column of 'cash_sessions' in the schema cache"
-- Este script resolve o problema adicionando a coluna que está faltando

-- Adicionar coluna notes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'notes'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN notes TEXT;
        RAISE NOTICE '✅ Coluna notes adicionada com sucesso';
    ELSE
        RAISE NOTICE '⚠️ Coluna notes já existe na tabela';
    END IF;
END $$;

-- Verificar se a coluna foi adicionada
SELECT 
    'Verificação' AS status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cash_sessions'
  AND column_name = 'notes';

-- Adicionar comentário na coluna (opcional)
COMMENT ON COLUMN cash_sessions.notes IS 'Observações adicionais sobre a sessão de caixa';



