-- Adicionar campos faltantes na tabela 'sales' 
-- Data: 2024-03-24

-- 1. Adicionar novas colunas à tabela 'sales'
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS seller_name TEXT,
ADD COLUMN IF NOT EXISTS carrier_name TEXT,
ADD COLUMN IF NOT EXISTS sale_source TEXT DEFAULT 'produtos',
ADD COLUMN IF NOT EXISTS payment_condition TEXT, -- dinheiro_vista, parcelado, etc
ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_address JSONB,
ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- 2. Garantir que as colunas de auditoria existam
-- (Normalmente já existem, mas por precaução)
-- ALTER TABLE sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Comentários para documentação
COMMENT ON COLUMN sales.seller_name IS 'Nome do vendedor ou operador que realizou a venda';
COMMENT ON COLUMN sales.carrier_name IS 'Nome da transportadora para entrega';
COMMENT ON COLUMN sales.sale_source IS 'Origem da venda: produtos, servicos, etc';
COMMENT ON COLUMN sales.delivery_address IS 'Objeto JSON com dados completos de entrega';

-- 4. Verificar se as colunas foram criadas corretamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND column_name IN (
    'seller_name', 'carrier_name', 'sale_source', 
    'payment_condition', 'delivery_date', 'delivery_address'
);
