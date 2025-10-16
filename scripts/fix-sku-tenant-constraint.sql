-- =============================================
-- CORREÇÃO DE CONSTRAINT SKU POR TENANT
-- =============================================
-- Este script corrige a constraint de SKU para ser única
-- apenas dentro de cada tenant, não globalmente

-- 1. Verificar constraint atual
SELECT 'VERIFICANDO CONSTRAINT ATUAL:' as status;
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
AND (tc.constraint_type = 'UNIQUE' OR tc.constraint_type = 'PRIMARY KEY')
ORDER BY tc.constraint_name;

-- 2. Verificar se existe constraint products_sku_key
SELECT 'VERIFICANDO SE EXISTE products_sku_key:' as status;
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_sku_key' 
    AND table_name = 'products'
    AND table_schema = 'public'
) as constraint_exists;

-- 3. Remover constraint global de SKU se existir
SELECT 'REMOVENDO CONSTRAINT GLOBAL DE SKU...' as status;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_sku_key;

-- 4. Criar constraint única para SKU + tenant_id
SELECT 'CRIANDO CONSTRAINT ÚNICA PARA SKU + TENANT_ID...' as status;
ALTER TABLE public.products 
ADD CONSTRAINT products_sku_tenant_unique 
UNIQUE (sku, tenant_id);

-- 5. Verificar se a nova constraint foi criada
SELECT 'VERIFICANDO NOVA CONSTRAINT:' as status;
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
ORDER BY tc.constraint_name;

-- 6. Verificar dados existentes para debug
SELECT 'VERIFICANDO DADOS EXISTENTES:' as status;
SELECT 
    tenant_id,
    sku,
    name,
    COUNT(*) as count
FROM public.products 
GROUP BY tenant_id, sku, name
HAVING COUNT(*) > 1
ORDER BY tenant_id, sku;

-- 7. Mostrar alguns exemplos de produtos por tenant
SELECT 'EXEMPLOS DE PRODUTOS POR TENANT:' as status;
SELECT 
    tenant_id,
    sku,
    name,
    created_at
FROM public.products 
ORDER BY tenant_id, created_at DESC
LIMIT 10;

SELECT '✅ CORREÇÃO DE CONSTRAINT CONCLUÍDA!' as resultado;



