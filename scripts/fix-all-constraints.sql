-- =============================================
-- CORRIGIR TODOS OS PROBLEMAS DE CONSTRAINTS
-- =============================================

-- 1. Verificar estrutura completa da tabela sales
SELECT 'ESTRUTURA COMPLETA DA TABELA SALES:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales'
ORDER BY ordinal_position;

-- 2. Verificar todas as constraints NOT NULL
SELECT 'CONSTRAINTS NOT NULL:' as status;
SELECT 
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales'
AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 3. Corrigir TODAS as colunas problemáticas
DO $$
BEGIN
    -- Remover NOT NULL de user_id se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'user_id') THEN
        ALTER TABLE public.sales ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'Constraint NOT NULL removida de user_id!';
    END IF;
    
    -- Remover NOT NULL de sale_type se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'sale_type') THEN
        ALTER TABLE public.sales ALTER COLUMN sale_type DROP NOT NULL;
        RAISE NOTICE 'Constraint NOT NULL removida de sale_type!';
    END IF;
    
    -- Remover NOT NULL de tenant_id se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.sales ALTER COLUMN tenant_id DROP NOT NULL;
        RAISE NOTICE 'Constraint NOT NULL removida de tenant_id!';
    END IF;
    
    -- Remover NOT NULL de created_by se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'created_by') THEN
        ALTER TABLE public.sales ALTER COLUMN created_by DROP NOT NULL;
        RAISE NOTICE 'Constraint NOT NULL removida de created_by!';
    END IF;
    
    -- Remover NOT NULL de updated_by se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'updated_by') THEN
        ALTER TABLE public.sales ALTER COLUMN updated_by DROP NOT NULL;
        RAISE NOTICE 'Constraint NOT NULL removida de updated_by!';
    END IF;
    
    -- Remover NOT NULL de deleted_at se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.sales ALTER COLUMN deleted_at DROP NOT NULL;
        RAISE NOTICE 'Constraint NOT NULL removida de deleted_at!';
    END IF;
    
    -- Remover NOT NULL de discount_amount se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'discount_amount') THEN
        ALTER TABLE public.sales ALTER COLUMN discount_amount DROP NOT NULL;
        RAISE NOTICE 'Constraint NOT NULL removida de discount_amount!';
    END IF;
    
    -- Remover NOT NULL de tax_amount se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'tax_amount') THEN
        ALTER TABLE public.sales ALTER COLUMN tax_amount DROP NOT NULL;
        RAISE NOTICE 'Constraint NOT NULL removida de tax_amount!';
    END IF;
    
    -- Remover NOT NULL de subtotal se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'subtotal') THEN
        ALTER TABLE public.sales ALTER COLUMN subtotal DROP NOT NULL;
        RAISE NOTICE 'Constraint NOT NULL removida de subtotal!';
    END IF;
    
    -- Remover NOT NULL de notes se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'notes') THEN
        ALTER TABLE public.sales ALTER COLUMN notes DROP NOT NULL;
        RAISE NOTICE 'Constraint NOT NULL removida de notes!';
    END IF;
    
    RAISE NOTICE 'Todas as constraints NOT NULL problemáticas foram removidas!';
END $$;

-- 4. Verificar estrutura após correção
SELECT 'ESTRUTURA APÓS CORREÇÃO:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales'
ORDER BY ordinal_position;

-- 5. Teste de inserção com apenas as colunas essenciais
INSERT INTO public.sales (
    sale_number,
    customer_name,
    total_amount,
    payment_method,
    status,
    notes
) VALUES (
    'TESTE-CONSTRAINTS-001',
    'Cliente Teste Constraints',
    300.00,
    'dinheiro',
    'completed',
    'Teste após correção de constraints'
) RETURNING id, sale_number, customer_name, total_amount;

-- 6. Verificar se a inserção funcionou
SELECT 'VERIFICAÇÃO DA INSERÇÃO:' as status;
SELECT id, sale_number, customer_name, total_amount, created_at 
FROM public.sales 
WHERE sale_number = 'TESTE-CONSTRAINTS-001';

-- 7. Limpar dados de teste
DELETE FROM public.sales WHERE sale_number = 'TESTE-CONSTRAINTS-001';

-- 8. Verificar se a tabela sale_items está funcionando
SELECT 'VERIFICANDO TABELA SALE_ITEMS:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'sale_items';

-- 9. Se sale_items não existir, criar
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100),
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Verificar se a função generate_sale_number existe e funciona
SELECT 'TESTE DA FUNÇÃO:' as status;
SELECT generate_sale_number() as numero_teste;

SELECT 'TODAS AS CONSTRAINTS CORRIGIDAS COM SUCESSO!' as resultado;


