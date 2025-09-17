-- Unicidade por usuário do documento (CPF/CNPJ) para clientes e fornecedores
-- Observação: a criação pode falhar se já houver duplicados; limpe os dados antes.

-- Clientes: (user_id, document) único quando document não é nulo
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_user_document
ON customers (user_id, document)
WHERE document IS NOT NULL;

-- Fornecedores: (user_id, document) único quando document não é nulo
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_user_document
ON suppliers (user_id, document)
WHERE document IS NOT NULL;

-- Migração: adicionar colunas extras à tabela products para gestão avançada
-- Data: 2025-09-17

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS internal_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS product_group VARCHAR(100),
  ADD COLUMN IF NOT EXISTS has_variations BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS fiscal_note VARCHAR(100),
  ADD COLUMN IF NOT EXISTS unit_conversion VARCHAR(100),
  ADD COLUMN IF NOT EXISTS moves_stock BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS width_cm NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS length_cm NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(10,3);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_products_internal_code ON products(internal_code);
CREATE INDEX IF NOT EXISTS idx_products_group ON products(product_group);


