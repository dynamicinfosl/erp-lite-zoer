-- ============================================
-- VERIFICAR CONTA DE DESENVOLVIMENTO
-- ============================================

-- 1. Verificar usuário e tenant
SELECT 
  'Dados do Usuário' as tipo,
  u.id as user_id,
  u.email,
  u.created_at as cadastrado_em,
  um.role as papel,
  t.id as tenant_id,
  t.name as nome_empresa,
  t.status as status_tenant,
  t.trial_ends_at as trial_expira_em
FROM auth.users u
LEFT JOIN user_memberships um ON um.user_id = u.id
LEFT JOIN tenants t ON t.id = um.tenant_id
WHERE u.email = 'gabrieldesouza100@gmail.com';

-- 2. Verificar se tem subscription
SELECT 
  'Subscription' as tipo,
  s.id as subscription_id,
  s.status as status_subscription,
  s.trial_ends_at as trial_expira,
  p.id as plan_id,
  p.name as nome_plano,
  p.price as preco_plano
FROM subscriptions s
JOIN tenants t ON t.id = s.tenant_id
JOIN plans p ON p.id = s.plan_id
JOIN user_memberships um ON um.tenant_id = t.id
JOIN auth.users u ON u.id = um.user_id
WHERE u.email = 'gabrieldesouza100@gmail.com';

-- 3. Verificar planos disponíveis
SELECT 
  'Planos Disponíveis' as tipo,
  id,
  name as nome,
  description as descricao,
  price as preco,
  billing_cycle as ciclo
FROM plans
ORDER BY price;

-- 4. Verificar dados do tenant
SELECT 
  'Dados da Empresa' as tipo,
  t.*
FROM tenants t
JOIN user_memberships um ON um.tenant_id = t.id
JOIN auth.users u ON u.id = um.user_id
WHERE u.email = 'gabrieldesouza100@gmail.com';


