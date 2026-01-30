-- Criar tabela para armazenar operações individuais de caixa (sangrias e reforços)
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar se a tabela cash_sessions existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cash_sessions'
  ) THEN
    RAISE EXCEPTION 'Tabela cash_sessions não existe. Execute primeiro o script create-cash-sessions-table.sql';
  END IF;
END $$;

-- PASSO 2: Verificar tipo do ID em cash_sessions
DO $$
DECLARE
  id_type TEXT;
BEGIN
  SELECT data_type INTO id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'cash_sessions'
    AND column_name = 'id';
  
  IF id_type IS NULL THEN
    RAISE EXCEPTION 'Não foi possível determinar o tipo do ID em cash_sessions';
  END IF;
  
  RAISE NOTICE 'Tipo do ID em cash_sessions: %', id_type;
END $$;

-- PASSO 3: Adicionar tenant_id em cash_sessions se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cash_sessions' 
    AND column_name = 'tenant_id'
  ) THEN
    -- Adicionar coluna sem constraint primeiro
    ALTER TABLE public.cash_sessions 
    ADD COLUMN tenant_id UUID;
    
    RAISE NOTICE '✅ Coluna tenant_id adicionada à tabela cash_sessions';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna tenant_id já existe em cash_sessions';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Erro ao adicionar tenant_id: %', SQLERRM;
END $$;

-- PASSO 4: Adicionar foreign key constraint se não existir
DO $$
BEGIN
  -- Verificar se a constraint já existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'cash_sessions' 
    AND constraint_name = 'cash_sessions_tenant_id_fkey'
  ) THEN
    -- Verificar se a coluna existe antes de adicionar constraint
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'cash_sessions' 
      AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE public.cash_sessions 
      ADD CONSTRAINT cash_sessions_tenant_id_fkey 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
      
      RAISE NOTICE '✅ Constraint de foreign key adicionada para tenant_id';
    ELSE
      RAISE EXCEPTION 'Coluna tenant_id não existe em cash_sessions';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ Constraint de foreign key já existe para tenant_id';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Erro ao adicionar constraint: %', SQLERRM;
END $$;

-- PASSO 5: Remover tabela cash_operations se existir (para recriar limpa)
DROP TABLE IF EXISTS public.cash_operations CASCADE;

-- PASSO 6: Criar tabela cash_operations
-- IMPORTANTE: O tipo de cash_session_id deve corresponder ao tipo de cash_sessions.id
-- Se o erro anterior indicou UUID, vamos usar UUID; caso contrário, usar BIGINT
CREATE TABLE public.cash_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cash_session_id UUID NOT NULL REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  user_id UUID,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('sangria', 'reforco', 'abertura', 'fechamento')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PASSO 7: Criar índices para performance
CREATE INDEX idx_cash_operations_tenant_session 
  ON public.cash_operations(tenant_id, cash_session_id);

CREATE INDEX idx_cash_operations_session 
  ON public.cash_operations(cash_session_id);

CREATE INDEX idx_cash_operations_created_at 
  ON public.cash_operations(created_at DESC);

CREATE INDEX idx_cash_operations_type 
  ON public.cash_operations(operation_type);

-- PASSO 8: Habilitar RLS (Row Level Security)
ALTER TABLE public.cash_operations ENABLE ROW LEVEL SECURITY;

-- PASSO 9: Criar políticas RLS
-- Policy: Usuários podem ver operações de caixa do seu tenant
CREATE POLICY "Users can view cash operations for their tenant"
ON public.cash_operations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_memberships 
    WHERE tenant_id = cash_operations.tenant_id 
    AND user_id = auth.uid()
  )
);

-- Policy: Usuários podem criar operações de caixa para seu tenant
CREATE POLICY "Users can insert cash operations for their tenant"
ON public.cash_operations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_memberships 
    WHERE tenant_id = cash_operations.tenant_id 
    AND user_id = auth.uid()
  )
);

-- Policy: Usuários podem atualizar operações de caixa do seu tenant
CREATE POLICY "Users can update cash operations for their tenant"
ON public.cash_operations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_memberships 
    WHERE tenant_id = cash_operations.tenant_id 
    AND user_id = auth.uid()
  )
);

-- Policy: Usuários podem deletar operações de caixa do seu tenant
CREATE POLICY "Users can delete cash operations for their tenant"
ON public.cash_operations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_memberships 
    WHERE tenant_id = cash_operations.tenant_id 
    AND user_id = auth.uid()
  )
);

-- PASSO 10: Adicionar comentários
COMMENT ON TABLE public.cash_operations IS 'Operações individuais de caixa (sangrias, reforços, abertura, fechamento)';
COMMENT ON COLUMN public.cash_operations.operation_type IS 'Tipo de operação: sangria, reforco, abertura, fechamento';
COMMENT ON COLUMN public.cash_operations.amount IS 'Valor da operação';
COMMENT ON COLUMN public.cash_operations.cash_session_id IS 'ID da sessão de caixa relacionada';
