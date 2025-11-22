-- ============================================
-- CRIAR SUBSCRIPTION PARA UM TENANT SEM PLANO
-- ============================================
-- Use este script se o tenant não tiver subscription

-- IMPORTANTE: Substitua os valores:
-- - 'TENANT_ID_AQUI' pelo ID do tenant
-- - 'PLAN_ID_AQUI' pelo ID do plano desejado
-- - '2025-12-31' pela data de expiração (formato: YYYY-MM-DD)

-- 1. Verificar se já existe subscription
SELECT * FROM subscriptions WHERE tenant_id = 'TENANT_ID_AQUI'; -- SUBSTITUA AQUI

-- 2. Criar subscription se não existir
INSERT INTO subscriptions (
  tenant_id,
  plan_id,
  status,
  current_period_start,
  current_period_end,
  trial_end,
  trial_ends_at,
  created_at,
  updated_at
)
SELECT 
  'TENANT_ID_AQUI'::uuid, -- SUBSTITUA AQUI
  'PLAN_ID_AQUI'::uuid, -- SUBSTITUA AQUI (ou use: (SELECT id FROM plans WHERE slug = 'basic' LIMIT 1))
  'active',
  NOW(),
  '2025-12-31T23:59:59'::timestamp, -- SUBSTITUA A DATA
  NULL,
  NULL,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE tenant_id = 'TENANT_ID_AQUI' -- SUBSTITUA AQUI
);

-- 3. Atualizar tenant
UPDATE tenants
SET 
  status = 'active',
  trial_ends_at = NULL,
  updated_at = NOW()
WHERE id = 'TENANT_ID_AQUI'; -- SUBSTITUA AQUI

-- 4. Verificar resultado
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.status as tenant_status,
  s.id as subscription_id,
  s.status as subscription_status,
  s.plan_id,
  p.name as plan_name,
  s.current_period_end,
  s.current_period_start
FROM tenants t
LEFT JOIN subscriptions s ON t.id = s.tenant_id
LEFT JOIN plans p ON s.plan_id = p.id
WHERE t.id = 'TENANT_ID_AQUI'; -- SUBSTITUA AQUI

