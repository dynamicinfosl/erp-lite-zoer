-- ============================================
-- DIAGNÓSTICO: Por que produtos/clientes não aparecem?
-- ============================================
-- Este script verifica se os dados estão sendo filtrados corretamente por tenant

-- IMPORTANTE: Execute este script no Supabase SQL Editor

-- ============================================
-- 1. VERIFICAR PRODUTOS POR TENANT
-- ============================================

-- Mostrar todos os produtos e seus tenant_id
SELECT 
    'PRODUTOS' as tabela,
    id,
    name,
    sku,
    tenant_id,
    user_id,
    CASE 
        WHEN tenant_id = user_id THEN '✅ CONSISTENTE'
        ELSE '❌ INCONSISTENTE'
    END as status_consistencia
FROM products 
ORDER BY created_at DESC
LIMIT 10;

-- Contar produtos por tenant
SELECT 
    'PRODUTOS POR TENANT' as info,
    tenant_id,
    COUNT(*) as total_produtos
FROM products 
GROUP BY tenant_id
ORDER BY total_produtos DESC;

-- ============================================
-- 2. VERIFICAR CLIENTES POR TENANT
-- ============================================

-- Mostrar todos os clientes e seus tenant_id
SELECT 
    'CLIENTES' as tabela,
    id,
    name,
    email,
    tenant_id,
    user_id,
    CASE 
        WHEN tenant_id = user_id THEN '✅ CONSISTENTE'
        ELSE '❌ INCONSISTENTE'
    END as status_consistencia
FROM customers 
ORDER BY created_at DESC
LIMIT 10;

-- Contar clientes por tenant
SELECT 
    'CLIENTES POR TENANT' as info,
    tenant_id,
    COUNT(*) as total_clientes
FROM customers 
GROUP BY tenant_id
ORDER BY total_clientes DESC;

-- ============================================
-- 3. VERIFICAR VENDAS POR TENANT
-- ============================================

-- Contar vendas por tenant
SELECT 
    'VENDAS POR TENANT' as info,
    tenant_id,
    COUNT(*) as total_vendas
FROM sales 
GROUP BY tenant_id
ORDER BY total_vendas DESC;

-- ============================================
-- 4. VERIFICAR CORRESPONDÊNCIA COM USUÁRIOS AUTH
-- ============================================

-- Verificar se os tenant_id dos dados correspondem aos usuários auth
SELECT 
    'DADOS COM USUARIOS AUTH' as info,
    COUNT(DISTINCT tenant_id) as tenants_com_dados
FROM (
    SELECT tenant_id FROM products WHERE tenant_id IS NOT NULL
    UNION
    SELECT tenant_id FROM customers WHERE tenant_id IS NOT NULL
    UNION
    SELECT tenant_id FROM sales WHERE tenant_id IS NOT NULL
) dados
WHERE tenant_id IN (SELECT id FROM auth.users);

-- ============================================
-- 5. VERIFICAR USUÁRIOS AUTH ATIVOS
-- ============================================

-- Mostrar usuários auth com seus emails
SELECT 
    'USUARIOS AUTH' as info,
    id,
    email,
    last_sign_in_at
FROM auth.users 
ORDER BY last_sign_in_at DESC NULLS LAST
LIMIT 5;

-- ============================================
-- 6. RESUMO GERAL
-- ============================================

-- Resumo de dados por usuário
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
    'RESUMO POR USUARIO' as info,
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
-- 7. MENSAGEM FINAL
-- ============================================

SELECT '🔍 Diagnóstico completo! Verifique os resultados acima.' as resultado;

