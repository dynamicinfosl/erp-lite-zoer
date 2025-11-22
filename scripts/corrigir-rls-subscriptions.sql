-- Script para corrigir RLS na tabela subscriptions
-- O service_role deve ter acesso total, mas RLS pode estar bloqueando

-- 1. Verificar status atual do RLS
SELECT 
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'subscriptions';

-- 2. Verificar políticas RLS existentes
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

-- 3. Desabilitar RLS temporariamente para service_role (se necessário)
-- NOTA: O service_role DEVE bypassar RLS automaticamente, mas vamos garantir

-- 4. Criar política permissiva para service_role (bypass completo)
-- Primeiro, remover políticas conflitantes se existirem
DO $$
BEGIN
    -- Remover políticas antigas que possam estar bloqueando
    DROP POLICY IF EXISTS "service_role_bypass" ON subscriptions;
    DROP POLICY IF EXISTS "Allow service_role full access" ON subscriptions;
    
    RAISE NOTICE '✅ Políticas antigas removidas (se existiam)';
END $$;

-- 5. Garantir que service_role pode fazer tudo
-- O service_role já deve ter permissões, mas vamos criar uma política explícita
-- que permite tudo para service_role
DO $$
BEGIN
    -- Criar política que permite tudo para service_role
    CREATE POLICY IF NOT EXISTS "service_role_full_access" ON subscriptions
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    
    RAISE NOTICE '✅ Política criada para service_role';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Erro ao criar política: %', SQLERRM;
END $$;

-- 6. Verificar se há constraints que podem estar bloqueando
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'subscriptions'::regclass;

-- 7. Verificar foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'subscriptions';

-- 8. Testar inserção direta com service_role (simulado)
-- NOTA: Isso só funciona se executado como service_role
DO $$
DECLARE
    v_test_tenant_id UUID := '7a56008e-0a31-4084-8c70-de7a5cdd083b';
    v_test_plan_id UUID;
    v_test_sub_id UUID;
BEGIN
    -- Buscar plano trial
    SELECT id INTO v_test_plan_id
    FROM plans
    WHERE (slug = 'trial' OR slug = 'free')
      AND is_active = true
    LIMIT 1;
    
    IF v_test_plan_id IS NULL THEN
        SELECT id INTO v_test_plan_id
        FROM plans
        WHERE is_active = true
        ORDER BY price_monthly ASC
        LIMIT 1;
    END IF;
    
    IF v_test_plan_id IS NULL THEN
        RAISE EXCEPTION '❌ Nenhum plano encontrado!';
    END IF;
    
    RAISE NOTICE '🔍 Tentando inserir subscription de teste...';
    RAISE NOTICE '   Tenant ID: %', v_test_tenant_id;
    RAISE NOTICE '   Plan ID: %', v_test_plan_id;
    
    -- Verificar se já existe
    SELECT id INTO v_test_sub_id
    FROM subscriptions
    WHERE tenant_id = v_test_tenant_id
    LIMIT 1;
    
    IF v_test_sub_id IS NOT NULL THEN
        RAISE NOTICE '⚠️ Subscription já existe para este tenant: %', v_test_sub_id;
        RAISE NOTICE '   Pulando inserção de teste';
    ELSE
        -- Tentar inserir (será revertido se houver erro)
        BEGIN
            INSERT INTO subscriptions (
                tenant_id,
                plan_id,
                status,
                trial_end,
                current_period_start,
                current_period_end
            ) VALUES (
                v_test_tenant_id,
                v_test_plan_id,
                'trial',
                NOW() + INTERVAL '7 days',
                NOW(),
                NULL
            ) RETURNING id INTO v_test_sub_id;
            
            RAISE NOTICE '✅ Inserção de teste bem-sucedida! ID: %', v_test_sub_id;
            
            -- Reverter a inserção de teste
            DELETE FROM subscriptions WHERE id = v_test_sub_id;
            RAISE NOTICE '✅ Inserção de teste revertida';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION '❌ Erro ao inserir: % - %', SQLSTATE, SQLERRM;
        END;
    END IF;
END $$;

-- 9. Resumo final
SELECT 
    'Resumo' AS info,
    (SELECT COUNT(*) FROM subscriptions) AS total_subscriptions,
    (SELECT COUNT(*) FROM subscriptions WHERE tenant_id = '7a56008e-0a31-4084-8c70-de7a5cdd083b') AS subscriptions_para_tenant,
    (SELECT COUNT(*) FROM plans WHERE is_active = true) AS planos_ativos;

