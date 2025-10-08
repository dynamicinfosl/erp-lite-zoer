-- =============================================
-- BLOCO 6: CRIAR FUNÇÕES AUXILIARES (Execute separadamente)
-- =============================================

-- Função para gerar número da venda
CREATE OR REPLACE FUNCTION generate_sale_number(tenant_uuid UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    sale_count INTEGER;
    sale_number VARCHAR(50);
BEGIN
    -- Contar vendas do tenant hoje
    SELECT COUNT(*) + 1 INTO sale_count
    FROM public.sales 
    WHERE tenant_id = tenant_uuid 
    AND DATE(created_at) = CURRENT_DATE;
    
    -- Gerar número da venda no formato VND-YYYYMMDD-0001
    sale_number := 'VND-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(sale_count::TEXT, 4, '0');
    
    RETURN sale_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular totais da venda
CREATE OR REPLACE FUNCTION calculate_sale_totals(sale_uuid UUID)
RETURNS TABLE (
    total_items INTEGER,
    total_amount DECIMAL(10,2),
    total_discount DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_items,
        COALESCE(SUM(subtotal), 0) as total_amount,
        COALESCE(SUM((unit_price * quantity * discount_percentage / 100)), 0) as total_discount
    FROM public.sale_items 
    WHERE sale_id = sale_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função do trigger para atualizar estoque
CREATE OR REPLACE FUNCTION update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar estoque do produto
    UPDATE public.products 
    SET stock_quantity = stock_quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_stock_after_sale ON public.sale_items;
CREATE TRIGGER trigger_update_stock_after_sale
    AFTER INSERT ON public.sale_items
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_after_sale();

-- Verificar funções criadas
SELECT 'Funções criadas:' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('generate_sale_number', 'calculate_sale_totals', 'update_stock_after_sale')
ORDER BY routine_name;


