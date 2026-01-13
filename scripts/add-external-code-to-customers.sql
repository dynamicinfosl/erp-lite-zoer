-- Adicionar campo external_code à tabela customers para vincular com importações
-- Data: 2025-01-XX
-- Descrição: Adiciona campo external_code para fazer match entre clientes e endereços importados

-- Adicionar coluna se não existir
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS external_code VARCHAR(100);

-- Criar índice para busca rápida por código externo
CREATE INDEX IF NOT EXISTS idx_customers_external_code ON customers(external_code);

-- Comentário na coluna
COMMENT ON COLUMN customers.external_code IS 'Código externo usado para vincular clientes com dados importados de sistemas legados';

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'customers'
AND column_name = 'external_code';
