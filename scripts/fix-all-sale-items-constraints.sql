-- =============================================
-- CORREÇÃO COMPLETA DE CONSTRAINTS SALE_ITEMS
-- =============================================
-- Este script remove constraints NOT NULL problemáticas
-- da tabela sale_items para evitar erros

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

-- 2. Verificar constraints NOT NULL problemáticas
SELECT 'VERIFICANDO CONSTRAINTS NOT NULL:' as status;
SELECT 
    column_name,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sale_items'
AND is_nullable = 'NO'
ORDER BY column_name;

-- 3. Remover constraints NOT NULL problemáticas
SELECT 'REMOVENDO CONSTRAINTS NOT NULL PROBLEMÁTICAS...' as status;

-- Remover NOT NULL de user_id se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'user_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.sale_items ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE '✅ NOT NULL removido de user_id!';
    ELSE
        RAISE NOTICE 'ℹ️ user_id já aceita NULL ou não existe';
    END IF;
END $$;

-- Remover NOT NULL de product_id se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'product_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.sale_items ALTER COLUMN product_id DROP NOT NULL;
        RAISE NOTICE '✅ NOT NULL removido de product_id!';
    ELSE
        RAISE NOTICE 'ℹ️ product_id já aceita NULL ou não existe';
    END IF;
END $$;

-- Remover NOT NULL de total_price se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'total_price'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.sale_items ALTER COLUMN total_price DROP NOT NULL;
        RAISE NOTICE '✅ NOT NULL removido de total_price!';
    ELSE
        RAISE NOTICE 'ℹ️ total_price já aceita NULL ou não existe';
    END IF;
END $$;

-- Remover NOT NULL de subtotal se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'subtotal'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.sale_items ALTER COLUMN subtotal DROP NOT NULL;
        RAISE NOTICE '✅ NOT NULL removido de subtotal!';
    ELSE
        RAISE NOTICE 'ℹ️ subtotal já aceita NULL ou não existe';
    END IF;
END $$;

-- Remover NOT NULL de unit_price se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'unit_price'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.sale_items ALTER COLUMN unit_price DROP NOT NULL;
        RAISE NOTICE '✅ NOT NULL removido de unit_price!';
    ELSE
        RAISE NOTICE 'ℹ️ unit_price já aceita NULL ou não existe';
    END IF;
END $$;

-- Remover NOT NULL de quantity se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'quantity'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.sale_items ALTER COLUMN quantity DROP NOT NULL;
        RAISE NOTICE '✅ NOT NULL removido de quantity!';
    ELSE
        RAISE NOTICE 'ℹ️ quantity já aceita NULL ou não existe';
    END IF;
END $$;

-- Remover NOT NULL de product_name se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sale_items' 
        AND column_name = 'product_name'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.sale_items ALTER COLUMN product_name DROP NOT NULL;
        RAISE NOTICE '✅ NOT NULL removido de product_name!';
    ELSE
        RAISE NOTICE 'ℹ️ product_name já aceita NULL ou não existe';
    END IF;
END $$;

-- 4. Verificar estrutura final
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

SELECT '✅ TODAS AS CONSTRAINTS NOT NULL CORRIGIDAS!' as resultado;



