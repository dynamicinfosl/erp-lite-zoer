-- ============================================
-- CORRIGIR SUBSCRIPTION DE UM TENANT ESPECÍFICO
-- ============================================
-- IMPORTANTE: Substitua 'TENANT_ID_AQUI' pelo ID real do tenant que precisa ser corrigido

-- 1. PRIMEIRO: Verificar o estado atual
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.status as tenant_status,
  s.id as subscription_id,
  s.status as subscription_status,
  s.plan_id,
  p.name as plan_name,
  s.current_period_end,
  s.trial_end,
  s.trial_ends_at
FROM tenants t
LEFT JOIN subscriptions s ON t.id = s.tenant_id
LEFT JOIN plans p ON s.plan_id = p.id
WHERE t.id = 'TENANT_ID_AQUI'; -- SUBSTITUA AQUI

-- 2. CORRIGIR: Atualizar subscription para status 'active' com data futura
-- Substitua os valores abaixo:
-- - 'TENANT_ID_AQUI' pelo ID do tenant
-- - 'PLAN_ID_AQUI' pelo ID do plano (ou deixe NULL para manter o plano atual)
-- - '2025-12-31' pela data de expiração desejada (formato: YYYY-MM-DD)

UPDATE subscriptions
SET 
  status = 'active',
  current_period_start = NOW(),
  current_period_end = '2025-12-31T23:59:59'::timestamp, -- SUBSTITUA A DATA
  trial_end = NULL,
  trial_ends_at = NULL,
  updated_at = NOW()
WHERE tenant_id = 'TENANT_ID_AQUI'; -- SUBSTITUA AQUI

-- Se quiser atualizar o plan_id também:
-- UPDATE subscriptions
-- SET 
--   plan_id = 'PLAN_ID_AQUI', -- SUBSTITUA AQUI
--   status = 'active',
--   current_period_start = NOW(),
--   current_period_end = '2025-12-31T23:59:59'::timestamp,
--   trial_end = NULL,
--   trial_ends_at = NULL,
--   updated_at = NOW()
-- WHERE tenant_id = 'TENANT_ID_AQUI';

-- 3. Atualizar status do tenant também
UPDATE tenants
SET 
  status = 'active',
  trial_ends_at = NULL,
  updated_at = NOW()
WHERE id = 'TENANT_ID_AQUI'; -- SUBSTITUA AQUI

-- 4. VERIFICAR resultado
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.status as tenant_status,
  s.id as subscription_id,
  s.status as subscription_status,
  s.plan_id,
  p.name as plan_name,
  s.current_period_end,
  CASE 
    WHEN s.status = 'active' AND s.current_period_end IS NOT NULL 
      THEN s.current_period_end > NOW()
    ELSE false
  END as is_valid
FROM tenants t
LEFT JOIN subscriptions s ON t.id = s.tenant_id
LEFT JOIN plans p ON s.plan_id = p.id
WHERE t.id = 'TENANT_ID_AQUI'; -- SUBSTITUA AQUI

