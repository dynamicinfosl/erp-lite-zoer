-- ============================================
-- SCRIPT: Verificar Dados de Vendas (Versão Segura)
-- ============================================
-- Este script verifica se as vendas estão sendo salvas corretamente
-- Versão segura que funciona independente da estrutura da tabela

-- IMPORTANTE: Execute este script no Supabase SQL Editor

-- ============================================
-- 1. VERIFICAR ESTRUTURA DA TABELA SALES
-- ============================================

SELECT 
    'ESTRUTURA TABELA SALES' as info,
    column_name as total_vendas,
    data_type as total_valor,
    is_nullable as primeira_venda,
    column_default as ultima_venda,
    NULL as extra6
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY ordinal_position

UNION ALL

-- ============================================
-- 2. VERIFICAR VENDAS RECENTES (GENÉRICO)
-- ============================================

SELECT 
    'VENDAS RECENTES (7 dias)' as info,
    COUNT(*)::text as total_vendas,
    'Verificar coluna total' as total_valor,
    MIN(created_at)::text as primeira_venda,
    MAX(created_at)::text as ultima_venda,
    NULL as extra6
FROM sales 
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

-- ============================================
-- 3. VERIFICAR VENDAS POR TENANT
-- ============================================

SELECT 
    'VENDAS POR TENANT' as info,
    tenant_id::text as total_vendas,
    COUNT(*)::text as total_valor,
    MIN(created_at)::text as primeira_venda,
    MAX(created_at)::text as ultima_venda,
    NULL as extra6
FROM sales 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY tenant_id

UNION ALL

-- ============================================
-- 4. VERIFICAR VENDAS DE HOJE
-- ============================================

SELECT 
    'VENDAS DE HOJE' as info,
    tenant_id::text as total_vendas,
    sale_number as total_valor,
    customer_name as primeira_venda,
    created_at::text as ultima_venda,
    payment_method as extra6
FROM sales 
WHERE DATE(created_at) = CURRENT_DATE

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

-- ============================================
-- 6. CONTAGEM GERAL
-- ============================================

SELECT 
    'CONTAGEM GERAL' as info,
    (SELECT COUNT(*) FROM sales)::text as total_vendas,
    (SELECT COUNT(*) FROM sale_items)::text as total_valor,
    (SELECT COUNT(DISTINCT tenant_id) FROM sales)::text as primeira_venda,
    NULL as ultima_venda,
    NULL as extra6

UNION ALL

-- ============================================
-- 7. MENSAGEM DE CONCLUSÃO
-- ============================================

SELECT 
    '✅ VERIFICAÇÃO CONCLUÍDA' as info,
    'Verifique a estrutura da tabela acima' as total_vendas,
    'e ajuste o script conforme necessário' as total_valor,
    NULL as primeira_venda,
    NULL as ultima_venda,
    NULL as extra6;

