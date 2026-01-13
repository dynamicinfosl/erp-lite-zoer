-- Adicionar campo created_at_branch_id à tabela customers
-- Objetivo: identificar onde o cliente foi cadastrado (matriz ou filial)
-- Se null, foi cadastrado na matriz; se tem valor, foi cadastrado naquela filial

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS created_at_branch_id bigint null references public.branches(id);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_customers_created_at_branch 
ON public.customers(created_at_branch_id) 
WHERE created_at_branch_id IS NOT NULL;

-- Comentário na coluna
COMMENT ON COLUMN public.customers.created_at_branch_id IS 'ID da filial onde o cliente foi cadastrado. NULL = cadastrado na matriz';
