-- Script para verificar colunas da tabela cash_sessions e comparar com o necessário
-- Execute este script para ver quais colunas existem e quais faltam

-- 1. Listar TODAS as colunas existentes na tabela
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cash_sessions'
ORDER BY ordinal_position;

-- 2. Verificar se as colunas principais que precisamos existem
SELECT 
    'tenant_id' AS coluna_necessaria,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'tenant_id'
    ) THEN '✅ EXISTE' ELSE '❌ FALTA' END AS status
UNION ALL
SELECT 'register_id', CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'register_id'
    ) THEN '✅ EXISTE' ELSE '❌ FALTA' END
UNION ALL
SELECT 'status', CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'status'
    ) THEN '✅ EXISTE' ELSE '❌ FALTA' END
UNION ALL
SELECT 'opened_by', CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'opened_by'
    ) THEN '✅ EXISTE' ELSE '❌ FALTA' END
UNION ALL
SELECT 'opened_at', CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'opened_at'
    ) THEN '✅ EXISTE' ELSE '❌ FALTA' END
UNION ALL
SELECT 'opening_amount', CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'opening_amount'
    ) THEN '✅ EXISTE' ELSE '❌ FALTA' END
UNION ALL
SELECT 'closed_by', CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closed_by'
    ) THEN '✅ EXISTE' ELSE '❌ FALTA' END
UNION ALL
SELECT 'closed_at', CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closed_at'
    ) THEN '✅ EXISTE' ELSE '❌ FALTA' END
UNION ALL
SELECT 'closing_amount_cash', CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closing_amount_cash'
    ) THEN '✅ EXISTE' ELSE '❌ FALTA' END
UNION ALL
SELECT 'closing_amount_card_debit', CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closing_amount_card_debit'
    ) THEN '✅ EXISTE' ELSE '❌ FALTA' END
UNION ALL
SELECT 'closing_amount_card_credit', CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closing_amount_card_credit'
    ) THEN '✅ EXISTE' ELSE '❌ FALTA' END
UNION ALL
SELECT 'closing_amount_pix', CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closing_amount_pix'
    ) THEN '✅ EXISTE' ELSE '❌ FALTA' END
UNION ALL
SELECT 'closing_amount_other', CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'closing_amount_other'
    ) THEN '✅ EXISTE' ELSE '❌ FALTA' END
UNION ALL
SELECT 'difference_amount', CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'difference_amount'
    ) THEN '✅ EXISTE' ELSE '❌ FALTA' END
UNION ALL
SELECT 'difference_reason', CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' AND column_name = 'difference_reason'
    ) THEN '✅ EXISTE' ELSE '❌ FALTA' END
ORDER BY coluna_necessaria;












