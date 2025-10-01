# 🚀 GUIA COMPLETO - SETUP MULTI-TENANT SAAS

## 📋 VISÃO GERAL

Este guia vai te ajudar a configurar o sistema ERP Lite como um SaaS multi-tenant completo, onde cada cliente terá seu próprio espaço isolado no banco de dados.

---

## 🎯 PARTE 1: CONFIGURAR ESTRUTURA DO BANCO DE DADOS

### Passo 1.1: Acessar o Supabase

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: **lfxietcasaooenffdodr**
4. Vá em: **SQL Editor** (ícone na barra lateral)

### Passo 1.2: Executar o Script de Configuração

1. Abra o arquivo: `scripts/setup-complete-saas.sql`
2. Copie **TODO O CONTEÚDO** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **RUN** (ou pressione Ctrl+Enter)
5. Aguarde a execução (deve levar ~10 segundos)

### Passo 1.3: Verificar Criação

Você deve ver uma mensagem no final mostrando:
```
Tenants criados: 1
Planos criados: 4
Memberships criados: 0
Assinaturas criadas: 1
```

✅ **Se aparecer isso, está tudo certo!**

---

## 🎯 PARTE 2: VINCULAR SEU USUÁRIO AO TENANT

### Passo 2.1: Fazer Login no Sistema (Criar Usuário)

⚠️ **IMPORTANTE:** Antes de executar o script, você precisa:

1. Abrir o sistema: http://localhost:3000/login
2. **REGISTRAR** uma nova conta com o email: `gabrieldecousa100@gmail.com`
3. Confirmar o email (se necessário)
4. Fazer login

Isso criará seu usuário no Supabase Auth.

### Passo 2.2: Executar Script de Vinculação

Agora volte ao terminal e execute:

```bash
node scripts/setup-tenant-dev.js
```

Você deve ver:
```
✅ Tenant encontrado: JUGA - Desenvolvimento
✅ Usuário vinculado com sucesso!
✅ Assinatura ativa: Profissional
🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!
```

---

## 🎯 PARTE 3: ATIVAR AUTENTICAÇÃO

### Passo 3.1: Editar .env.local

Abra o arquivo `.env.local` e altere:

```env
# De:
NEXT_PUBLIC_ENABLE_AUTH=false

# Para:
NEXT_PUBLIC_ENABLE_AUTH=true
```

### Passo 3.2: Reiniciar Servidor

1. Pare o servidor (Ctrl+C no terminal)
2. Inicie novamente:
```bash
npm run dev
```

---

## 🎯 PARTE 4: TESTAR O SISTEMA

### Passo 4.1: Fazer Login

1. Acesse: http://localhost:3000/login
2. Digite:
   - Email: `gabrieldecousa100@gmail.com`
   - Senha: (a senha que você criou)
3. Clique em **Entrar**

### Passo 4.2: Verificar Acesso

Você deve ver:
- ✅ Nome da empresa: **JUGA - Desenvolvimento**
- ✅ Plano: **Profissional**
- ✅ Acesso a todas as funcionalidades
- ✅ Dados isolados (apenas seus dados)

---

## 📊 COMO FUNCIONA A SEPARAÇÃO MULTI-TENANT

### Estrutura de Dados

```
TENANT (Empresa)
├── gabrieldecousa100@gmail.com (você - owner)
├── Clientes (seus clientes cadastrados)
├── Produtos (seus produtos)
└── Vendas (suas vendas)

TENANT (Outro Cliente do SaaS)
├── outro@email.com (owner deles)
├── Clientes (clientes DELES)
├── Produtos (produtos DELES)
└── Vendas (vendas DELES)
```

### Isolamento Automático

- ✅ Cada tabela tem `tenant_id`
- ✅ RLS (Row Level Security) filtra automaticamente
- ✅ Você **NUNCA** verá dados de outros tenants
- ✅ Outros tenants **NUNCA** verão seus dados

---

## 🎯 PRÓXIMOS PASSOS (DESENVOLVIMENTO)

### Para Adicionar Novos Clientes ao SaaS:

1. **Via Registro Público** (página de signup - ainda será criada)
2. **Via Painel Admin** (superadmin pode criar manualmente)

### O Que Ainda Precisa Ser Implementado:

1. ✅ Estrutura multi-tenant (CONCLUÍDO)
2. ✅ Seu tenant ativo (CONCLUÍDO)
3. 🔄 Página de registro público para novos clientes
4. 🔄 Atualizar todas as operações para usar tenant_id
5. 🔄 Remover dados mockados e usar dados reais
6. 🔄 Implementar gerenciamento de assinaturas no admin

---

## ❓ TROUBLESHOOTING

### Erro: "Tenants criados: 0"

**Solução:** Execute novamente o script SQL no Supabase.

### Erro: "Usuário não encontrado"

**Solução:** Faça login no sistema primeiro para criar o usuário no Supabase Auth.

### Erro: "Nenhuma assinatura encontrada"

**Solução:** Execute novamente o script SQL - a seção de assinatura não rodou corretamente.

### Não consigo ver meus dados após ativar AUTH

**Solução:** 
1. Verifique se o user_membership foi criado (rode o script de vinculação)
2. Confira se o tenant_id está sendo passado nas queries
3. Veja os logs do console do navegador para erros

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verifique os logs do console do navegador (F12)
2. Verifique os logs do terminal (servidor Next.js)
3. Verifique os logs do Supabase Dashboard

---

**Data de Criação:** Outubro 2025  
**Versão:** 1.0.0  
**Sistema:** ERP Lite - Multi-Tenant SaaS


