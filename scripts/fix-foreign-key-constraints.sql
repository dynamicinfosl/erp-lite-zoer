-- ============================================
-- SOLUÇÃO: Remover constraints de Foreign Key
-- ============================================
-- Este script remove as constraints de foreign key que impedem
-- o uso de user_id como tenant_id

-- IMPORTANTE: Execute este script no Supabase SQL Editor

-- ============================================
-- 1. REMOVER FOREIGN KEY CONSTRAINTS
-- ============================================

-- Remover constraint de products → tenants
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_tenant_id_fkey;

-- Remover constraint de customers → tenants
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_tenant_id_fkey;

-- Remover constraint de sales → tenants
ALTER TABLE sales 
DROP CONSTRAINT IF EXISTS sales_tenant_id_fkey;

-- Remover constraint de stock_movements → tenants (se existir)
ALTER TABLE stock_movements 
DROP CONSTRAINT IF EXISTS stock_movements_tenant_id_fkey;

-- Remover constraint de sale_items → tenants (se existir)
ALTER TABLE sale_items 
DROP CONSTRAINT IF EXISTS sale_items_tenant_id_fkey;

-- ============================================
-- 2. VERIFICAR CONSTRAINTS REMOVIDAS
-- ============================================

-- Ver todas as constraints de foreign key restantes
SELECT
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema='public'
  AND (
    tc.table_name IN ('products', 'customers', 'sales', 'stock_movements', 'sale_items')
    OR ccu.table_name = 'tenants'
  )
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================
-- 3. ADICIONAR ÍNDICES PARA PERFORMANCE
-- ============================================
-- Como não temos mais FK, é bom ter índices para performance

-- Índice em products.tenant_id
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);

-- Índice em customers.tenant_id
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);

-- Índice em sales.tenant_id
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);

-- Índice em stock_movements.tenant_id (se a coluna existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'stock_movements' 
        AND column_name = 'tenant_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_id ON stock_movements(tenant_id);
    END IF;
END $$;

-- Índice em sale_items.tenant_id (se a coluna existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sale_items' 
        AND column_name = 'tenant_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_sale_items_tenant_id ON sale_items(tenant_id);
    END IF;
END $$;

-- ============================================
-- 4. VERIFICAR ESTRUTURA DAS TABELAS
-- ============================================

-- Ver colunas da tabela products
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver colunas da tabela customers
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'customers'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver colunas da tabela sales
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sales'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- MENSAGENS DE SUCESSO
-- ============================================

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Foreign key constraints removidas com sucesso!';
    RAISE NOTICE '✅ Índices criados para melhor performance';
    RAISE NOTICE '✅ Agora você pode usar user_id como tenant_id sem problemas';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Próximos passos:';
    RAISE NOTICE '1. Faça logout e login novamente no sistema';
    RAISE NOTICE '2. Tente cadastrar um novo produto ou cliente';
    RAISE NOTICE '3. Verifique que agora aparece na lista';
END $$;


