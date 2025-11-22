-- ============================================
-- VERIFICAR SUBSCRIPTIONS DOS TENANTS
-- ============================================
-- Este script verifica quais tenants têm subscription e quais não têm

-- 1. VERIFICAR TENANTS COM SUBSCRIPTION
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.status as tenant_status,
  t.trial_ends_at as tenant_trial_ends_at,
  s.id as subscription_id,
  s.status as subscription_status,
  s.plan_id,
  p.name as plan_name,
  s.trial_end as subscription_trial_end,
  s.current_period_start,
  s.current_period_end,
  CASE 
    WHEN s.status = 'active' AND s.current_period_end IS NOT NULL 
      THEN s.current_period_end > NOW()
    WHEN s.status = 'trial' AND s.trial_end IS NOT NULL
      THEN s.trial_end > NOW()
    ELSE false
  END as subscription_is_valid,
  s.created_at as subscription_created_at,
  s.updated_at as subscription_updated_at
FROM tenants t
INNER JOIN subscriptions s ON t.id = s.tenant_id
LEFT JOIN plans p ON s.plan_id = p.id
ORDER BY t.created_at DESC;

-- 2. VERIFICAR TENANTS SEM SUBSCRIPTION (PROBLEMA!)
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.status as tenant_status,
  t.trial_ends_at,
  t.created_at,
  CASE 
    WHEN t.trial_ends_at IS NOT NULL AND t.trial_ends_at < NOW()
      THEN 'EXPIRADO'
    WHEN t.trial_ends_at IS NOT NULL AND t.trial_ends_at >= NOW()
      THEN 'TRIAL ATIVO'
    ELSE 'SEM DATA DE TRIAL'
  END as status_trial
FROM tenants t
LEFT JOIN subscriptions s ON t.id = s.tenant_id
WHERE s.id IS NULL
ORDER BY t.created_at DESC;

-- 3. VERIFICAR SE EXISTEM PLANOS
SELECT 
  COUNT(*) as total_planos,
  COUNT(CASE WHEN is_active = true THEN 1 END) as planos_ativos
FROM plans;

-- 4. LISTAR PLANOS DISPONÍVEIS
SELECT 
  id,
  name,
  slug,
  price_monthly,
  is_active
FROM plans
WHERE is_active = true
ORDER BY price_monthly;

