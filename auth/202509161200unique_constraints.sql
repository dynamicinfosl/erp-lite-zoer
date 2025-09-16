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


