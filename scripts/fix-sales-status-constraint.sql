-- =============================================
-- CORREÇÃO DA CONSTRAINT SALES_STATUS
-- =============================================
-- Este script corrige o problema de constraint CHECK
-- na coluna status da tabela sales

-- 1. Verificar constraint atual
SELECT 'VERIFICANDO CONSTRAINT STATUS:' as status;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.sales'::regclass 
AND conname LIKE '%status%';

-- 2. Verificar estrutura da coluna status
SELECT 'VERIFICANDO COLUNA STATUS:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales' 
AND column_name = 'status';

-- 3. Remover constraint CHECK se existir
SELECT 'REMOVENDO CONSTRAINT CHECK...' as status;
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_status_check;

-- 4. Alterar coluna para aceitar NULL se necessário
SELECT 'PERMITINDO NULL NA COLUNA...' as status;
ALTER TABLE public.sales ALTER COLUMN status DROP NOT NULL;

-- 5. Adicionar constraint mais permissiva (opcional)
-- Valores comuns para status de venda:
-- ALTER TABLE public.sales ADD CONSTRAINT sales_status_check 
-- CHECK (status IS NULL OR status IN ('completed', 'pending', 'cancelled', 'refunded', 'paid', 'processing'));

-- 6. Verificar resultado
SELECT 'VERIFICANDO RESULTADO:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales' 
AND column_name = 'status';

SELECT '✅ CONSTRAINT STATUS CORRIGIDA!' as resultado;



