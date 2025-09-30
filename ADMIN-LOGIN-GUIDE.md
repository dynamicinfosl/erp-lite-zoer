# 🔐 Guia do Sistema de Login Administrativo

## Visão Geral

O sistema ERP Lite JUGA agora possui um sistema completo de autenticação administrativa, permitindo acesso restrito ao painel de controle do sistema.

## 🚀 Funcionalidades Implementadas

### ✅ Sistema de Popup Administrativo
- **Acesso**: Via popup modal em qualquer página
- **Design**: Interface moderna com tema administrativo (vermelho/preto)
- **Campos**: Usuário Admin, Senha Admin
- **Nova Janela**: Abre o painel admin em nova janela do navegador
- **Segurança**: Dupla autenticação (popup + painel)

### ✅ Página de Login Administrativo (Legado)
- **URL**: `/admin/login`
- **Design**: Interface moderna com tema administrativo (vermelho/preto)
- **Campos**: Email, Senha, Código de Administrador
- **Validação**: Verificação de credenciais e código de acesso

### ✅ Proteção de Rotas
- **Middleware**: Proteção automática das rotas `/admin/*`
- **Redirecionamento**: Usuários não autenticados são direcionados para `/admin/login`
- **Verificação de Privilégios**: Validação de role de administrador

### ✅ Painel Administrativo Aprimorado
- **Header**: Exibe informações do usuário logado
- **Botão de Logout**: Saída segura do sistema
- **Verificação de Acesso**: Validação contínua de privilégios

### ✅ Script de Criação de Admin
- **Automatizado**: Cria usuários administradores via linha de comando
- **Configurável**: Parâmetros personalizáveis
- **Validação**: Verificação de dados e credenciais

## 🔑 Credenciais de Acesso

### 🆕 Popup Administrativo (Nova Funcionalidade)
```
Usuário: admin
Senha: admin123

OU

Usuário: juga_admin
Senha: juga2024
```

### Usuário Administrador Supabase (Para Painel Completo)
```
Email: admin@juga.com
Senha: admin123456
```

### Códigos de Administrador Válidos (Painel Completo)
- `ADMIN2024`
- `JUGA-ADMIN`
- `SUPER-ADMIN`
- `123456`
- `admin123`

## 📋 Como Usar

### 🆕 1. Acesso via Popup (Recomendado)

**Via Página Principal:**
1. Acesse `http://localhost:3000`
2. Clique no botão "Admin" (vermelho)
3. Digite as credenciais do popup:
   - Usuário: `admin` | Senha: `admin123`
   - OU Usuário: `juga_admin` | Senha: `juga2024`
4. Clique em "Abrir Painel Admin"
5. O painel abrirá em uma nova janela do navegador

**Via Página de Login:**
1. Acesse `http://localhost:3000/login`
2. Clique em "Acesso Administrativo"
3. Siga os mesmos passos acima

**Via Dashboard:**
1. Acesse o dashboard
2. Clique no botão "Admin" no header
3. Siga os mesmos passos acima

### 2. Acesso Direto (Legado)

**Via URL Direta:**
1. Acesse `http://localhost:3000/admin/login`
2. Use as credenciais do Supabase

### 2. Fazer Login
1. Digite o **email** do administrador
2. Digite a **senha**
3. Digite o **código de administrador**
4. Clique em "Acessar Painel Admin"

### 3. Criar Novos Administradores

**Via Script (Recomendado):**
```bash
# Usuário padrão
node scripts/create-admin-user.js

# Usuário personalizado
node scripts/create-admin-user.js --email novo@admin.com --password senha123 --name "Novo Admin"
```

**Via Interface:**
1. Acesse o painel administrativo
2. Use o componente `CreateAdminUser` (se disponível)

## 🛡️ Segurança

### Recursos de Segurança Implementados

1. **Verificação de Código**: Código de administrador obrigatório
2. **Validação de Role**: Verificação de privilégios no backend
3. **Proteção de Rotas**: Middleware de autenticação
4. **Logout Seguro**: Limpeza de sessão e redirecionamento
5. **Tratamento de Erros**: Mensagens específicas para diferentes tipos de erro

### Boas Práticas

1. **Senhas Fortes**: Use senhas com pelo menos 6 caracteres
2. **Códigos Seguros**: Mantenha os códigos de admin seguros
3. **Logout**: Sempre faça logout ao terminar
4. **Backup**: Mantenha backup das credenciais de admin

## 🔧 Configuração

### Variáveis de Ambiente Necessárias

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

### Middleware Configurado

O arquivo `middleware.ts` foi atualizado para incluir:
- Rotas administrativas protegidas
- Redirecionamento automático
- Verificação de autenticação

## 🚨 Resolução de Problemas

### Erro: "Acesso Negado"
- **Causa**: Usuário não possui privilégios de admin
- **Solução**: Verificar role do usuário ou criar novo admin

### Erro: "Código de Administrador Inválido"
- **Causa**: Código incorreto inserido
- **Solução**: Usar um dos códigos válidos listados acima

### Erro: "Refresh Token Not Found"
- **Causa**: Sessão expirada ou corrompida
- **Solução**: Acessar `/clear-auth.html` para limpar dados de auth

### Usuário Não Consegue Fazer Login
1. Verificar se o email está correto
2. Verificar se a senha está correta
3. Verificar se o código de admin está correto
4. Executar script de criação de admin se necessário

## 📞 Suporte

### Logs e Debug
- Console do navegador: Verificar erros de JavaScript
- Terminal do servidor: Verificar logs do Next.js
- Supabase Dashboard: Verificar usuários e autenticação

### Contatos
- **Sistema**: ERP Lite JUGA
- **Versão**: 1.0.0
- **Desenvolvedor**: Equipe JUGA

## 🔄 Atualizações Futuras

### Próximas Funcionalidades
- [ ] Gerenciamento de usuários admin via interface
- [ ] Logs de auditoria administrativa
- [ ] Configurações de segurança avançadas
- [ ] Autenticação de dois fatores
- [ ] Backup automático de configurações admin

---

**⚠️ Importante**: Mantenha as credenciais de administrador seguras e nunca as compartilhe publicamente. O acesso administrativo fornece controle total sobre o sistema.
