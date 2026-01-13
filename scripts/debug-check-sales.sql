-- Script para verificar vendas no banco de dados
-- Execute este script no Supabase SQL Editor para debugar o histórico de vendas

-- 1. Verificar todas as vendas do tenant (últimas 10)
SELECT 
  id,
  sale_number,
  customer_name,
  total_amount,
  payment_method,
  sale_source,
  created_at,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at_formatted,
  tenant_id
FROM sales
WHERE tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Contar vendas por dia para este tenant
SELECT 
  DATE(created_at) as data,
  COUNT(*) as quantidade,
  SUM(total_amount) as total
FROM sales
WHERE tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
GROUP BY DATE(created_at)
ORDER BY data DESC
LIMIT 7;

-- 3. Verificar vendas de hoje (considerando UTC)
SELECT 
  id,
  sale_number,
  customer_name,
  total_amount,
  created_at,
  TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI:SS') as hora_brasil
FROM sales
WHERE tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
  AND created_at >= CURRENT_DATE
ORDER BY created_at DESC;

-- 4. Verificar vendas de hoje (considerando horário de Brasília -03:00)
SELECT 
  id,
  sale_number,
  customer_name,
  total_amount,
  created_at,
  TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI:SS') as hora_brasil
FROM sales
WHERE tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
  AND created_at >= '2026-01-13T06:00:00.000Z'
  AND created_at <= '2026-01-14T05:59:59.999Z'
ORDER BY created_at DESC;

-- 5. Verificar se há alguma venda do PDV (sale_source = 'pdv')
SELECT 
  id,
  sale_number,
  customer_name,
  total_amount,
  sale_source,
  created_at,
  TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI:SS') as hora_brasil
FROM sales
WHERE tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
  AND sale_source = 'pdv'
ORDER BY created_at DESC
LIMIT 10;
