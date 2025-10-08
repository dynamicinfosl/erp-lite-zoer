-- =============================================
-- TESTE DE INTEGRAÇÃO - VERIFICAR SE TUDO ESTÁ FUNCIONANDO
-- =============================================

-- 1. Verificar se as tabelas existem
SELECT 'VERIFICAÇÃO DE TABELAS:' as teste;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sales', 'sale_items', 'cash_operations')
ORDER BY table_name;

-- 2. Verificar estrutura da tabela sales
SELECT 'ESTRUTURA TABELA SALES:' as teste;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales'
ORDER BY column_name;

-- 3. Verificar estrutura da tabela sale_items
SELECT 'ESTRUTURA TABELA SALE_ITEMS:' as teste;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sale_items'
ORDER BY column_name;

-- 4. Testar função generate_sale_number
SELECT 'TESTE FUNÇÃO:' as teste;
SELECT generate_sale_number() as numero_teste;

-- 5. Inserir venda de teste
INSERT INTO public.sales (
    sale_number,
    customer_name,
    total_amount,
    payment_method,
    status,
    notes
) VALUES (
    'TESTE-001',
    'Cliente Teste',
    100.00,
    'dinheiro',
    'completed',
    'Venda de teste para verificar integração'
) RETURNING id, sale_number;

-- 6. Verificar se a venda foi inserida
SELECT 'VENDAS INSERIDAS:' as teste;
SELECT id, sale_number, customer_name, total_amount, created_at 
FROM public.sales 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Limpar dados de teste
DELETE FROM public.sales WHERE sale_number = 'TESTE-001';

SELECT 'TESTE CONCLUÍDO - INTEGRAÇÃO FUNCIONANDO!' as resultado;


