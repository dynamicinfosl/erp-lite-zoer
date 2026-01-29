-- Script SIMPLIFICADO para criar vendas de teste
-- Execute este script no Supabase SQL Editor
-- 
-- Este script cria vendas de teste usando o primeiro tenant e usuário autenticado encontrados

-- Criar vendas de teste para hoje
WITH tenant_data AS (
    SELECT id FROM tenants LIMIT 1
),
user_data AS (
    -- Buscar o primeiro usuário da tabela auth.users (UUID)
    SELECT id FROM auth.users LIMIT 1
),
sales_data AS (
    SELECT 
        (SELECT id FROM tenant_data) as tenant_id,
        (SELECT id FROM user_data) as user_id,
        'VND-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(n::TEXT, 3, '0') as sale_number,
        'Cliente Teste ' || n as customer_name,
        CASE n
            WHEN 1 THEN 50.00
            WHEN 2 THEN 75.50
            WHEN 3 THEN 120.00
            WHEN 4 THEN 200.00
            WHEN 5 THEN 30.00
        END as total_amount,
        0.00 as discount_amount,
        CASE n
            WHEN 1 THEN 50.00
            WHEN 2 THEN 75.50
            WHEN 3 THEN 120.00
            WHEN 4 THEN 200.00
            WHEN 5 THEN 30.00
        END as final_amount,
        CASE n
            WHEN 1 THEN 'dinheiro'
            WHEN 2 THEN 'pix'
            WHEN 3 THEN 'cartao_debito'
            WHEN 4 THEN 'cartao_credito'
            WHEN 5 THEN 'dinheiro'
        END as payment_method,
        'paga' as status,
        'pdv' as sale_source,
        CURRENT_TIMESTAMP as created_at,
        CURRENT_TIMESTAMP as sold_at
    FROM generate_series(1, 5) as n
)
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
)
SELECT * FROM sales_data;

-- Verificar vendas criadas
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
ORDER BY created_at DESC;

