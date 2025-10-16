-- ============================================
-- AJUSTAR VALOR PADRÃO DA COLUNA tenant_id
-- ============================================
-- Remove o valor padrão fixo da coluna tenant_id em sales
-- para que a aplicação sempre forneça o tenant_id correto

-- IMPORTANTE: Execute este script APÓS fix-foreign-key-constraints.sql

-- ============================================
-- 1. REMOVER VALOR PADRÃO FIXO
-- ============================================

-- Remover valor padrão da tabela sales
ALTER TABLE sales 
ALTER COLUMN tenant_id DROP DEFAULT;

-- Verificar se foi removido
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sales'
  AND column_name = 'tenant_id'
  AND table_schema = 'public';

-- ============================================
-- 2. ATUALIZAR VENDAS EXISTENTES COM O UUID PADRÃO
-- ============================================

-- Se você tem vendas com o UUID padrão '11111111-1111-1111-1111-111111111111'
-- e quer atribuí-las ao seu usuário, substitua 'SEU-USER-ID-AQUI'
-- pelo seu user_id real (você pode ver nos logs do console)

-- OPÇÃO 1: Atualizar todas as vendas para um usuário específico
-- Descomente e ajuste o comando abaixo:

-- UPDATE sales 
-- SET tenant_id = 'SEU-USER-ID-AQUI'
-- WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

-- OPÇÃO 2: Usar a tabela user_memberships se existir
-- UPDATE sales s
-- SET tenant_id = um.user_id
-- FROM user_memberships um
-- WHERE s.user_id = um.user_id
--   AND um.is_active = true
--   AND s.tenant_id = '11111111-1111-1111-1111-111111111111';

-- OPÇÃO 3: Usar o user_id da própria venda
-- Esta é a opção mais segura - cada venda fica com o tenant_id do usuário que a criou
UPDATE sales 
SET tenant_id = user_id
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

-- ============================================
-- 3. VERIFICAR VENDAS POR TENANT
-- ============================================

-- Ver quantas vendas existem por tenant_id
SELECT 
  tenant_id,
  COUNT(*) as total_vendas,
  SUM(final_amount) as valor_total,
  MIN(sold_at) as primeira_venda,
  MAX(sold_at) as ultima_venda
FROM sales
GROUP BY tenant_id
ORDER BY total_vendas DESC;

-- Ver detalhes das vendas
SELECT 
  id,
  sale_number,
  customer_name,
  final_amount,
  payment_method,
  tenant_id,
  user_id,
  sold_at
FROM sales
ORDER BY sold_at DESC
LIMIT 10;

-- ============================================
-- MENSAGENS DE SUCESSO
-- ============================================

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Valor padrão removido da coluna tenant_id';
    RAISE NOTICE '✅ Vendas atualizadas para usar user_id como tenant_id';
    RAISE NOTICE '';
    RAISE NOTICE '📝 A partir de agora:';
    RAISE NOTICE '- Novas vendas usarão o tenant_id fornecido pela aplicação';
    RAISE NOTICE '- Cada usuário verá apenas suas próprias vendas';
END $$;


