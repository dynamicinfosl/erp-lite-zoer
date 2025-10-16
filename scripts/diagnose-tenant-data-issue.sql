-- ============================================
-- DIAGNÓSTICO: Problema de Dados por Tenant
-- ============================================
-- Este script ajuda a diagnosticar por que os dados não aparecem
-- para cada usuário no sistema

-- IMPORTANTE: Execute este script no Supabase SQL Editor

-- ============================================
-- 1. VERIFICAR USUÁRIOS AUTENTICADOS
-- ============================================

-- Mostrar todos os usuários do auth.users
SELECT 
    id as user_id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC;

-- ============================================
-- 2. VERIFICAR PRODUTOS POR TENANT
-- ============================================

-- Mostrar todos os produtos e seus tenant_id
SELECT 
    id,
    name,
    sku,
    tenant_id,
    user_id,
    created_at
FROM products 
ORDER BY created_at DESC;

-- Contar produtos por tenant
SELECT 
    tenant_id,
    COUNT(*) as total_produtos,
    MIN(created_at) as primeiro_produto,
    MAX(created_at) as ultimo_produto
FROM products 
GROUP BY tenant_id
ORDER BY total_produtos DESC;

-- ============================================
-- 3. VERIFICAR CLIENTES POR TENANT
-- ============================================

-- Mostrar todos os clientes e seus tenant_id
SELECT 
    id,
    name,
    email,
    tenant_id,
    user_id,
    created_at
FROM customers 
ORDER BY created_at DESC;

-- Contar clientes por tenant
SELECT 
    tenant_id,
    COUNT(*) as total_clientes,
    MIN(created_at) as primeiro_cliente,
    MAX(created_at) as ultimo_cliente
FROM customers 
GROUP BY tenant_id
ORDER BY total_clientes DESC;

-- ============================================
-- 4. VERIFICAR VENDAS POR TENANT
-- ============================================

-- Mostrar todas as vendas e seus tenant_id
SELECT 
    id,
    sale_number,
    total_amount,
    tenant_id,
    user_id,
    created_at
FROM sales 
ORDER BY created_at DESC;

-- Contar vendas por tenant
SELECT 
    tenant_id,
    COUNT(*) as total_vendas,
    SUM(total_amount) as valor_total,
    MIN(created_at) as primeira_venda,
    MAX(created_at) as ultima_venda
FROM sales 
GROUP BY tenant_id
ORDER BY total_vendas DESC;

-- ============================================
-- 5. VERIFICAR CONSISTÊNCIA tenant_id vs user_id
-- ============================================

-- Produtos onde tenant_id != user_id
SELECT 
    'PRODUTOS' as tabela,
    id,
    name,
    tenant_id,
    user_id,
    CASE 
        WHEN tenant_id = user_id THEN '✅ CONSISTENTE'
        ELSE '❌ INCONSISTENTE'
    END as status
FROM products
WHERE tenant_id != user_id OR tenant_id IS NULL OR user_id IS NULL;

-- Clientes onde tenant_id != user_id
SELECT 
    'CLIENTES' as tabela,
    id,
    name,
    tenant_id,
    user_id,
    CASE 
        WHEN tenant_id = user_id THEN '✅ CONSISTENTE'
        ELSE '❌ INCONSISTENTE'
    END as status
FROM customers
WHERE tenant_id != user_id OR tenant_id IS NULL OR user_id IS NULL;

-- Vendas onde tenant_id != user_id
SELECT 
    'VENDAS' as tabela,
    id,
    sale_number,
    tenant_id,
    user_id,
    CASE 
        WHEN tenant_id = user_id THEN '✅ CONSISTENTE'
        ELSE '❌ INCONSISTENTE'
    END as status
FROM sales
WHERE tenant_id != user_id OR tenant_id IS NULL OR user_id IS NULL;

-- ============================================
-- 6. VERIFICAR TENANTS TABLE
-- ============================================

-- Mostrar tabela tenants (se existir)
SELECT 
    id,
    uuid,
    email,
    trial_ends_at,
    created_at
FROM tenants 
ORDER BY created_at DESC;

-- ============================================
-- 7. RESUMO EXECUTIVO
-- ============================================

-- Resumo geral do sistema
SELECT 
    'RESUMO GERAL' as secao,
    (SELECT COUNT(*) FROM auth.users) as total_usuarios,
    (SELECT COUNT(*) FROM products) as total_produtos,
    (SELECT COUNT(*) FROM customers) as total_clientes,
    (SELECT COUNT(*) FROM sales) as total_vendas;

-- Resumo por usuário (tenant)
WITH user_data AS (
    SELECT 
        u.id as user_id,
        u.email,
        COUNT(DISTINCT p.id) as produtos,
        COUNT(DISTINCT c.id) as clientes,
        COUNT(DISTINCT s.id) as vendas
    FROM auth.users u
    LEFT JOIN products p ON p.user_id = u.id
    LEFT JOIN customers c ON c.user_id = u.id  
    LEFT JOIN sales s ON s.user_id = u.id
    GROUP BY u.id, u.email
)
SELECT 
    user_id,
    email,
    produtos,
    clientes,
    vendas,
    CASE 
        WHEN produtos = 0 AND clientes = 0 AND vendas = 0 THEN '❌ SEM DADOS'
        WHEN produtos > 0 OR clientes > 0 OR vendas > 0 THEN '✅ COM DADOS'
    END as status
FROM user_data
ORDER BY produtos + clientes + vendas DESC;

-- ============================================
-- 8. MENSAGEM FINAL
-- ============================================

SELECT '🔍 Diagnóstico completo! Verifique os resultados acima.' as resultado;

