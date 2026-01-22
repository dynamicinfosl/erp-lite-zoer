-- Verificar as variações do produto 1032 (tenant ffd61c21-81d8-49f0-8b70-b1c0f05f6960)

-- 1. Verificar variações do produto "gatorade fd" (ID 1032)
SELECT 
  id as variacao_id,
  product_id,
  label,
  name,
  stock_quantity,
  sale_price,
  cost_price,
  is_active
FROM product_variants
WHERE tenant_id = 'ffd61c21-81d8-49f0-8b70-b1c0f05f6960'
  AND product_id = 1032
ORDER BY label;

-- 2. Contar total de variações por tenant
SELECT 
  tenant_id,
  COUNT(*) as total_variacoes
FROM product_variants
GROUP BY tenant_id;

-- 3. Listar TODOS os produtos Gatorade no tenant B
SELECT 
  id,
  name,
  sku,
  stock_quantity,
  is_active
FROM products
WHERE tenant_id = 'ffd61c21-81d8-49f0-8b70-b1c0f05f6960'
  AND LOWER(name) LIKE '%gatorade%'
ORDER BY id;
