-- ============================================
-- DIAGNÓSTICO DETALHADO - EXECUTE E ME ENVIE OS RESULTADOS
-- ============================================

-- QUERY 1: Todas as colunas da tabela SALES
SELECT 
    'SALES' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'sales'
ORDER BY ordinal_position;

-- QUERY 2: Todas as colunas da tabela SALE_ITEMS
SELECT 
    'SALE_ITEMS' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'sale_items'
ORDER BY ordinal_position;

-- QUERY 3: Todas as colunas da tabela CUSTOMERS
SELECT 
    'CUSTOMERS' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'customers'
ORDER BY ordinal_position;

-- QUERY 4: Todas as colunas da tabela PRODUCTS
SELECT 
    'PRODUCTS' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'products'
ORDER BY ordinal_position;

-- QUERY 5: Índices já existentes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('sales', 'sale_items', 'customers', 'products')
ORDER BY tablename, indexname;

-- QUERY 6: Contagem de registros (para saber o tamanho)
SELECT 
    'sales' as tabela,
    COUNT(*) as total_registros
FROM sales
UNION ALL
SELECT 
    'sale_items' as tabela,
    COUNT(*) as total_registros
FROM sale_items
UNION ALL
SELECT 
    'customers' as tabela,
    COUNT(*) as total_registros
FROM customers
UNION ALL
SELECT 
    'products' as tabela,
    COUNT(*) as total_registros
FROM products;
