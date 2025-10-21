# 🔧 Configuração do Supabase - Resolução de Sessões Cruzadas

## 🚨 PROBLEMA IDENTIFICADO

O sistema está usando configurações **hardcoded** (fallback) do Supabase, o que causa **conflitos de sessão** entre diferentes instâncias da aplicação.

## ✅ SOLUÇÃO

### 1. Criar Projeto Supabase Próprio

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Crie um novo projeto
4. Anote as credenciais:
   - **Project URL**
   - **Anon Key** 
   - **Service Role Key**

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto com:

```env
# ===========================================
# CONFIGURAÇÕES DO SUPABASE
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico-aqui

# ===========================================
# CONFIGURAÇÕES DO BANCO DE DADOS (ZOER.AI)
# ===========================================
POSTGREST_URL=https://sua-instancia.zoer.ai
POSTGREST_SCHEMA=public
POSTGREST_API_KEY=sua-chave-api-aqui

# ===========================================
# CONFIGURAÇÕES DE AUTENTICAÇÃO
# ===========================================
JWT_SECRET=sua-chave-jwt-super-secreta-aqui
SCHEMA_ADMIN_USER=admin

# ===========================================
# CONFIGURAÇÕES DA ZOER.AI
# ===========================================
NEXT_PUBLIC_ZOER_HOST=https://zoer.ai
NEXT_PUBLIC_ENABLE_AUTH=true
NEXT_PUBLIC_APP_Name=ERP Lite

# ===========================================
# CONFIGURAÇÕES DE DESENVOLVIMENTO
# ===========================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Executar Scripts de Verificação

```bash
# Verificação completa
node scripts/run-supabase-check.js full

# Apenas verificação básica
node scripts/run-supabase-check.js verify

# Limpeza de sessões
node scripts/run-supabase-check.js clear

# Correção de problemas
node scripts/run-supabase-check.js fix
```

## 🔍 SCRIPTS DISPONÍVEIS

### `scripts/verify-supabase.js`
- Verifica configuração do Supabase
- Testa conexão
- Lista usuários e tenants

### `scripts/clear-sessions.js`
- Remove sessões duplicadas
- Limpa usuários órfãos
- Verifica integridade dos dados

### `scripts/fix-session-issues.js`
- Identifica problemas de sessão
- Corrige conflitos
- Gera relatórios

### `scripts/run-supabase-check.js`
- Executa todos os scripts em sequência
- Verificação completa automatizada

## ⚠️ IMPORTANTE

1. **NÃO use as credenciais hardcoded** em produção
2. **Configure variáveis de ambiente próprias**
3. **Execute os scripts de verificação** após configurar
4. **Teste em modo incógnito** após correções

## 🎯 RESULTADO ESPERADO

Após configurar corretamente:
- ✅ Sem conflitos de sessão
- ✅ Cada usuário acessa apenas seus dados
- ✅ Registro funciona corretamente
- ✅ Login seguro e isolado

## 🆘 SE O PROBLEMA PERSISTIR

1. Limpe o cache do navegador
2. Execute: `node scripts/run-supabase-check.js full`
3. Teste em modo incógnito
4. Verifique se as variáveis de ambiente estão corretas
