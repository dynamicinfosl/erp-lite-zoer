-- Sistema de compartilhamento de cadastros entre Matriz e Filiais
-- Objetivo: Matriz cadastra clientes/produtos e pode compartilhar com filiais específicas
-- Filiais só veem os cadastros que foram compartilhados com elas

-- 1) Tabela de compartilhamento de clientes
create table if not exists public.branch_customers (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id bigint not null references public.branches(id) on delete cascade,
  customer_id bigint not null references public.customers(id) on delete cascade,
  shared_by uuid, -- user_id de quem compartilhou (opcional)
  shared_at timestamptz not null default now(),
  is_active boolean not null default true,
  unique(tenant_id, branch_id, customer_id)
);

create index if not exists idx_branch_customers_tenant on public.branch_customers(tenant_id);
create index if not exists idx_branch_customers_branch on public.branch_customers(branch_id);
create index if not exists idx_branch_customers_customer on public.branch_customers(customer_id);

-- 2) Tabela de compartilhamento de produtos
create table if not exists public.branch_products (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id bigint not null references public.branches(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  shared_by uuid, -- user_id de quem compartilhou (opcional)
  shared_at timestamptz not null default now(),
  is_active boolean not null default true,
  unique(tenant_id, branch_id, product_id)
);

create index if not exists idx_branch_products_tenant on public.branch_products(tenant_id);
create index if not exists idx_branch_products_branch on public.branch_products(branch_id);
create index if not exists idx_branch_products_product on public.branch_products(product_id);

-- 3) Backfill: Compartilhar todos os clientes/produtos existentes com a Matriz de cada tenant
-- (para não quebrar o sistema atual, onde tudo é visível)
insert into public.branch_customers (tenant_id, branch_id, customer_id, shared_at, is_active)
select 
  c.tenant_id,
  b.id as branch_id,
  c.id as customer_id,
  now() as shared_at,
  true as is_active
from public.customers c
inner join public.branches b on b.tenant_id = c.tenant_id and b.is_headquarters = true
where not exists (
  select 1 from public.branch_customers bc 
  where bc.tenant_id = c.tenant_id 
    and bc.branch_id = b.id 
    and bc.customer_id = c.id
)
on conflict do nothing;

insert into public.branch_products (tenant_id, branch_id, product_id, shared_at, is_active)
select 
  p.tenant_id,
  b.id as branch_id,
  p.id as product_id,
  now() as shared_at,
  true as is_active
from public.products p
inner join public.branches b on b.tenant_id = p.tenant_id and b.is_headquarters = true
where not exists (
  select 1 from public.branch_products bp 
  where bp.tenant_id = p.tenant_id 
    and bp.branch_id = b.id 
    and bp.product_id = p.id
)
on conflict do nothing;
