-- =============================================
-- ATUALIZAÇÃO DO SCHEMA PARA APROVAÇÃO DE CLIENTES
-- =============================================

-- Adicionar campos de aprovação na tabela tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Atualizar status para incluir pending_approval
ALTER TABLE public.tenants 
DROP CONSTRAINT IF EXISTS tenants_status_check;

ALTER TABLE public.tenants 
ADD CONSTRAINT tenants_status_check 
CHECK (status IN ('trial', 'active', 'suspended', 'cancelled', 'pending_approval'));

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tenants_approval_status ON public.tenants(approval_status);
CREATE INDEX IF NOT EXISTS idx_tenants_approved_at ON public.tenants(approved_at);
CREATE INDEX IF NOT EXISTS idx_tenants_rejected_at ON public.tenants(rejected_at);

-- Comentários para documentação
COMMENT ON COLUMN public.tenants.approval_status IS 'Status de aprovação do cliente: pending, approved, rejected';
COMMENT ON COLUMN public.tenants.approved_at IS 'Data e hora da aprovação';
COMMENT ON COLUMN public.tenants.rejected_at IS 'Data e hora da rejeição';
COMMENT ON COLUMN public.tenants.rejection_reason IS 'Motivo da rejeição';
COMMENT ON COLUMN public.tenants.approved_by IS 'ID do usuário que aprovou';

-- Atualizar clientes existentes para pending_approval se estiverem em trial
UPDATE public.tenants 
SET status = 'pending_approval', approval_status = 'pending'
WHERE status = 'trial' AND approval_status IS NULL;

-- Verificar se as alterações foram aplicadas
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tenants'
AND column_name IN ('approval_status', 'approved_at', 'rejected_at', 'rejection_reason', 'approved_by')
ORDER BY column_name;

-- Verificar constraint de status
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE table_name = 'tenants' 
AND constraint_name = 'tenants_status_check';
