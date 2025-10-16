-- =============================================
-- TESTE DE VALORES PARA SALE_TYPE
-- =============================================
-- Este script testa diferentes valores para sale_type
-- para descobrir quais são aceitos pela constraint

-- Verificar constraint atual da tabela sales
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.sales'::regclass 
AND conname LIKE '%sale_type%';

-- Verificar estrutura da coluna sale_type
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales' 
AND column_name = 'sale_type';

-- Testar inserção com diferentes valores
-- (Execute um por vez para ver qual funciona)

-- Teste 1: 'retail'
-- INSERT INTO public.sales (sale_type, sale_number, total_amount, payment_method) 
-- VALUES ('retail', 'TEST-001', 10.00, 'dinheiro');

-- Teste 2: 'pdv'
-- INSERT INTO public.sales (sale_type, sale_number, total_amount, payment_method) 
-- VALUES ('pdv', 'TEST-002', 10.00, 'dinheiro');

-- Teste 3: 'pos'
-- INSERT INTO public.sales (sale_type, sale_number, total_amount, payment_method) 
-- VALUES ('pos', 'TEST-003', 10.00, 'dinheiro');

-- Teste 4: 'cash'
-- INSERT INTO public.sales (sale_type, sale_number, total_amount, payment_method) 
-- VALUES ('cash', 'TEST-004', 10.00, 'dinheiro');

-- Teste 5: 'online'
-- INSERT INTO public.sales (sale_type, sale_number, total_amount, payment_method) 
-- VALUES ('online', 'TEST-005', 10.00, 'dinheiro');

-- Teste 6: 'store'
-- INSERT INTO public.sales (sale_type, sale_number, total_amount, payment_method) 
-- VALUES ('store', 'TEST-006', 10.00, 'dinheiro');

-- Teste 7: 'physical'
-- INSERT INTO public.sales (sale_type, sale_number, total_amount, payment_method) 
-- VALUES ('physical', 'TEST-007', 10.00, 'dinheiro');

-- Se nenhum funcionar, remover a constraint temporariamente:
-- ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_sale_type_check;

-- Ou alterar a coluna para aceitar NULL:
-- ALTER TABLE public.sales ALTER COLUMN sale_type DROP NOT NULL;



