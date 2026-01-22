-- Verificar se há variações em QUALQUER tenant (sem filtro)

-- 1. Contar total de variações no banco (todos os tenants)
SELECT COUNT(*) as total_variacoes
FROM product_variants;

-- 2. Listar variações por tenant
SELECT 
  tenant_id,
  COUNT(*) as total_variacoes
FROM product_variants
GROUP BY tenant_id
ORDER BY total_variacoes DESC;

-- 3. Buscar variações com label que tenha gatorade
SELECT 
  id,
  tenant_id,
  product_id,
  label,
  name,
  stock_quantity
FROM product_variants
WHERE LOWER(label) LIKE '%gatorade%'
   OR LOWER(name) LIKE '%gatorade%'
   OR LOWER(label) LIKE '%limao%'
   OR LOWER(label) LIKE '%laranja%'
   OR LOWER(label) LIKE '%uva%'
LIMIT 20;

-- 4. Verificar se há variações para o SKU 2006226387503 (em qualquer tenant)
SELECT 
  pv.id,
  pv.tenant_id,
  pv.product_id,
  p.name as produto_nome,
  p.sku as produto_sku,
  pv.label,
  pv.name as variacao_nome
FROM product_variants pv
JOIN products p ON p.id = pv.product_id
WHERE p.sku = '2006226387503'
LIMIT 20;

-- 5. Buscar produto com nome exato "gatorade fd"
SELECT 
  id,
  tenant_id,
  name,
  sku,
  stock_quantity
FROM products
WHERE LOWER(name) = 'gatorade fd'
   OR name ILIKE 'gatorade fd'
   OR name ILIKE 'gatorade%fd%'
LIMIT 20;
