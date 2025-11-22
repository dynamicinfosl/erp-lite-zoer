-- Script para garantir que todas as subscriptions tenham plan_id
-- Se uma subscription não tiver plan_id, será atribuído o plano 'trial' ou o mais barato disponível

DO $$
DECLARE
    v_trial_plan_id UUID;
    v_cheapest_plan_id UUID;
    v_subscription_count INTEGER;
    v_updated_count INTEGER := 0;
BEGIN
    -- Buscar plano trial ou free
    SELECT id INTO v_trial_plan_id
    FROM plans
    WHERE (slug = 'trial' OR slug = 'free')
      AND is_active = true
    LIMIT 1;
    
    -- Se não encontrou trial/free, buscar o mais barato
    IF v_trial_plan_id IS NULL THEN
        SELECT id INTO v_cheapest_plan_id
        FROM plans
        WHERE is_active = true
        ORDER BY price_monthly ASC
        LIMIT 1;
    END IF;
    
    -- Usar trial se disponível, senão usar o mais barato
    IF v_trial_plan_id IS NOT NULL THEN
        -- Atualizar subscriptions sem plan_id
        UPDATE subscriptions
        SET plan_id = v_trial_plan_id
        WHERE plan_id IS NULL;
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        
        RAISE NOTICE '✅ Atualizadas % subscriptions com plan_id = % (trial/free)', 
            v_updated_count, v_trial_plan_id;
    ELSIF v_cheapest_plan_id IS NOT NULL THEN
        -- Atualizar subscriptions sem plan_id
        UPDATE subscriptions
        SET plan_id = v_cheapest_plan_id
        WHERE plan_id IS NULL;
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        
        RAISE NOTICE '✅ Atualizadas % subscriptions com plan_id = % (mais barato)', 
            v_updated_count, v_cheapest_plan_id;
    ELSE
        RAISE EXCEPTION '❌ Nenhum plano ativo encontrado no banco de dados!';
    END IF;
    
    -- Verificar se ainda há subscriptions sem plan_id
    SELECT COUNT(*) INTO v_subscription_count
    FROM subscriptions
    WHERE plan_id IS NULL;
    
    IF v_subscription_count > 0 THEN
        RAISE WARNING '⚠️ Ainda existem % subscriptions sem plan_id', v_subscription_count;
    ELSE
        RAISE NOTICE '✅ Todas as subscriptions agora têm plan_id!';
    END IF;
    
    -- Relatório final
    RAISE NOTICE '';
    RAISE NOTICE '📊 RELATÓRIO FINAL:';
    RAISE NOTICE '   Total de subscriptions: %', (SELECT COUNT(*) FROM subscriptions);
    RAISE NOTICE '   Subscriptions com plan_id: %', (SELECT COUNT(*) FROM subscriptions WHERE plan_id IS NOT NULL);
    RAISE NOTICE '   Subscriptions sem plan_id: %', (SELECT COUNT(*) FROM subscriptions WHERE plan_id IS NULL);
    
END $$;

-- Verificação adicional: listar subscriptions e seus planos
SELECT 
    s.id AS subscription_id,
    s.tenant_id,
    s.status,
    s.plan_id,
    p.name AS plan_name,
    p.slug AS plan_slug,
    CASE 
        WHEN s.plan_id IS NULL THEN '❌ SEM PLAN_ID'
        ELSE '✅ OK'
    END AS status_check
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
ORDER BY s.created_at DESC;

