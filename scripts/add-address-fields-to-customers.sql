-- Adicionar campos de endereço completo à tabela customers
-- Data: 2025-01-XX
-- Descrição: Adiciona campos de endereço (address, neighborhood, state, zipcode, notes) à tabela customers

-- Adicionar colunas se não existirem
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS state VARCHAR(2),
ADD COLUMN IF NOT EXISTS zipcode VARCHAR(10),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Comentários nas colunas para documentação
COMMENT ON COLUMN customers.address IS 'Endereço completo do cliente (rua, avenida, número)';
COMMENT ON COLUMN customers.neighborhood IS 'Bairro do cliente';
COMMENT ON COLUMN customers.state IS 'Estado (UF) do cliente (2 caracteres)';
COMMENT ON COLUMN customers.zipcode IS 'CEP do endereço do cliente';
COMMENT ON COLUMN customers.notes IS 'Observações adicionais sobre o cliente';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'customers'
AND column_name IN ('address', 'neighborhood', 'state', 'zipcode', 'notes')
ORDER BY column_name;
