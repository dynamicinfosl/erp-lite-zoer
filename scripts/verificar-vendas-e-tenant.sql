-- Script para verificar as vendas criadas e seus tenant_ids
-- Execute no Supabase SQL Editor para diagnosticar o problema

-- 1. Verificar todas as vendas criadas hoje
SELECT 
    id,
    sale_number,
    customer_name,
    total_amount,
    payment_method,
    status,
    tenant_id,
    user_id,
    created_at,
    TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS') as data_br
FROM sales
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC;

-- 2. Verificar o tenant do usuário mileny@teste.com
SELECT 
    u.id as user_id,
    u.email,
    t.id as tenant_id,
    t.name as tenant_name
FROM auth.users u
LEFT JOIN tenants t ON t.id = u.id
WHERE u.email = 'mileny@teste.com';

-- 3. Contar vendas por tenant_id
SELECT 
    tenant_id,
    COUNT(*) as total_vendas,
    SUM(total_amount) as valor_total
FROM sales
WHERE created_at >= CURRENT_DATE
GROUP BY tenant_id;

-- 4. Verificar vendas sem tenant válido ou com tenant padrão
SELECT 
    'Vendas com tenant 00000000' as tipo,
    COUNT(*) as quantidade
FROM sales
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
  AND created_at >= CURRENT_DATE

UNION ALL

SELECT 
    'Total vendas hoje' as tipo,
    COUNT(*) as quantidade
FROM sales
WHERE created_at >= CURRENT_DATE;










