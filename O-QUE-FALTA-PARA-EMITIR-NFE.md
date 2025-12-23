# ✅ O que falta para conseguir emitir Nota Fiscal no Sistema

**Data:** 19 de Dezembro de 2025  
**Status:** Página implementada, configuração pendente

---

## 📊 Resumo Executivo

A **página de configuração fiscal** já está **100% implementada** em `/configuracao-fiscal`. O backend também está completo com todas as rotas necessárias. Para conseguir emitir notas fiscais, é necessário completar o **processo de configuração** seguindo os passos abaixo.

---

## 🔍 Checklist de Pré-Requisitos

Para emitir nota fiscal, o sistema valida os seguintes requisitos **nesta ordem**:

### ✅ 1. Variáveis de Ambiente (Servidor)

**Status:** ⚠️ **Verificar se estão configuradas**

**Arquivo:** `.env.local` (já criado)

**Variáveis obrigatórias:**

```env
# Conexão com Supabase
NEXT_PUBLIC_SUPABASE_URL=https://lfxietcasaooenffdodr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[já configurado]
SUPABASE_SERVICE_ROLE_KEY=[PRECISA CONFIGURAR - pegar no Supabase Dashboard]

# Criptografia de certificados - CRÍTICA!
FISCAL_CERT_ENCRYPTION_KEY=[já gerada automaticamente]
```

**Como obter `SUPABASE_SERVICE_ROLE_KEY`:**

1. Acesse: https://supabase.com/dashboard/project/lfxietcasaooenffdodr/settings/api
2. Copie a **service_role key** (secret)
3. Cole no arquivo `.env.local`
4. **Reinicie o servidor** após configurar

**⚠️ IMPORTANTE:** Sem essas variáveis, nenhuma rota da API fiscal funcionará!

---

### ✅ 2. Dados Cadastrais da Empresa (Tenant)

**Status:** ⚠️ **Verificar se estão completos**

**Onde configurar:** `/perfil-empresa`

**Campos obrigatórios na tabela `tenants`:**

- ✅ `document` (CNPJ com 14 dígitos - sem formatação)
- ✅ `razao_social` ou `nome_fantasia` ou `name`
- ✅ `email`
- ✅ `phone`
- ✅ `address` (logradouro)
- ✅ `numero`
- ✅ `bairro`
- ✅ `city` (município)
- ✅ `state` (UF - 2 letras)
- ✅ `zip_code` (CEP)
- 🔸 `complemento` (opcional)
- 🔸 `inscricao_estadual` (opcional, mas recomendado)
- 🔸 `inscricao_municipal` (opcional, mas recomendado)

**Erro comum:**
```
"Tenant sem CNPJ válido (tenants.document)"
```

**Solução:** Certifique-se de que o CNPJ tem exatamente 14 dígitos numéricos.

---

### ✅ 3. Configuração da Integração FocusNFe

**Status:** ⚠️ **Precisa configurar**

**Onde configurar:** `/configuracao-fiscal` → Aba **Integração**

**Passos:**

1. Obtenha seu **token da API FocusNFe**:
   - Acesse: https://app-v2.focusnfe.com.br/
   - Faça login ou crie uma conta
   - Vá em **Configurações → API → Tokens**
   - Copie o token

2. Na página `/configuracao-fiscal`:
   - Cole o token no campo "Token da API FocusNFe"
   - Selecione o ambiente (**Homologação** para testes)
   - Marque ✅ "Habilitar integração"
   - Clique em **Salvar**

**O que acontece:** Um registro é criado/atualizado na tabela `fiscal_integrations` com:
- `tenant_id`
- `provider: 'focusnfe'`
- `api_token`
- `environment: 'homologacao'` ou `'producao'`
- `enabled: true`

**Erro comum:**
```
"Integração FocusNFe não configurada ou desabilitada para este tenant"
```

---

### ✅ 4. Upload do Certificado Digital A1

**Status:** ⚠️ **Precisa fazer upload**

**Onde configurar:** `/configuracao-fiscal` → Aba **Certificado**

**Passos:**

1. Tenha em mãos:
   - Arquivo do certificado digital A1 (`.pfx` ou `.p12`)
   - Senha do certificado

2. Na página `/configuracao-fiscal`:
   - Clique em "Escolher arquivo" e selecione o certificado
   - Digite a senha do certificado
   - Clique em **Enviar Certificado**

**O que acontece:**
- Arquivo é enviado para o **Supabase Storage** (bucket privado `fiscal-certificates`)
- Senha é **criptografada** usando `FISCAL_CERT_ENCRYPTION_KEY` (AES-256-GCM)
- Metadados são salvos na tabela `fiscal_certificates`

**⚠️ IMPORTANTE:**
- A variável `FISCAL_CERT_ENCRYPTION_KEY` **NUNCA** deve ser alterada depois de gravar certificados
- Se mudar a chave, não será possível descriptografar senhas existentes

**Erro comum:**
```
"Certificado não encontrado ou senha não configurada"
```

---

### ✅ 5. Provisionamento da Empresa na FocusNFe

**Status:** ⚠️ **Precisa provisionar**

**Onde fazer:** `/configuracao-fiscal` → Aba **Certificado** → Seção "Provisionamento"

**Pré-requisitos:**
1. ✅ Integração configurada (passo 3)
2. ✅ Certificado enviado (passo 4)
3. ✅ Dados cadastrais completos (passo 2)

**Passos:**

1. Após enviar o certificado, clique em **Provisionar Empresa**

2. O sistema irá:
   - Buscar todos os dados do tenant
   - Baixar o certificado do storage
   - Descriptografar a senha
   - Enviar tudo para a FocusNFe via `POST /v2/empresas`

3. Se bem-sucedido:
   - Campo `focus_empresa_id` é preenchido em `fiscal_integrations`
   - Tokens são atualizados
   - Status fica "Empresa provisionada"

**Erro comum:**
```
"Empresa não provisionada na FocusNFe"
```

**Solução:** Verificar na aba **Status** se o campo "ID da Empresa na FocusNFe" está preenchido.

---

## 🎯 Fluxo Completo (Ordem de Execução)

```
1. ⚙️ Configurar variáveis de ambiente (.env.local)
   └─ Reiniciar servidor

2. 🏢 Preencher dados cadastrais da empresa (/perfil-empresa)
   └─ CNPJ, razão social, endereço completo

3. 🔑 Configurar integração FocusNFe (/configuracao-fiscal → Integração)
   └─ Token + Ambiente + Habilitar

4. 📜 Upload do certificado A1 (/configuracao-fiscal → Certificado)
   └─ Arquivo .pfx/.p12 + Senha

5. 🚀 Provisionar empresa (/configuracao-fiscal → Certificado)
   └─ Clique em "Provisionar Empresa"

6. ✅ Verificar status (/configuracao-fiscal → Status)
   └─ Conferir se "ID da Empresa na FocusNFe" está preenchido

7. 📄 EMITIR NOTA FISCAL!
   └─ Usar as rotas de emissão ou interface (se implementada)
```

---

## 📝 Como Emitir Nota Fiscal (Após Configuração)

### Opção 1: Via API (Backend)

**NFe/NFCe/NFSe:**
```bash
POST /next_api/fiscal/focusnfe/issue
Content-Type: application/json

{
  "tenant_id": "uuid-do-tenant",
  "doc_type": "nfe",  // ou "nfce", "nfse"
  "payload": {
    // Dados da nota conforme documentação FocusNFe
    // https://focusnfe.com.br/doc/
  },
  "ref": "opcional-referencia-interna"
}
```

**NFSe Nacional:**
```bash
POST /next_api/fiscal/focusnfe/nfse-nacional/issue
Content-Type: application/json

{
  "tenant_id": "uuid-do-tenant",
  "payload": {
    // Dados da NFSe Nacional
  }
}
```

### Opção 2: Via Interface (Se Implementada)

A página `/configuracao-fiscal` já tem uma aba **"Documentos"** que permite:
- Listar notas emitidas
- Consultar status
- Baixar XML/PDF
- Emitir novas notas (se formulário estiver implementado)

---

## 🐛 Erros Comuns e Soluções

### 1. "Cliente Supabase não configurado"

**Causa:** Variável `SUPABASE_SERVICE_ROLE_KEY` não está configurada

**Solução:**
1. Configure a variável no `.env.local`
2. Reinicie o servidor

---

### 2. "Integração FocusNFe não configurada"

**Causa:** Não foi feita a configuração na aba "Integração"

**Solução:**
1. Acesse `/configuracao-fiscal`
2. Vá na aba "Integração"
3. Configure token, ambiente e habilite
4. Salve

---

### 3. "Empresa não provisionada na FocusNFe"

**Causa:** Não foi clicado em "Provisionar Empresa"

**Solução:**
1. Certifique-se de ter enviado o certificado
2. Clique em "Provisionar Empresa"
3. Aguarde o processamento
4. Verifique na aba "Status" se `focus_empresa_id` está preenchido

---

### 4. "Tenant sem CNPJ válido"

**Causa:** CNPJ não tem 14 dígitos ou não está configurado

**Solução:**
1. Acesse `/perfil-empresa`
2. Preencha o CNPJ com 14 dígitos (apenas números)
3. Salve

---

### 5. "Certificado não encontrado"

**Causa:** Certificado não foi enviado

**Solução:**
1. Acesse `/configuracao-fiscal` → Aba "Certificado"
2. Faça upload do arquivo .pfx/.p12
3. Digite a senha
4. Clique em "Enviar Certificado"

---

## 🔐 Segurança

### Chaves Sensíveis

**Nunca commitar:**
- `.env.local`
- Certificados A1 (.pfx/.p12)
- Senhas de certificados

**Arquivos ignorados:**
- `.gitignore` já inclui `.env.local`
- Certificados ficam em storage privado (Supabase)
- Senhas são criptografadas com AES-256-GCM

### Rotação de Chaves

**Se precisar trocar `FISCAL_CERT_ENCRYPTION_KEY`:**

⚠️ **ATENÇÃO:** Isso invalidará todas as senhas criptografadas!

1. Exporte/anote todas as senhas de certificados
2. Troque a chave no `.env.local`
3. Faça upload novamente de todos os certificados
4. Provisione novamente todas as empresas

**Recomendação:** Não troque a chave a menos que seja absolutamente necessário.

---

## 📞 Suporte

### Documentação Oficial

- **FocusNFe API v2:** https://focusnfe.com.br/doc/
- **Painel FocusNFe:** https://app-v2.focusnfe.com.br/
- **Guia Inicial:** https://focusnfe.com.br/guides/passos-iniciais/

### Arquivos de Referência

- `FOCUSNFE-HANDOFF.md` - Documentação completa da integração
- `docs/CONFIGURACAO-FISCAL-IMPLEMENTACAO.md` - Detalhes da página
- `DIAGNOSTICO-PROVISIONAMENTO.md` - **🔍 Guia de diagnóstico de erros**
- `docs/NFE-INTEGRATION.md` - Integração NFe (se existir)

---

## ✅ Status Final (Checklist)

Antes de tentar emitir, verifique:

- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` configurada no `.env.local`
- [ ] Variável `FISCAL_CERT_ENCRYPTION_KEY` configurada no `.env.local`
- [ ] Servidor reiniciado após configurar variáveis
- [ ] Dados cadastrais da empresa completos (CNPJ, endereço, etc.)
- [ ] Token FocusNFe configurado na aba "Integração"
- [ ] Integração habilitada (checkbox marcado)
- [ ] Certificado A1 enviado na aba "Certificado"
- [ ] Empresa provisionada (botão "Provisionar Empresa" clicado)
- [ ] Aba "Status" mostra `focus_empresa_id` preenchido
- [ ] Aba "Status" mostra certificado válido

**Se todos os itens estiverem marcados, o sistema está pronto para emitir notas fiscais! ✅**

---

**Última atualização:** 19/12/2025

