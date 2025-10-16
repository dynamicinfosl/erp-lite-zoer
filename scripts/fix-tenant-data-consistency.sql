-- ============================================
-- CORREÇÃO: Consistência de Dados por Tenant
-- ============================================
-- Este script corrige a inconsistência entre tenant_id e user_id
-- garantindo que cada usuário veja apenas seus próprios dados

-- IMPORTANTE: Execute este script no Supabase SQL Editor

-- ============================================
-- 1. CORRIGIR PRODUTOS
-- ============================================

-- Atualizar produtos onde tenant_id != user_id
UPDATE products 
SET tenant_id = user_id
WHERE tenant_id != user_id 
   OR tenant_id IS NULL 
   OR user_id IS NULL;

-- Verificar resultado
SELECT 
    'PRODUTOS CORRIGIDOS' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN tenant_id = user_id THEN 1 END) as consistentes,
    COUNT(CASE WHEN tenant_id != user_id THEN 1 END) as inconsistentes
FROM products;

-- ============================================
-- 2. CORRIGIR CLIENTES
-- ============================================

-- Atualizar clientes onde tenant_id != user_id
UPDATE customers 
SET tenant_id = user_id
WHERE tenant_id != user_id 
   OR tenant_id IS NULL 
   OR user_id IS NULL;

-- Verificar resultado
SELECT 
    'CLIENTES CORRIGIDOS' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN tenant_id = user_id THEN 1 END) as consistentes,
    COUNT(CASE WHEN tenant_id != user_id THEN 1 END) as inconsistentes
FROM customers;

-- ============================================
-- 3. CORRIGIR VENDAS
-- ============================================

-- Atualizar vendas onde tenant_id != user_id
UPDATE sales 
SET tenant_id = user_id
WHERE tenant_id != user_id 
   OR tenant_id IS NULL 
   OR user_id IS NULL;

-- Verificar resultado
SELECT 
    'VENDAS CORRIGIDAS' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN tenant_id = user_id THEN 1 END) as consistentes,
    COUNT(CASE WHEN tenant_id != user_id THEN 1 END) as inconsistentes
FROM sales;

-- ============================================
-- 4. VERIFICAÇÃO FINAL
-- ============================================

-- Mostrar dados por usuário após correção
WITH user_summary AS (
    SELECT 
        u.id as user_id,
        u.email,
        COUNT(DISTINCT p.id) as produtos,
        COUNT(DISTINCT c.id) as clientes,
        COUNT(DISTINCT s.id) as vendas
    FROM auth.users u
    LEFT JOIN products p ON p.user_id = u.id AND p.tenant_id = u.id
    LEFT JOIN customers c ON c.user_id = u.id AND c.tenant_id = u.id
    LEFT JOIN sales s ON s.user_id = u.id AND s.tenant_id = u.id
    GROUP BY u.id, u.email
)
SELECT 
    user_id,
    email,
    produtos,
    clientes,
    vendas,
    CASE 
        WHEN produtos > 0 OR clientes > 0 OR vendas > 0 THEN '✅ DADOS DISPONÍVEIS'
        ELSE '⚠️ SEM DADOS'
    END as status
FROM user_summary
ORDER BY produtos + clientes + vendas DESC;

-- ============================================
-- 5. MENSAGEM DE SUCESSO
-- ============================================

SELECT '✅ Dados corrigidos! Agora cada usuário verá apenas seus próprios dados.' as resultado;

