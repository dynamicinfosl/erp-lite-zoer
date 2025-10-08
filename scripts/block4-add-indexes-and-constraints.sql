-- =============================================
-- BLOCO 4: ADICIONAR ÍNDICES E CONSTRAINTS (Execute separadamente)
-- =============================================

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);

-- Índices para customers  
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);

-- Índices para sales
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON public.sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_sale_number ON public.sales(sale_number);

-- Índices para sale_items
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);

-- Índices para cash_operations
CREATE INDEX IF NOT EXISTS idx_cash_operations_tenant_id ON public.cash_operations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_operations_created_at ON public.cash_operations(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_operations_type ON public.cash_operations(operation_type);

-- Adicionar constraints de validação
ALTER TABLE public.sales 
ADD CONSTRAINT chk_sales_payment_method 
CHECK (payment_method IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'boleto'));

ALTER TABLE public.sales 
ADD CONSTRAINT chk_sales_status 
CHECK (status IN ('pending', 'completed', 'cancelled'));

ALTER TABLE public.sale_items 
ADD CONSTRAINT chk_sale_items_quantity 
CHECK (quantity > 0);

ALTER TABLE public.sale_items 
ADD CONSTRAINT chk_sale_items_discount 
CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

ALTER TABLE public.cash_operations 
ADD CONSTRAINT chk_cash_operations_type 
CHECK (operation_type IN ('abertura', 'sangria', 'reforco', 'fechamento'));

-- Verificar índices criados
SELECT 'Índices criados:' as info;
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('products', 'customers', 'sales', 'sale_items', 'cash_operations')
ORDER BY tablename, indexname;


