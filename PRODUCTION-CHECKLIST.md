# 🚀 CHECKLIST PARA PRODUÇÃO

## ⚠️ IMPORTANTE - ANTES DE COLOCAR EM PRODUÇÃO

### 🔒 SEGURANÇA CRÍTICA

- [ ] **ATIVAR RLS (Row Level Security)**
  - Executar script: `scripts/enable-rls-production.sql`
  - Testar isolamento de dados entre tenants
  - Verificar que Cliente A não vê dados do Cliente B

- [ ] **Atualizar credenciais de superadmin**
  - Trocar usuário e senha padrão em: `src/app/admin/login/page.tsx`
  - Usar credenciais fortes e únicas

- [ ] **Configurar variáveis de ambiente de produção**
  - JWT_SECRET com chave forte (min 64 caracteres)
  - Remover credenciais hardcoded dos scripts

### 💳 PAGAMENTOS

- [ ] **Integrar Stripe/PagSeguro**
  - Configurar webhooks de pagamento
  - Implementar verificação de assinatura ativa
  - Bloquear acesso quando assinatura vencer

### 📧 EMAIL

- [ ] **Configurar serviço de email** (Resend/SendGrid)
  - Email de boas-vindas
  - Email de confirmação
  - Email de recuperação de senha
  - Notificações de pagamento

### 🔐 AUTENTICAÇÃO

- [ ] **Testar fluxo completo de registro**
  - Novo cliente se cadastra
  - Tenant é criado automaticamente
  - Email de confirmação enviado
  - Período trial iniciado

- [ ] **Implementar limites por plano**
  - Bloquear cadastro quando atingir limite
  - Mostrar alertas de upgrade

### 📊 DADOS

- [ ] **Backup automático configurado**
  - Supabase: backups diários ativados
  - Teste de restauração

- [ ] **Migrations organizadas**
  - Versionar todos os scripts SQL
  - Documentar mudanças

### 🎨 INTERFACE

- [ ] **Remover dados de exemplo/teste**
  - Limpar tenant "JUGA - Desenvolvimento"
  - Remover tenant "Teste Gabriel"

- [ ] **Remover informações de debug**
  - Scripts de credenciais visíveis
  - Logs de console em produção

### ⚡ PERFORMANCE

- [ ] **Otimizar queries**
  - Adicionar índices onde necessário
  - Testar com 1000+ registros

- [ ] **CDN configurado**
  - Assets estáticos servidos via CDN
  - Imagens otimizadas

### 📱 RESPONSIVO

- [ ] **Testar em dispositivos móveis**
  - iOS Safari
  - Android Chrome
  - Tablets

### 🔍 MONITORAMENTO

- [ ] **Configurar Sentry ou similar**
  - Rastreamento de erros
  - Alertas de problemas

---

## 📝 NOTAS

**Data de criação:** 01/10/2025
**Status atual:** DESENVOLVIMENTO (RLS DESABILITADO)
**Próxima revisão:** Antes do lançamento

⚠️ **NÃO COLOCAR EM PRODUÇÃO SEM COMPLETAR ESTA CHECKLIST!**


