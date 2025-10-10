-- =============================================
-- ADICIONAR MAIS DADOS FINANCEIROS PARA GRÁFICO
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- Inserir mais transações financeiras para melhorar o gráfico
INSERT INTO public.financial_transactions (
    user_id, tenant_id, transaction_type, category, description, 
    amount, payment_method, due_date, status, notes, created_at, updated_at
) VALUES 
-- Receitas dos últimos 7 dias
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'receita',
    'Vendas',
    'Venda produto eletrônico',
    450.00,
    'pix',
    CURRENT_DATE,
    'pago',
    'Venda realizada',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'receita',
    'Serviços',
    'Consultoria técnica',
    800.00,
    'transferencia',
    CURRENT_DATE,
    'pago',
    'Serviço prestado',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'receita',
    'Vendas',
    'Venda produto premium',
    1200.00,
    'cartao',
    CURRENT_DATE - INTERVAL '1 day',
    'pago',
    'Venda de produto premium',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'receita',
    'Vendas',
    'Venda produto básico',
    250.00,
    'dinheiro',
    CURRENT_DATE - INTERVAL '1 day',
    'pago',
    'Venda básica',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'receita',
    'Serviços',
    'Manutenção preventiva',
    350.00,
    'pix',
    CURRENT_DATE - INTERVAL '2 days',
    'pago',
    'Manutenção realizada',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'receita',
    'Vendas',
    'Venda produto especial',
    680.00,
    'cartao',
    CURRENT_DATE - INTERVAL '3 days',
    'pago',
    'Produto especial',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),

-- Despesas dos últimos 7 dias
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'despesa',
    'Operacional',
    'Aluguel do escritório',
    1200.00,
    'transferencia',
    CURRENT_DATE,
    'pago',
    'Aluguel mensal',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'despesa',
    'Marketing',
    'Google Ads',
    300.00,
    'cartao',
    CURRENT_DATE,
    'pago',
    'Campanha digital',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'despesa',
    'Operacional',
    'Energia elétrica',
    180.00,
    'boleto',
    CURRENT_DATE - INTERVAL '1 day',
    'pago',
    'Conta de luz',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'despesa',
    'Operacional',
    'Internet',
    120.00,
    'pix',
    CURRENT_DATE - INTERVAL '2 days',
    'pago',
    'Plano de internet',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'despesa',
    'Marketing',
    'Facebook Ads',
    250.00,
    'cartao',
    CURRENT_DATE - INTERVAL '3 days',
    'pago',
    'Campanha Facebook',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'despesa',
    'Operacional',
    'Material de escritório',
    95.00,
    'dinheiro',
    CURRENT_DATE - INTERVAL '4 days',
    'pago',
    'Compras diversas',
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '4 days'
);

-- Verificar dados inseridos
SELECT 'TOTAL TRANSACOES' as info, COUNT(*) as total FROM public.financial_transactions WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

-- Verificar distribuição por tipo
SELECT transaction_type, COUNT(*) as quantidade, SUM(amount) as total_valor 
FROM public.financial_transactions 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111' 
GROUP BY transaction_type;

-- Verificar distribuição por data
SELECT DATE(created_at) as data, 
       SUM(CASE WHEN transaction_type = 'receita' THEN amount ELSE 0 END) as receitas,
       SUM(CASE WHEN transaction_type = 'despesa' THEN amount ELSE 0 END) as despesas
FROM public.financial_transactions 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111' 
GROUP BY DATE(created_at)
ORDER BY data DESC;

