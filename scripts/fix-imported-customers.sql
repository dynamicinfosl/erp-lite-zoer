-- Script para diagnosticar e corrigir clientes importados que não aparecem na conta
-- Execute este script no Supabase SQL Editor

-- 1. Verificar quantos clientes existem por tenant_id
SELECT 
  tenant_id,
  COUNT(*) as total_clientes,
  COUNT(CASE WHEN created_at_branch_id IS NULL THEN 1 END) as clientes_matriz,
  COUNT(CASE WHEN created_at_branch_id IS NOT NULL THEN 1 END) as clientes_filiais,
  MIN(created_at) as primeiro_cadastro,
  MAX(created_at) as ultimo_cadastro
FROM customers
GROUP BY tenant_id
ORDER BY total_clientes DESC;

-- 2. Verificar clientes sem tenant_id (problema grave)
-- NOTA: tenant_id é do tipo UUID, então não pode ser string vazia (''), apenas NULL
SELECT 
  id,
  name,
  email,
  tenant_id,
  created_at_branch_id,
  created_at
FROM customers
WHERE tenant_id IS NULL
ORDER BY created_at DESC
LIMIT 100;

-- 3. Verificar clientes de um tenant específico (substitua 'SEU_TENANT_ID' pelo ID real)
-- Para encontrar seu tenant_id, execute: SELECT id, name FROM tenants;
/*
SELECT 
  id,
  name,
  email,
  tenant_id,
  created_at_branch_id,
  is_active,
  created_at
FROM customers
WHERE tenant_id = 'SEU_TENANT_ID'
ORDER BY created_at DESC;
*/

-- 4. Verificar clientes importados recentemente (últimas 24 horas)
SELECT 
  tenant_id,
  COUNT(*) as total_importados_hoje,
  COUNT(CASE WHEN created_at_branch_id IS NULL THEN 1 END) as na_matriz,
  COUNT(CASE WHEN created_at_branch_id IS NOT NULL THEN 1 END) as em_filiais
FROM customers
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY tenant_id;

-- 5. CORREÇÃO: Atualizar clientes sem tenant_id (CUIDADO: só execute se tiver certeza do tenant_id)
-- Descomente e ajuste o tenant_id antes de executar:
-- IMPORTANTE: tenant_id é UUID, então use o formato: '123e4567-e89b-12d3-a456-426614174000'::uuid
/*
UPDATE customers
SET tenant_id = 'SEU_TENANT_ID_AQUI'::uuid
WHERE tenant_id IS NULL
  AND created_at >= NOW() - INTERVAL '7 days'; -- Apenas clientes dos últimos 7 dias
*/

-- 6. CORREÇÃO: Garantir que clientes importados na matriz tenham created_at_branch_id = NULL
-- (Normalmente já deve estar assim, mas este comando garante)
/*
UPDATE customers
SET created_at_branch_id = NULL
WHERE tenant_id = 'SEU_TENANT_ID_AQUI'
  AND created_at_branch_id IS NOT NULL
  AND created_at >= NOW() - INTERVAL '7 days';
*/
