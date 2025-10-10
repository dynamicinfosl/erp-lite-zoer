-- =============================================
-- POPULAR TABELAS COM DADOS DE TESTE (VERSÃO CORRIGIDA)
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Inserir transações financeiras de teste
INSERT INTO public.financial_transactions (
    user_id, tenant_id, transaction_type, category, description, 
    amount, payment_method, due_date, status, notes, created_at, updated_at
) VALUES 
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'receita',
    'Vendas',
    'Venda de produto A',
    150.00,
    'dinheiro',
    CURRENT_DATE,
    'pago',
    'Venda realizada com sucesso',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'despesa',
    'Operacional',
    'Compra de material de escritório',
    75.50,
    'cartao',
    CURRENT_DATE,
    'pago',
    'Material para escritório',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'receita',
    'Serviços',
    'Prestação de serviços',
    300.00,
    'pix',
    CURRENT_DATE + INTERVAL '7 days',
    'pendente',
    'Serviço a ser prestado',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'despesa',
    'Marketing',
    'Campanha publicitária',
    200.00,
    'transferencia',
    CURRENT_DATE - INTERVAL '3 days',
    'pago',
    'Campanha no Facebook',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
);

-- 2. Inserir produtos de teste (apenas com colunas básicas)
INSERT INTO public.products (
    tenant_id, user_id, name, description, category, brand, created_at, updated_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Produto Teste A',
    'Descrição do produto A',
    'Categoria 1',
    'Marca A',
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
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Produto Teste C',
    'Descrição do produto C',
    'Categoria 1',
    'Marca C',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 3. Inserir vendas de teste
INSERT INTO public.sales (
    tenant_id, user_id, customer_id, total_amount, final_amount,
    payment_method, status, created_at, updated_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    NULL,
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
    NULL,
    200.00,
    190.00,
    'cartao',
    'concluida',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    NULL,
    300.00,
    285.00,
    'pix',
    'concluida',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
);

-- 4. Inserir entregas de teste
INSERT INTO public.deliveries (
    tenant_id, user_id, customer_name, customer_phone, customer_address,
    delivery_date, status, notes, created_at, updated_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Cliente Teste A',
    '11999999999',
    'Rua Teste, 123 - São Paulo/SP',
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
    'Av. Teste, 456 - Rio de Janeiro/RJ',
    CURRENT_DATE,
    'entregue',
    'Entrega realizada com sucesso',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Cliente Teste C',
    '11777777777',
    'Rua Exemplo, 789 - Belo Horizonte/MG',
    CURRENT_DATE - INTERVAL '1 day',
    'entregue',
    'Produto entregue',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
);

-- 5. Verificar dados inseridos
SELECT 'FINANCIAL_TRANSACTIONS' as tabela, COUNT(*) as total FROM public.financial_transactions WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT 'PRODUCTS' as tabela, COUNT(*) as total FROM public.products WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT 'SALES' as tabela, COUNT(*) as total FROM public.sales WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT 'DELIVERIES' as tabela, COUNT(*) as total FROM public.deliveries WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

