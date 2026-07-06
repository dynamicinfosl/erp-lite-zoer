-- ROLLBACK das correções de isolamento entre tenants
-- Aplicar apenas se algo quebrar após o fix principal

-- Recriar policies public de deliveries (ANTIGAS - NAO SEGURAS)
CREATE POLICY IF NOT EXISTS "Enable read access for deliveries by tenant" ON deliveries
  FOR SELECT TO public USING (tenant_id IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Enable insert access for deliveries by tenant" ON deliveries
  FOR INSERT TO public WITH CHECK (tenant_id IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Enable update access for deliveries by tenant" ON deliveries
  FOR UPDATE TO public USING (tenant_id IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Enable delete access for deliveries by tenant" ON deliveries
  FOR DELETE TO public USING (tenant_id IS NOT NULL);

-- Recriar policies abertas de stock_movements (ANTIGAS - NAO SEGURAS)
CREATE POLICY IF NOT EXISTS "Permitir leitura de movimentações para usuários autenticados" ON stock_movements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Permitir inserção de movimentações para usuários autenticados" ON stock_movements
  FOR INSERT TO authenticated WITH CHECK (true);

-- Recriar policies antigas baseadas em user_id (se necessário, mas idealmente NAO voltar)
-- NOTA: este rollback nao recria todas as policies antigas, apenas as que poderiam quebrar fluxos legítimos.
-- As policies de user_id para sales/products/customers/financial_transactions nao sao recriadas aqui por seguranca.
-- Se precisar, recrie individualmente via SQL direto no Supabase.
