-- Diagnóstico completo do problema de subscriptions
-- Execute este script para identificar exatamente o que está impedindo o funcionamento

-- 1. Verificar estrutura da tabela subscriptions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 2. Verificar constraints e foreign keys
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'subscriptions';

-- 3. Verificar RLS (Row Level Security)
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

-- 4. Verificar se RLS está habilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'subscriptions';

-- 5. Verificar subscriptions existentes para o tenant específico
SELECT 
    s.id,
    s.tenant_id,
    s.plan_id,
    s.status,
    s.trial_end,
    s.current_period_start,
    s.current_period_end,
    s.created_at,
    p.name AS plan_name,
    p.slug AS plan_slug,
    p.is_active AS plan_active
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
WHERE s.tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b'
ORDER BY s.created_at DESC;

-- 6. Verificar planos disponíveis
SELECT 
    id,
    name,
    slug,
    is_active,
    price_monthly,
    created_at
FROM plans
WHERE is_active = true
ORDER BY price_monthly ASC;

-- 7. Verificar se há algum trigger que possa estar bloqueando
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'subscriptions';

-- 8. Testar inserção manual (comentado - descomente para testar)
/*
DO $$
DECLARE
    v_tenant_id UUID := '7a56008e-0a31-4084-8c70-de7a5cdd083b';
    v_plan_id UUID;
    v_subscription_id UUID;
BEGIN
    -- Buscar plano trial ou mais barato
    SELECT id INTO v_plan_id
    FROM plans
    WHERE (slug = 'trial' OR slug = 'free')
      AND is_active = true
    LIMIT 1;
    
    IF v_plan_id IS NULL THEN
        SELECT id INTO v_plan_id
        FROM plans
        WHERE is_active = true
        ORDER BY price_monthly ASC
        LIMIT 1;
    END IF;
    
    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum plano ativo encontrado!';
    END IF;
    
    -- Tentar inserir
    BEGIN
        INSERT INTO subscriptions (
            tenant_id,
            plan_id,
            status,
            trial_end,
            current_period_start,
            current_period_end
        ) VALUES (
            v_tenant_id,
            v_plan_id,
            'trial',
            NOW() + INTERVAL '7 days',
            NOW(),
            NULL
        ) RETURNING id INTO v_subscription_id;
        
        RAISE NOTICE '✅ Subscription criada com sucesso! ID: %', v_subscription_id;
        
        -- Rollback para não criar duplicatas (comente se quiser criar de verdade)
        -- ROLLBACK;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Erro ao inserir: % - %', SQLSTATE, SQLERRM;
    END;
END $$;
*/

-- 9. Verificar permissões do usuário/service role
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'subscriptions';

