-- =============================================
-- CRIAR TENANTS SEPARADOS PARA USUÁRIOS DIFERENTES
-- =============================================
-- Este script cria tenants únicos para cada usuário e move seus dados

-- 1. Verificar usuários únicos no sistema
SELECT 'USUÁRIOS ÚNICOS ENCONTRADOS:' as status;
SELECT 
    user_id,
    COUNT(*) as total_registros,
    STRING_AGG(DISTINCT 'products', ', ') as tabelas_produtos,
    STRING_AGG(DISTINCT 'customers', ', ') as tabelas_clientes,
    STRING_AGG(DISTINCT 'sales', ', ') as tabelas_vendas
FROM (
    SELECT user_id, 'products' as tabela FROM public.products WHERE user_id IS NOT NULL
    UNION ALL
    SELECT user_id, 'customers' as tabela FROM public.customers WHERE user_id IS NOT NULL
    UNION ALL
    SELECT user_id, 'sales' as tabela FROM public.sales WHERE user_id IS NOT NULL
) AS all_users
GROUP BY user_id
ORDER BY user_id;

-- 2. Criar tenant para cada usuário único
DO $$
DECLARE
    user_record RECORD;
    new_tenant_id UUID;
    tenant_name TEXT;
BEGIN
    -- Para cada usuário único, criar um tenant
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM (
            SELECT user_id FROM public.products WHERE user_id IS NOT NULL
            UNION
            SELECT user_id FROM public.customers WHERE user_id IS NOT NULL
            UNION
            SELECT user_id FROM public.sales WHERE user_id IS NOT NULL
        ) AS unique_users
        WHERE user_id != '00000000-0000-0000-0000-000000000000'
    LOOP
        -- Gerar novo tenant_id
        new_tenant_id := gen_random_uuid();
        tenant_name := 'Empresa do Usuário ' || substring(user_record.user_id::text, 1, 8);
        
        -- Criar tenant
        INSERT INTO public.tenants (id, name, status, created_at)
        VALUES (new_tenant_id, tenant_name, 'active', NOW())
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Criado tenant % para usuário %', new_tenant_id, user_record.user_id;
        
        -- Atualizar produtos do usuário
        UPDATE public.products 
        SET tenant_id = new_tenant_id 
        WHERE user_id = user_record.user_id;
        
        -- Atualizar clientes do usuário
        UPDATE public.customers 
        SET tenant_id = new_tenant_id 
        WHERE user_id = user_record.user_id;
        
        -- Atualizar vendas do usuário
        UPDATE public.sales 
        SET tenant_id = new_tenant_id 
        WHERE user_id = user_record.user_id;
        
        RAISE NOTICE 'Dados movidos para tenant %', new_tenant_id;
        
    END LOOP;
END $$;

-- 3. Criar user_memberships para cada usuário
DO $$
DECLARE
    user_record RECORD;
    tenant_record RECORD;
BEGIN
    -- Para cada usuário que tem dados, criar membership
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM (
            SELECT user_id FROM public.products WHERE user_id IS NOT NULL
            UNION
            SELECT user_id FROM public.customers WHERE user_id IS NOT NULL
            UNION
            SELECT user_id FROM public.sales WHERE user_id IS NOT NULL
        ) AS unique_users
        WHERE user_id != '00000000-0000-0000-0000-000000000000'
    LOOP
        -- Buscar tenant do usuário
        SELECT tenant_id INTO tenant_record
        FROM public.products 
        WHERE user_id = user_record.user_id 
        LIMIT 1;
        
        IF tenant_record.tenant_id IS NOT NULL THEN
            -- Criar membership
            INSERT INTO public.user_memberships (user_id, tenant_id, is_active, role, created_at)
            VALUES (user_record.user_id, tenant_record.tenant_id, true, 'admin', NOW())
            ON CONFLICT (user_id, tenant_id) DO NOTHING;
            
            RAISE NOTICE 'Criado membership para usuário % no tenant %', user_record.user_id, tenant_record.tenant_id;
        END IF;
    END LOOP;
END $$;

-- 4. Verificar resultado final
SELECT 'RESULTADO FINAL - TENANTS CRIADOS:' as status;
SELECT 
    id,
    name,
    status,
    created_at
FROM public.tenants 
ORDER BY created_at DESC;

SELECT 'RESULTADO FINAL - MEMBERSHIPS CRIADOS:' as status;
SELECT 
    um.user_id,
    um.tenant_id,
    t.name as tenant_name,
    um.is_active,
    um.role
FROM public.user_memberships um
JOIN public.tenants t ON um.tenant_id = t.id
ORDER BY um.created_at DESC;

SELECT 'RESULTADO FINAL - DADOS POR TENANT:' as status;
SELECT 
    tenant_id,
    'products' as tabela,
    COUNT(*) as quantidade
FROM public.products 
GROUP BY tenant_id
UNION ALL
SELECT 
    tenant_id,
    'customers' as tabela,
    COUNT(*) as quantidade
FROM public.customers 
GROUP BY tenant_id
UNION ALL
SELECT 
    tenant_id,
    'sales' as tabela,
    COUNT(*) as quantidade
FROM public.sales 
GROUP BY tenant_id
ORDER BY tenant_id, tabela;

SELECT '✅ TENANTS SEPARADOS CRIADOS COM SUCESSO!' as resultado;



