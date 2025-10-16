-- =============================================
-- CORREÇÃO COMPLETA DA TABELA SALE_ITEMS
-- =============================================
-- Este script adiciona todas as colunas que podem estar faltando
-- na tabela sale_items

-- 1. Verificar estrutura atual
SELECT 'VERIFICANDO ESTRUTURA ATUAL:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sale_items'
ORDER BY ordinal_position;

-- 2. Adicionar colunas faltantes
SELECT 'ADICIONANDO COLUNAS FALTANTES...' as status;

-- Adicionar product_code se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'product_code'
    ) THEN
        ALTER TABLE public.sale_items 
        ADD COLUMN product_code VARCHAR(100);
        RAISE NOTICE '✅ Coluna product_code adicionada!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna product_code já existe';
    END IF;
END $$;

-- Adicionar discount_percentage se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'discount_percentage'
    ) THEN
        ALTER TABLE public.sale_items 
        ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0;
        RAISE NOTICE '✅ Coluna discount_percentage adicionada!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna discount_percentage já existe';
    END IF;
END $$;

-- Adicionar product_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'product_id'
    ) THEN
        ALTER TABLE public.sale_items 
        ADD COLUMN product_id UUID;
        RAISE NOTICE '✅ Coluna product_id adicionada!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna product_id já existe';
    END IF;
END $$;

-- Adicionar sale_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'sale_id'
    ) THEN
        ALTER TABLE public.sale_items 
        ADD COLUMN sale_id UUID NOT NULL;
        RAISE NOTICE '✅ Coluna sale_id adicionada!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna sale_id já existe';
    END IF;
END $$;

-- Adicionar product_name se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'product_name'
    ) THEN
        ALTER TABLE public.sale_items 
        ADD COLUMN product_name VARCHAR(255) NOT NULL;
        RAISE NOTICE '✅ Coluna product_name adicionada!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna product_name já existe';
    END IF;
END $$;

-- Adicionar unit_price se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'unit_price'
    ) THEN
        ALTER TABLE public.sale_items 
        ADD COLUMN unit_price DECIMAL(10,2) NOT NULL;
        RAISE NOTICE '✅ Coluna unit_price adicionada!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna unit_price já existe';
    END IF;
END $$;

-- Adicionar quantity se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'quantity'
    ) THEN
        ALTER TABLE public.sale_items 
        ADD COLUMN quantity INTEGER NOT NULL;
        RAISE NOTICE '✅ Coluna quantity adicionada!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna quantity já existe';
    END IF;
END $$;

-- Adicionar subtotal se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE public.sale_items 
        ADD COLUMN subtotal DECIMAL(10,2) NOT NULL;
        RAISE NOTICE '✅ Coluna subtotal adicionada!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna subtotal já existe';
    END IF;
END $$;

-- Adicionar created_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.sale_items 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Coluna created_at adicionada!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna created_at já existe';
    END IF;
END $$;

-- 3. Verificar estrutura final
SELECT 'VERIFICANDO ESTRUTURA FINAL:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sale_items'
ORDER BY ordinal_position;

SELECT '✅ TODAS AS COLUNAS CORRIGIDAS!' as resultado;



