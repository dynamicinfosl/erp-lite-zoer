-- Script para adicionar colunas faltantes na tabela cash_sessions
-- Execute este script no Supabase SQL Editor
-- 
-- Este script adiciona todas as colunas que podem estar faltando:
-- - closing_amount_card_debit
-- - closing_amount_card_credit
-- - difference_amount
-- - notes (CRÍTICO: necessário para fechar caixa)

-- Adicionar closing_amount_card_debit
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closing_amount_card_debit'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN closing_amount_card_debit DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna closing_amount_card_debit adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna closing_amount_card_debit já existe';
    END IF;
END $$;

-- Adicionar closing_amount_card_credit
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closing_amount_card_credit'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN closing_amount_card_credit DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna closing_amount_card_credit adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna closing_amount_card_credit já existe';
    END IF;
END $$;

-- Adicionar difference_amount
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'difference_amount'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN difference_amount DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna difference_amount adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna difference_amount já existe';
    END IF;
END $$;

-- Adicionar notes (CRÍTICO - necessário para fechar caixa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'notes'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN notes TEXT;
        RAISE NOTICE '✅ Coluna notes adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna notes já existe';
    END IF;
END $$;

-- Verificar resultado final
SELECT 
    'Verificação Final' AS status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cash_sessions'
  AND column_name IN ('closing_amount_card_debit', 'closing_amount_card_credit', 'difference_amount', 'notes')
ORDER BY column_name;



