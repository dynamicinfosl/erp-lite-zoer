-- Script para adicionar colunas faltantes na tabela cash_sessions
-- Execute este script APENAS se algumas colunas estiverem faltando
-- Este script é seguro: só adiciona colunas que não existem

-- Adicionar tenant_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        RAISE NOTICE 'Coluna tenant_id adicionada';
    ELSE
        RAISE NOTICE 'Coluna tenant_id já existe';
    END IF;
END $$;

-- Adicionar register_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'register_id'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN register_id VARCHAR(50) NOT NULL DEFAULT '1';
        RAISE NOTICE 'Coluna register_id adicionada';
    ELSE
        RAISE NOTICE 'Coluna register_id já existe';
    END IF;
END $$;

-- Adicionar status se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'status'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'open' 
            CHECK (status IN ('open', 'closed'));
        RAISE NOTICE 'Coluna status adicionada';
    ELSE
        RAISE NOTICE 'Coluna status já existe';
    END IF;
END $$;

-- Adicionar opened_by se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'opened_by'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN opened_by VARCHAR(255) NOT NULL DEFAULT 'Operador';
        RAISE NOTICE 'Coluna opened_by adicionada';
    ELSE
        RAISE NOTICE 'Coluna opened_by já existe';
    END IF;
END $$;

-- Adicionar opened_at se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'opened_at'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Coluna opened_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna opened_at já existe';
    END IF;
END $$;

-- Adicionar opening_amount se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'opening_amount'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN opening_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
        RAISE NOTICE 'Coluna opening_amount adicionada';
    ELSE
        RAISE NOTICE 'Coluna opening_amount já existe';
    END IF;
END $$;

-- Adicionar closed_by se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closed_by'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN closed_by VARCHAR(255);
        RAISE NOTICE 'Coluna closed_by adicionada';
    ELSE
        RAISE NOTICE 'Coluna closed_by já existe';
    END IF;
END $$;

-- Adicionar closed_at se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closed_at'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna closed_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna closed_at já existe';
    END IF;
END $$;

-- Adicionar closing_amount_cash se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closing_amount_cash'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN closing_amount_cash DECIMAL(10,2);
        RAISE NOTICE 'Coluna closing_amount_cash adicionada';
    ELSE
        RAISE NOTICE 'Coluna closing_amount_cash já existe';
    END IF;
END $$;

-- Adicionar closing_amount_card_debit se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closing_amount_card_debit'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN closing_amount_card_debit DECIMAL(10,2);
        RAISE NOTICE 'Coluna closing_amount_card_debit adicionada';
    ELSE
        RAISE NOTICE 'Coluna closing_amount_card_debit já existe';
    END IF;
END $$;

-- Adicionar closing_amount_card_credit se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closing_amount_card_credit'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN closing_amount_card_credit DECIMAL(10,2);
        RAISE NOTICE 'Coluna closing_amount_card_credit adicionada';
    ELSE
        RAISE NOTICE 'Coluna closing_amount_card_credit já existe';
    END IF;
END $$;

-- Adicionar closing_amount_pix se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closing_amount_pix'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN closing_amount_pix DECIMAL(10,2);
        RAISE NOTICE 'Coluna closing_amount_pix adicionada';
    ELSE
        RAISE NOTICE 'Coluna closing_amount_pix já existe';
    END IF;
END $$;

-- Adicionar closing_amount_other se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closing_amount_other'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN closing_amount_other DECIMAL(10,2);
        RAISE NOTICE 'Coluna closing_amount_other adicionada';
    ELSE
        RAISE NOTICE 'Coluna closing_amount_other já existe';
    END IF;
END $$;

-- Adicionar difference_amount se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'difference_amount'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN difference_amount DECIMAL(10,2);
        RAISE NOTICE 'Coluna difference_amount adicionada';
    ELSE
        RAISE NOTICE 'Coluna difference_amount já existe';
    END IF;
END $$;

-- Adicionar difference_reason se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'difference_reason'
    ) THEN
        ALTER TABLE cash_sessions ADD COLUMN difference_reason TEXT;
        RAISE NOTICE 'Coluna difference_reason adicionada';
    ELSE
        RAISE NOTICE 'Coluna difference_reason já existe';
    END IF;
END $$;

-- Verificar resultado final
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cash_sessions'
ORDER BY ordinal_position;





