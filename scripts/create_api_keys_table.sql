-- Tabela de API Keys para acesso externo
-- Execute no Supabase SQL Editor

-- Extensão para UUID se necessário
create extension if not exists pgcrypto;

-- Tabela de API Keys
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  key_hash text not null unique,  -- Hash da chave (nunca armazenar a chave em texto)
  name text not null,              -- Nome descritivo (ex: "Integração WooCommerce")
  permissions jsonb default '[]'::jsonb,  -- Array de permissões
  is_active boolean not null default true,
  expires_at timestamptz,          -- Data de expiração (nullable = nunca expira)
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para performance
create index if not exists idx_api_keys_tenant on public.api_keys(tenant_id);
create index if not exists idx_api_keys_hash on public.api_keys(key_hash);
create index if not exists idx_api_keys_active on public.api_keys(is_active);
create index if not exists idx_api_keys_tenant_active on public.api_keys(tenant_id, is_active);

-- Comentários para documentação
comment on table public.api_keys is 'Chaves de API para acesso externo ao sistema';
comment on column public.api_keys.key_hash is 'Hash SHA-256 da chave de API (nunca armazenar a chave em texto plano)';
comment on column public.api_keys.name is 'Nome descritivo da chave para identificação';
comment on column public.api_keys.permissions is 'Array JSON de permissões (ex: ["sales:create", "customers:read"])';
comment on column public.api_keys.expires_at is 'Data de expiração da chave (NULL = nunca expira)';
