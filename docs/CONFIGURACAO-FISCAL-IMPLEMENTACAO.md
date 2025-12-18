# Implementação da Página de Configuração Fiscal

## 📋 Resumo

Este documento descreve a implementação completa da página de **Configuração Fiscal** para integração com a FocusNFe, seguindo os requisitos especificados no arquivo `FOCUSNFE-HANDOFF.md`.

**Data de Implementação:** Janeiro 2025  
**Página:** `/configuracao-fiscal`  
**Base de Referência:** `src/app/perfil-empresa/page.tsx`

---

## ✅ Funcionalidades Implementadas

### 1. Página Principal (`src/app/configuracao-fiscal/page.tsx`)

A página foi criada seguindo o padrão visual e estrutural da página de perfil da empresa, com três abas principais:

#### **Aba 1: Integração**
- ✅ Campo para token da API FocusNFe (tipo password)
- ✅ Seleção de ambiente (Homologação/Produção)
- ✅ Checkbox para habilitar/desabilitar integração
- ✅ Botão para salvar configuração
- ✅ Indicação visual quando token já está configurado (badge verde)
- ✅ Validação de campos obrigatórios

#### **Aba 2: Certificado**
- ✅ Upload de certificado digital (.pfx ou .p12)
- ✅ Campo para senha do certificado
- ✅ Indicação visual quando certificado já foi enviado
- ✅ Botão para enviar certificado
- ✅ Seção de provisionamento da empresa na FocusNFe
- ✅ Instruções sobre pré-requisitos para provisionamento

#### **Aba 3: Status**
- ✅ Status da integração (habilitada/desabilitada)
- ✅ Ambiente configurado (homologação/produção)
- ✅ ID da empresa na FocusNFe (`focus_empresa_id`)
- ✅ Tokens de homologação e produção
- ✅ Status do certificado (enviado/não enviado)
- ✅ Validade do certificado (válido de/até)
- ✅ CNPJ do certificado
- ✅ Alerta visual quando certificado está expirado

### 2. Integração com Backend

#### **Rotas de API Utilizadas:**

1. **GET `/next_api/fiscal/focusnfe/integration?tenant_id=...`**
   - Carrega configuração de integração existente
   - Retorna: environment, api_token, enabled, focus_empresa_id, tokens, etc.

2. **POST `/next_api/fiscal/focusnfe/integration`**
   - Salva/atualiza configuração de integração
   - Body: `{ tenant_id, api_token, environment, enabled }`

3. **GET `/next_api/fiscal/focusnfe/certificate?tenant_id=...`**
   - Carrega informações do certificado enviado
   - Retorna: filename, size, status, validade, etc.

4. **POST `/next_api/fiscal/focusnfe/certificate`**
   - Upload do certificado digital
   - FormData: `{ tenant_id, password, file }`

5. **POST `/next_api/fiscal/focusnfe/company/provision`**
   - Provisiona empresa na FocusNFe
   - Body: `{ tenant_id }`

### 3. Melhorias nas Rotas de API

#### **`src/app/next_api/fiscal/focusnfe/integration/route.ts`**

**Mudanças implementadas:**
- ✅ Função `getSupabaseClient()` criada para inicialização sob demanda
- ✅ Tratamento robusto de erros de variáveis de ambiente
- ✅ Validação de formato UUID para `tenant_id`
- ✅ Retorno de todos os campos necessários no GET (incluindo `focus_empresa_id`, tokens, validade do certificado)
- ✅ Mensagens de erro mais descritivas

#### **`src/app/next_api/fiscal/focusnfe/certificate/route.ts`**

**Mudanças implementadas:**
- ✅ Função `getSupabaseClient()` criada para inicialização sob demanda
- ✅ Tratamento robusto de erros de variáveis de ambiente
- ✅ Validação de formato UUID para `tenant_id`
- ✅ Logs de erro mais detalhados

### 4. Navegação

- ✅ Link adicionado no menu lateral (`src/components/layout/AppSidebar.tsx`)
- ✅ Localização: Seção "Gestão" → "Configuração Fiscal"
- ✅ Ícone: `FileText` (lucide-react)

### 5. Tratamento de Erros

#### **Erros de Configuração:**
- ✅ Detecção de erro 500 por falta de variáveis de ambiente
- ✅ Mensagem amigável exibida na página
- ✅ Instruções claras sobre como resolver o problema
- ✅ Exemplo de código mostrando variáveis necessárias

#### **Erros de Validação:**
- ✅ Validação de UUID antes de fazer requisições
- ✅ Tratamento de respostas HTML (páginas de erro)
- ✅ Continuação normal quando não há dados (primeira configuração)

### 6. Segurança

- ✅ Token da API não é exibido na interface (apenas indicação de que está configurado)
- ✅ Token pode ser atualizado apenas se um novo for digitado
- ✅ Campo de senha do certificado usa tipo `password`
- ✅ Validação de formato de arquivo (.pfx ou .p12)

---

## 🛠️ Scripts e Ferramentas Criadas

### Script de Criação de `.env.local`

**Arquivo:** `scripts/create-env-local.js`

**Funcionalidades:**
- ✅ Cria arquivo `.env.local` baseado em `env.example`
- ✅ Gera automaticamente `JWT_SECRET` (32 bytes, base64)
- ✅ Gera automaticamente `FISCAL_CERT_ENCRYPTION_KEY` (32 bytes, base64)
- ✅ Verifica se arquivo já existe para evitar sobrescrita
- ✅ Instruções claras sobre próximos passos

**Uso:**
```bash
npm run create-env
# ou
node scripts/create-env-local.js
```

**Adicionado ao `package.json`:**
```json
"create-env": "node scripts/create-env-local.js"
```

---

## 📁 Arquivos Criados/Modificados

### Arquivos Criados:
1. `src/app/configuracao-fiscal/page.tsx` - Página principal
2. `scripts/create-env-local.js` - Script de criação de .env.local
3. `docs/CONFIGURACAO-FISCAL-IMPLEMENTACAO.md` - Este documento

### Arquivos Modificados:
1. `src/app/next_api/fiscal/focusnfe/integration/route.ts`
   - Melhorias no tratamento de erros
   - Retorno de campos adicionais no GET

2. `src/app/next_api/fiscal/focusnfe/certificate/route.ts`
   - Melhorias no tratamento de erros

3. `src/components/layout/AppSidebar.tsx`
   - Adicionado link "Configuração Fiscal" no menu

4. `package.json`
   - Adicionado script `create-env`

---

## 🔧 Configuração Necessária

### Variáveis de Ambiente

O arquivo `.env.local` deve conter as seguintes variáveis:

```env
# Obrigatórias para funcionamento básico
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Obrigatória para criptografia de certificados
FISCAL_CERT_ENCRYPTION_KEY=sua-chave-de-criptografia

# Opcionais (já geradas automaticamente pelo script)
JWT_SECRET=sua-chave-jwt
```

### Como Obter Credenciais do Supabase

1. Acesse https://supabase.com
2. Faça login e selecione seu projeto
3. Vá em **Settings → API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key (secret)** → `SUPABASE_SERVICE_ROLE_KEY`

### Como Gerar Chaves de Criptografia

```bash
# No terminal (Linux/Mac/Git Bash)
openssl rand -base64 32

# Ou use o script create-env-local.js que gera automaticamente
npm run create-env
```

---

## 🚀 Como Usar

### 1. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env.local
npm run create-env

# Editar arquivo .env.local e adicionar credenciais do Supabase
# (abrir manualmente no editor)
```

### 2. Reiniciar Servidor

```bash
# Parar servidor atual (Ctrl+C)
# Iniciar novamente
npm run dev
```

### 3. Acessar a Página

1. Faça login no sistema
2. No menu lateral, vá em **Gestão → Configuração Fiscal**
3. Ou acesse diretamente: `http://localhost:3000/configuracao-fiscal`

### 4. Configurar Integração

1. **Aba Integração:**
   - Cole o token da API FocusNFe
   - Selecione o ambiente (homologação/produção)
   - Marque "Habilitar integração"
   - Clique em "Salvar"

2. **Aba Certificado:**
   - Selecione o arquivo do certificado (.pfx ou .p12)
   - Digite a senha do certificado
   - Clique em "Enviar Certificado"
   - Após upload, clique em "Provisionar Empresa"

3. **Aba Status:**
   - Verifique se tudo está configurado corretamente
   - Confira a validade do certificado
   - Verifique se a empresa foi provisionada na FocusNFe

---

## 🐛 Problemas Resolvidos

### 1. Erro 500 - Configuração do Servidor Incompleta

**Problema:** Rotas retornavam erro 500 quando variáveis de ambiente não estavam configuradas.

**Solução:**
- Movida inicialização do Supabase para dentro das funções
- Tratamento específico de erros de configuração
- Mensagem amigável na página quando há erro

### 2. Erro de Parse JSON (HTML retornado)

**Problema:** Quando havia erro 500, o servidor retornava HTML em vez de JSON.

**Solução:**
- Garantido que todas as rotas sempre retornam JSON
- Tratamento de erros no frontend para detectar respostas HTML
- Logs de erro mais informativos

### 3. Token da API Exibido na Interface

**Problema:** Token poderia ser exposto na interface.

**Solução:**
- Token não é preenchido automaticamente quando carregado
- Apenas indicação visual de que está configurado
- Token só é atualizado se um novo for digitado

### 4. Validação de tenant_id

**Problema:** Erros quando tenant_id não era um UUID válido.

**Solução:**
- Validação de formato UUID antes de fazer requisições
- Mensagens de erro mais claras

---

## 📝 Estrutura da Página

```
Configuração Fiscal
├── Aba: Integração
│   ├── Token da API FocusNFe
│   ├── Ambiente (Homologação/Produção)
│   ├── Habilitar integração
│   └── Botão Salvar
│
├── Aba: Certificado
│   ├── Upload de Certificado (.pfx/.p12)
│   ├── Senha do Certificado
│   ├── Botão Enviar Certificado
│   └── Seção Provisionar Empresa
│       └── Botão Provisionar
│
└── Aba: Status
    ├── Status da Integração
    ├── Empresa na FocusNFe
    │   ├── ID da Empresa
    │   ├── Token Homologação
    │   └── Token Produção
    └── Certificado Digital
        ├── Status
        ├── Arquivo
        ├── CNPJ
        ├── Válido de
        └── Válido até
```

---

## 🎨 Componentes UI Utilizados

- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`
- `Input`, `Label`, `Button`, `Badge`
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- Ícones do `lucide-react`: `FileText`, `Key`, `Shield`, `Building2`, `CheckCircle2`, `XCircle`, `AlertCircle`, `Calendar`, `Upload`, `Save`, `Loader2`

---

## 🔐 Segurança Implementada

1. **Token da API:**
   - Não é exibido na interface
   - Campo tipo password
   - Apenas indicação visual de que está configurado

2. **Senha do Certificado:**
   - Campo tipo password
   - Criptografada antes de salvar (AES-256-GCM)
   - Nunca exibida na interface

3. **Validação de Dados:**
   - Validação de formato UUID
   - Validação de tipo de arquivo (.pfx/.p12)
   - Validação de campos obrigatórios

---

## 📚 Referências

- **Documento Base:** `FOCUSNFE-HANDOFF.md` (linhas 147-152)
- **Página de Referência:** `src/app/perfil-empresa/page.tsx`
- **Documentação FocusNFe:** https://focusnfe.com.br/doc/
- **Painel FocusNFe:** https://app-v2.focusnfe.com.br/

---

## ✅ Checklist de Implementação

- [x] Página criada seguindo padrão do perfil-empresa
- [x] Campos de token e ambiente implementados
- [x] Upload de certificado com senha
- [x] Botão de provisionamento
- [x] Seção de status com todas as informações
- [x] Integração com rotas de API existentes
- [x] Tratamento de erros robusto
- [x] Mensagens de erro amigáveis
- [x] Link no menu lateral
- [x] Segurança implementada
- [x] Script de criação de .env.local
- [x] Documentação completa

---

## 🎯 Próximos Passos (Opcional)

1. **UI de Listagem de Documentos Fiscais:**
   - Listar documentos emitidos
   - Consultar status
   - Download de XML/PDF

2. **Validações Adicionais:**
   - Impedir emissão se integração não estiver habilitada
   - Impedir emissão se empresa não estiver provisionada

3. **Webhooks:**
   - Implementar recebimento de webhooks da FocusNFe
   - Atualizar status automaticamente

4. **Histórico:**
   - Visualizar eventos de documentos fiscais
   - Log de ações realizadas

---

**Documento criado em:** Janeiro 2025  
**Última atualização:** Janeiro 2025

