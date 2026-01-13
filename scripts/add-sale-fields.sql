-- Adicionar campos necessários para vendas de produtos na tabela sales
-- Este script adiciona campos para diferenciar vendas de PDV/balcão das vendas de produtos
-- e campos adicionais para informações de entrega e pagamento

-- Verificar e adicionar campo sale_source se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sales' 
        AND column_name = 'sale_source'
    ) THEN
        ALTER TABLE sales ADD COLUMN sale_source VARCHAR(20);
        RAISE NOTICE 'Coluna sale_source adicionada à tabela sales';
    ELSE
        RAISE NOTICE 'Coluna sale_source já existe na tabela sales';
    END IF;
END $$;

-- Verificar e adicionar campo delivery_date se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sales' 
        AND column_name = 'delivery_date'
    ) THEN
        ALTER TABLE sales ADD COLUMN delivery_date DATE;
        RAISE NOTICE 'Coluna delivery_date adicionada à tabela sales';
    ELSE
        RAISE NOTICE 'Coluna delivery_date já existe na tabela sales';
    END IF;
END $$;

-- Verificar e adicionar campo carrier_name se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sales' 
        AND column_name = 'carrier_name'
    ) THEN
        ALTER TABLE sales ADD COLUMN carrier_name VARCHAR(255);
        RAISE NOTICE 'Coluna carrier_name adicionada à tabela sales';
    ELSE
        RAISE NOTICE 'Coluna carrier_name já existe na tabela sales';
    END IF;
END $$;

-- Verificar e adicionar campo payment_condition se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sales' 
        AND column_name = 'payment_condition'
    ) THEN
        ALTER TABLE sales ADD COLUMN payment_condition VARCHAR(100);
        RAISE NOTICE 'Coluna payment_condition adicionada à tabela sales';
    ELSE
        RAISE NOTICE 'Coluna payment_condition já existe na tabela sales';
    END IF;
END $$;

-- Verificar e adicionar campo delivery_address se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sales' 
        AND column_name = 'delivery_address'
    ) THEN
        ALTER TABLE sales ADD COLUMN delivery_address JSONB;
        RAISE NOTICE 'Coluna delivery_address adicionada à tabela sales';
    ELSE
        RAISE NOTICE 'Coluna delivery_address já existe na tabela sales';
    END IF;
END $$;

-- Atualizar vendas existentes do PDV para ter sale_source = 'pdv'
UPDATE sales 
SET sale_source = 'pdv'
WHERE sale_source IS NULL AND (sale_type = 'balcao' OR sale_type = 'entrega');

-- Criar índice para melhorar performance de consultas por sale_source
CREATE INDEX IF NOT EXISTS idx_sales_sale_source ON sales(sale_source);

-- Verificar resultado
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'sales'
AND column_name IN ('sale_source', 'delivery_date', 'carrier_name', 'payment_condition', 'delivery_address')
ORDER BY column_name;
