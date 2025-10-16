-- ============================================
-- SCRIPT: Verificar Dados de Vendas
-- ============================================
-- Este script verifica se as vendas estão sendo salvas corretamente
-- e se aparecem nas consultas por tenant
--
-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- 
-- O script usa UNION ALL para mostrar TODOS os resultados em uma única consulta
-- Colunas: info, total_vendas, total_valor, primeira_venda, ultima_venda, extra6

-- ============================================
-- 1. VERIFICAR VENDAS RECENTES
-- ============================================

-- Mostrar vendas dos últimos 7 dias
SELECT 
    'VENDAS RECENTES (7 dias)' as info,
    COUNT(*)::text as total_vendas,
    SUM(COALESCE(total_amount, final_amount, 0))::text as total_valor,
    MIN(created_at)::text as primeira_venda,
    MAX(created_at)::text as ultima_venda,
    NULL as extra6

UNION ALL

-- Mostrar vendas agrupadas por tenant
SELECT 
    'VENDAS POR TENANT' as info,
    tenant_id::text as total_vendas,
    COUNT(*)::text as total_valor,
    SUM(COALESCE(total_amount, final_amount, 0))::text as primeira_venda,
    MAX(created_at)::text as ultima_venda,
    NULL as extra6
FROM sales 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY tenant_id

UNION ALL

-- Mostrar vendas de hoje
SELECT 
    'VENDAS DE HOJE' as info,
    tenant_id::text as total_vendas,
    sale_number as total_valor,
    customer_name as primeira_venda,
    COALESCE(total_amount, final_amount, 0)::text as ultima_venda,
    payment_method as extra6
FROM sales 
WHERE DATE(created_at) = CURRENT_DATE

UNION ALL

-- Mostrar itens das vendas recentes
SELECT 
    'ITENS DAS VENDAS RECENTES' as info,
    s.tenant_id::text as total_vendas,
    s.sale_number as total_valor,
    si.product_name as primeira_venda,
    si.quantity::text as ultima_venda,
    si.unit_price::text as extra6
FROM sales s
JOIN sale_items si ON s.id = si.sale_id
WHERE s.created_at >= NOW() - INTERVAL '1 day'

UNION ALL

-- ============================================
-- 5. VERIFICAR PROBLEMAS COMUNS
-- ============================================

-- Vendas sem tenant_id
SELECT 
    'VENDAS SEM TENANT_ID' as info,
    COUNT(*)::text as total_vendas,
    NULL as total_valor,
    NULL as primeira_venda,
    NULL as ultima_venda,
    NULL as extra6
FROM sales 
WHERE tenant_id IS NULL OR tenant_id = '00000000-0000-0000-0000-000000000000'

UNION ALL

-- Vendas com total inválido
SELECT 
    'VENDAS COM TOTAL INVÁLIDO' as info,
    COUNT(*)::text as total_vendas,
    NULL as total_valor,
    NULL as primeira_venda,
    NULL as ultima_venda,
    NULL as extra6
FROM sales 
WHERE (total_amount IS NULL OR total_amount <= 0) 
  AND (final_amount IS NULL OR final_amount <= 0)

UNION ALL

-- Vendas sem itens
SELECT 
    'VENDAS SEM ITENS' as info,
    COUNT(*)::text as total_vendas,
    NULL as total_valor,
    NULL as primeira_venda,
    NULL as ultima_venda,
    NULL as extra6
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE si.id IS NULL

UNION ALL

-- Contar total de vendas e itens
SELECT 
    'CONTAGEM GERAL' as info,
    (SELECT COUNT(*) FROM sales)::text as total_vendas,
    (SELECT COUNT(*) FROM sale_items)::text as total_valor,
    (SELECT COUNT(DISTINCT tenant_id) FROM sales)::text as primeira_venda,
    NULL as ultima_venda,
    NULL as extra6

UNION ALL

-- Mensagem de sucesso
SELECT 
    '✅ VERIFICAÇÃO CONCLUÍDA' as info,
    'Todos os dados foram verificados' as total_vendas,
    'Verifique os resultados acima' as total_valor,
    NULL as primeira_venda,
    NULL as ultima_venda,
    NULL as extra6;
