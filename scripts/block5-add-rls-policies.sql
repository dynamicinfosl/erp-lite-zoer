-- =============================================
-- BLOCO 5: CONFIGURAR SEGURANÇA RLS (Execute separadamente)
-- =============================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_operations ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view sales from their tenant" ON public.sales;
DROP POLICY IF EXISTS "Users can create sales in their tenant" ON public.sales;
DROP POLICY IF EXISTS "Users can update sales from their tenant" ON public.sales;

DROP POLICY IF EXISTS "Users can view sale_items from their tenant" ON public.sale_items;
DROP POLICY IF EXISTS "Users can create sale_items in their tenant" ON public.sale_items;

DROP POLICY IF EXISTS "Users can view cash_operations from their tenant" ON public.cash_operations;
DROP POLICY IF EXISTS "Users can create cash_operations in their tenant" ON public.cash_operations;

-- Políticas para sales
CREATE POLICY "Users can view sales from their tenant" ON public.sales
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can create sales in their tenant" ON public.sales
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can update sales from their tenant" ON public.sales
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Políticas para sale_items
CREATE POLICY "Users can view sale_items from their tenant" ON public.sale_items
    FOR SELECT USING (
        sale_id IN (
            SELECT id FROM public.sales 
            WHERE tenant_id IN (
                SELECT tenant_id FROM public.user_memberships 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

CREATE POLICY "Users can create sale_items in their tenant" ON public.sale_items
    FOR INSERT WITH CHECK (
        sale_id IN (
            SELECT id FROM public.sales 
            WHERE tenant_id IN (
                SELECT tenant_id FROM public.user_memberships 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

-- Políticas para cash_operations
CREATE POLICY "Users can view cash_operations from their tenant" ON public.cash_operations
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can create cash_operations in their tenant" ON public.cash_operations
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.user_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Verificar políticas criadas
SELECT 'Políticas RLS criadas:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('sales', 'sale_items', 'cash_operations')
ORDER BY tablename, policyname;


