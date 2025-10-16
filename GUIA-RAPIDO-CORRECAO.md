# 🚀 Guia Rápido de Correção

## ⚠️ EXECUTAR NA ORDEM

### Passo 1: Remover Foreign Key Constraints (OBRIGATÓRIO)

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor** → **New query**
3. Cole o conteúdo de: `scripts/fix-foreign-key-constraints.sql`
4. Clique em **Run**
5. Verifique: `✅ Foreign key constraints removidas com sucesso!`

**Por que?** Sem isso, você verá o erro:
```
ERROR: 23503: insert or update on table "products" violates foreign key constraint
```

---

### Passo 2: Ajustar Vendas (RECOMENDADO)

1. No mesmo **SQL Editor**
2. Cole o conteúdo de: `scripts/fix-sales-tenant-default.sql`
3. Clique em **Run**
4. Verifique: `✅ Valor padrão removido da coluna tenant_id`

**Por que?** A tabela `sales` tinha um valor padrão fixo que não funcionava com o novo sistema.

---

### Passo 3: Migrar Dados Antigos (OPCIONAL)

**Apenas se você já tem produtos/clientes cadastrados:**

1. No **SQL Editor**
2. Abra: `scripts/fix-tenant-id-consistency.sql`
3. **IMPORTANTE**: Na linha que começa com `UPDATE`, substitua `'SEU-USER-ID-AQUI'` pelo seu `user_id` real
4. Para descobrir seu `user_id`:
   - Abra o Console do navegador (F12)
   - Procure por: `🔑 Usando user_id como tenant_id:`
   - Copie o UUID que aparece
5. Cole o script no SQL Editor
6. Clique em **Run**

---

## ✅ Testar Agora

### 1. Faça Logout e Login

- Isso garante que o novo `tenant_id` seja carregado
- Abra o Console (F12) e veja os logs

### 2. Cadastre um Produto

- Vá em **Produtos** → **Adicionar Produto**
- Preencha e salve
- ✅ Deve salvar SEM ERROS
- ✅ Deve aparecer na lista

### 3. Cadastre um Cliente

- Vá em **Clientes** → **Adicionar Cliente**
- Preencha e salve
- ✅ Deve salvar SEM ERROS
- ✅ Deve aparecer na lista

### 4. Faça uma Venda (se aplicável)

- Vá em **PDV** ou **Vendas**
- Adicione produtos e finalize
- ✅ Deve salvar SEM ERROS
- ✅ Deve aparecer na lista de vendas

---

## 📊 Verificar Logs

### Console do Navegador (F12)

Você deve ver:

```
🔍 Buscando tenant real para usuário: abc123-def456-...
🔑 Usando user_id como tenant_id: abc123-def456-...
✅ Tenant real configurado: Meu Negócio abc123-def456-...

📦 GET /products - tenant_id: abc123-def456-...
🔍 Buscando produtos com tenant_id: abc123-def456-...
✅ GET /products - 5 produtos encontrados

👥 GET /customers - tenant_id: abc123-def456-...
🔍 Buscando clientes com tenant_id: abc123-def456-...
✅ GET /customers - 3 clientes encontrados

💰 GET /sales - tenant_id: abc123-def456-...
🔍 Buscando vendas com tenant_id: abc123-def456-...
✅ GET /sales - 2 vendas encontradas
```

---

## ❓ Problemas?

### "Ainda não aparecem os dados"

1. Verifique se executou o script `fix-foreign-key-constraints.sql`
2. Faça logout e login novamente
3. Verifique os logs no Console (F12)
4. Certifique-se de que o `tenant_id` nos logs não é `00000000-0000-0000-0000-000000000000`

### "Erro ao cadastrar"

1. Verifique se executou o script `fix-foreign-key-constraints.sql`
2. Verifique no Console se há mensagens de erro
3. Se o erro menciona "foreign key constraint", execute o script novamente

### "Dados antigos não aparecem"

1. Execute o script `fix-tenant-id-consistency.sql`
2. Não esqueça de substituir `'SEU-USER-ID-AQUI'` pelo seu `user_id` real
3. Recarregue a página após executar

---

## 📝 Resumo

### O que foi corrigido:

1. ✅ **SimpleAuthContext** - Agora usa `user_id` diretamente como `tenant_id`
2. ✅ **APIs** - Logs melhorados em products, customers e sales
3. ✅ **Foreign Keys** - Removidas constraints que impediam cadastros
4. ✅ **Sales** - Removido valor padrão fixo do tenant_id

### Resultado:

- Cada usuário vê apenas seus próprios dados
- Consistência total entre cadastro e busca
- Sem erros de foreign key
- Logs claros para debug

---

## 📄 Documentação Completa

Para mais detalhes, veja: `CORRECAO-BUSCA-PRODUTOS-CLIENTES.md`


