-- Adicionar coluna tenant_id na tabela sale_items
-- Este script adiciona a coluna tenant_id necessária para RLS

-- Verificar se a coluna já existe
DO $$ 
BEGIN
    -- Adicionar coluna tenant_id se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sale_items' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE sale_items ADD COLUMN tenant_id UUID;
        RAISE NOTICE 'Coluna tenant_id adicionada à tabela sale_items';
    ELSE
        RAISE NOTICE 'Coluna tenant_id já existe na tabela sale_items';
    END IF;
END $$;

-- Adicionar foreign key constraint para tenant_id
DO $$
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'sale_items' 
        AND constraint_name = 'fk_sale_items_tenant'
    ) THEN
        ALTER TABLE sale_items 
        ADD CONSTRAINT fk_sale_items_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        RAISE NOTICE 'Foreign key constraint fk_sale_items_tenant adicionada';
    ELSE
        RAISE NOTICE 'Foreign key constraint fk_sale_items_tenant já existe';
    END IF;
END $$;

-- Atualizar registros existentes com tenant_id baseado na venda
UPDATE sale_items 
SET tenant_id = (
    SELECT s.tenant_id 
    FROM sales s 
    WHERE s.id = sale_items.sale_id
)
WHERE tenant_id IS NULL;

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_sale_items_tenant_id ON sale_items(tenant_id);

-- Verificar resultado
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sale_items' 
AND column_name = 'tenant_id';
