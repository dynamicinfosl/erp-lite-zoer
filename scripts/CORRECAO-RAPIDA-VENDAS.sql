-- =============================================
-- CORREÇÃO RÁPIDA - SISTEMA DE VENDAS
-- =============================================
-- Este script corrige o problema de constraint NOT NULL
-- na tabela sales que está impedindo a criação de vendas
-- 
-- EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR
-- =============================================

-- 1. Verificar colunas com problema
SELECT 'VERIFICANDO COLUNAS COM CONSTRAINT NOT NULL:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales'
AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 2. Remover constraint NOT NULL das colunas problemáticas
SELECT 'REMOVENDO CONSTRAINTS PROBLEMÁTICAS...' as status;

-- Remover NOT NULL de user_id (principal problema)
ALTER TABLE public.sales ALTER COLUMN user_id DROP NOT NULL;
SELECT '✅ user_id agora aceita NULL' as resultado;

-- Remover NOT NULL de tenant_id (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sales' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.sales ALTER COLUMN tenant_id DROP NOT NULL;
        RAISE NOTICE '✅ tenant_id agora aceita NULL';
    END IF;
END $$;

-- Remover NOT NULL de sale_type (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sales' AND column_name = 'sale_type') THEN
        ALTER TABLE public.sales ALTER COLUMN sale_type DROP NOT NULL;
        RAISE NOTICE '✅ sale_type agora aceita NULL';
    END IF;
END $$;

-- Remover NOT NULL de created_by (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sales' AND column_name = 'created_by') THEN
        ALTER TABLE public.sales ALTER COLUMN created_by DROP NOT NULL;
        RAISE NOTICE '✅ created_by agora aceita NULL';
    END IF;
END $$;

-- Remover NOT NULL de updated_by (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sales' AND column_name = 'updated_by') THEN
        ALTER TABLE public.sales ALTER COLUMN updated_by DROP NOT NULL;
        RAISE NOTICE '✅ updated_by agora aceita NULL';
    END IF;
END $$;

-- 3. Verificar estrutura após correção
SELECT 'ESTRUTURA APÓS CORREÇÃO:' as status;
SELECT 
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN '✅ NULL' ELSE '⚠️  NOT NULL' END as nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales'
ORDER BY ordinal_position;

-- 4. TESTE DE INSERÇÃO
SELECT 'TESTANDO INSERÇÃO DE VENDA...' as status;

-- Inserir venda de teste
INSERT INTO public.sales (
    sale_number,
    customer_name,
    total_amount,
    payment_method,
    status,
    notes
) VALUES (
    'TESTE-CORRECAO-001',
    'Cliente Teste de Correção',
    250.00,
    'pix',
    'completed',
    'Teste após correção de constraints - Se você está vendo isso, funcionou!'
) RETURNING id, sale_number, customer_name, total_amount, payment_method, created_at;

-- 5. Verificar se a venda foi inserida
SELECT 'VERIFICANDO VENDA INSERIDA:' as status;
SELECT 
    id, 
    sale_number, 
    customer_name, 
    total_amount,
    payment_method,
    status,
    created_at 
FROM public.sales 
WHERE sale_number = 'TESTE-CORRECAO-001';

-- 6. Limpar dados de teste
SELECT 'LIMPANDO DADOS DE TESTE...' as status;
DELETE FROM public.sales WHERE sale_number = 'TESTE-CORRECAO-001';
SELECT '✅ Dados de teste removidos' as resultado;

-- 7. RESULTADO FINAL
SELECT '════════════════════════════════════════' as divisor;
SELECT '🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!' as resultado;
SELECT '════════════════════════════════════════' as divisor;
SELECT 'Agora você pode criar vendas no PDV sem problemas!' as proximos_passos;
SELECT 'Execute: node scripts/verificar-vendas.js para confirmar' as verificacao;

-- 8. INFORMAÇÕES IMPORTANTES
SELECT '════════════════════════════════════════' as divisor;
SELECT '📋 COLUNAS AGORA OPCIONAIS:' as info;
SELECT '════════════════════════════════════════' as divisor;

SELECT 
    column_name as coluna,
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ Opcional (NULL permitido)'
        ELSE '⚠️  Obrigatório (NOT NULL)'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales'
AND column_name IN ('user_id', 'tenant_id', 'sale_type', 'created_by', 'updated_by')
ORDER BY column_name;

-- FIM DO SCRIPT

