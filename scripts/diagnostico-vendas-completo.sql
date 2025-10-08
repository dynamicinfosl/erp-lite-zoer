-- =============================================
-- DIAGNÓSTICO COMPLETO - SISTEMA DE VENDAS
-- =============================================
-- Execute este script no Supabase SQL Editor para verificar tudo
-- =============================================

-- 1. VERIFICAR SE AS TABELAS EXISTEM
SELECT '════════════════════════════════════════════════════════' as divisor;
SELECT '📋 1. VERIFICANDO TABELAS' as etapa;
SELECT '════════════════════════════════════════════════════════' as divisor;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('sales', 'sale_items', 'cash_operations') THEN '✅ EXISTE'
        ELSE '❌ NÃO ENCONTRADA'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sales', 'sale_items', 'cash_operations')
ORDER BY table_name;

-- Verificar quantas tabelas foram encontradas
SELECT 
    COUNT(*) as tabelas_encontradas,
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ TODAS AS TABELAS EXISTEM'
        WHEN COUNT(*) > 0 THEN '⚠️  ALGUMAS TABELAS FALTAM'
        ELSE '❌ NENHUMA TABELA ENCONTRADA - PRECISA EXECUTAR create-sales-BASIC.sql'
    END as resultado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sales', 'sale_items', 'cash_operations');

-- 2. VERIFICAR ESTRUTURA DA TABELA SALES
SELECT '════════════════════════════════════════════════════════' as divisor;
SELECT '🔍 2. ESTRUTURA DA TABELA SALES' as etapa;
SELECT '════════════════════════════════════════════════════════' as divisor;

SELECT 
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN '✅ NULL' ELSE '⚠️  NOT NULL' END as nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales'
ORDER BY ordinal_position;

-- 3. VERIFICAR ESTRUTURA DA TABELA SALE_ITEMS
SELECT '════════════════════════════════════════════════════════' as divisor;
SELECT '🔍 3. ESTRUTURA DA TABELA SALE_ITEMS' as etapa;
SELECT '════════════════════════════════════════════════════════' as divisor;

SELECT 
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN '✅ NULL' ELSE '⚠️  NOT NULL' END as nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sale_items'
ORDER BY ordinal_position;

-- 4. VERIFICAR SE A FUNÇÃO generate_sale_number EXISTE
SELECT '════════════════════════════════════════════════════════' as divisor;
SELECT '⚙️  4. VERIFICANDO FUNÇÃO generate_sale_number' as etapa;
SELECT '════════════════════════════════════════════════════════' as divisor;

SELECT 
    routine_name,
    routine_type,
    '✅ FUNÇÃO EXISTE' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'generate_sale_number';

-- Se não retornar nada, a função não existe

-- 5. TESTAR A FUNÇÃO (se existir)
SELECT '════════════════════════════════════════════════════════' as divisor;
SELECT '🧪 5. TESTANDO FUNÇÃO generate_sale_number' as etapa;
SELECT '════════════════════════════════════════════════════════' as divisor;

-- Comentado para não dar erro se a função não existir
-- Descomente a linha abaixo se a função existir:
-- SELECT generate_sale_number() as numero_gerado, '✅ FUNÇÃO FUNCIONANDO' as status;

-- 6. VERIFICAR ÍNDICES
SELECT '════════════════════════════════════════════════════════' as divisor;
SELECT '📊 6. VERIFICANDO ÍNDICES' as etapa;
SELECT '════════════════════════════════════════════════════════' as divisor;

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('sales', 'sale_items', 'cash_operations')
ORDER BY tablename, indexname;

-- 7. VERIFICAR FOREIGN KEYS
SELECT '════════════════════════════════════════════════════════' as divisor;
SELECT '🔗 7. VERIFICANDO FOREIGN KEYS' as etapa;
SELECT '════════════════════════════════════════════════════════' as divisor;

SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅ FK CONFIGURADA' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('sales', 'sale_items', 'cash_operations')
ORDER BY tc.table_name;

-- 8. TESTE DE INSERÇÃO (COMENTADO PARA SEGURANÇA)
SELECT '════════════════════════════════════════════════════════' as divisor;
SELECT '🧪 8. TESTE DE INSERÇÃO (COMENTADO)' as etapa;
SELECT '════════════════════════════════════════════════════════' as divisor;
SELECT 'Para testar inserção, descomente o bloco abaixo' as instrucao;

/*
-- DESCOMENTE PARA TESTAR:
INSERT INTO public.sales (
    sale_number,
    customer_name,
    total_amount,
    payment_method,
    status,
    notes
) VALUES (
    'TESTE-DIAG-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
    'Cliente Teste Diagnóstico',
    150.00,
    'dinheiro',
    'completed',
    'Teste automático de diagnóstico'
) RETURNING id, sale_number, customer_name, total_amount, created_at;
*/

-- 9. CONTAR VENDAS EXISTENTES
SELECT '════════════════════════════════════════════════════════' as divisor;
SELECT '📈 9. ESTATÍSTICAS DE VENDAS' as etapa;
SELECT '════════════════════════════════════════════════════════' as divisor;

SELECT 
    COUNT(*) as total_vendas,
    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as vendas_hoje,
    COALESCE(SUM(total_amount), 0) as valor_total,
    COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN total_amount END), 0) as valor_hoje
FROM public.sales
WHERE table_name = 'sales' AND table_schema = 'public'
OR NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales' AND table_schema = 'public');

-- 10. RESUMO FINAL
SELECT '════════════════════════════════════════════════════════' as divisor;
SELECT '🎯 10. RESUMO DO DIAGNÓSTICO' as etapa;
SELECT '════════════════════════════════════════════════════════' as divisor;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('sales', 'sale_items', 'cash_operations')) = 3
        THEN '✅ Sistema de vendas está CONFIGURADO'
        ELSE '❌ Sistema de vendas NÃO está configurado - Execute create-sales-BASIC.sql'
    END as status_geral;

-- 11. PRÓXIMOS PASSOS
SELECT '════════════════════════════════════════════════════════' as divisor;
SELECT '📝 PRÓXIMOS PASSOS' as etapa;
SELECT '════════════════════════════════════════════════════════' as divisor;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('sales', 'sale_items', 'cash_operations')) = 0
        THEN 'PASSO 1: Execute o script create-sales-BASIC.sql no Supabase SQL Editor'
        WHEN (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'generate_sale_number') = 0
        THEN 'PASSO 2: A função generate_sale_number não existe. Execute create-sales-BASIC.sql novamente'
        ELSE 'PASSO 3: Tudo configurado! Teste o PDV em /pdv'
    END as proxima_acao;

SELECT '════════════════════════════════════════════════════════' as divisor;
SELECT '✅ DIAGNÓSTICO CONCLUÍDO!' as resultado;
SELECT '════════════════════════════════════════════════════════' as divisor;

