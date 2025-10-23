-- Script para corrigir políticas RLS da tabela sale_items
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se RLS está habilitado na tabela sale_items
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'sale_items';

-- 2. Desabilitar RLS temporariamente para permitir inserção
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;

-- 3. Recriar políticas RLS adequadas para sale_items
-- Política para SELECT: usuários podem ver itens de vendas do seu tenant
CREATE POLICY "Users can view sale_items from their tenant" ON sale_items
    FOR SELECT USING (
        tenant_id IN (
            SELECT um.tenant_id 
            FROM user_memberships um 
            WHERE um.user_id = auth.uid() 
            AND um.is_active = true
        )
    );

-- Política para INSERT: usuários podem inserir itens de vendas do seu tenant
CREATE POLICY "Users can insert sale_items for their tenant" ON sale_items
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT um.tenant_id 
            FROM user_memberships um 
            WHERE um.user_id = auth.uid() 
            AND um.is_active = true
        )
    );

-- Política para UPDATE: usuários podem atualizar itens de vendas do seu tenant
CREATE POLICY "Users can update sale_items from their tenant" ON sale_items
    FOR UPDATE USING (
        tenant_id IN (
            SELECT um.tenant_id 
            FROM user_memberships um 
            WHERE um.user_id = auth.uid() 
            AND um.is_active = true
        )
    );

-- Política para DELETE: usuários podem deletar itens de vendas do seu tenant
CREATE POLICY "Users can delete sale_items from their tenant" ON sale_items
    FOR DELETE USING (
        tenant_id IN (
            SELECT um.tenant_id 
            FROM user_memberships um 
            WHERE um.user_id = auth.uid() 
            AND um.is_active = true
        )
    );

-- 4. Habilitar RLS novamente
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- 5. Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'sale_items';

-- 6. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'sale_items';
