-- ==========================================
-- CORREÇÃO ESPECÍFICA: Elias - Tenants Duplicados
-- ==========================================
-- Baseado nos IDs da imagem:
-- ✅ CORRETO: 7a56008e-0a31-4084-8c70-de7a5cdd083b (83b) - ATIVO
-- ❌ DUPLICADO: e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8 (bc8) - DESATIVADO

-- PASSO 1: Verificar situação atual
SELECT 
  '📊 SITUAÇÃO ATUAL' as info,
  t.id as tenant_id,
  t.name,
  t.status as tenant_status,
  um.is_active as membership_active,
  s.id as subscription_id,
  s.status as subscription_status,
  s.current_period_end,
  CASE 
    WHEN t.id = '7a56008e-0a31-4084-8c70-de7a5cdd083b' THEN '✅ CORRETO (83b)'
    WHEN t.id = 'e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8' THEN '❌ DUPLICADO (bc8)'
    ELSE '❓ OUTRO'
  END as identificacao
FROM tenants t
LEFT JOIN user_memberships um ON um.tenant_id = t.id
LEFT JOIN subscriptions s ON s.tenant_id = t.id
WHERE t.id IN (
  '7a56008e-0a31-4084-8c70-de7a5cdd083b',  -- 83b (correto)
  'e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8'   -- bc8 (duplicado)
)
ORDER BY t.created_at;

-- PASSO 2: Desativar membership do tenant duplicado (bc8)
UPDATE user_memberships
SET 
  is_active = FALSE,
  updated_at = NOW()
WHERE tenant_id = 'e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8'  -- bc8 (duplicado)
  AND is_active = TRUE;

-- Verificar quantos foram desativados
SELECT 
  '✅ MEMBERSHIPS DESATIVADOS' as info,
  COUNT(*) as total
FROM user_memberships
WHERE tenant_id = 'e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8'
  AND is_active = FALSE;

-- PASSO 3: Garantir que o membership do tenant correto está ativo (83b)
UPDATE user_memberships
SET 
  is_active = TRUE,
  updated_at = NOW()
WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'  -- 83b (correto)
  AND user_id IN (
    SELECT user_id 
    FROM user_memberships 
    WHERE tenant_id = 'e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8'
  );

-- Verificar
SELECT 
  '✅ MEMBERSHIP CORRETO ATIVADO' as info,
  COUNT(*) as total
FROM user_memberships
WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
  AND is_active = TRUE;

-- PASSO 4: Deletar subscription do tenant duplicado (bc8) se ainda existir
DELETE FROM subscriptions
WHERE tenant_id = 'e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8';  -- bc8 (duplicado)

SELECT 
  '✅ SUBSCRIPTION DUPLICADA DELETADA' as info;

-- PASSO 5: Garantir que o tenant correto tem subscription válida (83b)
-- Verificar subscription atual
SELECT 
  '📋 SUBSCRIPTION DO TENANT CORRETO' as info,
  s.id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.trial_end,
  p.name as plan_name,
  CASE 
    WHEN s.current_period_end > NOW() THEN '✅ VÁLIDO'
    WHEN s.trial_end > NOW() THEN '✅ TRIAL VÁLIDO'
    ELSE '❌ EXPIRADO'
  END as status_verificacao
FROM subscriptions s
LEFT JOIN plans p ON p.id = s.plan_id
WHERE s.tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b';  -- 83b (correto)

-- Se não existir ou estiver expirada, criar/atualizar:
-- OPÇÃO A: Atualizar subscription existente
UPDATE subscriptions
SET 
  status = 'active',
  current_period_start = NOW(),
  current_period_end = '2026-02-06T23:59:59+00:00'::timestamp,
  trial_end = NULL,
  updated_at = NOW(),
  plan_id = (SELECT id FROM plans WHERE slug = 'professional' LIMIT 1)
WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b';  -- 83b (correto)

-- OPÇÃO B: Se não existir, criar nova subscription
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
  '7a56008e-0a31-4084-8c70-de7a5cdd083b',  -- 83b (correto)
  (SELECT id FROM plans WHERE slug = 'professional' LIMIT 1),
  'active',
  NOW(),
  '2026-02-06T23:59:59+00:00'::timestamp,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions 
  WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
);

-- PASSO 6: Desativar tenant duplicado (bc8)
UPDATE tenants
SET 
  status = 'cancelled',
  updated_at = NOW()
WHERE id = 'e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8';  -- bc8 (duplicado)

SELECT 
  '✅ TENANT DUPLICADO DESATIVADO' as info;

-- PASSO 7: VERIFICAÇÃO FINAL
SELECT 
  '✅ VERIFICAÇÃO FINAL' as tipo,
  t.id as tenant_id,
  t.name,
  t.status as tenant_status,
  um.is_active as membership_active,
  s.status as subscription_status,
  s.current_period_end,
  p.name as plan_name,
  CASE 
    WHEN t.id = '7a56008e-0a31-4084-8c70-de7a5cdd083b' THEN '✅ ESTE DEVE ESTAR ATIVO'
    WHEN t.id = 'e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8' THEN '❌ ESTE DEVE ESTAR DESATIVADO'
    ELSE '❓ OUTRO'
  END as esperado,
  CASE 
    WHEN s.current_period_end > NOW() THEN '✅ VÁLIDO'
    WHEN s.trial_end > NOW() THEN '✅ TRIAL VÁLIDO'  
    WHEN s.current_period_end IS NULL THEN '⚠️ SEM SUBSCRIPTION'
    ELSE '❌ EXPIRADO'
  END as status_subscription
FROM tenants t
LEFT JOIN user_memberships um ON um.tenant_id = t.id
LEFT JOIN subscriptions s ON s.tenant_id = t.id
LEFT JOIN plans p ON p.id = s.plan_id
WHERE t.id IN (
  '7a56008e-0a31-4084-8c70-de7a5cdd083b',  -- 83b (correto)
  'e1e4d6d0-a1f6-4e77-89cc-04fa5b26ebc8'   -- bc8 (duplicado)
)
ORDER BY t.created_at;

-- RESUMO ESPERADO:
-- ✅ Tenant 83b: status='active', membership_active=TRUE, subscription válida até 06/02/2026
-- ❌ Tenant bc8: status='cancelled', membership_active=FALSE, sem subscription

