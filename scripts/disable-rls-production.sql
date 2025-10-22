-- Script para desabilitar RLS temporariamente em produção
-- Execute este script no SQL Editor do Supabase

-- 1. Desabilitar RLS na tabela sale_items
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se foi desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'sale_items';

-- 3. Remover todas as políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Users can view sale_items from their tenant" ON sale_items;
DROP POLICY IF EXISTS "Users can insert sale_items for their tenant" ON sale_items;
DROP POLICY IF EXISTS "Users can update sale_items from their tenant" ON sale_items;
DROP POLICY IF EXISTS "Users can delete sale_items from their tenant" ON sale_items;
DROP POLICY IF EXISTS "sale_items_delete_policy" ON sale_items;
DROP POLICY IF EXISTS "sale_items_insert_policy" ON sale_items;
DROP POLICY IF EXISTS "sale_items_select_policy" ON sale_items;
DROP POLICY IF EXISTS "sale_items_update_policy" ON sale_items;

-- 4. Verificar se não há mais políticas
SELECT COUNT(*) as remaining_policies
FROM pg_policies 
WHERE tablename = 'sale_items';

-- 5. Testar inserção direta (opcional)
-- INSERT INTO sale_items (sale_id, tenant_id, user_id, product_id, product_name, unit_price, quantity, subtotal, total_price)
-- VALUES ('00000000-0000-0000-0000-000000000000', '132b42a6-6355-4418-996e-de7eb33f6e34', '132b42a6-6355-4418-996e-de7eb33f6e34', '00000000-0000-0000-0000-000000000000', 'Teste', 10.00, 1, 10.00, 10.00);
