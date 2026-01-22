-- Diagnóstico: Por que as variações do Gatorade não aparecem na API?
-- Substitua o tenant_id pelo seu
-- Exemplo: '132b42a6-6355-4418-996e-de7eb33f6e34'

-- 1. Listar TODOS os produtos com "gatorade" no nome
SELECT 
  id as produto_id,
  name as produto_nome,
  sku,
  stock_quantity as estoque,
  is_active,
  has_variations
FROM products
WHERE tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
  AND LOWER(name) LIKE '%gatorade%'
ORDER BY id;

-- 2. Listar TODAS as variações de produtos Gatorade
SELECT 
  pv.id as variacao_id,
  pv.product_id,
  p.name as produto_pai_nome,
  p.sku as produto_pai_sku,
  pv.label as variacao_label,
  pv.name as variacao_nome,
  pv.stock_quantity as estoque_variacao,
  pv.is_active as variacao_ativa
FROM product_variants pv
JOIN products p ON p.id = pv.product_id
WHERE pv.tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
  AND LOWER(p.name) LIKE '%gatorade%'
ORDER BY pv.product_id, pv.label;

-- 3. Verificar especificamente os produtos que a API retornou
-- ID 1564: "gatorade (limao)" - SKU: 2006226387503
-- ID 1566: "GATORADE UND" - SKU: 2066241844207

SELECT 
  'Produto ID 1564' as info,
  id,
  name,
  sku,
  has_variations,
  (SELECT COUNT(*) FROM product_variants WHERE product_id = 1564) as total_variacoes
FROM products
WHERE id = 1564 AND tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'

UNION ALL

SELECT 
  'Produto ID 1566' as info,
  id,
  name,
  sku,
  has_variations,
  (SELECT COUNT(*) FROM product_variants WHERE product_id = 1566) as total_variacoes
FROM products
WHERE id = 1566 AND tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34';

-- 4. Buscar por SKU (mesma lógica que a API usa)
SELECT 
  p.id,
  p.name,
  p.sku,
  COUNT(pv.id) as total_variacoes
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.tenant_id = p.tenant_id
WHERE p.tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
  AND p.sku IN ('2006226387503', '2066241844207')
GROUP BY p.id, p.name, p.sku
ORDER BY p.id;

-- 5. Verificar se há produtos com SKUs duplicados
SELECT 
  sku,
  COUNT(*) as total_produtos,
  STRING_AGG(id::text, ', ') as ids_produtos,
  STRING_AGG(name, ' | ') as nomes
FROM products
WHERE tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
  AND sku IN ('2006226387503', '2066241844207')
GROUP BY sku
HAVING COUNT(*) > 1;

-- 6. Se houver um produto "gatorade fd", verificar suas variações
SELECT 
  p.id as produto_id,
  p.name as produto_nome,
  p.sku,
  pv.id as variacao_id,
  pv.label,
  pv.name as variacao_nome,
  pv.stock_quantity as estoque
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.tenant_id = p.tenant_id
WHERE p.tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
  AND LOWER(p.name) LIKE '%gatorade%fd%'
ORDER BY p.id, pv.label;
