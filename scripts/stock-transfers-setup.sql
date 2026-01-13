-- Transferências de Estoque entre Filiais - Setup
-- Objetivo:
-- 1) Criar tabelas stock_transfers e stock_transfer_items
-- 2) Permitir fluxo: draft -> sent -> received (ou cancelled)
-- 3) Referenciar tenant, filial origem/destino, usuário e timestamps

-- Pré-requisito: branches-setup.sql e branch-stock-setup.sql executados

create table if not exists public.stock_transfers (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  from_branch_id bigint not null references public.branches(id) on delete restrict,
  to_branch_id bigint not null references public.branches(id) on delete restrict,
  status text not null default 'draft', -- draft | sent | received | cancelled
  requested_by uuid null,
  sent_by uuid null,
  received_by uuid null,
  notes text null,
  sent_at timestamptz null,
  received_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stock_transfers_tenant_status
  on public.stock_transfers(tenant_id, status, created_at desc);
create index if not exists idx_stock_transfers_tenant_from
  on public.stock_transfers(tenant_id, from_branch_id, created_at desc);
create index if not exists idx_stock_transfers_tenant_to
  on public.stock_transfers(tenant_id, to_branch_id, created_at desc);

create table if not exists public.stock_transfer_items (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  transfer_id bigint not null references public.stock_transfers(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete restrict,
  quantity integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_transfer_items_transfer
  on public.stock_transfer_items(transfer_id);
create unique index if not exists idx_stock_transfer_items_unique
  on public.stock_transfer_items(transfer_id, product_id);

