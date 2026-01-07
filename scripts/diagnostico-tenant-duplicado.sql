-- ==========================================
-- DIAGNÓSTICO: Tenants Duplicados para Usuário
-- ==========================================

-- 1. BUSCAR USUÁRIO DO ELIAS
-- Substitua pelo email correto do Elias
SELECT 
  id as user_id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email ILIKE '%elias%'
ORDER BY created_at DESC;

-- 2. BUSCAR TODOS OS TENANTS VINCULADOS AO USUÁRIO
-- (Copie o user_id do resultado acima)
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
  t.created_at as tenant_created_at,
  um.user_id,
  um.role,
  um.is_active as membership_active,
  um.created_at as membership_created_at
FROM tenants t
JOIN user_memberships um ON um.tenant_id = t.id
JOIN user_info ui ON ui.user_id = um.user_id
ORDER BY t.created_at DESC;

-- 3. BUSCAR SUBSCRIPTIONS DE CADA TENANT
-- (Copie os tenant_ids do resultado acima)
WITH user_info AS (
  SELECT id as user_id, email 
  FROM auth.users 
  WHERE email ILIKE '%elias%'
  LIMIT 1
)
SELECT 
  s.id as subscription_id,
  s.tenant_id,
  t.name as tenant_name,
  s.status as subscription_status,
  s.plan_id,
  p.name as plan_name,
  s.current_period_start,
  s.current_period_end,
  s.trial_end,
  s.created_at as subscription_created_at,
  s.updated_at as subscription_updated_at,
  CASE 
    WHEN s.current_period_end IS NOT NULL AND s.current_period_end < NOW() THEN '🔴 EXPIRADO'
    WHEN s.current_period_end IS NOT NULL AND s.current_period_end > NOW() THEN '✅ VÁLIDO'
    WHEN s.trial_end IS NOT NULL AND s.trial_end < NOW() THEN '🔴 TRIAL EXPIRADO'
    WHEN s.trial_end IS NOT NULL AND s.trial_end > NOW() THEN '✅ TRIAL VÁLIDO'
    ELSE '⚠️ SEM DATA'
  END as status_atual
FROM subscriptions s
JOIN tenants t ON t.id = s.tenant_id
LEFT JOIN plans p ON p.id = s.plan_id
JOIN user_memberships um ON um.tenant_id = t.id
JOIN user_info ui ON ui.user_id = um.user_id
ORDER BY s.created_at DESC;

-- 4. VERIFICAR USER_PROFILES
WITH user_info AS (
  SELECT id as user_id, email 
  FROM auth.users 
  WHERE email ILIKE '%elias%'
  LIMIT 1
)
SELECT 
  up.id,
  up.user_id,
  up.name,
  ui.email,
  up.is_active,
  up.created_at,
  up.updated_at
FROM user_profiles up
JOIN user_info ui ON ui.user_id = up.user_id;

-- 5. RESUMO GERAL
WITH user_info AS (
  SELECT id as user_id, email 
  FROM auth.users 
  WHERE email ILIKE '%elias%'
  LIMIT 1
)
SELECT 
  '📊 RESUMO' as tipo,
  COUNT(DISTINCT t.id) as total_tenants,
  COUNT(DISTINCT s.id) as total_subscriptions,
  COUNT(DISTINCT um.id) as total_memberships
FROM tenants t
LEFT JOIN user_memberships um ON um.tenant_id = t.id AND um.user_id = (SELECT user_id FROM user_info)
LEFT JOIN subscriptions s ON s.tenant_id = t.id
WHERE um.user_id = (SELECT user_id FROM user_info);

