-- =============================================
-- ADICIONAR PRODUTOS PARA TESTE DO PDV
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- Inserir produtos para teste do PDV
INSERT INTO public.products (
    tenant_id, user_id, name, description, category, brand, sale_price, created_at, updated_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Coca-Cola 350ml',
    'Refrigerante Coca-Cola lata 350ml',
    'Bebidas',
    'Coca-Cola',
    4.50,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Pepsi 2L',
    'Refrigerante Pepsi garrafa 2 litros',
    'Bebidas',
    'Pepsi',
    6.90,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Pão Francês',
    'Pão francês fresco',
    'Padaria',
    'Padaria Local',
    0.80,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Leite Integral 1L',
    'Leite integral longa vida 1 litro',
    'Laticínios',
    'Vigor',
    4.20,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Açúcar 1kg',
    'Açúcar cristal 1kg',
    'Açougue',
    'União',
    3.50,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Café Torrado 500g',
    'Café torrado e moído 500g',
    'Bebidas',
    'Melitta',
    8.90,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Arroz 5kg',
    'Arroz tipo 1 pacote 5kg',
    'Grãos',
    'Tio João',
    12.50,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Feijão 1kg',
    'Feijão carioca 1kg',
    'Grãos',
    'Camil',
    6.80,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Óleo de Soja 900ml',
    'Óleo de soja refinado 900ml',
    'Temperos',
    'Liza',
    4.90,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Macarrão 500g',
    'Macarrão espaguete 500g',
    'Massas',
    'Barilla',
    3.20,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Verificar produtos inseridos
SELECT 'PRODUTOS INSERIDOS' as info, COUNT(*) as total FROM public.products WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

-- Ver alguns produtos de exemplo
SELECT name, sale_price, category FROM public.products WHERE tenant_id = '11111111-1111-1111-1111-111111111111' LIMIT 5;

