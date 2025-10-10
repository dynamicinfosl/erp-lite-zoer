-- =============================================
-- INSERIR DADOS MÍNIMOS DE TESTE
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Inserir apenas produtos com colunas básicas
INSERT INTO public.products (
    tenant_id, user_id, name, description, category, brand, sale_price, created_at, updated_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Produto Teste A',
    'Descrição do produto A',
    'Categoria 1',
    'Marca A',
    99.90,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Produto Teste B',
    'Descrição do produto B',
    'Categoria 2',
    'Marca B',
    149.90,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 2. Inserir vendas básicas
INSERT INTO public.sales (
    tenant_id, user_id, total_amount, final_amount, payment_method, status, created_at, updated_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    150.00,
    150.00,
    'dinheiro',
    'concluida',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    200.00,
    190.00,
    'cartao',
    'concluida',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
);

-- 3. Inserir entregas básicas
INSERT INTO public.deliveries (
    tenant_id, user_id, customer_name, customer_phone, customer_address,
    delivery_date, status, notes, created_at, updated_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Cliente Teste A',
    '11999999999',
    'Rua Teste, 123',
    CURRENT_DATE + INTERVAL '1 day',
    'pendente',
    'Entrega agendada',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Cliente Teste B',
    '11888888888',
    'Av. Teste, 456',
    CURRENT_DATE,
    'entregue',
    'Entrega realizada',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
);

-- 4. Verificar dados inseridos
SELECT 'PRODUCTS' as tabela, COUNT(*) as total FROM public.products WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT 'SALES' as tabela, COUNT(*) as total FROM public.sales WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT 'DELIVERIES' as tabela, COUNT(*) as total FROM public.deliveries WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

