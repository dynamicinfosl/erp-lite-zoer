-- Script para desabilitar RLS temporariamente na tabela sale_items
-- Execute este script no SQL Editor do Supabase

-- 1. Desabilitar RLS na tabela sale_items
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se foi desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'sale_items';

-- 3. Opcional: Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view sale_items from their tenant" ON sale_items;
DROP POLICY IF EXISTS "Users can insert sale_items for their tenant" ON sale_items;
DROP POLICY IF EXISTS "Users can update sale_items from their tenant" ON sale_items;
DROP POLICY IF EXISTS "Users can delete sale_items from their tenant" ON sale_items;

-- 4. Verificar políticas restantes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'sale_items';
