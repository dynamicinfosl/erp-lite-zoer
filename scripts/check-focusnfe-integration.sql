-- Script para verificar se a integração FocusNFe está configurada
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se existem integrações FocusNFe configuradas
SELECT 
  id,
  tenant_id,
  provider,
  environment,
  CASE 
    WHEN api_token IS NOT NULL THEN '✓ Configurado' 
    ELSE '✗ Não configurado' 
  END as token_status,
  cnpj_emitente,
  enabled,
  CASE 
    WHEN focus_empresa_id IS NOT NULL THEN '✓ Provisionado' 
    ELSE '✗ Não provisionado' 
  END as provisioning_status,
  cert_cnpj,
  cert_valid_from,
  cert_valid_to,
  created_at,
  updated_at
FROM public.fiscal_integrations
WHERE provider = 'focusnfe'
ORDER BY created_at DESC;

-- 2. Verificar certificados enviados
SELECT 
  id,
  tenant_id,
  provider,
  CASE 
    WHEN storage_path IS NOT NULL THEN '✓ Arquivo enviado' 
    ELSE '✗ Sem arquivo' 
  END as certificate_file,
  valid_from,
  valid_to,
  cnpj,
  issuer,
  subject,
  created_at
FROM public.fiscal_certificates
WHERE provider = 'focusnfe'
ORDER BY created_at DESC;

-- 3. Verificar tenants (empresas)
SELECT 
  id,
  name,
  document as cnpj,
  email,
  city,
  state
FROM public.tenants
ORDER BY created_at DESC
LIMIT 5;

-- 4. Resumo geral
SELECT 
  COUNT(*) as total_integracoes,
  SUM(CASE WHEN enabled = true THEN 1 ELSE 0 END) as integracoes_ativas,
  SUM(CASE WHEN api_token IS NOT NULL THEN 1 ELSE 0 END) as com_token,
  SUM(CASE WHEN focus_empresa_id IS NOT NULL THEN 1 ELSE 0 END) as provisionadas
FROM public.fiscal_integrations
WHERE provider = 'focusnfe';

