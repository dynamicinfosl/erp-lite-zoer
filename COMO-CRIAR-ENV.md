# 📝 Como Criar e Configurar o Arquivo .env.local

## ⚠️ Situação Atual

O arquivo `.env` **não existe** no projeto (ele está no `.gitignore` para não ser versionado no Git por segurança).

## ✅ Solução: Criar o Arquivo .env.local

### Passo 1: Localização

O arquivo deve ser criado na **raiz do projeto**, no mesmo nível que:
- `package.json`
- `next.config.ts`
- `env.example`

Caminho completo:
```
c:\Users\milen\trabalhos\em andamento\erp-lite-zoer\.env.local
```

### Passo 2: Criar o Arquivo

Você pode criar o arquivo de duas formas:

#### Opção A: Copiar do Template

1. Abra o arquivo `env.example` (que já existe no projeto)
2. Copie todo o conteúdo
3. Crie um novo arquivo chamado `.env.local` na raiz do projeto
4. Cole o conteúdo copiado
5. Substitua os valores de exemplo pelos valores reais

#### Opção B: Criar Manualmente

Crie um arquivo chamado `.env.local` na raiz do projeto com este conteúdo:

```env
# ===========================================
# CONFIGURAÇÕES DO BANCO DE DADOS (SUPABASE)
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://lfxietcasaooenffdodr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# ===========================================
# CONFIGURAÇÕES DO BANCO DE DADOS (ZOER.AI)
# ===========================================
POSTGREST_URL=https://sua-instancia.supabase.co/rest/v1
POSTGREST_SCHEMA=public
POSTGREST_API_KEY=sua-chave-anonima

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

# ===========================================
# CONFIGURAÇÃO DA API DE NOTA FISCAL (NFe)
# ===========================================
NFE_API_ENABLED=false
NFE_API_BASE_URL=https://sandbox.seu-provedor-nfe.com.br
NFE_API_KEY=
NFE_API_TIMEOUT=15000
NFE_API_ENVIRONMENT=homologation
```

### Passo 3: Obter os Valores do Supabase

Para configurar as variáveis do Supabase, você precisa:

1. **Acessar o Dashboard do Supabase:**
   - URL: https://supabase.com/dashboard/project/lfxietcasaooenffdodr/settings/api

2. **Copiar as seguintes informações:**
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** (secret) → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **IMPORTANTE**

### Passo 4: Preencher o Arquivo .env.local

Substitua os valores de exemplo pelos valores reais do seu projeto Supabase:

```env
# Exemplo com valores reais (substitua pelos seus)
NEXT_PUBLIC_SUPABASE_URL=https://lfxietcasaooenffdodr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10
```

⚠️ **ATENÇÃO:** A `SUPABASE_SERVICE_ROLE_KEY` é a chave mais importante para operações de escrita (como fechar caixa). Ela tem permissões completas no banco de dados.

### Passo 5: Reiniciar o Servidor

Após criar/editar o arquivo `.env.local`, você **DEVE** reiniciar o servidor de desenvolvimento:

```bash
# Pare o servidor (Ctrl+C)
# Depois inicie novamente:
npm run dev
```

⚠️ **IMPORTANTE:** O Next.js só carrega variáveis de ambiente na inicialização. Mudanças no `.env.local` só terão efeito após reiniciar o servidor.

## 🔍 Como Verificar se Está Funcionando

### 1. Verificar se o arquivo existe

No terminal PowerShell, execute:

```powershell
Test-Path ".env.local"
```

Se retornar `True`, o arquivo existe.

### 2. Testar o Endpoint de Diagnóstico

Após reiniciar o servidor, acesse:

```
http://localhost:3000/next_api/cash-sessions/test
```

A resposta deve mostrar:
```json
{
  "success": true,
  "results": {
    "checks": {
      "env_vars": {
        "NEXT_PUBLIC_SUPABASE_URL": "✅ Configurado",
        "SUPABASE_SERVICE_ROLE_KEY": "✅ Configurado",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "✅ Configurado"
      }
    }
  }
}
```

## 📋 Checklist

- [ ] Arquivo `.env.local` criado na raiz do projeto
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado (mais importante!)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurado
- [ ] Servidor reiniciado após criar/editar o arquivo
- [ ] Endpoint de teste retorna ✅ para todas as variáveis

## 🚨 Problemas Comuns

### "Arquivo não encontrado"
- Certifique-se de que o arquivo está na **raiz do projeto** (mesmo nível que `package.json`)
- O nome deve ser exatamente `.env.local` (com o ponto no início)

### "Variáveis ainda não funcionam"
- Reinicie o servidor (`npm run dev`)
- Verifique se não há espaços em branco antes/depois dos valores
- Verifique se não há aspas desnecessárias nos valores

### "Service Role Key não funciona"
- Certifique-se de copiar a chave completa (é muito longa)
- Verifique se não há quebras de linha na chave
- A chave deve começar com `eyJ...` (é um JWT)

## 📝 Nota sobre Segurança

- ⚠️ **NUNCA** faça commit do arquivo `.env.local` no Git
- ⚠️ O arquivo já está no `.gitignore` para sua proteção
- ⚠️ **NUNCA** compartilhe suas chaves do Supabase publicamente




