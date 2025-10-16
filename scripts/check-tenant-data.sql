-- =============================================
-- VERIFICAR DADOS POR TENANT
-- =============================================
-- Este script verifica se há dados com diferentes tenant_ids

-- 1. Verificar produtos por tenant
SELECT 'PRODUTOS POR TENANT:' as status;
SELECT 
    tenant_id,
    COUNT(*) as quantidade,
    STRING_AGG(name, ', ') as nomes
FROM public.products 
GROUP BY tenant_id
ORDER BY tenant_id;

-- 2. Verificar clientes por tenant
SELECT 'CLIENTES POR TENANT:' as status;
SELECT 
    tenant_id,
    COUNT(*) as quantidade,
    STRING_AGG(name, ', ') as nomes
FROM public.customers 
GROUP BY tenant_id
ORDER BY tenant_id;

-- 3. Verificar vendas por tenant
SELECT 'VENDAS POR TENANT:' as status;
SELECT 
    tenant_id,
    COUNT(*) as quantidade
FROM public.sales 
GROUP BY tenant_id
ORDER BY tenant_id;

-- 4. Verificar todos os tenant_ids únicos no sistema
SELECT 'TENANT_IDS ÚNICOS NO SISTEMA:' as status;
SELECT DISTINCT tenant_id, 'products' as tabela FROM public.products
UNION ALL
SELECT DISTINCT tenant_id, 'customers' as tabela FROM public.customers
UNION ALL
SELECT DISTINCT tenant_id, 'sales' as tabela FROM public.sales
ORDER BY tenant_id, tabela;

-- 5. Verificar se há dados sem tenant_id
SELECT 'DADOS SEM TENANT_ID:' as status;
SELECT 'products' as tabela, COUNT(*) as quantidade 
FROM public.products WHERE tenant_id IS NULL
UNION ALL
SELECT 'customers' as tabela, COUNT(*) as quantidade 
FROM public.customers WHERE tenant_id IS NULL
UNION ALL
SELECT 'sales' as tabela, COUNT(*) as quantidade 
FROM public.sales WHERE tenant_id IS NULL;

SELECT '✅ VERIFICAÇÃO CONCLUÍDA!' as resultado;



