-- =============================================
-- ADICIONAR tenant_id À TABELA deliveries
-- =============================================
-- Este script adiciona a coluna tenant_id à tabela deliveries
-- para permitir multi-tenancy nas entregas
--
-- Execute no Supabase SQL Editor.

-- Adicionar coluna tenant_id se não existir
ALTER TABLE IF EXISTS public.deliveries
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Criar índice para melhorar performance de consultas por tenant
CREATE INDEX IF NOT EXISTS idx_deliveries_tenant 
  ON public.deliveries(tenant_id);

-- Comentário na coluna para documentação
COMMENT ON COLUMN public.deliveries.tenant_id IS 'ID do tenant (empresa) que possui esta entrega';

-- Verificar se a coluna foi adicionada
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'deliveries' 
  AND column_name = 'tenant_id';

-- IMPORTANTE: Após executar este script, o cache do PostgREST pode levar alguns minutos para atualizar
-- Se ainda houver erro "Could not find the 'tenant_id' column", tente:
-- 1. Aguardar 2-5 minutos para o cache atualizar automaticamente
-- 2. Recriar o índice (força atualização do cache):
DROP INDEX IF EXISTS idx_deliveries_tenant;
CREATE INDEX idx_deliveries_tenant ON public.deliveries(tenant_id);

-- 3. Verificar se a coluna está realmente presente:
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'deliveries'
ORDER BY ordinal_position;
