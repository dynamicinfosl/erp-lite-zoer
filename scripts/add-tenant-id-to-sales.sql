-- =============================================
-- ADICIONAR CAMPO TENANT_ID À TABELA SALES
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Verificar se a coluna já existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'tenant_id'
    ) THEN
        -- 2. Adicionar coluna tenant_id
        ALTER TABLE public.sales 
        ADD COLUMN tenant_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
        
        -- 3. Adicionar foreign key constraint
        ALTER TABLE public.sales 
        ADD CONSTRAINT fk_sales_tenant 
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
        
        -- 4. Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_sales_tenant_id 
        ON public.sales(tenant_id);
        
        RAISE NOTICE 'Coluna tenant_id adicionada à tabela sales com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna tenant_id já existe na tabela sales.';
    END IF;
END $$;

-- 5. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales'
ORDER BY ordinal_position;

-- 6. Verificar se há dados na tabela
SELECT COUNT(*) as total_sales FROM public.sales;

