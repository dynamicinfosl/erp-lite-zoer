-- =============================================
-- JUGA - ENTREGAS / ROMANEIO (MANIFESTOS)
-- =============================================
-- Cria estrutura para:
-- - Entregadores (vinculados ao tenant)
-- - Entregas (por venda) agrupadas em um Romaneio/Manifesto
-- - Restrição: apenas 1 manifesto ABERTO por entregador
--
-- Execute no Supabase SQL Editor.

-- Extensão para UUID
create extension if not exists pgcrypto;

-- -------------------------------------------------
-- 1) Garantir coluna tenant_id em delivery_drivers
-- -------------------------------------------------
alter table if exists public.delivery_drivers
  add column if not exists tenant_id uuid;

-- Se a tabela ainda não existir em algum ambiente, crie uma versão mínima
create table if not exists public.delivery_drivers (
  id bigserial primary key,
  tenant_id uuid,
  name text not null,
  phone text not null,
  vehicle_type text not null,
  vehicle_plate text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_delivery_drivers_tenant on public.delivery_drivers(tenant_id);

-- -------------------------------------------------
-- 2) Manifestos (Romaneios)
-- -------------------------------------------------
create table if not exists public.delivery_manifests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  driver_id bigint not null references public.delivery_drivers(id),
  status text not null default 'aberta' check (status in ('aberta','finalizada','cancelada')),
  manifest_number text,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finalized_at timestamptz
);

create index if not exists idx_delivery_manifests_tenant on public.delivery_manifests(tenant_id);
create index if not exists idx_delivery_manifests_driver on public.delivery_manifests(driver_id);
create index if not exists idx_delivery_manifests_status on public.delivery_manifests(status);

-- Apenas 1 manifesto aberto por entregador
create unique index if not exists uniq_open_manifest_per_driver
  on public.delivery_manifests(tenant_id, driver_id)
  where status = 'aberta';

-- -------------------------------------------------
-- 3) Coluna manifest_id em deliveries (agrupamento)
-- -------------------------------------------------
alter table if exists public.deliveries
  add column if not exists manifest_id uuid references public.delivery_manifests(id);

create index if not exists idx_deliveries_manifest on public.deliveries(manifest_id);
create index if not exists idx_deliveries_driver on public.deliveries(driver_id);
create index if not exists idx_deliveries_status on public.deliveries(status);

-- -------------------------------------------------
-- 4) RLS (se estiver usando RLS)
-- -------------------------------------------------
-- Habilitar RLS
alter table public.delivery_drivers enable row level security;
alter table public.delivery_manifests enable row level security;

-- Políticas para delivery_drivers
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'delivery_drivers' and policyname = 'Users can view delivery_drivers from their tenant'
  ) then
    execute $pol$
      create policy "Users can view delivery_drivers from their tenant" on public.delivery_drivers
        for select using (
          tenant_id in (
            select tenant_id from public.user_memberships
            where user_id = auth.uid() and is_active = true
          )
        );
    $pol$;
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'delivery_drivers' and policyname = 'Users can insert delivery_drivers in their tenant'
  ) then
    execute $pol$
      create policy "Users can insert delivery_drivers in their tenant" on public.delivery_drivers
        for insert with check (
          tenant_id in (
            select tenant_id from public.user_memberships
            where user_id = auth.uid() and is_active = true
          )
        );
    $pol$;
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'delivery_drivers' and policyname = 'Users can update delivery_drivers from their tenant'
  ) then
    execute $pol$
      create policy "Users can update delivery_drivers from their tenant" on public.delivery_drivers
        for update using (
          tenant_id in (
            select tenant_id from public.user_memberships
            where user_id = auth.uid() and is_active = true
          )
        );
    $pol$;
  end if;
end $$;

-- Políticas para delivery_manifests
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'delivery_manifests' and policyname = 'Users can view delivery_manifests from their tenant'
  ) then
    execute $pol$
      create policy "Users can view delivery_manifests from their tenant" on public.delivery_manifests
        for select using (
          tenant_id in (
            select tenant_id from public.user_memberships
            where user_id = auth.uid() and is_active = true
          )
        );
    $pol$;
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'delivery_manifests' and policyname = 'Users can insert delivery_manifests in their tenant'
  ) then
    execute $pol$
      create policy "Users can insert delivery_manifests in their tenant" on public.delivery_manifests
        for insert with check (
          tenant_id in (
            select tenant_id from public.user_memberships
            where user_id = auth.uid() and is_active = true
          )
        );
    $pol$;
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'delivery_manifests' and policyname = 'Users can update delivery_manifests from their tenant'
  ) then
    execute $pol$
      create policy "Users can update delivery_manifests from their tenant" on public.delivery_manifests
        for update using (
          tenant_id in (
            select tenant_id from public.user_memberships
            where user_id = auth.uid() and is_active = true
          )
        );
    $pol$;
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'delivery_manifests' and policyname = 'Users can delete delivery_manifests from their tenant'
  ) then
    execute $pol$
      create policy "Users can delete delivery_manifests from their tenant" on public.delivery_manifests
        for delete using (
          tenant_id in (
            select tenant_id from public.user_memberships
            where user_id = auth.uid() and is_active = true
          )
        );
    $pol$;
  end if;
end $$;

