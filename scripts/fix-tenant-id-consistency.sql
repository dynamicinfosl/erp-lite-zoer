-- Script para corrigir inconsistência de tenant_id
-- Este script atualiza produtos e clientes para usar o user_id como tenant_id

-- ============================================
-- PRODUTOS: Atualizar tenant_id para user_id
-- ============================================

-- Opção 1: Se você tem apenas UM usuário e quer atribuir todos os produtos para ele
-- Substitua 'SEU-USER-ID-AQUI' pelo user_id real do Supabase
-- UPDATE products 
-- SET tenant_id = 'SEU-USER-ID-AQUI'
-- WHERE tenant_id IS NOT NULL;

-- Opção 2: Se você tem a tabela user_memberships configurada
-- Esta opção usa o user_id da membership para atualizar o tenant_id
UPDATE products p
SET tenant_id = um.user_id
FROM user_memberships um
WHERE p.user_id = um.user_id
  AND um.is_active = true
  AND p.tenant_id != um.user_id;

-- ============================================
-- CLIENTES: Atualizar tenant_id para user_id
-- ============================================

-- Opção 1: Se você tem apenas UM usuário e quer atribuir todos os clientes para ele
-- Substitua 'SEU-USER-ID-AQUI' pelo user_id real do Supabase
-- UPDATE customers 
-- SET tenant_id = 'SEU-USER-ID-AQUI'
-- WHERE tenant_id IS NOT NULL;

-- Opção 2: Se você tem a tabela user_memberships configurada
UPDATE customers c
SET tenant_id = um.user_id
FROM user_memberships um
WHERE c.user_id = um.user_id
  AND um.is_active = true
  AND c.tenant_id != um.user_id;

-- ============================================
-- VENDAS: Atualizar tenant_id para user_id
-- ============================================

-- Opção 1: Se você tem apenas UM usuário
-- UPDATE sales 
-- SET tenant_id = 'SEU-USER-ID-AQUI'
-- WHERE tenant_id IS NOT NULL;

-- Opção 2: Com user_memberships
UPDATE sales s
SET tenant_id = um.user_id
FROM user_memberships um
WHERE s.user_id = um.user_id
  AND um.is_active = true
  AND s.tenant_id != um.user_id;

-- ============================================
-- VERIFICAÇÃO: Ver quantos registros existem por tenant
-- ============================================

-- Ver produtos por tenant_id
SELECT 
  tenant_id,
  COUNT(*) as total_produtos,
  MIN(created_at) as primeiro_cadastro,
  MAX(created_at) as ultimo_cadastro
FROM products
GROUP BY tenant_id
ORDER BY total_produtos DESC;

-- Ver clientes por tenant_id
SELECT 
  tenant_id,
  COUNT(*) as total_clientes,
  MIN(created_at) as primeiro_cadastro,
  MAX(created_at) as ultimo_cadastro
FROM customers
GROUP BY tenant_id
ORDER BY total_clientes DESC;

-- ============================================
-- LIMPEZA: Remover tenant_id 00000000 (se aplicável)
-- ============================================

-- CUIDADO: Execute apenas se você realmente quer remover dados com tenant_id zero
-- DELETE FROM products WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
-- DELETE FROM customers WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
-- DELETE FROM sales WHERE tenant_id = '00000000-0000-0000-0000-000000000000';


