-- ============================================
-- VERIFICAR E CORRIGIR SUBSCRIPTIONS
-- ============================================
-- Este script verifica se todos os tenants têm subscription,
-- cria subscriptions para os que não têm, e bloqueia acesso
-- para tenants sem plano ativo e com trial expirado

-- 1. VERIFICAR TENANTS SEM SUBSCRIPTION
SELECT 
  t.id,
  t.name,
  t.status as tenant_status,
  t.trial_ends_at,
  CASE 
    WHEN t.trial_ends_at IS NULL THEN 'Sem data de trial'
    WHEN t.trial_ends_at < NOW() THEN 'Trial expirado'
    ELSE 'Trial ativo'
  END as trial_status,
  s.id as subscription_id,
  s.status as subscription_status
FROM tenants t
LEFT JOIN subscriptions s ON s.tenant_id = t.id
WHERE s.id IS NULL
ORDER BY t.created_at DESC;

-- 2. VERIFICAR TENANTS COM SUBSCRIPTION MAS SEM PLANO ATIVO
SELECT 
  t.id,
  t.name,
  t.status as tenant_status,
  t.trial_ends_at,
  s.id as subscription_id,
  s.status as subscription_status,
  s.plan_id,
  s.current_period_end,
  s.trial_end,
  CASE 
    WHEN s.status = 'trial' AND (s.trial_end IS NULL OR s.trial_end < NOW()) THEN 'Trial expirado'
    WHEN s.status = 'active' AND (s.current_period_end IS NULL OR s.current_period_end < NOW()) THEN 'Plano expirado'
    WHEN s.status = 'suspended' THEN 'Suspenso'
    WHEN s.status = 'canceled' THEN 'Cancelado'
    ELSE 'Status desconhecido'
  END as status_detalhado
FROM tenants t
INNER JOIN subscriptions s ON s.tenant_id = t.id
WHERE s.status NOT IN ('active', 'trial')
   OR (s.status = 'trial' AND (s.trial_end IS NULL OR s.trial_end < NOW()))
   OR (s.status = 'active' AND (s.current_period_end IS NULL OR s.current_period_end < NOW()))
ORDER BY t.created_at DESC;

-- 3. CRIAR SUBSCRIPTIONS PARA TENANTS SEM SUBSCRIPTION
-- Primeiro, vamos verificar se existe um plano "free" ou "trial"
DO $$
DECLARE
  tenant_record RECORD;
  free_plan_id UUID;
  trial_plan_id UUID;
  new_subscription_id UUID;
  trial_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar plano free ou trial (prioridade: free > trial)
  SELECT id INTO free_plan_id 
  FROM plans 
  WHERE slug IN ('free', 'trial') 
  ORDER BY CASE WHEN slug = 'free' THEN 1 ELSE 2 END
  LIMIT 1;
  
  -- Se não encontrar, usar o primeiro plano disponível
  IF free_plan_id IS NULL THEN
    SELECT id INTO trial_plan_id 
    FROM plans 
    ORDER BY created_at ASC
    LIMIT 1;
    free_plan_id := trial_plan_id;
  END IF;
  
  IF free_plan_id IS NULL THEN
    RAISE NOTICE '⚠️ Nenhum plano encontrado. Crie pelo menos um plano antes de executar este script.';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Usando plano ID: %', free_plan_id;
  
  -- Para cada tenant sem subscription
  FOR tenant_record IN 
    SELECT t.id, t.name, t.trial_ends_at, t.created_at
    FROM tenants t
    LEFT JOIN subscriptions s ON s.tenant_id = t.id
    WHERE s.id IS NULL
  LOOP
    -- Calcular data de término do trial (7 dias a partir de agora ou usar trial_ends_at do tenant se existir)
    IF tenant_record.trial_ends_at IS NOT NULL AND tenant_record.trial_ends_at > NOW() THEN
      trial_end_date := tenant_record.trial_ends_at;
    ELSE
      trial_end_date := NOW() + INTERVAL '7 days';
    END IF;
    
    -- Criar subscription
    INSERT INTO subscriptions (
      tenant_id,
      plan_id,
      status,
      trial_end,
      current_period_start,
      current_period_end,
      created_at,
      updated_at
    ) VALUES (
      tenant_record.id,
      free_plan_id,
      'trial',
      trial_end_date,
      NOW(),
      trial_end_date,
      NOW(),
      NOW()
    ) RETURNING id INTO new_subscription_id;
    
    RAISE NOTICE '✅ Subscription criada para tenant % (ID: %). Trial até: %', 
      tenant_record.name, 
      tenant_record.id, 
      trial_end_date;
  END LOOP;
  
  RAISE NOTICE '✅ Processo de criação de subscriptions concluído.';
END $$;

-- 4. BLOQUEAR ACESSO PARA TENANTS COM TRIAL EXPIRADO E SEM PLANO ATIVO
DO $$
DECLARE
  tenant_record RECORD;
  blocked_count INTEGER := 0;
BEGIN
  -- Para cada tenant com trial expirado ou sem plano ativo
  FOR tenant_record IN 
    SELECT DISTINCT t.id, t.name, t.status
    FROM tenants t
    LEFT JOIN subscriptions s ON s.tenant_id = t.id
    WHERE (
      -- Sem subscription
      s.id IS NULL
      OR
      -- Subscription com trial expirado
      (s.status = 'trial' AND (s.trial_end IS NULL OR s.trial_end < NOW()))
      OR
      -- Subscription ativa mas período expirado
      (s.status = 'active' AND (s.current_period_end IS NULL OR s.current_period_end < NOW()))
      OR
      -- Subscription suspensa ou cancelada
      s.status IN ('suspended', 'canceled')
    )
    AND t.status != 'suspended' -- Apenas se ainda não estiver suspenso
  LOOP
    -- Atualizar status do tenant para suspended
    UPDATE tenants
    SET 
      status = 'suspended',
      updated_at = NOW()
    WHERE id = tenant_record.id;
    
    blocked_count := blocked_count + 1;
    
    RAISE NOTICE '🚫 Acesso bloqueado para tenant % (ID: %)', 
      tenant_record.name, 
      tenant_record.id;
  END LOOP;
  
  RAISE NOTICE '✅ Total de tenants bloqueados: %', blocked_count;
END $$;

-- 5. VERIFICAR RESULTADO FINAL
SELECT 
  'Total de tenants' as tipo,
  COUNT(*) as total
FROM tenants
UNION ALL
SELECT 
  'Tenants com subscription',
  COUNT(DISTINCT s.tenant_id)
FROM subscriptions s
UNION ALL
SELECT 
  'Tenants sem subscription',
  COUNT(*)
FROM tenants t
LEFT JOIN subscriptions s ON s.tenant_id = t.id
WHERE s.id IS NULL
UNION ALL
SELECT 
  'Tenants com trial ativo',
  COUNT(DISTINCT t.id)
FROM tenants t
INNER JOIN subscriptions s ON s.tenant_id = t.id
WHERE s.status = 'trial' 
  AND s.trial_end IS NOT NULL 
  AND s.trial_end > NOW()
UNION ALL
SELECT 
  'Tenants com plano ativo',
  COUNT(DISTINCT t.id)
FROM tenants t
INNER JOIN subscriptions s ON s.tenant_id = t.id
WHERE s.status = 'active' 
  AND s.current_period_end IS NOT NULL 
  AND s.current_period_end > NOW()
UNION ALL
SELECT 
  'Tenants bloqueados (suspended)',
  COUNT(*)
FROM tenants
WHERE status = 'suspended';

-- 6. LISTAR TENANTS BLOQUEADOS COM DETALHES
SELECT 
  t.id,
  t.name,
  t.status as tenant_status,
  t.trial_ends_at,
  s.id as subscription_id,
  s.status as subscription_status,
  s.plan_id,
  p.name as plan_name,
  s.current_period_end,
  s.trial_end,
  CASE 
    WHEN s.id IS NULL THEN 'Sem subscription'
    WHEN s.status = 'trial' AND (s.trial_end IS NULL OR s.trial_end < NOW()) THEN 'Trial expirado'
    WHEN s.status = 'active' AND (s.current_period_end IS NULL OR s.current_period_end < NOW()) THEN 'Plano expirado'
    WHEN s.status = 'suspended' THEN 'Suspenso'
    WHEN s.status = 'canceled' THEN 'Cancelado'
    ELSE 'Outro motivo'
  END as motivo_bloqueio
FROM tenants t
LEFT JOIN subscriptions s ON s.tenant_id = t.id
LEFT JOIN plans p ON p.id = s.plan_id
WHERE t.status = 'suspended'
ORDER BY t.updated_at DESC;

