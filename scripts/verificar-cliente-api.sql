-- Script para verificar cliente criado via API
-- Execute no Supabase SQL Editor para verificar se o cliente foi criado corretamente

-- 1) Verificar clientes criados recentemente (últimas 24 horas) na matriz
-- Esta query funciona sem precisar especificar tenant_id
SELECT 
  id,
  tenant_id,
  name,
  email,
  phone,
  created_at_branch_id,  -- Deve ser NULL para aparecer na matriz
  is_active,
  created_at
FROM customers
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND created_at_branch_id IS NULL  -- Clientes da matriz
ORDER BY created_at DESC
LIMIT 50;

-- 2) Verificar cliente específico por nome
-- (substitua 'Nome do Cliente' pelo nome do cliente que você criou)
SELECT 
  id,
  tenant_id,
  name,
  email,
  phone,
  created_at_branch_id,  -- Deve ser NULL para aparecer na matriz
  is_active,
  created_at
FROM customers
WHERE name ILIKE '%Nome do Cliente%'  -- Substitua pelo nome do cliente
ORDER BY created_at DESC
LIMIT 10;

-- 3) Verificar todos os clientes da matriz (created_at_branch_id IS NULL) de um tenant específico
-- ⚠️ Descomente e substitua 'seu-uuid-aqui' pelo tenant_id correto antes de executar
/*
SELECT 
  id,
  name,
  email,
  created_at_branch_id,
  created_at
FROM customers
WHERE tenant_id = 'seu-uuid-aqui'  -- ⚠️ Substitua pelo tenant_id real (formato UUID)
  AND created_at_branch_id IS NULL  -- Clientes da matriz
ORDER BY created_at DESC;
*/

-- 4) Contar clientes por tenant (últimos 7 dias)
SELECT 
  tenant_id,
  COUNT(*) as total_clientes,
  COUNT(*) FILTER (WHERE created_at_branch_id IS NULL) as clientes_matriz,
  COUNT(*) FILTER (WHERE created_at_branch_id IS NOT NULL) as clientes_filiais
FROM customers
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY tenant_id
ORDER BY total_clientes DESC;
