-- ============================================
-- MOVER TODOS OS DADOS DE UM TENANT PARA OUTRO
-- ============================================
-- IMPORTANTE: Substitua os tenant_ids antes de executar!

-- Tenant de origem (errado): e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8
-- Tenant de destino (correto): 7a56008e-0a31-4084-8c70-de7a5cdd083b

-- 1. VERIFICAR QUANTOS REGISTROS SERÃO MOVIDOS
SELECT 
  'products' as tabela, COUNT(*) as total FROM products WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8'
UNION ALL
SELECT 'customers', COUNT(*) FROM customers WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8'
UNION ALL
SELECT 'sales', COUNT(*) FROM sales WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8'
UNION ALL
SELECT 'sale_items', COUNT(*) FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8')
UNION ALL
SELECT 'stock_movements', COUNT(*) FROM stock_movements WHERE product_id IN (SELECT id FROM products WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8')
UNION ALL
SELECT 'orders', COUNT(*) FROM orders WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8'
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8')
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8'
UNION ALL
SELECT 'financial_transactions', COUNT(*) FROM financial_transactions WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8';

-- 2. MOVER PRODUTOS (se ainda não foi feito)
UPDATE products
SET 
  tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b',
  updated_at = NOW()
WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8';

-- 3. MOVER CLIENTES
UPDATE customers
SET 
  tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b',
  updated_at = NOW()
WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8';

-- 4. MOVER VENDAS
UPDATE sales
SET 
  tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b',
  updated_at = NOW()
WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8';

-- 5. MOVER MOVIMENTAÇÕES DE ESTOQUE (através dos produtos)
UPDATE stock_movements
SET 
  updated_at = NOW()
WHERE product_id IN (
  SELECT id FROM products WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
);

-- 6. MOVER FORNECEDORES
UPDATE suppliers
SET 
  tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b',
  updated_at = NOW()
WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8';

-- 7. MOVER TRANSAÇÕES FINANCEIRAS
UPDATE financial_transactions
SET 
  tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b',
  updated_at = NOW()
WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8';

-- 8. MOVER PEDIDOS (se existir tabela orders)
UPDATE orders
SET 
  tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b',
  updated_at = NOW()
WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8';

-- 9. VERIFICAR RESULTADO FINAL
SELECT 
  'products' as tabela, COUNT(*) as total FROM products WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
UNION ALL
SELECT 'customers', COUNT(*) FROM customers WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
UNION ALL
SELECT 'sales', COUNT(*) FROM sales WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
UNION ALL
SELECT 'financial_transactions', COUNT(*) FROM financial_transactions WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b';

