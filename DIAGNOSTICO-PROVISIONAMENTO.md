# 🔍 Diagnóstico: Erro ao Provisionar Empresa na FocusNFe

**Data:** 19 de Dezembro de 2025

---

## 🎯 Problema Relatado

Erro 400 (Bad Request) ao tentar provisionar empresa na FocusNFe através da página `/configuracao-fiscal`.

---

## 📋 Checklist de Diagnóstico

Execute esta checklist **na ordem** para identificar o problema:

### ✅ 1. Verificar Variáveis de Ambiente

Abra o terminal e execute:

```bash
# PowerShell (Windows)
cd "C:\Users\milen\trabalhos\em andamento\erp-lite-zoer"
node -e "console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL); console.log('SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'FALTANDO'); console.log('ENCRYPTION_KEY:', process.env.FISCAL_CERT_ENCRYPTION_KEY ? 'Configurada' : 'FALTANDO');"
```

**Resultado esperado:**
```
SUPABASE_URL: https://lfxietcasaooenffdodr.supabase.co
SERVICE_KEY: Configurada
ENCRYPTION_KEY: Configurada
```

**Se alguma variável estiver faltando:**
1. Abra o arquivo `.env.local`
2. Adicione a variável faltante
3. Reinicie o servidor

---

### ✅ 2. Verificar Dados do Tenant (Empresa)

Execute este SQL no **Supabase Dashboard** → **SQL Editor**:

```sql
-- Substitua 'TENANT_ID_AQUI' pelo ID real do seu tenant
SELECT 
  id,
  name,
  document,
  LENGTH(REGEXP_REPLACE(document, '[^0-9]', '', 'g')) as cnpj_length,
  razao_social,
  nome_fantasia,
  email,
  phone,
  address,
  numero,
  bairro,
  city,
  state,
  zip_code,
  inscricao_estadual,
  inscricao_municipal
FROM tenants 
WHERE id = 'TENANT_ID_AQUI';
```

**Verificar:**
- ✅ `document` deve ter **14 dígitos numéricos** (pode ter formatação, mas sem formatação deve ter 14)
- ✅ `razao_social` ou `nome_fantasia` ou `name` deve estar preenchido
- ✅ `email` deve estar preenchido
- ✅ `address`, `numero`, `bairro`, `city`, `state`, `zip_code` devem estar preenchidos
- ✅ `state` deve ter **2 letras** (ex: SP, RJ, MG)

**Problema comum: CNPJ inválido**

Se `cnpj_length` não for 14:
```sql
-- Corrigir CNPJ (exemplo com CNPJ fictício)
UPDATE tenants 
SET document = '12345678000190'  -- 14 dígitos
WHERE id = 'TENANT_ID_AQUI';
```

**Problema comum: Campos de endereço faltando**

```sql
-- Preencher campos faltantes
UPDATE tenants 
SET 
  address = 'Rua Exemplo',
  numero = '123',
  bairro = 'Centro',
  city = 'São Paulo',
  state = 'SP',
  zip_code = '01310100'
WHERE id = 'TENANT_ID_AQUI';
```

---

### ✅ 3. Verificar Integração FocusNFe

Execute este SQL:

```sql
-- Substitua 'TENANT_ID_AQUI' pelo ID real
SELECT 
  id,
  tenant_id,
  provider,
  environment,
  enabled,
  api_token IS NOT NULL as token_configured,
  focus_empresa_id
FROM fiscal_integrations
WHERE tenant_id = 'TENANT_ID_AQUI' 
  AND provider = 'focusnfe';
```

**Verificar:**
- ✅ Registro existe
- ✅ `enabled` = `true`
- ✅ `token_configured` = `true`
- ✅ `environment` = `homologacao` ou `producao`

**Se não existir registro:**
1. Acesse `/configuracao-fiscal`
2. Vá na aba "Integração"
3. Configure token + ambiente + habilite
4. Salve

**Se `enabled` = `false`:**
```sql
UPDATE fiscal_integrations
SET enabled = true
WHERE tenant_id = 'TENANT_ID_AQUI' AND provider = 'focusnfe';
```

**Se `api_token` estiver vazio:**
1. Obtenha o token em: https://app-v2.focusnfe.com.br/
2. Configure na página `/configuracao-fiscal`

---

### ✅ 4. Verificar Certificado Digital

Execute este SQL:

```sql
-- Substitua 'TENANT_ID_AQUI' pelo ID real
SELECT 
  id,
  tenant_id,
  provider,
  storage_path,
  original_filename,
  status,
  created_at,
  password_ciphertext_b64 IS NOT NULL as password_encrypted
FROM fiscal_certificates
WHERE tenant_id = 'TENANT_ID_AQUI' 
  AND provider = 'focusnfe'
ORDER BY created_at DESC
LIMIT 1;
```

**Verificar:**
- ✅ Registro existe
- ✅ `storage_path` está preenchido
- ✅ `password_encrypted` = `true`
- ✅ `status` = `active` ou similar

**Se não existir certificado:**
1. Acesse `/configuracao-fiscal`
2. Vá na aba "Certificado"
3. Faça upload do arquivo `.pfx` ou `.p12`
4. Digite a senha
5. Clique em "Enviar Certificado"

**Verificar se o arquivo existe no Storage:**

No **Supabase Dashboard** → **Storage** → **fiscal-certificates**:
- Deve existir uma pasta com o `tenant_id`
- Dentro dela, deve ter o arquivo `.pfx`

---

### ✅ 5. Verificar Token FocusNFe (Válido)

O token deve ser válido e ter permissões para criar empresas.

**Testar token manualmente:**

```bash
# PowerShell (Windows)
$token = "SEU_TOKEN_FOCUSNFE_AQUI"
$base64Token = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${token}:"))

Invoke-RestMethod -Uri "https://homologacao.focusnfe.com.br/v2/empresas" `
  -Method GET `
  -Headers @{
    "Authorization" = "Basic $base64Token"
  }
```

**Resultado esperado:**
- Status 200
- Lista de empresas (pode estar vazia)

**Se retornar erro 401/403:**
- Token está inválido ou expirado
- Obtenha um novo token em: https://app-v2.focusnfe.com.br/

---

### ✅ 6. Verificar Logs do Servidor

Após melhorar o tratamento de erro, tente provisionar novamente e observe:

**No console do navegador (F12):**
- Procure por `❌ Erro ao provisionar:`
- Copie toda a mensagem de erro

**Na mensagem toast (notificação):**
- Leia a mensagem de erro completa
- Anote o "Status HTTP" se aparecer

**Erros comuns e soluções:**

| Erro | Causa | Solução |
|------|-------|---------|
| `tenant_id inválido` | UUID malformado | Verificar autenticação |
| `Tenant não encontrado` | Tenant não existe no DB | Verificar ID do tenant |
| `Tenant sem CNPJ válido` | CNPJ ≠ 14 dígitos | Corrigir no banco (ver passo 2) |
| `Integração FocusNFe não configurada` | Sem registro em fiscal_integrations | Configurar na página (ver passo 3) |
| `Nenhum certificado enviado` | Sem certificado no DB/Storage | Fazer upload (ver passo 4) |
| `Erro ao baixar certificado` | Arquivo não existe no Storage | Reenviar certificado |
| `FISCAL_CERT_ENCRYPTION_KEY não configurada` | Variável faltando | Adicionar no .env.local |
| FocusNFe retorna erro | Problema na API FocusNFe | Ver detalhes do provider_error |

---

## 🔧 Script de Diagnóstico Automático

Salve este script como `diagnostico-provisioning.sql` e execute no Supabase:

```sql
-- DIAGNÓSTICO COMPLETO DE PROVISIONAMENTO
-- Substitua 'TENANT_ID_AQUI' pelo ID real do tenant

DO $$
DECLARE
  v_tenant_id UUID := 'TENANT_ID_AQUI';
  v_cnpj TEXT;
  v_cnpj_length INT;
  v_integration_exists BOOLEAN;
  v_cert_exists BOOLEAN;
  v_status TEXT := '';
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNÓSTICO DE PROVISIONAMENTO';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- 1. Verificar Tenant
  RAISE NOTICE '1. VERIFICANDO DADOS DO TENANT...';
  SELECT 
    REGEXP_REPLACE(document, '[^0-9]', '', 'g'),
    LENGTH(REGEXP_REPLACE(document, '[^0-9]', '', 'g'))
  INTO v_cnpj, v_cnpj_length
  FROM tenants WHERE id = v_tenant_id;
  
  IF v_cnpj_length = 14 THEN
    RAISE NOTICE '   ✅ CNPJ válido: % (% dígitos)', v_cnpj, v_cnpj_length;
  ELSE
    RAISE NOTICE '   ❌ CNPJ INVÁLIDO: % dígitos (esperado: 14)', v_cnpj_length;
  END IF;
  
  RAISE NOTICE '';
  
  -- 2. Verificar Integração
  RAISE NOTICE '2. VERIFICANDO INTEGRAÇÃO FOCUSNFE...';
  SELECT EXISTS(
    SELECT 1 FROM fiscal_integrations 
    WHERE tenant_id = v_tenant_id 
      AND provider = 'focusnfe'
      AND enabled = true
      AND api_token IS NOT NULL
  ) INTO v_integration_exists;
  
  IF v_integration_exists THEN
    RAISE NOTICE '   ✅ Integração configurada e habilitada';
  ELSE
    RAISE NOTICE '   ❌ Integração NÃO configurada ou desabilitada';
  END IF;
  
  RAISE NOTICE '';
  
  -- 3. Verificar Certificado
  RAISE NOTICE '3. VERIFICANDO CERTIFICADO...';
  SELECT EXISTS(
    SELECT 1 FROM fiscal_certificates
    WHERE tenant_id = v_tenant_id
      AND provider = 'focusnfe'
      AND storage_path IS NOT NULL
      AND password_ciphertext_b64 IS NOT NULL
  ) INTO v_cert_exists;
  
  IF v_cert_exists THEN
    RAISE NOTICE '   ✅ Certificado enviado e senha criptografada';
  ELSE
    RAISE NOTICE '   ❌ Certificado NÃO encontrado ou senha faltando';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESULTADO FINAL';
  RAISE NOTICE '========================================';
  
  IF v_cnpj_length = 14 AND v_integration_exists AND v_cert_exists THEN
    RAISE NOTICE '✅ TUDO OK - Pode provisionar!';
  ELSE
    RAISE NOTICE '❌ CORRIGIR PROBLEMAS ACIMA antes de provisionar';
  END IF;
  
END $$;
```

---

## 🚨 Erro Específico da FocusNFe

Se o erro vier da FocusNFe (campo `provider_error`), pode ser:

### Erro: "Certificado inválido"
**Causa:** Certificado corrompido, expirado ou senha incorreta

**Solução:**
1. Verifique a validade do certificado
2. Teste o certificado em outro sistema
3. Reenvie o certificado com a senha correta

### Erro: "CNPJ já cadastrado"
**Causa:** Empresa já foi provisionada anteriormente

**Solução:**
- Isso é normal em alguns casos
- O sistema deveria fazer `PUT` em vez de `POST`
- Verifique se `focus_empresa_id` está preenchido no banco

### Erro: "Token inválido"
**Causa:** Token da API FocusNFe inválido ou expirado

**Solução:**
1. Acesse https://app-v2.focusnfe.com.br/
2. Gere um novo token
3. Atualize na página `/configuracao-fiscal`

---

## 📞 Próximos Passos

1. **Execute o checklist acima na ordem**
2. **Anote qual passo falhou**
3. **Corrija o problema identificado**
4. **Tente provisionar novamente**
5. **Observe a mensagem de erro detalhada** (melhorada no código)
6. **Compartilhe os logs** se o problema persistir

---

## 📝 Informações para Suporte

Se precisar de ajuda, forneça:

1. ✅ Resultado do SQL de diagnóstico (passo 2, 3 e 4)
2. ✅ Mensagem de erro completa do console do navegador
3. ✅ Status HTTP retornado
4. ✅ Conteúdo do `provider_error` (se houver)
5. ✅ Ambiente usado (homologação/produção)

---

**Última atualização:** 19/12/2025







