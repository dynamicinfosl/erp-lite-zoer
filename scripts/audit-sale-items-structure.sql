-- =============================================
-- AUDITORIA COMPLETA DA TABELA SALE_ITEMS
-- =============================================
-- Este script verifica a estrutura real da tabela sale_items
-- e identifica todas as colunas que podem estar faltando

-- 1. Verificar se a tabela existe
SELECT 'VERIFICANDO EXISTÊNCIA DA TABELA:' as status;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sale_items'
) as tabela_existe;

-- 2. Verificar estrutura atual completa
SELECT 'ESTRUTURA ATUAL DA TABELA SALE_ITEMS:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sale_items'
ORDER BY ordinal_position;

-- 3. Verificar constraints da tabela
SELECT 'CONSTRAINTS DA TABELA:' as status;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.sale_items'::regclass;

-- 4. Verificar índices da tabela
SELECT 'ÍNDICES DA TABELA:' as status;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'sale_items' 
AND schemaname = 'public';

-- 5. Verificar se existem dados na tabela
SELECT 'DADOS NA TABELA:' as status;
SELECT COUNT(*) as total_registros FROM public.sale_items;

-- 6. Verificar estrutura esperada vs atual
SELECT 'COLUNAS ESPERADAS:' as status;
SELECT unnest(ARRAY[
    'id',
    'sale_id', 
    'product_id',
    'product_name',
    'product_code',
    'unit_price',
    'quantity',
    'discount_percentage',
    'subtotal',
    'created_at'
]) as coluna_esperada;

-- 7. Identificar colunas faltantes
SELECT 'COLUNAS FALTANTES:' as status;
WITH colunas_esperadas AS (
    SELECT unnest(ARRAY[
        'id',
        'sale_id', 
        'product_id',
        'product_name',
        'product_code',
        'unit_price',
        'quantity',
        'discount_percentage',
        'subtotal',
        'created_at'
    ]) as coluna
),
colunas_existentes AS (
    SELECT column_name as coluna
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sale_items'
)
SELECT 
    e.coluna as coluna_faltante,
    CASE 
        WHEN c.coluna IS NULL THEN '❌ FALTANDO'
        ELSE '✅ EXISTE'
    END as status
FROM colunas_esperadas e
LEFT JOIN colunas_existentes c ON e.coluna = c.coluna
ORDER BY status DESC, e.coluna;

SELECT '✅ AUDITORIA CONCLUÍDA!' as resultado;



