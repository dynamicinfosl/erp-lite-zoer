-- Script para adicionar novos campos à tabela tenants
-- Execute este script no Supabase SQL Editor

-- Adicionar campos de dados gerais da empresa
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'juridica';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS inscricao_estadual VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS inscricao_municipal VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cnae_principal VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS regime_tributario VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS regime_especial VARCHAR(50);

-- Adicionar campos de contato
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS celular VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS site TEXT;

-- Adicionar campos de endereço detalhado
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS numero VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);

-- Comentários descritivos para documentação
COMMENT ON COLUMN tenants.tipo IS 'Tipo de pessoa: juridica ou fisica';
COMMENT ON COLUMN tenants.nome_fantasia IS 'Nome fantasia da empresa';
COMMENT ON COLUMN tenants.razao_social IS 'Razão social da empresa';
COMMENT ON COLUMN tenants.inscricao_estadual IS 'Inscrição estadual';
COMMENT ON COLUMN tenants.inscricao_municipal IS 'Inscrição municipal';
COMMENT ON COLUMN tenants.cnae_principal IS 'CNAE principal da atividade';
COMMENT ON COLUMN tenants.regime_tributario IS 'Regime tributário (Simples/Presumido/Real)';
COMMENT ON COLUMN tenants.regime_especial IS 'Regime especial de tributação';
COMMENT ON COLUMN tenants.celular IS 'Telefone celular';
COMMENT ON COLUMN tenants.site IS 'Website da empresa';
COMMENT ON COLUMN tenants.numero IS 'Número do endereço';
COMMENT ON COLUMN tenants.complemento IS 'Complemento do endereço';
COMMENT ON COLUMN tenants.bairro IS 'Bairro';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Colunas adicionadas com sucesso à tabela tenants!';
END $$;

