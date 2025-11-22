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
SELECT 'sale_items', COUNT(*) FROM sale_items WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8'
UNION ALL
SELECT 'orders', COUNT(*) FROM orders WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8'
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

-- 4.1. VERIFICAR E MOVER VENDAS QUE PODEM ESTAR COM TENANT_ID NULL OU INCORRETO
-- (Garantir que todas as vendas relacionadas ao usuário sejam movidas)
UPDATE sales
SET 
  tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b',
  updated_at = NOW()
WHERE id IN (
  SELECT s.id 
  FROM sales s
  INNER JOIN sale_items si ON si.sale_id = s.id
  WHERE si.tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
  AND (s.tenant_id IS NULL OR s.tenant_id != '7a56008e-0a31-4084-8c70-de7a5cdd083b')
);

-- 5. MOVER ITENS DE VENDA (por tenant_id direto)
UPDATE sale_items
SET 
  tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8';

-- 5.1. MOVER ITENS DE VENDA (por sale_id - garantir que itens ligados a vendas já movidas também sejam atualizados)
UPDATE sale_items
SET 
  tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
WHERE sale_id IN (
  SELECT id FROM sales WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
)
AND (tenant_id IS NULL OR tenant_id != '7a56008e-0a31-4084-8c70-de7a5cdd083b');

-- 6. MOVER PEDIDOS (se existir - pode dar erro se a tabela não existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    UPDATE orders
    SET tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
    WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8';
    RAISE NOTICE 'Pedidos movidos com sucesso';
  ELSE
    RAISE NOTICE 'Tabela orders não existe, pulando...';
  END IF;
END $$;

-- 7. MOVER TRANSAÇÕES FINANCEIRAS (se existir - pode dar erro se a tabela não existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_transactions') THEN
    UPDATE financial_transactions
    SET tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
    WHERE tenant_id = 'e1e4d6d0-a17e-4e77-89cc-04fa5b26ebc8';
    RAISE NOTICE 'Transações financeiras movidas com sucesso';
  ELSE
    RAISE NOTICE 'Tabela financial_transactions não existe, pulando...';
  END IF;
END $$;

-- 8. VERIFICAR RESULTADO FINAL
SELECT 
  'products' as tabela, COUNT(*) as total FROM products WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
UNION ALL
SELECT 'customers', COUNT(*) FROM customers WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
UNION ALL
SELECT 'sales', COUNT(*) FROM sales WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
UNION ALL
SELECT 'sale_items', COUNT(*) FROM sale_items WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b';

