-- Adicionar colunas variant_id e price_type_id na tabela sale_items
-- Este script adiciona suporte para variações de produto e tipos de preço nas vendas

-- 1. Adicionar coluna variant_id (referência para product_variants)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sale_items' 
        AND column_name = 'variant_id'
    ) THEN
        ALTER TABLE sale_items ADD COLUMN variant_id INTEGER;
        RAISE NOTICE 'Coluna variant_id adicionada à tabela sale_items';
    ELSE
        RAISE NOTICE 'Coluna variant_id já existe na tabela sale_items';
    END IF;
END $$;

-- 2. Adicionar foreign key constraint para variant_id (se a tabela product_variants existir)
DO $$
BEGIN
    -- Verificar se a tabela product_variants existe
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'product_variants'
    ) THEN
        -- Verificar se a constraint já existe
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_name = 'sale_items' 
            AND constraint_name = 'fk_sale_items_variant'
        ) THEN
            ALTER TABLE sale_items 
            ADD CONSTRAINT fk_sale_items_variant 
            FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
            RAISE NOTICE 'Foreign key constraint fk_sale_items_variant adicionada';
        ELSE
            RAISE NOTICE 'Foreign key constraint fk_sale_items_variant já existe';
        END IF;
    ELSE
        RAISE NOTICE 'Tabela product_variants não encontrada, pulando foreign key constraint';
    END IF;
END $$;

-- 3. Adicionar coluna price_type_id (referência para price_types)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sale_items' 
        AND column_name = 'price_type_id'
    ) THEN
        ALTER TABLE sale_items ADD COLUMN price_type_id INTEGER;
        RAISE NOTICE 'Coluna price_type_id adicionada à tabela sale_items';
    ELSE
        RAISE NOTICE 'Coluna price_type_id já existe na tabela sale_items';
    END IF;
END $$;

-- 4. Adicionar foreign key constraint para price_type_id (se a tabela price_types existir)
DO $$
BEGIN
    -- Verificar se a tabela price_types existe
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'price_types'
    ) THEN
        -- Verificar se a constraint já existe
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_name = 'sale_items' 
            AND constraint_name = 'fk_sale_items_price_type'
        ) THEN
            ALTER TABLE sale_items 
            ADD CONSTRAINT fk_sale_items_price_type 
            FOREIGN KEY (price_type_id) REFERENCES price_types(id) ON DELETE SET NULL;
            RAISE NOTICE 'Foreign key constraint fk_sale_items_price_type adicionada';
        ELSE
            RAISE NOTICE 'Foreign key constraint fk_sale_items_price_type já existe';
        END IF;
    ELSE
        RAISE NOTICE 'Tabela price_types não encontrada, pulando foreign key constraint';
    END IF;
END $$;

-- 5. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_sale_items_variant_id ON sale_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_price_type_id ON sale_items(price_type_id);

-- 6. Verificar resultado
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sale_items' 
AND column_name IN ('variant_id', 'price_type_id')
ORDER BY column_name;
