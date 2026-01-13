-- Estoque por Filial - Setup
-- Objetivo:
-- 1) Criar tabela product_stocks (quantidade por produto e por filial)
-- 2) Adicionar colunas de referência em stock_movements (branch_id, reference_type/id)
-- 3) Backfill: copiar products.stock_quantity para a Matriz (branch HQ) em product_stocks

-- Pré-requisito: branches-setup.sql executado (para existir branches e a Matriz por tenant)

-- 1) Estoque por filial
create table if not exists public.product_stocks (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id bigint not null references public.branches(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  quantity integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_product_stocks_unique
  on public.product_stocks(tenant_id, branch_id, product_id);

create index if not exists idx_product_stocks_tenant_branch
  on public.product_stocks(tenant_id, branch_id);

-- 2) Evoluir stock_movements para suportar filial e referências
alter table public.stock_movements
  add column if not exists tenant_id uuid null,
  add column if not exists branch_id bigint null,
  add column if not exists reference_type text null,
  add column if not exists reference_id bigint null;

create index if not exists idx_stock_movements_tenant_branch
  on public.stock_movements(tenant_id, branch_id, created_at desc);

-- 3) Backfill tenant_id/branch_id em stock_movements existentes (best-effort)
-- tenant_id via products
update public.stock_movements sm
set tenant_id = p.tenant_id
from public.products p
where sm.tenant_id is null
  and sm.product_id = p.id;

-- branch_id = Matriz do tenant
update public.stock_movements sm
set branch_id = b.id
from public.branches b
where sm.branch_id is null
  and sm.tenant_id = b.tenant_id
  and b.is_headquarters = true;

-- 4) Backfill product_stocks com o estoque atual do produto na Matriz
insert into public.product_stocks (tenant_id, branch_id, product_id, quantity)
select
  p.tenant_id,
  b.id as branch_id,
  p.id as product_id,
  coalesce(p.stock_quantity, 0) as quantity
from public.products p
join public.branches b
  on b.tenant_id = p.tenant_id
 and b.is_headquarters = true
where not exists (
  select 1
  from public.product_stocks ps
  where ps.tenant_id = p.tenant_id
    and ps.branch_id = b.id
    and ps.product_id = p.id
);

-- Observação:
-- Por compatibilidade, NÃO removemos products.stock_quantity agora.
-- Em uma fase 2, podemos transformar products.stock_quantity em campo derivado/soma de filiais.

