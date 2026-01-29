-- Script para diagnosticar o problema de vendas não aparecendo no histórico
-- Execute no Supabase SQL Editor

-- 1. Verificar qual tenant_id está sendo usado nas vendas de hoje
SELECT 
    tenant_id,
    COUNT(*) as total_vendas,
    MIN(created_at) as primeira_venda,
    MAX(created_at) as ultima_venda
FROM sales
WHERE created_at >= CURRENT_DATE
GROUP BY tenant_id
ORDER BY total_vendas DESC;

-- 2. Verificar o tenant do usuário mileny@teste.com
SELECT 
    u.id as user_id,
    u.email,
    um.tenant_id as membership_tenant_id,
    t.id as tenant_table_id,
    t.name as tenant_name
FROM auth.users u
LEFT JOIN user_memberships um ON um.user_id = u.id AND um.is_active = true
LEFT JOIN tenants t ON t.id = um.tenant_id OR t.id = u.id
WHERE u.email = 'mileny@teste.com';

-- 3. Verificar as últimas 5 vendas criadas hoje com seus tenant_ids
SELECT 
    id,
    sale_number,
    customer_name,
    total_amount,
    payment_method,
    tenant_id,
    user_id,
    created_at,
    TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS') as data_br
FROM sales
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verificar se há vendas com tenant_id NULL
SELECT 
    COUNT(*) as vendas_sem_tenant
FROM sales
WHERE tenant_id IS NULL
  AND created_at >= CURRENT_DATE;



