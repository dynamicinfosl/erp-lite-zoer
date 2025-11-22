-- Verificar detalhes da subscription existente para o tenant
-- Tenant ID: 7a56008e-0a31-4084-8c70-de7a5cdd083b

SELECT 
    s.id AS subscription_id,
    s.tenant_id,
    s.plan_id,
    s.status,
    s.trial_end,
    s.current_period_start,
    s.current_period_end,
    s.created_at,
    s.updated_at,
    p.id AS plan_id_verificado,
    p.name AS plan_name,
    p.slug AS plan_slug,
    p.is_active AS plan_is_active,
    t.id AS tenant_id_verificado,
    t.name AS tenant_name,
    t.status AS tenant_status,
    t.trial_ends_at AS tenant_trial_ends_at -- esta coluna existe na tabela tenants
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
LEFT JOIN tenants t ON s.tenant_id = t.id
WHERE s.tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
ORDER BY s.created_at DESC;

-- Verificar se há problemas com a subscription
SELECT 
    CASE 
        WHEN s.plan_id IS NULL THEN '❌ SEM PLAN_ID'
        WHEN p.id IS NULL THEN '❌ PLAN_ID INVÁLIDO (plano não existe)'
        WHEN p.is_active = false THEN '⚠️ PLANO INATIVO'
        WHEN s.status IS NULL THEN '❌ SEM STATUS'
        WHEN s.status = 'suspended' THEN '⚠️ SUSPENSO'
        WHEN s.status = 'trial' AND s.trial_end IS NOT NULL AND s.trial_end < NOW() THEN '❌ TRIAL EXPIRADO'
        WHEN s.status = 'active' AND s.current_period_end IS NOT NULL AND s.current_period_end < NOW() THEN '❌ PERÍODO EXPIRADO'
        ELSE '✅ OK'
    END AS status_check,
    s.id,
    s.status,
    s.plan_id,
    p.name AS plan_name,
    s.trial_end,
    s.current_period_end
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
WHERE s.tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b';

-- Se a subscription estiver OK mas o sistema não encontrar, pode ser problema de RLS
-- Verificar se o service_role consegue ver esta subscription
SELECT 
    'Teste de visibilidade para service_role' AS teste,
    COUNT(*) AS subscriptions_visiveis
FROM subscriptions
WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b';

