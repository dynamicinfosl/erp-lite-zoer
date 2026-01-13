-- Adicionar branch_id nas tabelas operacionais principais
-- Objetivo: permitir segmentar operações por filial.
-- Pré-requisito: branches-setup.sql executado (Matriz por tenant)

-- SALES
alter table public.sales
  add column if not exists branch_id bigint null references public.branches(id);
create index if not exists idx_sales_tenant_branch_created_at
  on public.sales(tenant_id, branch_id, created_at desc);

-- DELIVERIES
alter table public.deliveries
  add column if not exists branch_id bigint null references public.branches(id);
create index if not exists idx_deliveries_tenant_branch_created_at
  on public.deliveries(tenant_id, branch_id, created_at desc);

-- DELIVERY MANIFESTS
alter table public.delivery_manifests
  add column if not exists branch_id bigint null references public.branches(id);
create index if not exists idx_delivery_manifests_tenant_branch_created_at
  on public.delivery_manifests(tenant_id, branch_id, created_at desc);

-- BACKFILL branch_id = Matriz do tenant (para registros existentes)
update public.sales s
set branch_id = b.id
from public.branches b
where s.branch_id is null
  and s.tenant_id = b.tenant_id
  and b.is_headquarters = true;

update public.deliveries d
set branch_id = b.id
from public.branches b
where d.branch_id is null
  and d.tenant_id = b.tenant_id
  and b.is_headquarters = true;

update public.delivery_manifests m
set branch_id = b.id
from public.branches b
where m.branch_id is null
  and m.tenant_id = b.tenant_id
  and b.is_headquarters = true;

