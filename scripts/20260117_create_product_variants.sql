-- Suporte a variações de produtos (ex.: sabores, tamanhos) com o MESMO "Código/SKU" no sistema legado
-- Motivo: alguns XLSX vêm com códigos duplicados e nomes diferentes (ex.: "Convenção FD (LIMAO)", "Convenção FD (GUARANÁ)")
-- Execute no Supabase SQL Editor.

-- 1) Tabela de variações
create table if not exists public.product_variants (
  id bigserial primary key,
  tenant_id uuid not null,
  product_id bigint not null references public.products(id) on delete cascade,

  -- label: valor da variação (ex.: "LIMAO", "GUARANÁ", "UVA")
  label text not null,
  -- name: nome completo exibível (opcional), vindo do legado
  name text null,

  -- overrides/opcionais (para preservar dados do XLSX)
  barcode text null,
  unit text null,
  sale_price numeric(12,2) null,
  cost_price numeric(12,2) null,
  stock_quantity integer not null default 0,

  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Unicidade por produto + label (normalizado via slug)
-- Como não temos uma coluna slug aqui, usamos lower(label) como chave simples.
-- (Se quiser mais robusto no futuro: adicionar coluna slug e normalizar acentos.)
create unique index if not exists product_variants_tenant_product_label_uidx
  on public.product_variants (tenant_id, product_id, lower(label));

create index if not exists idx_product_variants_tenant on public.product_variants (tenant_id);
create index if not exists idx_product_variants_product on public.product_variants (product_id);

