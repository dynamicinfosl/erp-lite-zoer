-- Script COMPLETO para adicionar TODAS as colunas faltantes na tabela cash_sessions
-- Execute este script no Supabase SQL Editor
-- 
-- Este script verifica e adiciona todas as colunas necessárias para o fechamento de caixa

-- 1. Adicionar closing_amount_card_debit
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'closing_amount_card_debit'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN closing_amount_card_debit DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna closing_amount_card_debit adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna closing_amount_card_debit já existe';
    END IF;
END $$;

-- 2. Adicionar closing_amount_card_credit
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'closing_amount_card_credit'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN closing_amount_card_credit DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna closing_amount_card_credit adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna closing_amount_card_credit já existe';
    END IF;
END $$;

-- 3. Adicionar expected_cash
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'expected_cash'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN expected_cash DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna expected_cash adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna expected_cash já existe';
    END IF;
END $$;

-- 4. Adicionar expected_card_debit
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'expected_card_debit'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN expected_card_debit DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna expected_card_debit adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna expected_card_debit já existe';
    END IF;
END $$;

-- 5. Adicionar expected_card_credit
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'expected_card_credit'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN expected_card_credit DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna expected_card_credit adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna expected_card_credit já existe';
    END IF;
END $$;

-- 6. Adicionar expected_pix
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'expected_pix'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN expected_pix DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna expected_pix adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna expected_pix já existe';
    END IF;
END $$;

-- 7. Adicionar expected_other
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'expected_other'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN expected_other DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna expected_other adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna expected_other já existe';
    END IF;
END $$;

-- 8. Adicionar difference_amount
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'difference_amount'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN difference_amount DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna difference_amount adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna difference_amount já existe';
    END IF;
END $$;

-- 9. Adicionar difference_cash (CRÍTICO!)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'difference_cash'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN difference_cash DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna difference_cash adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna difference_cash já existe';
    END IF;
END $$;

-- 10. Adicionar difference_card_debit (CRÍTICO!)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'difference_card_debit'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN difference_card_debit DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna difference_card_debit adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna difference_card_debit já existe';
    END IF;
END $$;

-- 11. Adicionar difference_card_credit (CRÍTICO!)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'difference_card_credit'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN difference_card_credit DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna difference_card_credit adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna difference_card_credit já existe';
    END IF;
END $$;

-- 12. Adicionar difference_pix (CRÍTICO!)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'difference_pix'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN difference_pix DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna difference_pix adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna difference_pix já existe';
    END IF;
END $$;

-- 13. Adicionar difference_other (CRÍTICO!)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'difference_other'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN difference_other DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna difference_other adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna difference_other já existe';
    END IF;
END $$;

-- 14. Adicionar difference_reason
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'difference_reason'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN difference_reason TEXT;
        RAISE NOTICE '✅ Coluna difference_reason adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna difference_reason já existe';
    END IF;
END $$;

-- 15. Adicionar total_sales
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'total_sales'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN total_sales INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Coluna total_sales adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna total_sales já existe';
    END IF;
END $$;

-- 16. Adicionar total_sales_amount
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'total_sales_amount'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN total_sales_amount DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Coluna total_sales_amount adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna total_sales_amount já existe';
    END IF;
END $$;

-- 17. Adicionar total_withdrawals
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'total_withdrawals'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN total_withdrawals INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Coluna total_withdrawals adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna total_withdrawals já existe';
    END IF;
END $$;

-- 18. Adicionar total_withdrawals_amount
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'total_withdrawals_amount'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN total_withdrawals_amount DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Coluna total_withdrawals_amount adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna total_withdrawals_amount já existe';
    END IF;
END $$;

-- 19. Adicionar total_supplies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'total_supplies'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN total_supplies INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Coluna total_supplies adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna total_supplies já existe';
    END IF;
END $$;

-- 20. Adicionar total_supplies_amount
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'cash_sessions' 
          AND column_name = 'total_supplies_amount'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN total_supplies_amount DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Coluna total_supplies_amount adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna total_supplies_amount já existe';
    END IF;
END $$;

-- 21. Adicionar notes
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
    '🎉 VERIFICAÇÃO FINAL - Todas as colunas necessárias' AS status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cash_sessions'
  AND column_name IN (
    'closing_amount_card_debit', 'closing_amount_card_credit',
    'expected_cash', 'expected_card_debit', 'expected_card_credit', 'expected_pix', 'expected_other',
    'difference_amount', 'difference_cash', 'difference_card_debit', 'difference_card_credit', 
    'difference_pix', 'difference_other', 'difference_reason',
    'total_sales', 'total_sales_amount', 
    'total_withdrawals', 'total_withdrawals_amount',
    'total_supplies', 'total_supplies_amount',
    'notes'
  )
ORDER BY column_name;










