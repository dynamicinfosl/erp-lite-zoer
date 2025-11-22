-- ============================================
-- CORRIGIR ITENS DE VENDA (sale_items)
-- ============================================
-- Este script verifica e corrige os itens de venda que podem estar
-- com tenant_id ou sale_id incorretos após a migração

-- Tenant correto: 7a56008e-0a31-4084-8c70-de7a5cdd083b

-- 1. VERIFICAR ITENS DE VENDA SEM TENANT_ID OU COM TENANT_ID ERRADO
SELECT 
  'Itens sem tenant_id ou com tenant_id errado' as tipo,
  COUNT(*) as total
FROM sale_items
WHERE tenant_id IS NULL 
   OR tenant_id != '7a56008e-0a31-4084-8c70-de7a5cdd083b'
   OR sale_id NOT IN (
     SELECT id FROM sales WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
   );

-- 2. VERIFICAR ITENS DE VENDA QUE ESTÃO LIGADOS A VENDAS DO TENANT CORRETO
--    MAS TÊM TENANT_ID INCORRETO
SELECT 
  si.id,
  si.sale_id,
  si.tenant_id as item_tenant_id,
  s.tenant_id as sale_tenant_id,
  si.product_name
FROM sale_items si
INNER JOIN sales s ON s.id = si.sale_id
WHERE s.tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
  AND (si.tenant_id IS NULL OR si.tenant_id != '7a56008e-0a31-4084-8c70-de7a5cdd083b');

-- 3. CORRIGIR ITENS DE VENDA: Atualizar tenant_id baseado no sale_id
UPDATE sale_items
SET tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
WHERE sale_id IN (
  SELECT id FROM sales WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
)
AND (tenant_id IS NULL OR tenant_id != '7a56008e-0a31-4084-8c70-de7a5cdd083b');

-- 4. VERIFICAR RESULTADO FINAL
SELECT 
  'Total de itens no tenant correto' as tipo,
  COUNT(*) as total
FROM sale_items
WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b';

-- 5. VERIFICAR VENDAS E SEUS ITENS
SELECT 
  s.id as sale_id,
  s.sale_number,
  s.total_amount,
  COUNT(si.id) as total_itens
FROM sales s
LEFT JOIN sale_items si ON si.sale_id = s.id AND si.tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
WHERE s.tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
GROUP BY s.id, s.sale_number, s.total_amount
ORDER BY s.created_at DESC;

