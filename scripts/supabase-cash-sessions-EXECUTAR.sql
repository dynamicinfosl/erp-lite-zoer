-- =============================================================================
-- SCRIPTS PARA EXECUTAR NO SUPABASE (SQL Editor)
-- Objetivo: deixar a tabela cash_sessions compatível com a API (coluna opening_amount)
-- Execute cada bloco no Supabase: SQL Editor → colar → Run
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PASSO 1 (opcional): Ver o que existe hoje
-- Rode isso e confira se a tabela cash_sessions existe e quais colunas tem.
-- -----------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cash_sessions'
ORDER BY ordinal_position;


-- -----------------------------------------------------------------------------
-- PASSO 2: Garantir a coluna opening_amount
-- Se a tabela JÁ EXISTE mas não tem opening_amount, este bloco adiciona.
-- Se a tabela NÃO EXISTE, este bloco não faz nada (aí você roda o PASSO 3).
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cash_sessions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'cash_sessions' AND column_name = 'opening_amount'
    ) THEN
      ALTER TABLE cash_sessions
      ADD COLUMN opening_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
      -- Se existir coluna initial_amount, copiar os valores para opening_amount
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'cash_sessions' AND column_name = 'initial_amount'
      ) THEN
        UPDATE cash_sessions SET opening_amount = initial_amount;
      END IF;
    END IF;
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- PASSO 2b: Garantir colunas de FECHAMENTO (closed_at, closed_by, status)
-- Necessário para o botão "Fechar caixa" e fechamento no PDV funcionarem.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cash_sessions') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cash_sessions' AND column_name = 'closed_at') THEN
      ALTER TABLE cash_sessions ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cash_sessions' AND column_name = 'closed_by') THEN
      ALTER TABLE cash_sessions ADD COLUMN closed_by VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cash_sessions' AND column_name = 'status') THEN
      ALTER TABLE cash_sessions ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'open';
    END IF;
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- PASSO 3: Só use se a tabela cash_sessions NÃO EXISTIR
-- (Se no PASSO 1 não retornou nenhuma linha, rode o script abaixo.)
-- Atenção: ele referencia a tabela "tenants". Se você não tiver essa tabela,
-- me avise que monto uma versão sem essa referência.
-- -----------------------------------------------------------------------------
-- CREATE TABLE IF NOT EXISTS cash_sessions (
--     id BIGSERIAL PRIMARY KEY,
--     tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
--     user_id UUID,
--     register_id VARCHAR(50) NOT NULL DEFAULT '1',
--     status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
--     opened_by VARCHAR(255),
--     opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     opening_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
--     closed_by VARCHAR(255),
--     closed_at TIMESTAMP WITH TIME ZONE,
--     notes TEXT,
--     created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX IF NOT EXISTS idx_cash_sessions_tenant_id ON cash_sessions(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(status);
-- CREATE INDEX IF NOT EXISTS idx_cash_sessions_opened_at ON cash_sessions(opened_at DESC);
