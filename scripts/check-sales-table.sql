-- Verificar estrutura da tabela sales
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales'
ORDER BY ordinal_position;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_sales FROM public.sales;

-- Verificar se há tenant_id na tabela sales
SELECT DISTINCT tenant_id FROM public.sales LIMIT 5;

