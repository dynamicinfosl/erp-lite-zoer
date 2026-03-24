-- Adicionar campos fiscais para NF-e (FocusNFe V2)
-- Data: 2025-01-XX

-- 1. Atualizar tabela de PRODUTOS
ALTER TABLE products
ADD COLUMN IF NOT EXISTS cest VARCHAR(7),
ADD COLUMN IF NOT EXISTS cfop_default VARCHAR(4),
ADD COLUMN IF NOT EXISTS tax_origem VARCHAR(1) DEFAULT '0', -- 0=Nacional, 1=Estrangeira imp. direta, etc.
ADD COLUMN IF NOT EXISTS tax_icms_cst VARCHAR(3),           -- CST ou CSOSN
ADD COLUMN IF NOT EXISTS tax_icms_aliquota DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS tax_pis_cst VARCHAR(2),
ADD COLUMN IF NOT EXISTS tax_pis_aliquota DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS tax_cofins_cst VARCHAR(2),
ADD COLUMN IF NOT EXISTS tax_cofins_aliquota DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS tax_ipi_cst VARCHAR(2),
ADD COLUMN IF NOT EXISTS tax_ipi_aliquota DECIMAL(5,2);

COMMENT ON COLUMN products.cest IS 'Código Especificador da Substituição Tributária';
COMMENT ON COLUMN products.cfop_default IS 'CFOP padrão para este produto';
COMMENT ON COLUMN products.tax_origem IS 'Origem da mercadoria (0 a 8)';

-- 2. Atualizar tabela de CLIENTES
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS address_number VARCHAR(10),
ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100),
ADD COLUMN IF NOT EXISTS state_registration VARCHAR(20); -- Inscrição Estadual (IE)

COMMENT ON COLUMN customers.address_number IS 'Número do endereço';
COMMENT ON COLUMN customers.address_complement IS 'Complemento do endereço';
COMMENT ON COLUMN customers.state_registration IS 'Inscrição Estadual do cliente';

-- 3. Verificar colunas adicionadas
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('products', 'customers')
AND column_name IN (
    'cest', 'cfop_default', 'tax_origem', 'tax_icms_cst', 
    'address_number', 'address_complement', 'state_registration'
)
ORDER BY table_name, column_name;
