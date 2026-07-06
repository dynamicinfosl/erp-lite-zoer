# Auditoria de Isolamento entre Tenants — ERP Lite

> Data da análise: 05/07/2026
> Projeto Supabase: `lfxietcasaooenffdodr`
> Tipo: leitura/auditoria — nenhuma alteração foi feita no banco.

---

## Resumo executivo

A análise das políticas de RLS (Row Level Security) do banco mostrou que a maior parte das tabelas principais **tem** políticas de tenant, mas algumas possuem políticas **conflitantes, excessivamente permissivas ou inexistentes**, permitindo que usuários de um tenant acessem dados de outro — ou até usuários não autenticados (`anon`) acessem dados sensíveis.

### Nível de risco por tabela

| Tabela | RLS ativo | Isolamento por tenant | Problemas encontrados | Risco |
|---|---|---|---|---|
| `sales` | ✅ | ✅ | Tem policies `public` baseadas em `user_id` (antigas) convivendo com policies de tenant. | 🟡 Médio |
| `products` | ✅ | ✅ | Mesmo problema de `sales`: policies `public` + `authenticated` conflitantes. | 🟡 Médio |
| `customers` | ✅ | ✅ | Policies `public` baseadas em `user_id`; permissiva `tenant_id IS NULL`. | 🔴 Alto |
| `cash_sessions` | ✅ | ✅ | Política correta por `get_current_tenant_id()`. | 🟢 OK |
| `financial_transactions` | ✅ | ✅ | Policies `public` baseadas em `user_id` além da política de tenant. | 🟡 Médio |
| `deliveries` | ✅ | ⚠️ | Policies `public` permitem **qualquer usuário não autenticado** ler/inserir/atualizar/deletar enquanto `tenant_id IS NOT NULL`. | 🔴 Crítico |
| `product_stocks` | ✅ | ✅ | Política correta. | 🟢 OK |
| `branches` | ✅ | ✅ | Política correta. | 🟢 OK |
| `sale_items` | ✅ | ✅ | Política correta. | 🟢 OK |
| `stock_movements` | ✅ | ❌ | Policies `authenticated` com `qual = true` permitem **qualquer usuário logado ver TODAS** as movimentações. | 🔴 Crítico |
| `fiscal_documents` | ✅ | ✅ | Política correta. | 🟢 OK |
| `subscriptions` | ✅ | ✅ | Política correta + service_role. | 🟢 OK |
| `cash_sessions_log` | ✅ | ❌ | RLS ativo, mas **sem nenhuma policy** — nenhum usuário consegue acessar, ou o acesso é feito via service_role. | 🔴 Alto |
| `cash_operations` | ✅ | ✅ | Baseada em `user_memberships`, sem `is_superadmin`. | 🟡 Médio |
| `cash_transactions` | ✅ | ✅ | Política correta. | 🟢 OK |
| `cash_counts` | ✅ | ✅ | Política correta. | 🟢 OK |
| `delivery_manifests` | ✅ | ✅ | Política correta. | 🟢 OK |
| `fiscal_certificates` | ✅ | ✅ | Política correta. | 🟢 OK |
| `api_keys` | ✅ | ✅ | Política correta. | 🟢 OK |
| `tenant_feature_flags` | ✅ | ✅ | Política correta. | 🟢 OK |
| `payment_records` | ✅ | ✅ | Política correta. | 🟢 OK |
| `plans` | ✅ | ⚠️ | Acesso global para authenticated; provavelmente intencional para página de planos. | 🟢 OK (se intencional) |
| `tenants` | ✅ | ⚠️ | Qualquer `authenticated` pode inserir tenants (`with_check = true`). Revisar. | 🟡 Médio |
| `user_memberships` | ✅ | ✅ | Permite ver próprias memberships via `public`. Revisar. | 🟡 Médio |
| `user_permissions` | ✅ | ⚠️ | Policies `public` para administradores. Deveriam ser `authenticated`. | 🟡 Médio |
| `user_profiles` | ✅ | ⚠️ | Baseado em `user_id`, não em tenant. Provavelmente OK para perfil próprio. | 🟡 Médio |
| `delivery_drivers` | ✅ | ✅ | Tem policies `public` baseadas em `user_id` (antigas) + tenant policies. | 🟡 Médio |

---

## Problemas críticos que vazam dados entre tenants

### 1. `deliveries` — usuários não autenticados podem acessar TODAS as entregas

Policies encontradas:
```sql
-- POLICY "Enable read access for deliveries by tenant" (public, SELECT)
qual = (tenant_id IS NOT NULL)

-- POLICY "Enable insert access for deliveries by tenant" (public, INSERT)
with_check = (tenant_id IS NOT NULL)

-- POLICY "Enable update access for deliveries by tenant" (public, UPDATE)
qual = (tenant_id IS NOT NULL)

-- POLICY "Enable delete access for deliveries by tenant" (public, DELETE)
qual = (tenant_id IS NOT NULL)
```

**Impacto:** qualquer request `anon` (sem login) pode ler, inserir, atualizar e deletar qualquer entrega desde que tenha `tenant_id` preenchido. São **8.305 entregas** expostas.

**Correção:** remover todas as policies `public` da tabela `deliveries`. A policy `deliveries_tenant_policy` para `authenticated` já cobre o caso real.

---

### 2. `stock_movements` — qualquer usuário logado vê TODAS as movimentações

Policies encontradas:
```sql
-- POLICY "Permitir leitura de movimentações para usuários autenticados" (authenticated, SELECT)
qual = true

-- POLICY "Permitir inserção de movimentações para usuários autenticados" (authenticated, INSERT)
with_check = true
```

**Impacto:** usuário do tenant A vê estoque do tenant B. São **13.505 movimentações**, com **723 registros sem `tenant_id`** (outro problema de dados).

**Correção:** substituir essas policies por uma política por tenant (`tenant_id = get_current_tenant_id() OR is_superadmin()`). Também corrigir os 723 registros com `tenant_id` NULL ou removê-los se forem lixo.

---

### 3. `cash_sessions_log` — RLS sem política nenhuma

RLS está ativo, mas **nenhuma policy** existe. Isso significa que nenhum usuário autenticado consegue ler/escrever, e o sistema pode depender de `service_role` — ou a funcionalidade pode estar quebrada.

**Correção:** definir uma policy por tenant para `authenticated` (e `service_role` se necessário para log interno).

---

### 4. Tabelas com policies antigas `public` baseadas em `user_id`

As tabelas abaixo têm policies duplicadas: uma antiga baseada em `user_id` (papel `public` ou `authenticated`) e uma nova baseada em tenant. As antigas podem permitir vazamento lateral quando o mesmo `user_id` estiver em múltiplos tenants:

- `sales`
- `products`
- `customers`
- `financial_transactions`
- `delivery_drivers`

**Correção:** remover as policies antigas baseadas em `user_id` e manter apenas as policies baseadas em `tenant_id` (via `get_current_tenant_id()` ou `user_memberships`).

---

## Roteiro de teste para validar isolamento

> ⚠️ Rode isso em um ambiente de **teste/branch** primeiro. Não em produção.

### Teste 1 — Verificar se tabelas críticas têm RLS e policies

```sql
SELECT c.relname AS tabela,
       c.relrowsecurity AS rls_ativo,
       COUNT(p.policyname) AS total_policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relname IN ('sales','products','customers','cash_sessions','financial_transactions',
                    'deliveries','product_stocks','branches','sale_items','stock_movements',
                    'fiscal_documents','subscriptions','cash_sessions_log','cash_operations')
  AND c.relkind = 'r'
GROUP BY c.relname, c.relrowsecurity
ORDER BY total_policies;
```

**Esperado:** toda tabela deve ter `rls_ativo = true` e `total_policies > 0`.

---

### Teste 2 — Verificar se existem policies perigosas para `public`/`anon`

```sql
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND 'public' = ANY (roles)
  AND tablename IN ('sales','products','customers','deliveries','stock_movements',
                    'financial_transactions','delivery_drivers')
ORDER BY tablename, policyname;
```

**Esperado:** nenhuma policy para `public` nessas tabelas. (Exceto se houver um caso muito específico e intencional.)

---

### Teste 3 — Verificar se há policies com `qual = true` (permissão total)

```sql
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = 'true' OR with_check = 'true')
  AND tablename IN ('sales','products','customers','cash_sessions','financial_transactions',
                    'deliveries','product_stocks','branches','sale_items','stock_movements',
                    'fiscal_documents','subscriptions','cash_sessions_log','cash_operations')
ORDER BY tablename, policyname;
```

**Esperado:** apenas `tenants` (INSERT intencional), `plans` (SELECT intencional) e `subscriptions` (service_role). Nada de `true` em tabelas de dados de negócio.

---

### Teste 4 — Simular acesso como usuário de outro tenant (ambiente de teste)

Crie duas contas de teste (Tenant A e Tenant B) e, logado em B, tente:

```sql
-- Usando a role anon para simular request nao autenticado
SET ROLE anon;
SELECT count(*) FROM deliveries;  -- Deve retornar 0 ou erro
RESET ROLE;
```

```sql
-- Logado como usuario do Tenant B, tente ler dados do Tenant A
SET ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '<uuid_usuario_tenant_b>';
SET LOCAL request.jwt.claim.user_tenant_id = '<uuid_tenant_a>';  -- tentativa de spoof
SELECT count(*) FROM sales WHERE tenant_id = '<uuid_tenant_a>';   -- Deve retornar 0
RESET ROLE;
```

> Nota: simular JWT no Supabase pode exigir configuração específica. Em teste, o mais prático é usar o client SDK real logado em duas contas.

---

### Teste 5 — Verificar registros órfãos sem `tenant_id`

```sql
SELECT 'sales' AS tabela, count(*) FILTER (WHERE tenant_id IS NULL) AS sem_tenant FROM sales
UNION ALL SELECT 'products', count(*) FILTER (WHERE tenant_id IS NULL) FROM products
UNION ALL SELECT 'customers', count(*) FILTER (WHERE tenant_id IS NULL) FROM customers
UNION ALL SELECT 'deliveries', count(*) FILTER (WHERE tenant_id IS NULL) FROM deliveries
UNION ALL SELECT 'financial_transactions', count(*) FILTER (WHERE tenant_id IS NULL) FROM financial_transactions
UNION ALL SELECT 'stock_movements', count(*) FILTER (WHERE tenant_id IS NULL) FROM stock_movements
UNION ALL SELECT 'sale_items', count(*) FILTER (WHERE tenant_id IS NULL) FROM sale_items
UNION ALL SELECT 'cash_sessions', count(*) FILTER (WHERE tenant_id IS NULL) FROM cash_sessions;
```

**Resultado atual:** `stock_movements` tem **723 registros sem tenant_id**. As demais tabelas principais estão OK.

---

## Plano de correção proposto (não aplicar em produção sem revisar)

### Passo A — Remover policies perigosas

```sql
-- Remover policies public de deliveries (CRITICO)
DROP POLICY IF EXISTS "Enable read access for deliveries by tenant" ON deliveries;
DROP POLICY IF EXISTS "Enable insert access for deliveries by tenant" ON deliveries;
DROP POLICY IF EXISTS "Enable update access for deliveries by tenant" ON deliveries;
DROP POLICY IF EXISTS "Enable delete access for deliveries by tenant" ON deliveries;
DROP POLICY IF EXISTS "delivery_drivers_select_policy" ON delivery_drivers;
DROP POLICY IF EXISTS "delivery_drivers_insert_policy" ON delivery_drivers;
DROP POLICY IF EXISTS "delivery_drivers_update_policy" ON delivery_drivers;
DROP POLICY IF EXISTS "delivery_drivers_delete_policy" ON delivery_drivers;

-- Remover policies antigas baseadas em user_id (duplicadas/conflitantes)
DROP POLICY IF EXISTS "sales_select_policy" ON sales;
DROP POLICY IF EXISTS "sales_insert_policy" ON sales;
DROP POLICY IF EXISTS "sales_update_policy" ON sales;
DROP POLICY IF EXISTS "sales_delete_policy" ON sales;

DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;

DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;

DROP POLICY IF EXISTS "financial_transactions_select_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete_policy" ON financial_transactions;

DROP POLICY IF EXISTS "prod_select_sales" ON sales;
DROP POLICY IF EXISTS "prod_insert_sales" ON sales;
DROP POLICY IF EXISTS "prod_update_sales" ON sales;
DROP POLICY IF EXISTS "prod_delete_sales" ON sales;
DROP POLICY IF EXISTS "prod_select_products" ON products;
DROP POLICY IF EXISTS "prod_insert_products" ON products;
DROP POLICY IF EXISTS "prod_update_products" ON products;
DROP POLICY IF EXISTS "prod_delete_products" ON products;
DROP POLICY IF EXISTS "prod_select_customers" ON customers;
DROP POLICY IF EXISTS "prod_insert_customers" ON customers;
DROP POLICY IF EXISTS "prod_update_customers" ON customers;
DROP POLICY IF EXISTS "prod_delete_customers" ON customers;
```

### Passo B — Corrigir policies de stock_movements

```sql
-- Remover as policies abertas
DROP POLICY IF EXISTS "Permitir leitura de movimentações para usuários autenticados" ON stock_movements;
DROP POLICY IF EXISTS "Permitir inserção de movimentações para usuários autenticados" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_select_policy" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_insert_policy" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_update_policy" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_delete_policy" ON stock_movements;

-- Criar policy por tenant
CREATE POLICY "stock_movements_tenant_policy" ON stock_movements
  FOR ALL
  TO authenticated
  USING (tenant_id = get_current_tenant_id() OR is_superadmin())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_superadmin());
```

### Passo C — Criar policy para cash_sessions_log

```sql
CREATE POLICY "cash_sessions_log_tenant_policy" ON cash_sessions_log
  FOR ALL
  TO authenticated
  USING (tenant_id = get_current_tenant_id() OR is_superadmin())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_superadmin());
```

### Passo D — Corrigir dados órfãos

```sql
-- Investigar e tratar os 723 registros de stock_movements sem tenant_id
SELECT id, created_at, product_id, quantity, type
FROM stock_movements
WHERE tenant_id IS NULL
LIMIT 50;

-- Opcional: se forem lixo de teste, apagar
-- DELETE FROM stock_movements WHERE tenant_id IS NULL;

-- Ou, se possível, inferir tenant_id a partir de product_id/sale_id
-- UPDATE stock_movements sm
-- SET tenant_id = p.tenant_id
-- FROM products p
-- WHERE sm.product_id = p.id AND sm.tenant_id IS NULL;
```

> ⚠️ Só execute esse DELETE/UPDATE depois de confirmar que são realmente descartáveis.

---

## Checklist de validação pós-correção

1. Rodar novamente os **Security Advisors** do Supabase.
2. Rodar o Teste 2 (policies para `public`) e confirmar que **não há nenhuma** em tabelas de negócio.
3. Rodar o Teste 3 e confirmar que **não há `qual = true`** em tabelas de dados.
4. Criar 2 tenants de teste e confirmar que Tenant A não vê dados do Tenant B em nenhuma tela.
5. Testar request `anon` deslogado confirmando que não lê `deliveries`, `stock_movements`, etc.

---

## Correções aplicadas em produção (05/07/2026)

Todas as correções foram aplicadas no projeto `lfxietcasaooenffdodr` com validação a cada lote.

### Lote 1 — `cash_sessions_log`
- Criada policy `cash_sessions_log_tenant_policy` baseada na sessão de caixa (`cash_sessions.tenant_id`), já que a tabela de log não possui coluna `tenant_id` própria.

### Lote 2 — `deliveries`
- Removidas as 4 policies `public` perigosas (`tenant_id IS NOT NULL`).
- Restou apenas `deliveries_tenant_policy` (`authenticated`).

### Lote 3 — `stock_movements`
- Removidas policies `authenticated` com `qual = true`.
- Criada `stock_movements_tenant_policy` (`authenticated`).
- **Pendência:** 723 registros ainda têm `tenant_id IS NULL`. Como o app usa `service_role`, eles não quebram, mas não serão visíveis para clientes via cliente autenticado. Tratar em tarefa separada.

### Lote 4 — Limpeza de policies antigas baseadas em `user_id`
- Removidas policies duplicadas/conflitantes de `sales`, `products`, `customers`, `financial_transactions` e `delivery_drivers`.
- Restaram apenas as policies baseadas em `tenant_id`/`get_current_tenant_id()` ou `user_memberships`.

### Validação pós-correção
- Nenhuma policy `public` baseada em `user_id` nas tabelas de negócio.
- Nenhuma policy com `qual = true` em `deliveries`, `stock_movements`, `sales`, `products`, `customers` ou `financial_transactions`.
- Ainda restam policies `public` baseadas em `user_memberships` (não `user_id`) em `products`, `customers` e `delivery_drivers`. São redundantes, mas não vazam dados — podem ser removidas em limpeza futura.

---

## Recomendação final

**Os 3 problemas críticos de isolamento estão corrigidos.** Antes de ligar tráfego pago, ainda é necessário:
1. Corrigir os 723 registros de `stock_movements` sem `tenant_id`.
2. Resolver os outros itens críticos do checklist (RPCs `anon`, view `SECURITY DEFINER`, middleware/billing).
3. Testar o app com usuários reais para confirmar que nenhuma tela quebrou.

Eles permitem vazamento de dados entre tenants ou acesso por usuários não autenticados, com risco legal (LGPD) e perda de confiança de clientes.
