-- Criar tabela para armazenar operações individuais de caixa (sangrias e reforços)
-- Execute este script no Supabase SQL Editor

-- Primeiro, garantir que cash_sessions tem tenant_id
DO $$
BEGIN
  -- Verificar se a coluna tenant_id existe em cash_sessions
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cash_sessions' 
    AND column_name = 'tenant_id'
  ) THEN
    -- Adicionar coluna tenant_id se não existir
    ALTER TABLE public.cash_sessions 
    ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Coluna tenant_id adicionada à tabela cash_sessions';
  ELSE
    RAISE NOTICE 'Coluna tenant_id já existe em cash_sessions';
  END IF;
END $$;

-- Criar tabela cash_operations
CREATE TABLE IF NOT EXISTS public.cash_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cash_session_id BIGINT NOT NULL REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  user_id UUID,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('sangria', 'reforco', 'abertura', 'fechamento')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cash_operations_tenant_session 
  ON public.cash_operations(tenant_id, cash_session_id);

CREATE INDEX IF NOT EXISTS idx_cash_operations_session 
  ON public.cash_operations(cash_session_id);

CREATE INDEX IF NOT EXISTS idx_cash_operations_created_at 
  ON public.cash_operations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cash_operations_type 
  ON public.cash_operations(operation_type);

-- RLS (Row Level Security)
ALTER TABLE public.cash_operations ENABLE ROW LEVEL SECURITY;

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

-- Comentários
COMMENT ON TABLE public.cash_operations IS 'Operações individuais de caixa (sangrias, reforços, abertura, fechamento)';
COMMENT ON COLUMN public.cash_operations.operation_type IS 'Tipo de operação: sangria, reforco, abertura, fechamento';
COMMENT ON COLUMN public.cash_operations.amount IS 'Valor da operação';
COMMENT ON COLUMN public.cash_operations.cash_session_id IS 'ID da sessão de caixa relacionada';
