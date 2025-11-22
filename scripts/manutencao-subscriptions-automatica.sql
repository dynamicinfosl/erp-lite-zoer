-- ============================================
-- MANUTENÇÃO AUTOMÁTICA DE SUBSCRIPTIONS
-- ============================================
-- Este script pode ser executado periodicamente (ex: diariamente)
-- para garantir que todos os tenants tenham subscriptions e que
-- tenants com trial expirado sejam bloqueados automaticamente

-- IMPORTANTE: Execute este script regularmente para manter o sistema atualizado

-- 1. CRIAR SUBSCRIPTIONS PARA TENANTS SEM SUBSCRIPTION
DO $$
DECLARE
  tenant_record RECORD;
  free_plan_id UUID;
  trial_plan_id UUID;
  new_subscription_id UUID;
  trial_end_date TIMESTAMP WITH TIME ZONE;
  created_count INTEGER := 0;
BEGIN
  -- Buscar plano free ou trial (prioridade: free > trial)
  SELECT id INTO free_plan_id 
  FROM plans 
  WHERE slug IN ('free', 'trial') 
    AND is_active = true
  ORDER BY CASE WHEN slug = 'free' THEN 1 ELSE 2 END
  LIMIT 1;
  
  -- Se não encontrar, usar o primeiro plano ativo disponível
  IF free_plan_id IS NULL THEN
    SELECT id INTO trial_plan_id 
    FROM plans 
    WHERE is_active = true
    ORDER BY price_monthly ASC, created_at ASC
    LIMIT 1;
    free_plan_id := trial_plan_id;
  END IF;
  
  IF free_plan_id IS NULL THEN
    RAISE NOTICE '⚠️ Nenhum plano ativo encontrado. Crie pelo menos um plano antes de executar este script.';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Usando plano ID: %', free_plan_id;
  
  -- Para cada tenant sem subscription
  FOR tenant_record IN 
    SELECT t.id, t.name, t.trial_ends_at, t.created_at
    FROM tenants t
    LEFT JOIN subscriptions s ON s.tenant_id = t.id
    WHERE s.id IS NULL
      AND t.status != 'suspended' -- Não criar para tenants já suspensos
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
    
    created_count := created_count + 1;
    
    RAISE NOTICE '✅ Subscription criada para tenant % (ID: %). Trial até: %', 
      tenant_record.name, 
      tenant_record.id, 
      trial_end_date;
  END LOOP;
  
  RAISE NOTICE '✅ Total de subscriptions criadas: %', created_count;
END $$;

-- 2. BLOQUEAR ACESSO PARA TENANTS COM TRIAL EXPIRADO E SEM PLANO ATIVO
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
    
    -- Também atualizar a subscription para suspended se existir
    UPDATE subscriptions
    SET 
      status = 'suspended',
      updated_at = NOW()
    WHERE tenant_id = tenant_record.id
      AND status != 'suspended';
    
    blocked_count := blocked_count + 1;
    
    RAISE NOTICE '🚫 Acesso bloqueado para tenant % (ID: %)', 
      tenant_record.name, 
      tenant_record.id;
  END LOOP;
  
  RAISE NOTICE '✅ Total de tenants bloqueados: %', blocked_count;
END $$;

-- 3. RESUMO FINAL
SELECT 
  'RESUMO DA MANUTENÇÃO' as tipo,
  '' as valor
UNION ALL
SELECT 
  'Tenants totais',
  COUNT(*)::text
FROM tenants
UNION ALL
SELECT 
  'Tenants com subscription',
  COUNT(DISTINCT s.tenant_id)::text
FROM subscriptions s
UNION ALL
SELECT 
  'Tenants sem subscription',
  COUNT(*)::text
FROM tenants t
LEFT JOIN subscriptions s ON s.tenant_id = t.id
WHERE s.id IS NULL
UNION ALL
SELECT 
  'Tenants com trial ativo',
  COUNT(DISTINCT t.id)::text
FROM tenants t
INNER JOIN subscriptions s ON s.tenant_id = t.id
WHERE s.status = 'trial' 
  AND s.trial_end IS NOT NULL 
  AND s.trial_end > NOW()
UNION ALL
SELECT 
  'Tenants com plano ativo',
  COUNT(DISTINCT t.id)::text
FROM tenants t
INNER JOIN subscriptions s ON s.tenant_id = t.id
WHERE s.status = 'active' 
  AND s.current_period_end IS NOT NULL 
  AND s.current_period_end > NOW()
UNION ALL
SELECT 
  'Tenants bloqueados',
  COUNT(*)::text
FROM tenants
WHERE status = 'suspended';

