-- Adicionar coluna branch_id à tabela user_memberships
-- Esta coluna identifica se o usuário é admin de uma filial específica
-- Se NULL, o usuário é admin da matriz

-- Adicionar coluna branch_id (nullable)
alter table public.user_memberships
add column if not exists branch_id bigint null references public.branches(id) on delete set null;

-- Criar índice para melhor performance
create index if not exists idx_user_memberships_branch_id 
on public.user_memberships(branch_id) 
where branch_id is not null;

-- Comentário explicativo
comment on column public.user_memberships.branch_id is 
'Se NULL, usuário é admin da matriz. Se preenchido, usuário é admin da filial especificada.';
