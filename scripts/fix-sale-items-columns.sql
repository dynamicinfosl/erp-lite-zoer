-- =============================================
-- CORREÇÃO DA TABELA SALE_ITEMS
-- =============================================
-- Este script verifica e adiciona colunas que podem estar faltando
-- na tabela sale_items

-- 1. Verificar estrutura atual da tabela sale_items
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

-- 2. Verificar se a tabela existe
SELECT 'VERIFICANDO SE TABELA EXISTE:' as status;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sale_items'
) as tabela_existe;

-- 3. Adicionar colunas que podem estar faltando
SELECT 'ADICIONANDO COLUNAS FALTANTES...' as status;

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

-- Adicionar outras colunas que podem estar faltando
DO $$
BEGIN
    -- Verificar e adicionar product_id se não existir
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

SELECT '✅ TABELA SALE_ITEMS CORRIGIDA!' as resultado;



