-- Suporte a múltiplos valores de venda por produto (atacado, varejo, cartão, etc.)
-- Execute no Supabase SQL Editor.

-- 1) Tipos de preço (ex.: "Valor Varejo", "Valor atacado", "Valor Varejo Cartão")
create table if not exists public.product_price_types (
  id bigserial primary key,
  tenant_id uuid not null,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists product_price_types_tenant_slug_uidx
  on public.product_price_types (tenant_id, slug);

-- 2) Preços por produto e tipo
create table if not exists public.product_price_tiers (
  id bigserial primary key,
  tenant_id uuid not null,
  product_id bigint not null references public.products(id) on delete cascade,
  price_type_id bigint not null references public.product_price_types(id) on delete cascade,
  price numeric(12,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists product_price_tiers_tenant_product_type_uidx
  on public.product_price_tiers (tenant_id, product_id, price_type_id);

