-- =============================================
-- CRIAR ESTRUTURA DE TENANTS E MEMBERSHIPS
-- =============================================
-- Este script cria as tabelas necessárias para o sistema multi-tenant

-- 1. Criar tabela tenants se não existir
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela user_memberships se não existir
CREATE TABLE IF NOT EXISTS public.user_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON public.user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_tenant_id ON public.user_memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_active ON public.user_memberships(is_active);

-- 4. Verificar se há dados existentes para criar tenant padrão
DO $$
DECLARE
    default_tenant_id UUID;
    existing_tenant_count INTEGER;
BEGIN
    -- Verificar se já existe algum tenant
    SELECT COUNT(*) INTO existing_tenant_count FROM public.tenants;
    
    IF existing_tenant_count = 0 THEN
        -- Criar tenant padrão
        INSERT INTO public.tenants (id, name, status, email, created_at)
        VALUES (
            '65d11970-ae36-4432-9aca-25c8db2b97a0',
            'Tenant Padrão',
            'active',
            'admin@default.com',
            NOW()
        );
        
        RAISE NOTICE 'Tenant padrão criado com ID: 65d11970-ae36-4432-9aca-25c8db2b97a0';
    ELSE
        RAISE NOTICE 'Tenants já existem na tabela';
    END IF;
END $$;

-- 5. Verificar se há users sem membership
DO $$
DECLARE
    user_count INTEGER;
    membership_count INTEGER;
BEGIN
    -- Contar usuários únicos nas tabelas de produtos/clientes
    SELECT COUNT(DISTINCT user_id) INTO user_count FROM (
        SELECT user_id FROM public.products WHERE user_id IS NOT NULL
        UNION
        SELECT user_id FROM public.customers WHERE user_id IS NOT NULL
        UNION
        SELECT user_id FROM public.sales WHERE user_id IS NOT NULL
    ) AS users;
    
    -- Contar memberships existentes
    SELECT COUNT(*) INTO membership_count FROM public.user_memberships;
    
    RAISE NOTICE 'Usuários únicos encontrados: %', user_count;
    RAISE NOTICE 'Memberships existentes: %', membership_count;
    
    IF membership_count = 0 AND user_count > 0 THEN
        RAISE NOTICE 'Criando memberships para usuários existentes...';
        
        -- Criar membership para usuários existentes com tenant padrão
        INSERT INTO public.user_memberships (user_id, tenant_id, is_active, role, created_at)
        SELECT DISTINCT user_id, '65d11970-ae36-4432-9aca-25c8db2b97a0', true, 'admin', NOW()
        FROM (
            SELECT user_id FROM public.products WHERE user_id IS NOT NULL
            UNION
            SELECT user_id FROM public.customers WHERE user_id IS NOT NULL
            UNION
            SELECT user_id FROM public.sales WHERE user_id IS NOT NULL
        ) AS users
        WHERE user_id IS NOT NULL;
        
        RAISE NOTICE 'Memberships criados para usuários existentes';
    END IF;
END $$;

-- 6. Verificar resultado final
SELECT 'ESTRUTURA CRIADA COM SUCESSO!' as status;
SELECT 'TENANTS:' as tabela, COUNT(*) as quantidade FROM public.tenants;
SELECT 'USER_MEMBERSHIPS:' as tabela, COUNT(*) as quantidade FROM public.user_memberships;

SELECT '✅ ESTRUTURA DE TENANTS CONCLUÍDA!' as resultado;



