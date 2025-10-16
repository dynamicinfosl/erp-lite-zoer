-- =============================================
-- VERIFICAR PRODUTOS EXISTENTES NO BANCO
-- =============================================
-- Este script verifica se há produtos cadastrados e qual tenant_id estão usando

-- 1. Verificar total de produtos
SELECT 'TOTAL DE PRODUTOS NO BANCO:' as status;
SELECT COUNT(*) as total FROM public.products;

-- 2. Verificar produtos por tenant_id
SELECT 'PRODUTOS POR TENANT_ID:' as status;
SELECT 
    tenant_id,
    COUNT(*) as quantidade,
    MIN(created_at) as primeiro_produto,
    MAX(created_at) as ultimo_produto
FROM public.products 
GROUP BY tenant_id
ORDER BY quantidade DESC;

-- 3. Verificar produtos específicos (amostra)
SELECT 'AMOSTRA DE PRODUTOS:' as status;
SELECT 
    id,
    tenant_id,
    sku,
    name,
    sale_price,
    created_at
FROM public.products 
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verificar se há produtos com tenant_id específico
SELECT 'PRODUTOS COM TENANT_ID ZERO:' as status;
SELECT 
    id,
    tenant_id,
    sku,
    name,
    created_at
FROM public.products 
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
ORDER BY created_at DESC;

-- 5. Verificar se há produtos com tenant_id válido (não zero)
SELECT 'PRODUTOS COM TENANT_ID VÁLIDO:' as status;
SELECT 
    id,
    tenant_id,
    sku,
    name,
    created_at
FROM public.products 
WHERE tenant_id != '00000000-0000-0000-0000-000000000000'
ORDER BY created_at DESC;

-- 6. Verificar constraints da tabela
SELECT 'CONSTRAINTS DA TABELA PRODUCTS:' as status;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'products'
ORDER BY tc.constraint_name;

SELECT '✅ VERIFICAÇÃO CONCLUÍDA!' as resultado;



