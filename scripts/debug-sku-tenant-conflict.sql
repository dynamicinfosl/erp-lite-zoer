-- =============================================
-- DEBUG: CONFLITO DE SKU POR TENANT
-- =============================================
-- Este script investiga o conflito de SKU mesmo com constraint por tenant

-- 1. Verificar todas as constraints da tabela products
SELECT 'CONSTRAINTS DA TABELA PRODUCTS:' as status;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'products'
ORDER BY tc.constraint_name;

-- 2. Verificar dados duplicados por tenant e sku
SELECT 'DADOS DUPLICADOS POR TENANT E SKU:' as status;
SELECT 
    tenant_id,
    sku,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as produtos
FROM public.products 
WHERE sku IS NOT NULL AND sku != ''
GROUP BY tenant_id, sku
HAVING COUNT(*) > 1
ORDER BY tenant_id, sku;

-- 3. Verificar todos os produtos com SKU não nulo
SELECT 'TODOS OS PRODUTOS COM SKU:' as status;
SELECT 
    id,
    tenant_id,
    sku,
    name,
    created_at
FROM public.products 
WHERE sku IS NOT NULL AND sku != ''
ORDER BY tenant_id, sku, created_at;

-- 4. Verificar se há produtos com SKU vazio ou nulo
SELECT 'PRODUTOS COM SKU VAZIO OU NULO:' as status;
SELECT 
    id,
    tenant_id,
    sku,
    name,
    created_at
FROM public.products 
WHERE sku IS NULL OR sku = ''
ORDER BY tenant_id, created_at DESC;

-- 5. Verificar constraint específica products_sku_tenant_unique
SELECT 'DETALHES DA CONSTRAINT products_sku_tenant_unique:' as status;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'products'
AND tc.constraint_name = 'products_sku_tenant_unique'
ORDER BY kcu.ordinal_position;

-- 6. Verificar se existe constraint products_sku_key (global)
SELECT 'VERIFICANDO SE EXISTE CONSTRAINT GLOBAL products_sku_key:' as status;
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_sku_key' 
    AND table_name = 'products'
    AND table_schema = 'public'
) as constraint_global_exists;

SELECT '✅ INVESTIGAÇÃO CONCLUÍDA!' as resultado;



