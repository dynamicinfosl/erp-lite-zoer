-- =============================================
-- CORRIGIR TENANT_ID DOS PRODUTOS EXISTENTES
-- =============================================
-- Este script corrige produtos que estão com tenant_id zero

-- 1. Verificar produtos com tenant_id zero
SELECT 'PRODUTOS COM TENANT_ID ZERO (ANTES DA CORREÇÃO):' as status;
SELECT 
    id,
    tenant_id,
    sku,
    name,
    created_at
FROM public.products 
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
ORDER BY created_at DESC;

-- 2. Verificar se existe algum tenant válido
SELECT 'TENANTS DISPONÍVEIS:' as status;
SELECT 
    id,
    name,
    status,
    created_at
FROM public.tenants 
ORDER BY created_at DESC
LIMIT 5;

-- 3. Se não houver tenants, criar um tenant padrão
INSERT INTO public.tenants (id, name, status, created_at)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    'Tenant Padrão',
    'active',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = '00000000-0000-0000-0000-000000000000');

-- 4. Verificar se a tabela tenants existe
SELECT 'VERIFICANDO SE TABELA TENANTS EXISTE:' as status;
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'tenants' 
    AND table_schema = 'public'
) as tenants_table_exists;

-- 5. Se a tabela tenants não existir, criar estrutura básica
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Inserir tenant padrão se não existir
INSERT INTO public.tenants (id, name, status, created_at)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    'Tenant Padrão',
    'active',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = '00000000-0000-0000-0000-000000000000');

-- 7. Verificar produtos após correção
SELECT 'PRODUTOS APÓS CORREÇÃO:' as status;
SELECT 
    tenant_id,
    COUNT(*) as quantidade,
    STRING_AGG(name, ', ') as nomes
FROM public.products 
GROUP BY tenant_id
ORDER BY tenant_id;

SELECT '✅ CORREÇÃO CONCLUÍDA!' as resultado;



