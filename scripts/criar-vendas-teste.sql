-- Script para criar vendas de teste para fechar o caixa
-- Execute este script no Supabase SQL Editor
-- 
-- IMPORTANTE: Substitua 'SEU_TENANT_ID_AQUI' pelo UUID do seu tenant
-- Você pode obter o tenant_id executando: SELECT id FROM tenants LIMIT 1;

-- ===========================================
-- PASSO 1: Obter o tenant_id
-- ===========================================
-- Execute esta query primeiro para obter seu tenant_id:
-- SELECT id, name FROM tenants LIMIT 1;
-- Copie o UUID do id e use no script abaixo

-- ===========================================
-- PASSO 2: Criar vendas de teste
-- ===========================================
-- ⚠️ SUBSTITUA 'SEU_TENANT_ID_AQUI' pelo UUID real do seu tenant

DO $$
DECLARE
    v_tenant_id UUID;
    v_sale_id BIGINT;
    v_sale_number VARCHAR(50);
    v_date TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
BEGIN
    -- Obter o primeiro tenant (ou use um específico)
    SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum tenant encontrado. Crie um tenant primeiro.';
    END IF;
    
    RAISE NOTICE '✅ Usando tenant_id: %', v_tenant_id;
    
    -- Venda 1: Dinheiro - R$ 50,00
    v_sale_number := 'VND-' || TO_CHAR(v_date, 'YYYYMMDD') || '-001';
    INSERT INTO sales (
        tenant_id,
        user_id,
        sale_number,
        customer_name,
        total_amount,
        discount_amount,
        final_amount,
        payment_method,
        status,
        sale_source,
        created_at,
        sold_at
    ) VALUES (
        v_tenant_id,
        NULL, -- user_id opcional
        v_sale_number,
        'Cliente Teste 1',
        50.00,
        0.00,
        50.00,
        'dinheiro',
        'paga', -- Status paga para aparecer no fechamento
        'pdv',
        v_date,
        v_date
    ) RETURNING id INTO v_sale_id;
    
    RAISE NOTICE '✅ Venda 1 criada: % (ID: %)', v_sale_number, v_sale_id;
    
    -- Venda 2: PIX - R$ 75,50
    v_sale_number := 'VND-' || TO_CHAR(v_date, 'YYYYMMDD') || '-002';
    INSERT INTO sales (
        tenant_id,
        user_id,
        sale_number,
        customer_name,
        total_amount,
        discount_amount,
        final_amount,
        payment_method,
        status,
        sale_source,
        created_at,
        sold_at
    ) VALUES (
        v_tenant_id,
        NULL,
        v_sale_number,
        'Cliente Teste 2',
        75.50,
        0.00,
        75.50,
        'pix',
        'paga',
        'pdv',
        v_date,
        v_date
    ) RETURNING id INTO v_sale_id;
    
    RAISE NOTICE '✅ Venda 2 criada: % (ID: %)', v_sale_number, v_sale_id;
    
    -- Venda 3: Cartão Débito - R$ 120,00
    v_sale_number := 'VND-' || TO_CHAR(v_date, 'YYYYMMDD') || '-003';
    INSERT INTO sales (
        tenant_id,
        user_id,
        sale_number,
        customer_name,
        total_amount,
        discount_amount,
        final_amount,
        payment_method,
        status,
        sale_source,
        created_at,
        sold_at
    ) VALUES (
        v_tenant_id,
        NULL,
        v_sale_number,
        'Cliente Teste 3',
        120.00,
        0.00,
        120.00,
        'cartao_debito',
        'paga',
        'pdv',
        v_date,
        v_date
    ) RETURNING id INTO v_sale_id;
    
    RAISE NOTICE '✅ Venda 3 criada: % (ID: %)', v_sale_number, v_sale_id;
    
    -- Venda 4: Cartão Crédito - R$ 200,00
    v_sale_number := 'VND-' || TO_CHAR(v_date, 'YYYYMMDD') || '-004';
    INSERT INTO sales (
        tenant_id,
        user_id,
        sale_number,
        customer_name,
        total_amount,
        discount_amount,
        final_amount,
        payment_method,
        status,
        sale_source,
        created_at,
        sold_at
    ) VALUES (
        v_tenant_id,
        NULL,
        v_sale_number,
        'Cliente Teste 4',
        200.00,
        0.00,
        200.00,
        'cartao_credito',
        'paga',
        'pdv',
        v_date,
        v_date
    ) RETURNING id INTO v_sale_id;
    
    RAISE NOTICE '✅ Venda 4 criada: % (ID: %)', v_sale_number, v_sale_id;
    
    -- Venda 5: Dinheiro - R$ 30,00
    v_sale_number := 'VND-' || TO_CHAR(v_date, 'YYYYMMDD') || '-005';
    INSERT INTO sales (
        tenant_id,
        user_id,
        sale_number,
        customer_name,
        total_amount,
        discount_amount,
        final_amount,
        payment_method,
        status,
        sale_source,
        created_at,
        sold_at
    ) VALUES (
        v_tenant_id,
        NULL,
        v_sale_number,
        'Cliente Teste 5',
        30.00,
        0.00,
        30.00,
        'dinheiro',
        'paga',
        'pdv',
        v_date,
        v_date
    ) RETURNING id INTO v_sale_id;
    
    RAISE NOTICE '✅ Venda 5 criada: % (ID: %)', v_sale_number, v_sale_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Total de vendas criadas: 5';
    RAISE NOTICE '📊 Resumo:';
    RAISE NOTICE '   - Dinheiro: R$ 80,00 (2 vendas)';
    RAISE NOTICE '   - PIX: R$ 75,50 (1 venda)';
    RAISE NOTICE '   - Cartão Débito: R$ 120,00 (1 venda)';
    RAISE NOTICE '   - Cartão Crédito: R$ 200,00 (1 venda)';
    RAISE NOTICE '   - Total: R$ 475,50';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Vendas criadas com sucesso! Agora você pode fechar o caixa.';
    
END $$;

-- ===========================================
-- Verificar vendas criadas
-- ===========================================
SELECT 
    sale_number,
    customer_name,
    final_amount,
    payment_method,
    status,
    created_at
FROM sales
WHERE sale_source = 'pdv'
  AND status = 'paga'
  AND created_at >= CURRENT_DATE
ORDER BY created_at DESC
LIMIT 10;

-- ===========================================
-- Resumo por método de pagamento
-- ===========================================
SELECT 
    payment_method,
    COUNT(*) as quantidade,
    SUM(final_amount) as total
FROM sales
WHERE sale_source = 'pdv'
  AND status = 'paga'
  AND created_at >= CURRENT_DATE
GROUP BY payment_method
ORDER BY payment_method;


