-- Feature Flags por Tenant (controlado pelo SuperAdmin)
-- Objetivo: permitir habilitar/desabilitar recursos extras por tenant
-- Ex.: {"branches": true}

create table if not exists public.tenant_feature_flags (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  features jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_tenant_feature_flags_updated_at
  on public.tenant_feature_flags(updated_at desc);

