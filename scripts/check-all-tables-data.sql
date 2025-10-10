-- =============================================
-- VERIFICAR DADOS EM TODAS AS TABELAS
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Verificar tenants disponíveis
SELECT 'TENANTS' as tabela, COUNT(*) as total FROM public.tenants;
SELECT id, name FROM public.tenants LIMIT 5;

-- 2. Verificar transações financeiras
SELECT 'FINANCIAL_TRANSACTIONS' as tabela, COUNT(*) as total FROM public.financial_transactions;
SELECT DISTINCT tenant_id, COUNT(*) as count FROM public.financial_transactions GROUP BY tenant_id;

-- 3. Verificar vendas
SELECT 'SALES' as tabela, COUNT(*) as total FROM public.sales;
SELECT DISTINCT tenant_id, COUNT(*) as count FROM public.sales GROUP BY tenant_id;

-- 4. Verificar produtos
SELECT 'PRODUCTS' as tabela, COUNT(*) as total FROM public.products;
SELECT DISTINCT tenant_id, COUNT(*) as count FROM public.products GROUP BY tenant_id;

-- 5. Verificar entregas
SELECT 'DELIVERIES' as tabela, COUNT(*) as total FROM public.deliveries;
SELECT DISTINCT tenant_id, COUNT(*) as count FROM public.deliveries GROUP BY tenant_id;

-- 6. Verificar algumas transações financeiras de exemplo
SELECT id, description, amount, tenant_id, created_at 
FROM public.financial_transactions 
ORDER BY created_at DESC 
LIMIT 3;

