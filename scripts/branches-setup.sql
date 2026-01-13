-- Filiais (Branches) - Setup inicial
-- Objetivo:
-- 1) Criar tabela branches (filiais) por tenant
-- 2) Criar tabela user_branch_memberships (usuário pode acessar várias filiais)
-- 3) Criar automaticamente a filial "Matriz" (is_headquarters=true) para tenants existentes
-- 4) Indexes básicos

-- 1) Tabela de filiais
create table if not exists public.branches (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  code text null,
  is_headquarters boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_branches_tenant_id on public.branches(tenant_id);
create index if not exists idx_branches_tenant_active on public.branches(tenant_id, is_active);
create unique index if not exists idx_branches_tenant_code_unique
  on public.branches(tenant_id, code)
  where code is not null;

-- Garantir apenas 1 Matriz por tenant (unique parcial)
create unique index if not exists idx_branches_single_hq_per_tenant
  on public.branches(tenant_id)
  where is_headquarters = true;

-- 2) Tabela de membership por filial
create table if not exists public.user_branch_memberships (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id bigint not null references public.branches(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'operator', -- operator | manager | admin
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_branch_memberships_tenant on public.user_branch_memberships(tenant_id);
create index if not exists idx_user_branch_memberships_user on public.user_branch_memberships(user_id);
create unique index if not exists idx_user_branch_memberships_unique
  on public.user_branch_memberships(tenant_id, branch_id, user_id);

-- 3) Criar Matriz para tenants existentes que ainda não possuem
insert into public.branches (tenant_id, name, code, is_headquarters, is_active)
select t.id as tenant_id, 'Matriz' as name, 'MATRIZ' as code, true as is_headquarters, true as is_active
from public.tenants t
where not exists (
  select 1 from public.branches b where b.tenant_id = t.id and b.is_headquarters = true
);

-- 4) (Opcional) Atualização automática do updated_at (sem triggers aqui para manter simples)

