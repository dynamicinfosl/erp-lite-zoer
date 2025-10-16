-- =============================================
-- ENABLE ROW LEVEL SECURITY FOR PRODUCTION
-- =============================================
-- Este script reativa o RLS para segurança em produção
-- Execute APENAS após testar todas as funcionalidades

-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- =============================================

-- Tabela tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Tabela user_memberships
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

-- Tabela customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Tabela products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Tabela sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Tabela sale_items
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Tabela orders (ordens de serviço)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Tabela deliveries
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Tabela stock_movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Tabela subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. CRIAR POLÍTICAS RLS
-- =============================================

-- Políticas para tenants
CREATE POLICY "Users can view their own tenant" ON public.tenants
  FOR SELECT USING (
    id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can update their own tenant" ON public.tenants
  FOR UPDATE USING (
    id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Políticas para user_memberships
CREATE POLICY "Users can view their own memberships" ON public.user_memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own memberships" ON public.user_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own memberships" ON public.user_memberships
  FOR UPDATE USING (user_id = auth.uid());

-- Políticas para customers
CREATE POLICY "Users can view customers from their tenant" ON public.customers
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can insert customers in their tenant" ON public.customers
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can update customers from their tenant" ON public.customers
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can delete customers from their tenant" ON public.customers
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Políticas para products
CREATE POLICY "Users can view products from their tenant" ON public.products
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can insert products in their tenant" ON public.products
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can update products from their tenant" ON public.products
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can delete products from their tenant" ON public.products
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Políticas para sales
CREATE POLICY "Users can view sales from their tenant" ON public.sales
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can insert sales in their tenant" ON public.sales
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can update sales from their tenant" ON public.sales
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Políticas para sale_items
CREATE POLICY "Users can view sale_items from their tenant" ON public.sale_items
  FOR SELECT USING (
    sale_id IN (
      SELECT id 
      FROM public.sales 
      WHERE tenant_id IN (
        SELECT tenant_id 
        FROM public.user_memberships 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )
  );

CREATE POLICY "Users can insert sale_items in their tenant" ON public.sale_items
  FOR INSERT WITH CHECK (
    sale_id IN (
      SELECT id 
      FROM public.sales 
      WHERE tenant_id IN (
        SELECT tenant_id 
        FROM public.user_memberships 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )
  );

-- Políticas para orders
CREATE POLICY "Users can view orders from their tenant" ON public.orders
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can insert orders in their tenant" ON public.orders
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can update orders from their tenant" ON public.orders
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can delete orders from their tenant" ON public.orders
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Políticas para deliveries
CREATE POLICY "Users can view deliveries from their tenant" ON public.deliveries
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can insert deliveries in their tenant" ON public.deliveries
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can update deliveries from their tenant" ON public.deliveries
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can delete deliveries from their tenant" ON public.deliveries
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Políticas para stock_movements
CREATE POLICY "Users can view stock_movements from their tenant" ON public.stock_movements
  FOR SELECT USING (
    product_id IN (
      SELECT id 
      FROM public.products 
      WHERE tenant_id IN (
        SELECT tenant_id 
        FROM public.user_memberships 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )
  );

CREATE POLICY "Users can insert stock_movements in their tenant" ON public.stock_movements
  FOR INSERT WITH CHECK (
    product_id IN (
      SELECT id 
      FROM public.products 
      WHERE tenant_id IN (
        SELECT tenant_id 
        FROM public.user_memberships 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )
  );

-- Políticas para subscriptions
CREATE POLICY "Users can view subscriptions from their tenant" ON public.subscriptions
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can update subscriptions from their tenant" ON public.subscriptions
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- 3. POLÍTICAS ESPECIAIS PARA SUPERADMIN
-- =============================================

-- Superadmin pode ver tudo (usar com cuidado)
CREATE POLICY "Superadmin can view all tenants" ON public.tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND role = 'superadmin'
      AND is_active = true
    )
  );

CREATE POLICY "Superadmin can view all customers" ON public.customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND role = 'superadmin'
      AND is_active = true
    )
  );

CREATE POLICY "Superadmin can view all products" ON public.products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM public.user_memberships 
      WHERE user_id = auth.uid() 
      AND role = 'superadmin'
      AND is_active = true
    )
  );

-- 4. VERIFICAR POLÍTICAS CRIADAS
-- =============================================

-- Listar todas as políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. TESTAR RLS
-- =============================================

-- Teste: verificar se RLS está ativo
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = true;

-- =============================================
-- FIM DO SCRIPT
-- =============================================

-- IMPORTANTE: 
-- 1. Execute este script APENAS em produção
-- 2. Teste todas as funcionalidades após executar
-- 3. Monitore performance das queries
-- 4. Tenha um plano de rollback caso necessário