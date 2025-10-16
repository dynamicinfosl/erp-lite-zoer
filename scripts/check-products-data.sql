-- =============================================
-- VERIFICAR DADOS DE PRODUTOS NO BANCO
-- =============================================
-- Este script verifica se há produtos no banco e qual tenant_id estão usando

-- 1. Verificar se existem produtos
SELECT 'TOTAL DE PRODUTOS:' as status;
SELECT COUNT(*) as total_produtos FROM public.products;

-- 2. Verificar produtos por tenant_id
SELECT 'PRODUTOS POR TENANT:' as status;
SELECT 
    tenant_id,
    COUNT(*) as quantidade,
    STRING_AGG(name, ', ') as nomes
FROM public.products 
GROUP BY tenant_id
ORDER BY tenant_id;

-- 3. Verificar alguns produtos específicos
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
LIMIT 10;

-- 4. Verificar se há produtos com tenant_id zero
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

-- 5. Verificar estrutura da tabela
SELECT 'ESTRUTURA DA TABELA PRODUCTS:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '✅ VERIFICAÇÃO CONCLUÍDA!' as resultado;



