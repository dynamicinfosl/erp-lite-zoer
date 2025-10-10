-- =============================================
-- VERIFICAR ESTRUTURA DA TABELA PRODUCTS
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- Verificar estrutura da tabela products
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'products'
ORDER BY ordinal_position;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_products FROM public.products;

