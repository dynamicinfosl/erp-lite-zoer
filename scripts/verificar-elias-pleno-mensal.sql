-- ==========================================
-- VERIFICAR SE ELIAS ESTÁ COM PLENO MENSAL VENCIDO
-- ==========================================

-- 1. BUSCAR USUÁRIO DO ELIAS
SELECT 
  id as user_id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email ILIKE '%elias%'
ORDER BY created_at DESC;

-- 2. BUSCAR TENANT(S) DO ELIAS E SUA SUBSCRIPTION
WITH user_info AS (
  SELECT id as user_id, email 
  FROM auth.users 
  WHERE email ILIKE '%elias%'
  LIMIT 1
)
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.status as tenant_status,
  t.email as tenant_email,
  t.created_at as tenant_created_at,
  -- Dados da Subscription
  s.id as subscription_id,
  s.status as subscription_status,
  s.plan_id,
  p.name as plan_name,
  p.slug as plan_slug,
  p.price_monthly,
  s.trial_end,
  t.trial_ends_at as tenant_trial_ends_at,
  s.current_period_start,
  s.current_period_end,
  s.created_at as subscription_created_at,
  s.updated_at as subscription_updated_at,
  -- Verificação de vencimento
  CASE 
    WHEN s.status = 'active' AND s.current_period_end IS NOT NULL AND s.current_period_end < NOW() 
      THEN '🔴 PLENO MENSAL VENCIDO'
    WHEN s.status = 'active' AND s.current_period_end IS NOT NULL AND s.current_period_end >= NOW() 
      THEN '✅ PLENO MENSAL VÁLIDO'
    WHEN s.status = 'trial' AND s.trial_end IS NOT NULL AND s.trial_end < NOW() 
      THEN '🔴 TRIAL EXPIRADO'
    WHEN s.status = 'trial' AND s.trial_end IS NOT NULL AND s.trial_end >= NOW() 
      THEN '✅ TRIAL ATIVO'
    WHEN s.status = 'suspended' 
      THEN '⚠️ SUSPENSO'
    WHEN s.status = 'cancelled' 
      THEN '❌ CANCELADO'
    WHEN s.id IS NULL 
      THEN '⚠️ SEM SUBSCRIPTION'
    ELSE '⚠️ STATUS DESCONHECIDO'
  END as status_plano,
  -- Dias restantes ou dias vencidos
  CASE 
    WHEN s.status = 'active' AND s.current_period_end IS NOT NULL THEN
      CASE 
        WHEN s.current_period_end < NOW() 
          THEN CONCAT('Vencido há ', EXTRACT(DAY FROM NOW() - s.current_period_end)::INTEGER, ' dias')
        ELSE CONCAT(EXTRACT(DAY FROM s.current_period_end - NOW())::INTEGER, ' dias restantes')
      END
    WHEN s.status = 'trial' AND s.trial_end IS NOT NULL THEN
      CASE 
        WHEN s.trial_end < NOW() 
          THEN CONCAT('Trial expirado há ', EXTRACT(DAY FROM NOW() - s.trial_end)::INTEGER, ' dias')
        ELSE CONCAT(EXTRACT(DAY FROM s.trial_end - NOW())::INTEGER, ' dias de trial restantes')
      END
    ELSE 'N/A'
  END as dias_info
FROM tenants t
JOIN user_memberships um ON um.tenant_id = t.id
JOIN user_info ui ON ui.user_id = um.user_id
LEFT JOIN subscriptions s ON s.tenant_id = t.id
LEFT JOIN plans p ON p.id = s.plan_id
ORDER BY t.created_at DESC;

-- 3. RESUMO: ELIAS ESTÁ COM PLENO MENSAL VENCIDO?
WITH user_info AS (
  SELECT id as user_id, email 
  FROM auth.users 
  WHERE email ILIKE '%elias%'
  LIMIT 1
),
tenant_subscription AS (
  SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    s.status as subscription_status,
    s.current_period_end,
    s.trial_end,
    p.name as plan_name
  FROM tenants t
  JOIN user_memberships um ON um.tenant_id = t.id
  JOIN user_info ui ON ui.user_id = um.user_id
  LEFT JOIN subscriptions s ON s.tenant_id = t.id
  LEFT JOIN plans p ON p.id = s.plan_id
)
SELECT 
  tenant_name,
  plan_name,
  subscription_status,
  current_period_end,
  CASE 
    WHEN subscription_status = 'active' AND current_period_end IS NOT NULL AND current_period_end < NOW() 
      THEN 'SIM - PLENO MENSAL VENCIDO ❌'
    WHEN subscription_status = 'active' AND current_period_end IS NOT NULL AND current_period_end >= NOW() 
      THEN 'NÃO - PLENO MENSAL VÁLIDO ✅'
    WHEN subscription_status = 'trial' AND trial_end IS NOT NULL AND trial_end < NOW() 
      THEN 'SIM - TRIAL EXPIRADO ❌'
    ELSE 'NÃO - STATUS DIFERENTE ⚠️'
  END as pleno_mensal_vencido
FROM tenant_subscription;

