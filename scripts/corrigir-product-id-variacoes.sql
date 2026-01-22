-- Script para corrigir o product_id das variações se estiverem associadas ao produto errado
-- ATENÇÃO: Execute o diagnostico-gatorade.sql primeiro para identificar o problema!

-- Cenário: As variações estão associadas a um produto, mas a API busca por outro produto com mesmo SKU

-- Exemplo de correção (ajuste os IDs conforme o diagnóstico):
-- Se as variações estão no produto ID X, mas deveriam estar no produto ID Y:

-- PASSO 1: Backup (recomendado)
-- CREATE TABLE product_variants_backup AS SELECT * FROM product_variants WHERE tenant_id = 'SEU_TENANT_ID';

-- PASSO 2: Atualizar product_id das variações
-- Substitua PRODUTO_ORIGEM_ID pelo ID onde as variações estão
-- Substitua PRODUTO_DESTINO_ID pelo ID onde as variações deveriam estar

/*
UPDATE product_variants
SET product_id = PRODUTO_DESTINO_ID
WHERE tenant_id = 'SEU_TENANT_ID'
  AND product_id = PRODUTO_ORIGEM_ID;
*/

-- PASSO 3: Atualizar has_variations nos produtos
/*
UPDATE products
SET has_variations = true
WHERE id = PRODUTO_DESTINO_ID
  AND tenant_id = 'SEU_TENANT_ID';

UPDATE products
SET has_variations = false
WHERE id = PRODUTO_ORIGEM_ID
  AND tenant_id = 'SEU_TENANT_ID'
  AND NOT EXISTS (
    SELECT 1 FROM product_variants
    WHERE product_id = PRODUTO_ORIGEM_ID
      AND tenant_id = 'SEU_TENANT_ID'
  );
*/

-- PASSO 4: Verificar resultado
/*
SELECT 
  p.id,
  p.name,
  p.sku,
  p.has_variations,
  COUNT(pv.id) as total_variacoes
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.tenant_id = p.tenant_id
WHERE p.tenant_id = 'SEU_TENANT_ID'
  AND p.id IN (PRODUTO_ORIGEM_ID, PRODUTO_DESTINO_ID)
GROUP BY p.id, p.name, p.sku, p.has_variations;
*/
