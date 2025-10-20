-- Create tenants table
-- Data: 2025-01-20
-- Description: Tabela para armazenar dados das empresas/tenants

CREATE TABLE IF NOT EXISTS ${schema}.tenants (
    id VARCHAR(255) PRIMARY KEY, -- UUID do tenant
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'trial',
    
    -- Dados gerais da empresa
    tipo VARCHAR(20) DEFAULT 'juridica', -- juridica ou fisica
    document VARCHAR(20), -- CNPJ ou CPF
    nome_fantasia VARCHAR(255),
    razao_social VARCHAR(255),
    inscricao_estadual VARCHAR(50),
    inscricao_municipal VARCHAR(50),
    cnae_principal VARCHAR(20),
    regime_tributario VARCHAR(50),
    regime_especial VARCHAR(50),
    
    -- Contato
    email VARCHAR(255),
    phone VARCHAR(20),
    celular VARCHAR(20),
    site VARCHAR(255),
    
    -- Endereço
    zip_code VARCHAR(10),
    address VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(255),
    bairro VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(50),
    
    -- Controle
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON ${schema}.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON ${schema}.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_document ON ${schema}.tenants(document) WHERE document IS NOT NULL;

-- Enable RLS
ALTER TABLE ${schema}.tenants ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenants
-- Users can access their own tenant
CREATE POLICY "Users can access own tenant" ON ${schema}.tenants
    FOR ALL USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create update trigger
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON ${schema}.tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to schema_user
GRANT SELECT, INSERT, UPDATE, DELETE ON ${schema}.tenants TO ${schema_user};

-- Grant permissions to schema_admin_user
GRANT SELECT, INSERT, UPDATE, DELETE ON ${schema}.tenants TO ${schema_admin_user};
