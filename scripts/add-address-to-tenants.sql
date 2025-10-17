-- Adicionar coluna 'address' à tabela 'tenants'
-- Data: 2025-10-16
-- Descrição: Adiciona campo de endereço completo para os cupons fiscais

-- Adicionar a coluna address se ela não existir
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS address TEXT;

-- Comentário na coluna para documentação
COMMENT ON COLUMN tenants.address IS 'Endereço completo da empresa (rua, número, complemento)';

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
AND column_name = 'address';

