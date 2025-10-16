-- =============================================
-- LIMPEZA DE SKUs DUPLICADOS POR TENANT
-- =============================================
-- Este script remove produtos duplicados mantendo apenas o mais recente

-- 1. Verificar dados duplicados antes da limpeza
SELECT 'DADOS DUPLICADOS ANTES DA LIMPEZA:' as status;
SELECT 
    tenant_id,
    sku,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as ids,
    STRING_AGG(name, ', ') as produtos
FROM public.products 
WHERE sku IS NOT NULL AND sku != ''
GROUP BY tenant_id, sku
HAVING COUNT(*) > 1
ORDER BY tenant_id, sku;

-- 2. Remover produtos duplicados, mantendo apenas o mais recente
WITH ranked_products AS (
  SELECT 
    id,
    tenant_id,
    sku,
    name,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, sku 
      ORDER BY created_at DESC
    ) as rn
  FROM public.products 
  WHERE sku IS NOT NULL AND sku != ''
),
products_to_delete AS (
  SELECT id
  FROM ranked_products 
  WHERE rn > 1
)
DELETE FROM public.products 
WHERE id IN (SELECT id FROM products_to_delete);

-- 3. Verificar se ainda há duplicados após limpeza
SELECT 'DADOS DUPLICADOS APÓS LIMPEZA:' as status;
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

-- 4. Verificar constraint
SELECT 'VERIFICANDO CONSTRAINT:' as status;
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_sku_tenant_unique' 
    AND table_name = 'products'
    AND table_schema = 'public'
) as constraint_exists;

-- 5. Mostrar alguns produtos por tenant para verificação
SELECT 'PRODUTOS POR TENANT (AMOSTRA):' as status;
SELECT 
    tenant_id,
    sku,
    name,
    created_at
FROM public.products 
WHERE sku IS NOT NULL AND sku != ''
ORDER BY tenant_id, sku, created_at DESC
LIMIT 20;

SELECT '✅ LIMPEZA CONCLUÍDA!' as resultado;



