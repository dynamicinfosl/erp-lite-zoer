-- ============================================
-- ATIVAR CONTA DE DESENVOLVIMENTO
-- Criar subscription ativa para desenvolvimento
-- ============================================

-- 1. Verificar se já tem subscription
DO $$ 
DECLARE
  v_tenant_id uuid;
  v_plan_id uuid;
  v_subscription_exists boolean;
BEGIN
  -- Pegar tenant_id do usuário
  SELECT um.tenant_id INTO v_tenant_id
  FROM user_memberships um
  JOIN auth.users u ON u.id = um.user_id
  WHERE u.email = 'gabrieldesouza100@gmail.com'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE NOTICE 'Usuário não tem tenant vinculado!';
    RETURN;
  END IF;

  -- Verificar se já tem subscription
  SELECT EXISTS(
    SELECT 1 FROM subscriptions 
    WHERE tenant_id = v_tenant_id
  ) INTO v_subscription_exists;

  IF v_subscription_exists THEN
    RAISE NOTICE 'Subscription já existe! Atualizando...';
    
    -- Atualizar subscription existente
    UPDATE subscriptions
    SET 
      status = 'active',
      trial_ends_at = '2026-12-31'::timestamp,
      current_period_start = NOW(),
      current_period_end = '2026-12-31'::timestamp
    WHERE tenant_id = v_tenant_id;
    
    RAISE NOTICE 'Subscription atualizada para ACTIVE até 2026!';
  ELSE
    RAISE NOTICE 'Criando nova subscription...';
    
    -- Pegar ID do plano Profissional
    SELECT id INTO v_plan_id
    FROM plans
    WHERE name = 'Profissional'
    LIMIT 1;

    IF v_plan_id IS NULL THEN
      -- Se não tem plano, usar o primeiro disponível
      SELECT id INTO v_plan_id
      FROM plans
      ORDER BY price
      LIMIT 1;
    END IF;

    -- Criar subscription
    INSERT INTO subscriptions (
      tenant_id,
      plan_id,
      status,
      trial_ends_at,
      current_period_start,
      current_period_end
    ) VALUES (
      v_tenant_id,
      v_plan_id,
      'active',
      '2026-12-31'::timestamp,
      NOW(),
      '2026-12-31'::timestamp
    );
    
    RAISE NOTICE 'Subscription criada com sucesso!';
  END IF;

  -- Atualizar status do tenant
  UPDATE tenants
  SET 
    status = 'active',
    trial_ends_at = '2026-12-31'::timestamp
  WHERE id = v_tenant_id;

  RAISE NOTICE 'Tenant ativado até 2026!';
END $$;

-- 2. Verificar resultado
SELECT 
  u.email,
  t.name as empresa,
  t.status as status_tenant,
  s.status as status_subscription,
  p.name as plano,
  s.trial_ends_at as expira_em
FROM auth.users u
JOIN user_memberships um ON um.user_id = u.id
JOIN tenants t ON t.id = um.tenant_id
LEFT JOIN subscriptions s ON s.tenant_id = t.id
LEFT JOIN plans p ON p.id = s.plan_id
WHERE u.email = 'gabrieldesouza100@gmail.com';


