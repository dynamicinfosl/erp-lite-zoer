-- Verificar quais API Keys estão associadas a quais tenants

-- 1. Listar TODAS as API Keys e seus respectivos tenants
SELECT 
  ak.id as api_key_id,
  ak.name as nome,
  LEFT(ak.key_hash, 20) || '...' as key_inicio,
  ak.tenant_id,
  t.name as tenant_nome,
  ak.is_active as ativa,
  ak.created_at
FROM api_keys ak
LEFT JOIN tenants t ON t.id = ak.tenant_id
ORDER BY ak.created_at DESC;

-- 2. Verificar qual API Key está no Tenant B (correto - com variações)
SELECT 
  ak.id as api_key_id,
  ak.name as nome,
  LEFT(ak.key_hash, 20) || '...' as key_inicio,
  ak.is_active as ativa,
  ak.created_at
FROM api_keys ak
WHERE ak.tenant_id = 'ffd61c21-81d8-49f0-8b70-b1c0f05f6960'
ORDER BY ak.created_at DESC;

-- 3. Verificar qual API Key está no Tenant A (errado - sem variações)
SELECT 
  ak.id as api_key_id,
  ak.name as nome,
  LEFT(ak.key_hash, 20) || '...' as key_inicio,
  ak.is_active as ativa,
  ak.created_at
FROM api_keys ak
WHERE ak.tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34'
ORDER BY ak.created_at DESC;

-- 4. Contar produtos e variações por tenant
SELECT 
  'Tenant A (SEM variações)' as info,
  '132b42a6-6355-4418-996e-de7eb33f6e34' as tenant_id,
  (SELECT COUNT(*) FROM products WHERE tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34') as total_produtos,
  (SELECT COUNT(*) FROM product_variants WHERE tenant_id = '132b42a6-6355-4418-996e-de7eb33f6e34') as total_variacoes

UNION ALL

SELECT 
  'Tenant B (COM variações)' as info,
  'ffd61c21-81d8-49f0-8b70-b1c0f05f6960' as tenant_id,
  (SELECT COUNT(*) FROM products WHERE tenant_id = 'ffd61c21-81d8-49f0-8b70-b1c0f05f6960') as total_produtos,
  (SELECT COUNT(*) FROM product_variants WHERE tenant_id = 'ffd61c21-81d8-49f0-8b70-b1c0f05f6960') as total_variacoes;
