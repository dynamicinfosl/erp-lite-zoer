-- ============================================
-- ATIVAR PLANO PARA UM TENANT ESPECÍFICO
-- ============================================
-- IMPORTANTE: Substitua os valores antes de executar!

-- PASSO 1: Verificar o tenant e sua subscription atual
-- Substitua 'TENANT_ID_AQUI' pelo ID do tenant
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.status as tenant_status,
  t.trial_ends_at,
  s.id as subscription_id,
  s.status as subscription_status,
  s.plan_id,
  p.name as plan_name,
  s.current_period_end
FROM tenants t
LEFT JOIN subscriptions s ON t.id = s.tenant_id
LEFT JOIN plans p ON s.plan_id = p.id
WHERE t.id = 'TENANT_ID_AQUI'; -- SUBSTITUA AQUI

-- PASSO 2: Verificar planos disponíveis
SELECT id, name, slug FROM plans WHERE is_active = true ORDER BY price_monthly;

-- PASSO 3: Ativar/Atualizar subscription
-- Opção A: Se o tenant JÁ TEM subscription, apenas atualizar
UPDATE subscriptions
SET 
  status = 'active',
  current_period_start = NOW(),
  current_period_end = '2025-12-31T23:59:59'::timestamp, -- SUBSTITUA A DATA
  trial_end = NULL,
  updated_at = NOW()
WHERE tenant_id = 'TENANT_ID_AQUI'; -- SUBSTITUA AQUI

-- Opção B: Se o tenant NÃO TEM subscription, criar uma nova
-- Descomente e ajuste os valores:
-- INSERT INTO subscriptions (
--   tenant_id,
--   plan_id,
--   status,
--   current_period_start,
--   current_period_end,
--   trial_end,
--   created_at,
--   updated_at
-- )
-- VALUES (
--   'TENANT_ID_AQUI'::uuid, -- SUBSTITUA AQUI
--   (SELECT id FROM plans WHERE slug = 'basic' LIMIT 1), -- OU use um plan_id específico
--   'active',
--   NOW(),
--   '2025-12-31T23:59:59'::timestamp, -- SUBSTITUA A DATA
--   NULL,
--   NOW(),
--   NOW()
-- );

-- PASSO 4: Atualizar status do tenant
UPDATE tenants
SET 
  status = 'active',
  trial_ends_at = NULL,
  updated_at = NOW()
WHERE id = 'TENANT_ID_AQUI'; -- SUBSTITUA AQUI

-- PASSO 5: Verificar resultado final
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

