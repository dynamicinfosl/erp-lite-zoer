-- Execute cada query SEPARADAMENTE, uma de cada vez

-- ============================================
-- QUERY 1: Produtos Gatorade
-- ============================================
SELECT 
  id,
  name,
  sku,
  stock_quantity,
  tenant_id
FROM products
WHERE tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
  AND LOWER(name) LIKE '%gatorade%'
ORDER BY id;

-- ============================================
-- QUERY 2: Variações de Gatorade
-- ============================================
SELECT 
  pv.id,
  pv.product_id,
  pv.label,
  pv.name,
  pv.stock_quantity,
  pv.tenant_id
FROM product_variants pv
WHERE pv.tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
  AND (
    LOWER(pv.label) LIKE '%gatorade%'
    OR LOWER(pv.name) LIKE '%gatorade%'
  )
ORDER BY pv.product_id, pv.id;

-- ============================================
-- QUERY 3: Todas as variações (sem filtro)
-- ============================================
SELECT 
  pv.id,
  pv.product_id,
  pv.label,
  p.name as produto_nome,
  p.sku as produto_sku
FROM product_variants pv
JOIN products p ON p.id = pv.product_id
WHERE pv.tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
ORDER BY pv.product_id, pv.id
LIMIT 20;

-- ============================================
-- QUERY 4: Produto "gatorade fd"
-- ============================================
SELECT 
  id,
  name,
  sku,
  stock_quantity
FROM products
WHERE tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
  AND LOWER(name) LIKE '%gatorade%fd%'
ORDER BY id;

-- ============================================
-- QUERY 5: Buscar produto com SKU específico
-- ============================================
SELECT 
  id,
  name,
  sku,
  stock_quantity
FROM products
WHERE tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
  AND sku = '2006226387503'
ORDER BY id;
