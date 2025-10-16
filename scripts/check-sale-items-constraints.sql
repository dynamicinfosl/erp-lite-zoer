-- =============================================
-- VERIFICAÇÃO DE CONSTRAINTS NA TABELA SALE_ITEMS
-- =============================================
-- Este script verifica todas as constraints NOT NULL
-- na tabela sale_items para identificar campos obrigatórios

-- 1. Verificar colunas NOT NULL
SELECT 'COLUNAS NOT NULL (OBRIGATÓRIAS):' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sale_items'
AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 2. Verificar todas as constraints da tabela
SELECT 'TODAS AS CONSTRAINTS:' as status;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.sale_items'::regclass
ORDER BY conname;

-- 3. Verificar estrutura completa da tabela
SELECT 'ESTRUTURA COMPLETA:' as status;
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

-- 4. Verificar se existem dados na tabela
SELECT 'DADOS NA TABELA:' as status;
SELECT COUNT(*) as total_registros FROM public.sale_items;

-- 5. Verificar se há foreign keys
SELECT 'FOREIGN KEYS:' as status;
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='sale_items'
AND tc.table_schema='public';

SELECT '✅ VERIFICAÇÃO CONCLUÍDA!' as resultado;



