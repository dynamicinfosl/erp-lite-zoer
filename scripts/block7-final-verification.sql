-- =============================================
-- BLOCO 7: VERIFICAÇÃO FINAL (Execute separadamente)
-- =============================================

-- Verificar todas as tabelas criadas
SELECT 'TABELAS CRIADAS:' as verificacao;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sales', 'sale_items', 'cash_operations')
ORDER BY table_name;

-- Verificar colunas tenant_id
SELECT 'COLUNAS TENANT_ID:' as verificacao;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('products', 'customers', 'sales', 'sale_items', 'cash_operations')
AND column_name = 'tenant_id'
ORDER BY table_name;

-- Verificar índices
SELECT 'ÍNDICES CRIADOS:' as verificacao;
SELECT 
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('products', 'customers', 'sales', 'sale_items', 'cash_operations')
ORDER BY tablename, indexname;

-- Verificar políticas RLS
SELECT 'POLÍTICAS RLS:' as verificacao;
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('sales', 'sale_items', 'cash_operations')
ORDER BY tablename, policyname;

-- Verificar funções
SELECT 'FUNÇÕES CRIADAS:' as verificacao;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('generate_sale_number', 'calculate_sale_totals', 'update_stock_after_sale')
ORDER BY routine_name;

-- Teste da função de geração de número
SELECT 'TESTE FUNÇÃO:' as verificacao;
SELECT generate_sale_number('00000000-0000-0000-0000-000000000000') as numero_teste;

-- Inserir operação de abertura de caixa para todos os tenants
INSERT INTO public.cash_operations (tenant_id, operation_type, amount, description)
SELECT 
    t.id,
    'abertura',
    0.00,
    'Abertura de caixa - valor inicial'
FROM public.tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM public.cash_operations co 
    WHERE co.tenant_id = t.id 
    AND co.operation_type = 'abertura'
    AND DATE(co.created_at) = CURRENT_DATE
)
ON CONFLICT DO NOTHING;

SELECT 'SETUP COMPLETO! PDV INTEGRADO COM SUPABASE!' as resultado;


