# Checklist Técnico — Antes de Divulgar para Fora

> Baseado na análise real do código (`middleware.ts`, `src/config/routes.ts`) e dos advisors de segurança do Supabase (projeto **ERP Lite** `lfxietcasaooenffdodr`).
> **Regra:** não rodar tráfego pago enquanto o bloco 🔴 CRÍTICO não estiver resolvido.

---

## 🔴 CRÍTICO — resolver antes de qualquer divulgação

### 1. Funções `SECURITY DEFINER` executáveis por `anon` (não autenticado)
- **Problema:** `link_user_to_tenant(...)` e `is_superadmin()` podem ser chamadas por usuários **não logados** via `/rest/v1/rpc/...`. Alguém pode tentar se vincular a um tenant ou sondar privilégios.
- **Ação:** revogar `EXECUTE` do papel `anon` (e revisar `authenticated`) nessas RPCs, ou trocar para `SECURITY INVOKER`.
- **Como (revisar antes de aplicar em produção):**
  ```sql
  REVOKE EXECUTE ON FUNCTION public.link_user_to_tenant(text, uuid, text) FROM anon;
  REVOKE EXECUTE ON FUNCTION public.is_superadmin() FROM anon;
  -- revisar também: auto_create_subscription, check_expired_subscriptions,
  -- get_all_system_users, get_current_tenant_id, get_user_tenant (para authenticated)
  ```
- ⚠️ Testar em branch/staging antes de aplicar — pode quebrar fluxos que dependem dessas RPCs.

### 2. View `cash_sessions_audit_view` com `SECURITY DEFINER` (advisor nível ERROR)
- **Problema:** a view roda com permissões do criador, ignorando RLS de quem consulta — pode expor dados de caixa entre tenants.
- **Ação:** recriar a view sem `SECURITY DEFINER` (ou `security_invoker=on`) e garantir filtro por tenant.

### 3. Autorização de billing é só client-side (paywall furado)
- **Problema:** no `middleware.ts`, comentário confirma: *"deixar o client-side fazer as verificações de trial"*. Quem entende de navegador contorna e usa de graça. Explica parte dos **49 `past_due` ainda ativos**.
- **Ação:** validar assinatura/trial no servidor (middleware ou nas rotas de API `next_api`), bloqueando dados quando `status ∈ {past_due, canceled}` ou trial expirado.

### 4. Middleware não valida o JWT, só a presença do cookie
- **Problema:** `middleware.ts` só checa se existe um cookie com nome `sb-...auth-token`. Não verifica validade/assinatura do token.
- **Ação:** validar sessão de verdade no servidor (Supabase SSR `getUser()`), não apenas a existência do cookie.

### 5. Flag `NEXT_PUBLIC_ENABLE_AUTH` pode desligar TODA a auth
- **Problema:** se `NEXT_PUBLIC_ENABLE_AUTH !== 'true'`, o middleware libera **todas** as rotas. Um erro de env em produção abre o sistema inteiro.
- **Ação:** garantir que produção sempre tenha `=true`; idealmente remover o bypass em builds de produção.

---

## 🟠 ALTO — resolver na Fase 0/1

### 6. RLS ativado sem política: `cash_sessions_log`
- Tabela com RLS on e **nenhuma policy** → ou está inacessível, ou depende de service_role. Definir policy explícita por tenant.

### 7. Impor cobrança na prática (limpeza + enforcement)
- Reativar/cobrar ou desativar os **49 `past_due`**.
- Job que expira trial e rebaixa acesso automaticamente (a função `check_expired_subscriptions` existe — garantir que roda via cron/pg_cron e é confiável).

### 8. Proteção contra senha vazada (Supabase Auth) desativada
- Ativar "Leaked Password Protection" (HaveIBeenPwned) no painel Auth.

### 9. Versão do Postgres com patches de segurança pendentes
- `supabase-postgres-17.4.1.075` desatualizada. Agendar upgrade (janela de manutenção). ⚠️ Fazer backup antes.

### 10. Schema da tabela `plans` bagunçado
- Colunas duplicadas/conflitantes (`name`/`nome`, `price_monthly`/`preco_cents`, `is_active`/`ativo`, `id` repetido). Padronizar antes de expor página de preços dinâmica — risco de bug de cobrança.

---

## 🟡 MÉDIO — Fase 1 (qualidade / confiança)

### 11. `function_search_path_mutable` (vários)
- ~20 funções sem `search_path` fixo. Adicionar `SET search_path = ''` (ou `public`) em cada função. Boa prática de segurança; baixo risco de quebrar.

### 12. Limpeza do repositório
- Muitos `.md` de troubleshooting e arquivos soltos na raiz (`test-query.js`, `page-backup.tsx`, `page-simple.tsx`, `layout-simple.tsx`). Mover para `/docs` ou remover. `.env` **já está fora do Git** (verificado ✅).
- Confirmar que `certs/` e chaves de certificado fiscal NÃO estão versionados.

### 13. Design/UX das telas de maior contato
- Priorizar visual de: Landing, Login/Register, Dashboard, PDV. São o "cartão de visita" para novos clientes.

### 14. Onboarding self-service
- Fluxo: cadastro → criação de tenant → checklist de primeiros passos → primeiro valor sem depender de você.

---

## 🟢 BAIXO — melhorias contínuas

- Observabilidade: logs de erro centralizados (ex.: Sentry) + monitor de uptime.
- Performance: já existem docs de otimização — consolidar e medir.
- Backups automáticos verificados (testar restauração de verdade).
- Testes automatizados dos fluxos críticos (venda, caixa, NF-e, cobrança).

---

## Como validar depois de corrigir
1. Rodar novamente os **Security Advisors** do Supabase e confirmar que os itens 🔴 sumiram.
2. Testar em uma conta trial "de fora": criar conta → usar → deixar expirar → confirmar bloqueio.
3. Tentar acessar RPCs sensíveis deslogado (deve falhar).
4. Testar isolamento entre 2 tenants (um não vê dados do outro).

> Quando você quiser, eu implemento qualquer item deste checklist — sempre revisando os riscos antes de aplicar em produção (conforme sua regra de operações sensíveis).
