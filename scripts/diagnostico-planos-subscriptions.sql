-- ============================================
-- SCRIPT DE DIAGNÓSTICO E CORREÇÃO
-- Planos e Subscriptions
-- ============================================

-- 1. VERIFICAR SE EXISTEM PLANOS NA TABELA
SELECT 
  id, 
  name, 
  slug, 
  price_monthly, 
  is_active,
  created_at
FROM plans
ORDER BY price_monthly;

-- Se não houver planos, você verá uma tabela vazia
-- Execute o script "criar-planos-basicos.sql" para criar planos

-- ============================================
-- 2. VERIFICAR STATUS DE RLS (Row Level Security)
-- ============================================

-- Verificar se RLS está habilitado na tabela plans
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'plans';

-- Verificar políticas RLS na tabela plans
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'plans';

-- Verificar RLS na tabela subscriptions
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'subscriptions';

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'subscriptions';

-- ============================================
-- 3. VERIFICAR SUBSCRIPTIONS DE TODOS OS TENANTS
-- ============================================

SELECT 
  s.id,
  s.tenant_id,
  t.name as tenant_name,
  s.plan_id,
  p.name as plan_name,
  s.status,
  s.trial_end,
  s.trial_ends_at,
  s.current_period_start,
  s.current_period_end,
  s.created_at,
  s.updated_at,
  CASE 
    WHEN s.status = 'active' AND s.current_period_end IS NOT NULL 
      THEN s.current_period_end > NOW()
    WHEN s.status = 'trial' AND (s.trial_end IS NOT NULL OR s.trial_ends_at IS NOT NULL)
      THEN COALESCE(s.trial_end, s.trial_ends_at) > NOW()
    ELSE false
  END as is_valid
FROM subscriptions s
LEFT JOIN tenants t ON s.tenant_id = t.id
LEFT JOIN plans p ON s.plan_id = p.id
ORDER BY s.updated_at DESC;

-- ============================================
-- 4. VERIFICAR TENANT ESPECÍFICO (SUBSTITUA O TENANT_ID)
-- ============================================

-- Substitua 'SEU_TENANT_ID_AQUI' pelo ID real do tenant
-- SELECT 
--   t.id as tenant_id,
--   t.name as tenant_name,
--   t.status as tenant_status,
--   t.trial_ends_at as tenant_trial_ends_at,
--   s.id as subscription_id,
--   s.status as subscription_status,
--   s.plan_id,
--   p.name as plan_name,
--   s.trial_end,
--   s.trial_ends_at,
--   s.current_period_start,
--   s.current_period_end,
--   CASE 
--     WHEN s.status = 'active' AND s.current_period_end IS NOT NULL 
--       THEN s.current_period_end > NOW()
--     WHEN s.status = 'trial' AND (s.trial_end IS NOT NULL OR s.trial_ends_at IS NOT NULL)
--       THEN COALESCE(s.trial_end, s.trial_ends_at) > NOW()
--     ELSE false
--   END as subscription_is_valid
-- FROM tenants t
-- LEFT JOIN subscriptions s ON t.id = s.tenant_id
-- LEFT JOIN plans p ON s.plan_id = p.id
-- WHERE t.id = 'SEU_TENANT_ID_AQUI';

-- ============================================
-- 5. LISTAR TENANTS SEM SUBSCRIPTION
-- ============================================

SELECT 
  t.id,
  t.name,
  t.status,
  t.trial_ends_at,
  t.created_at
FROM tenants t
LEFT JOIN subscriptions s ON t.id = s.tenant_id
WHERE s.id IS NULL;

