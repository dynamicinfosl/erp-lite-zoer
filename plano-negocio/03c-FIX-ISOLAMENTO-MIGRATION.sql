-- FIX de isolamento entre tenants
-- Aplicar em LOTES, verificando a cada passo
-- Projeto: lfxietcasaooenffdodr

-- ============================================
-- LOTE 1: cash_sessions_log (sem policy atualmente)
-- ============================================
CREATE POLICY IF NOT EXISTS "cash_sessions_log_tenant_policy" ON cash_sessions_log
  FOR ALL TO authenticated
  USING (tenant_id = get_current_tenant_id() OR is_superadmin())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_superadmin());

-- ============================================
-- LOTE 2: deliveries - remover policies public perigosas
-- ============================================
DROP POLICY IF EXISTS "Enable read access for deliveries by tenant" ON deliveries;
DROP POLICY IF EXISTS "Enable insert access for deliveries by tenant" ON deliveries;
DROP POLICY IF EXISTS "Enable update access for deliveries by tenant" ON deliveries;
DROP POLICY IF EXISTS "Enable delete access for deliveries by tenant" ON deliveries;

-- ============================================
-- LOTE 3: stock_movements - substituir policies abertas por policy de tenant
-- ============================================
DROP POLICY IF EXISTS "Permitir leitura de movimentações para usuários autenticados" ON stock_movements;
DROP POLICY IF EXISTS "Permitir inserção de movimentações para usuários autenticados" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_select_policy" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_insert_policy" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_update_policy" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_delete_policy" ON stock_movements;

CREATE POLICY IF NOT EXISTS "stock_movements_tenant_policy" ON stock_movements
  FOR ALL TO authenticated
  USING (tenant_id = get_current_tenant_id() OR is_superadmin())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_superadmin());

-- ============================================
-- LOTE 4: remover policies antigas baseadas em user_id (duplicadas/conflitantes)
-- ============================================
-- sales
DROP POLICY IF EXISTS "sales_select_policy" ON sales;
DROP POLICY IF EXISTS "sales_insert_policy" ON sales;
DROP POLICY IF EXISTS "sales_update_policy" ON sales;
DROP POLICY IF EXISTS "sales_delete_policy" ON sales;
DROP POLICY IF EXISTS "prod_select_sales" ON sales;
DROP POLICY IF EXISTS "prod_insert_sales" ON sales;
DROP POLICY IF EXISTS "prod_update_sales" ON sales;
DROP POLICY IF EXISTS "prod_delete_sales" ON sales;

-- products
DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;
DROP POLICY IF EXISTS "prod_select_products" ON products;
DROP POLICY IF EXISTS "prod_insert_products" ON products;
DROP POLICY IF EXISTS "prod_update_products" ON products;
DROP POLICY IF EXISTS "prod_delete_products" ON products;

-- customers
DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;
DROP POLICY IF EXISTS "prod_select_customers" ON customers;
DROP POLICY IF EXISTS "prod_insert_customers" ON customers;
DROP POLICY IF EXISTS "prod_update_customers" ON customers;
DROP POLICY IF EXISTS "prod_delete_customers" ON customers;

-- financial_transactions
DROP POLICY IF EXISTS "financial_transactions_select_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete_policy" ON financial_transactions;

-- delivery_drivers
DROP POLICY IF EXISTS "delivery_drivers_select_policy" ON delivery_drivers;
DROP POLICY IF EXISTS "delivery_drivers_insert_policy" ON delivery_drivers;
DROP POLICY IF EXISTS "delivery_drivers_update_policy" ON delivery_drivers;
DROP POLICY IF EXISTS "delivery_drivers_delete_policy" ON delivery_drivers;
