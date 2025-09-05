# 🚀 Guia de Configuração - ERP Lite

## 📋 Pré-requisitos

- Node.js 18+ instalado
- pnpm instalado (`npm install -g pnpm`)
- Credenciais da Zoer.ai (URL do banco, API Key)

## ⚙️ Configuração Inicial

### 1. Instalar Dependências
```bash
pnpm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `env.example` para `.env.local`:
```bash
cp env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais da Zoer.ai:

```bash
# Substitua pelos valores reais fornecidos pela Zoer.ai
POSTGREST_URL=https://sua-instancia-real.zoer.ai
POSTGREST_API_KEY=sua-chave-api-real
JWT_SECRET=sua-chave-jwt-gerada
```

### 3. Gerar Chave JWT Segura

Execute um dos comandos abaixo para gerar uma chave JWT segura:

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Windows (PowerShell):**
```powershell
[System.Web.Security.Membership]::GeneratePassword(32, 0)
```

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Executar o Projeto

```bash
pnpm dev
```

O sistema estará disponível em: http://localhost:3000

## 🔐 Primeiro Acesso

### Credenciais Padrão do Admin
- **Email:** admin@erplite.com
- **Senha:** admin123

⚠️ **IMPORTANTE:** Altere a senha padrão imediatamente após o primeiro login!

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Executar em produção
pnpm start

# Linting
pnpm lint
```

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Páginas (App Router)
│   ├── dashboard/         # Dashboard principal
│   ├── pdv/              # Ponto de venda
│   ├── produtos/         # Gestão de produtos
│   ├── clientes/         # Gestão de clientes
│   ├── entregas/         # Sistema de entregas
│   ├── financeiro/       # Controle financeiro
│   └── next_api/         # API Routes
├── components/           # Componentes React
│   ├── auth/            # Componentes de autenticação
│   ├── dashboard/       # Componentes do dashboard
│   ├── pdv/            # Componentes do PDV
│   └── ui/             # Componentes de UI (shadcn)
├── lib/                 # Utilitários e configurações
└── types/              # Definições TypeScript
```

## 🔧 Personalização

### Adicionar Novos Módulos
1. Crie a página em `src/app/novo-modulo/page.tsx`
2. Adicione a rota no sidebar (`src/components/layout/AppSidebar.tsx`)
3. Implemente as APIs em `src/app/next_api/novo-modulo/`

### Modificar Interface
- **Cores:** Edite `src/app/globals.css`
- **Componentes:** Modifique em `src/components/ui/`
- **Layout:** Ajuste em `src/components/layout/`

## 🐛 Solução de Problemas

### Erro de Conexão com Banco
- Verifique se as credenciais no `.env.local` estão corretas
- Confirme se a URL do PostgREST está acessível

### Erro de Autenticação
- Verifique se o `JWT_SECRET` está configurado
- Confirme se `NEXT_PUBLIC_ENABLE_AUTH=true`

### Erro de Build
- Execute `pnpm install` novamente
- Verifique se todas as dependências estão instaladas

## 📞 Suporte

Para dúvidas sobre:
- **Sistema:** Consulte a documentação em `README-SISTEMA.md`
- **Zoer.ai:** Entre em contato com o suporte da Zoer
- **Desenvolvimento:** Consulte a documentação do Next.js

---

**Boa sorte com seu ERP! 🎉**
