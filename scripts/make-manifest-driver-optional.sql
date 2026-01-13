-- Tornar driver_id opcional no delivery_manifests
-- Remover constraint de único romaneio aberto por entregador
-- Alterar numeração para sequencial simples

-- 1) Remover constraint de único romaneio aberto por entregador
drop index if exists public.uniq_open_manifest_per_driver;

-- 2) Tornar driver_id opcional (nullable)
alter table public.delivery_manifests
  alter column driver_id drop not null;

-- 3) Remover foreign key constraint se existir (vamos recriar como opcional)
alter table public.delivery_manifests
  drop constraint if exists delivery_manifests_driver_id_fkey;

-- Recriar foreign key como opcional
alter table public.delivery_manifests
  add constraint delivery_manifests_driver_id_fkey
  foreign key (driver_id) references public.delivery_drivers(id)
  on delete set null;

-- 4) Criar função para gerar número sequencial de entrega
create or replace function get_next_manifest_number(p_tenant_id uuid)
returns text as $$
declare
  v_count bigint;
begin
  select count(*) + 1 into v_count
  from public.delivery_manifests
  where tenant_id = p_tenant_id;
  
  return 'Entrega ' || v_count::text;
end;
$$ language plpgsql;
