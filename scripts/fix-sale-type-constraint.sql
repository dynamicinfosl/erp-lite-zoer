-- =============================================
-- CORREÇÃO DA CONSTRAINT SALE_TYPE
-- =============================================
-- Este script corrige o problema de constraint CHECK
-- na coluna sale_type da tabela sales

-- 1. Verificar constraint atual
SELECT 'VERIFICANDO CONSTRAINT ATUAL:' as status;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.sales'::regclass 
AND conname LIKE '%sale_type%';

-- 2. Remover constraint CHECK se existir
SELECT 'REMOVENDO CONSTRAINT CHECK...' as status;
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_sale_type_check;

-- 3. Alterar coluna para aceitar NULL se necessário
SELECT 'PERMITINDO NULL NA COLUNA...' as status;
ALTER TABLE public.sales ALTER COLUMN sale_type DROP NOT NULL;

-- 4. Adicionar constraint mais permissiva (opcional)
-- ALTER TABLE public.sales ADD CONSTRAINT sales_sale_type_check 
-- CHECK (sale_type IS NULL OR sale_type IN ('retail', 'online', 'wholesale', 'pdv', 'pos'));

-- 5. Verificar resultado
SELECT 'VERIFICANDO RESULTADO:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales' 
AND column_name = 'sale_type';

SELECT '✅ CONSTRAINT CORRIGIDA!' as resultado;



