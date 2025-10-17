-- Adicionar todas as colunas necessárias para dados da empresa
-- Data: 2025-10-16
-- Descrição: Adiciona campos completos de empresa para perfil e cupons fiscais

-- Adicionar colunas se não existirem
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS document TEXT;

-- Comentários nas colunas para documentação
COMMENT ON COLUMN tenants.address IS 'Endereço completo da empresa (rua, número, complemento)';
COMMENT ON COLUMN tenants.city IS 'Cidade onde a empresa está localizada';
COMMENT ON COLUMN tenants.state IS 'Estado (UF) onde a empresa está localizada';
COMMENT ON COLUMN tenants.zip_code IS 'CEP do endereço da empresa';
COMMENT ON COLUMN tenants.email IS 'E-mail de contato da empresa';
COMMENT ON COLUMN tenants.phone IS 'Telefone de contato da empresa';
COMMENT ON COLUMN tenants.document IS 'CNPJ ou CPF da empresa';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
AND column_name IN ('address', 'city', 'state', 'zip_code', 'email', 'phone', 'document')
ORDER BY column_name;

