-- ==========================================
-- CORREÇÃO: Consolidar Tenants Duplicados
-- ==========================================
-- ⚠️ ATENÇÃO: Execute este script APENAS após revisar os resultados do diagnóstico!
-- ⚠️ Substitua os IDs pelos valores reais encontrados no diagnóstico

-- CONFIGURAÇÃO
-- Substitua estes valores:
-- - USER_ID: ID do usuário (Elias)
-- - TENANT_CORRETO: ID do tenant que deve permanecer (7a56008e-0a31-4084-8c70-de7a5cdd083b)
-- - TENANT_DUPLICADO: ID do tenant que deve ser removido (e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8)

-- ==========================================
-- PASSO 1: Identificar qual tenant usar
-- ==========================================
-- Execute este SELECT primeiro para confirmar qual é o correto:
/*
SELECT 
  t.id,
  t.name,
  t.status,
  s.status as subscription_status,
  s.current_period_end,
  CASE 
    WHEN s.current_period_end > NOW() THEN '✅ VÁLIDO - USAR ESTE'
    ELSE '❌ EXPIRADO - REMOVER'
  END as recomendacao
FROM tenants t
LEFT JOIN subscriptions s ON s.tenant_id = t.id
WHERE t.id IN (
  '7a56008e-0a31-4084-8c70-de7a5cdd083b',  -- 83b
  'e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8'   -- bc8
);
*/

-- ==========================================
-- PASSO 2: Backup dos dados (IMPORTANTE!)
-- ==========================================
-- Criar tabela de backup antes de deletar
CREATE TABLE IF NOT EXISTS backup_tenants_deleted (
  id uuid,
  name text,
  status text,
  deleted_at timestamp DEFAULT NOW(),
  backup_data jsonb
);

-- ==========================================
-- PASSO 3: Mover/Deletar Subscription do Tenant Duplicado
-- ==========================================
-- Se o tenant duplicado (bc8) tem subscription, deletá-la:
/*
DELETE FROM subscriptions 
WHERE tenant_id = 'e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8';  -- bc8 (duplicado)
*/

-- ==========================================
-- PASSO 4: Atualizar User Memberships
-- ==========================================
-- Garantir que o usuário está vinculado apenas ao tenant correto
/*
-- Primeiro, desativar membership do tenant duplicado
UPDATE user_memberships
SET is_active = FALSE,
    updated_at = NOW()
WHERE tenant_id = 'e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8'  -- bc8 (duplicado)
  AND user_id = 'SEU_USER_ID_AQUI';

-- Garantir que o membership do tenant correto está ativo
UPDATE user_memberships
SET is_active = TRUE,
    updated_at = NOW()
WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'  -- 83b (correto)
  AND user_id = 'SEU_USER_ID_AQUI';
*/

-- ==========================================
-- PASSO 5: Desativar Tenant Duplicado
-- ==========================================
-- Mover tenant duplicado para backup antes de deletar
/*
INSERT INTO backup_tenants_deleted (id, name, status, backup_data)
SELECT 
  id,
  name,
  status,
  jsonb_build_object(
    'tenant', row_to_json(t.*),
    'deleted_reason', 'Tenant duplicado - mantido apenas ' || '7a56008e-0a31-4084-8c70-de7a5cdd083b'
  )
FROM tenants t
WHERE id = 'e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8';  -- bc8

-- Desativar o tenant duplicado
UPDATE tenants
SET status = 'cancelled',
    updated_at = NOW()
WHERE id = 'e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8';  -- bc8 (duplicado)

-- OU deletar completamente (use com cautela!):
-- DELETE FROM tenants WHERE id = 'e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8';
*/

-- ==========================================
-- PASSO 6: Garantir Subscription no Tenant Correto
-- ==========================================
-- Verificar se o tenant correto tem subscription ativa
/*
SELECT 
  s.id,
  s.tenant_id,
  s.status,
  s.current_period_end,
  p.name as plan_name
FROM subscriptions s
LEFT JOIN plans p ON p.id = s.plan_id
WHERE s.tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b';  -- 83b (correto)
*/

-- Se não tiver subscription, criar uma:
/*
INSERT INTO subscriptions (
  tenant_id,
  plan_id,
  status,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
)
SELECT 
  '7a56008e-0a31-4084-8c70-de7a5cdd083b',  -- tenant correto (83b)
  (SELECT id FROM plans WHERE slug = 'professional' LIMIT 1),  -- plano profissional
  'active',
  NOW(),
  '2026-02-06T23:59:59+00:00'::timestamp,  -- data de renovação
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions 
  WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
);
*/

-- ==========================================
-- PASSO 7: Verificação Final
-- ==========================================
-- Confirmar que tudo está correto:
/*
WITH user_info AS (
  SELECT id as user_id 
  FROM auth.users 
  WHERE email ILIKE '%elias%'
  LIMIT 1
)
SELECT 
  '✅ VERIFICAÇÃO FINAL' as status,
  t.id as tenant_id,
  t.name as tenant_name,
  t.status as tenant_status,
  um.is_active as membership_active,
  s.status as subscription_status,
  s.current_period_end,
  p.name as plan_name,
  CASE 
    WHEN s.current_period_end > NOW() THEN '✅ VÁLIDO'
    ELSE '❌ PROBLEMA'
  END as verificacao
FROM tenants t
JOIN user_memberships um ON um.tenant_id = t.id
JOIN user_info ui ON ui.user_id = um.user_id
LEFT JOIN subscriptions s ON s.tenant_id = t.id
LEFT JOIN plans p ON p.id = s.plan_id
WHERE um.is_active = TRUE
ORDER BY t.created_at DESC;
*/

