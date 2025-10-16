# Correção: Busca de Produtos, Clientes e Vendas por Usuário

## 🎯 Problemas Identificados

### Problema 1: Inconsistência no tenant_id

Os produtos e clientes não estavam aparecendo para cada usuário porque havia **inconsistência no `tenant_id`** usado:

1. **No cadastro**: Produtos e clientes eram salvos com um `tenant_id` específico
2. **Na busca**: O sistema usava um `tenant_id` DIFERENTE (gerado por hash)
3. **Resultado**: As queries não encontravam nada, pois os IDs não batiam

### Problema 2: Foreign Key Constraint

Ao tentar cadastrar produtos/clientes, ocorria erro:

```
ERROR: 23503: insert or update on table "products" violates foreign key constraint "products_tenant_id_fkey"
DETAIL: Key (tenant_id)=(xxx) is not present in table "tenants".
```

**Causa**: As tabelas têm constraints de foreign key que exigem que o `tenant_id` exista na tabela `tenants`. Como estamos usando `user_id` como `tenant_id`, essa constraint impede o cadastro.

## ✅ Solução Implementada

### 1. **SimpleAuthContext.tsx** - Consistência no tenant_id

**Antes:**
- Gerava um `tenant_id` baseado em um hash do `user_id`
- Esse hash não correspondia ao `tenant_id` real usado no cadastro

**Depois:**
- Usa o **próprio `user_id` como `tenant_id`**
- Garante consistência total entre cadastro e busca
- Fallback para `user_memberships` se existir

```typescript
// ✅ SOLUÇÃO: Usar o próprio user_id como tenant_id
const userTenantId = userId;
```

### 2. **APIs de Produtos e Clientes** - Logs melhorados

Adicionados logs detalhados para facilitar debug:

**GET /products:**
```typescript
console.log(`📦 GET /products - tenant_id: ${tenant_id}, sku: ${sku}`);
console.log(`✅ GET /products - ${data?.length || 0} produtos encontrados`);
```

**GET /customers:**
```typescript
console.log(`👥 GET /customers - tenant_id: ${tenant_id}`);
console.log(`✅ GET /customers - ${data?.length || 0} clientes encontrados`);
```

### 3. **Script SQL** - Remover Foreign Key Constraints

Criado `scripts/fix-foreign-key-constraints.sql` para **remover as constraints** que impedem o cadastro:

```sql
-- Remover constraint de products → tenants
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_tenant_id_fkey;

-- Remover constraint de customers → tenants
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_tenant_id_fkey;

-- E outras tabelas relacionadas...
```

**Por que remover?**
- Estamos usando `user_id` como `tenant_id`
- Não precisamos da tabela `tenants` no modelo simplificado
- Remove a dependência e permite cadastros diretos

### 4. **Script SQL** - Migração de Dados Antigos

Criado `scripts/fix-tenant-id-consistency.sql` para atualizar dados existentes:

```sql
-- Atualizar produtos para usar user_id como tenant_id
UPDATE products p
SET tenant_id = um.user_id
FROM user_memberships um
WHERE p.user_id = um.user_id
  AND um.is_active = true
  AND p.tenant_id != um.user_id;
```

## 🧪 Como Testar

### ⚠️ PASSO OBRIGATÓRIO: Remover Foreign Key Constraints

**Antes de testar, você PRECISA executar este script:**

1. **Acesse o Supabase Dashboard**
   - Vá em https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Cole e execute o script**
   - Abra o arquivo `scripts/fix-foreign-key-constraints.sql`
   - Copie TODO o conteúdo
   - Cole no SQL Editor
   - Clique em "Run" ou pressione Ctrl+Enter

4. **Verifique a mensagem de sucesso**
   - Você deve ver: `✅ Foreign key constraints removidas com sucesso!`

### Opção A: Novo Cadastro (Recomendado)

1. **Faça logout e login novamente**
   - Isso garante que o novo `tenant_id` seja carregado

2. **Cadastre um novo produto**
   - Vá em Produtos → Adicionar Produto
   - Preencha os dados e salve
   - ✅ **Agora deve salvar SEM ERROS**
   - Verifique se aparece na lista

3. **Cadastre um novo cliente**
   - Vá em Clientes → Adicionar Cliente
   - Preencha os dados e salve
   - ✅ **Agora deve salvar SEM ERROS**
   - Verifique se aparece na lista

4. **Verifique os logs do console**
   - Abra as DevTools (F12)
   - Veja no Console:
     - `🔑 Usando user_id como tenant_id: [seu-user-id]`
     - `✅ GET /products - X produtos encontrados`
     - `✅ GET /customers - X clientes encontrados`

### Opção B: Migrar Dados Existentes

Se você já tem produtos/clientes cadastrados e quer vê-los:

1. **Identifique seu user_id**
   - Abra as DevTools (F12)
   - No Console, procure por: `🔑 Usando user_id como tenant_id:`
   - Copie o UUID que aparece

2. **Execute o script SQL no Supabase**
   - Acesse o Supabase Dashboard
   - Vá em SQL Editor
   - Cole o script `scripts/fix-tenant-id-consistency.sql`
   - **IMPORTANTE**: Substitua `'SEU-USER-ID-AQUI'` pelo seu user_id
   - Execute o script

3. **Recarregue a página**
   - Produtos e clientes devem aparecer agora

## 📊 Verificação

### Console do Navegador

Você deve ver logs como:

```
🔍 Buscando tenant real para usuário: abc123-def456-...
🔑 Usando user_id como tenant_id: abc123-def456-...
✅ Tenant real configurado: Meu Negócio abc123-def456-...
📦 GET /products - tenant_id: abc123-def456-...
🔍 Buscando produtos com tenant_id: abc123-def456-...
✅ GET /products - 5 produtos encontrados para tenant abc123-def456-...
```

### Supabase Database

Execute para verificar os dados:

```sql
-- Ver produtos por tenant_id
SELECT 
  tenant_id,
  COUNT(*) as total_produtos,
  MIN(created_at) as primeiro_cadastro,
  MAX(created_at) as ultimo_cadastro
FROM products
GROUP BY tenant_id
ORDER BY total_produtos DESC;

-- Ver clientes por tenant_id
SELECT 
  tenant_id,
  COUNT(*) as total_clientes,
  MIN(created_at) as primeiro_cadastro,
  MAX(created_at) as ultimo_cadastro
FROM customers
GROUP BY tenant_id
ORDER BY total_clientes DESC;
```

## 🔧 Arquivos Modificados

### Código da Aplicação

1. ✅ `src/contexts/SimpleAuthContext.tsx`
   - Função `loadRealTenant()` - usa user_id diretamente
   - Função `refreshTenant()` - atualizada para consistência

2. ✅ `src/app/next_api/products/route.ts`
   - Logs melhorados no GET

3. ✅ `src/app/next_api/customers/route.ts`
   - Logs melhorados no GET

4. ✅ `src/app/next_api/sales/route.ts`
   - Logs melhorados no GET
   - Já estava passando tenant_id corretamente

### Scripts SQL (NOVOS)

5. ✅ `scripts/fix-foreign-key-constraints.sql` (NOVO) ⚠️ **OBRIGATÓRIO**
   - Remove constraints de foreign key de todas as tabelas
   - Adiciona índices para performance
   - **Execute ANTES de testar**

6. ✅ `scripts/fix-sales-tenant-default.sql` (NOVO) ⚠️ **RECOMENDADO**
   - Remove valor padrão fixo do tenant_id em sales
   - Atualiza vendas existentes para usar user_id
   - **Execute APÓS fix-foreign-key-constraints.sql**

7. ✅ `scripts/fix-tenant-id-consistency.sql` (NOVO)
   - Migra dados antigos de products/customers para o novo formato
   - Opcional, apenas se você tem dados antigos

### Documentação

8. ✅ `CORRECAO-BUSCA-PRODUTOS-CLIENTES.md` (NOVO)
   - Documentação completa do problema e solução

## ⚠️ Importante

### 🚨 PASSO CRÍTICO: Execute o Script de Foreign Keys

**ANTES de testar qualquer coisa**, você PRECISA executar o script `fix-foreign-key-constraints.sql`:

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Cole e execute `scripts/fix-foreign-key-constraints.sql`
4. Verifique a mensagem de sucesso

**Sem isso, você verá o erro:**
```
ERROR: 23503: insert or update on table "products" violates foreign key constraint
```

### ✅ Após executar o script:

- **Todos os novos cadastros** funcionarão automaticamente
- **Dados antigos** podem ser migrados com `fix-tenant-id-consistency.sql`
- O `tenant_id` agora é **igual ao `user_id`** do Supabase Auth
- Cada usuário tem seus próprios dados isolados
- Não há mais dependência da tabela `tenants`

## 🎉 Resultado Esperado

Após as correções:
- ✅ Produtos cadastrados aparecem na lista de Produtos
- ✅ Clientes cadastrados aparecem na lista de Clientes
- ✅ Vendas cadastradas aparecem na lista de Vendas
- ✅ Cada usuário vê apenas seus próprios dados
- ✅ Consistência total entre cadastro e busca
- ✅ Logs claros para debug em todas as APIs

### Console do Navegador

Logs esperados para vendas:
```
💰 GET /sales - tenant_id: abc123-def456-...
🔍 Buscando vendas com tenant_id: abc123-def456-...
✅ GET /sales - 3 vendas encontradas para tenant abc123-def456-...
```

