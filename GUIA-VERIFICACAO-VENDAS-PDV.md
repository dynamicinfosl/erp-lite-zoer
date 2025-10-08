# 🛠️ GUIA DE VERIFICAÇÃO - SISTEMA DE VENDAS/PDV

## 📋 Status Atual da Implementação

### ✅ O que está IMPLEMENTADO:

1. **Scripts SQL**
   - ✅ `scripts/create-sales-BASIC.sql` - Script completo de criação das tabelas
   - ✅ `scripts/fix-all-constraints.sql` - Correção de constraints problemáticas
   - ✅ `scripts/test-sales-integration.sql` - Testes de integração

2. **Backend/API**
   - ✅ `src/app/next_api/sales/route.ts` - API para criar e listar vendas
   - ✅ Integração com Supabase configurada
   - ✅ Validação de planos implementada

3. **Frontend/PDV**
   - ✅ `src/app/pdv/page.tsx` - Página principal do PDV
   - ✅ `src/components/pdv/ProductSearch.tsx` - Busca de produtos
   - ✅ `src/components/pdv/CartItems.tsx` - Carrinho de compras
   - ✅ `src/components/pdv/PaymentForm.tsx` - Formulário de pagamento

4. **Funcionalidades**
   - ✅ Busca de produtos por nome/código
   - ✅ Adição ao carrinho com quantidade e desconto
   - ✅ Múltiplas formas de pagamento
   - ✅ Histórico de vendas do dia
   - ✅ Operações de caixa (sangria, reforço, fechamento)
   - ✅ KPIs em tempo real

---

## 🔍 VERIFICAÇÃO PASSO A PASSO

### **PASSO 1: Verificar Configuração Básica**

Execute o script de verificação automática:

```bash
node scripts/verificar-vendas.js
```

Este script irá:
- ✅ Verificar se as tabelas existem
- ✅ Verificar se a função `generate_sale_number()` existe
- ✅ Testar inserção de vendas
- ✅ Mostrar estatísticas de vendas existentes

---

### **PASSO 2: Se as Tabelas NÃO Existirem**

Se o script indicar que as tabelas não existem, siga estas etapas:

#### 2.1. Acesse o Supabase SQL Editor

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **"SQL Editor"** no menu lateral

#### 2.2. Execute o Script de Criação

1. Abra o arquivo: `scripts/create-sales-BASIC.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou pressione Ctrl+Enter)

**O que este script faz:**
- Cria a tabela `sales` (vendas)
- Cria a tabela `sale_items` (itens da venda)
- Cria a tabela `cash_operations` (operações de caixa)
- Cria índices para performance
- Cria a função `generate_sale_number()` para gerar números de venda

#### 2.3. Verifique se Funcionou

Execute novamente:

```bash
node scripts/verificar-vendas.js
```

Você deve ver:
```
✅ sales: EXISTE
✅ sale_items: EXISTE
✅ cash_operations: EXISTE
✅ Função generate_sale_number FUNCIONA
```

---

### **PASSO 3: Diagnóstico Avançado (Opcional)**

Se ainda houver problemas, execute o diagnóstico completo no Supabase:

1. Abra: `scripts/diagnostico-vendas-completo.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Execute

Este script irá mostrar:
- 📋 Todas as tabelas existentes
- 🔍 Estrutura completa de cada tabela
- ⚙️ Funções disponíveis
- 📊 Índices criados
- 🔗 Foreign keys configuradas
- 📈 Estatísticas de vendas

---

### **PASSO 4: Corrigir Constraints (Se Necessário)**

Se houver erros relacionados a colunas obrigatórias (NOT NULL), execute:

1. Abra: `scripts/fix-all-constraints.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Execute

Este script remove constraints problemáticas de colunas como:
- `user_id`
- `tenant_id`
- `sale_type`
- `created_by`
- `updated_by`

---

### **PASSO 5: Testar o PDV**

#### 5.1. Iniciar o Servidor

```bash
npm run dev
```

#### 5.2. Acessar o PDV

Abra no navegador:
```
http://localhost:3000/pdv
```

#### 5.3. Testar Funcionalidades

1. **Busca de Produtos**
   - Digite um nome ou código no campo de busca
   - Selecione um produto

2. **Adicionar ao Carrinho**
   - Ajuste a quantidade
   - Adicione desconto (opcional)
   - Clique em "ADICIONAR PRODUTO/ITEM"

3. **Finalizar Venda**
   - Clique em "FINALIZAR VENDA"
   - Escolha a forma de pagamento
   - Adicione nome do cliente (opcional)
   - Confirme a venda

4. **Verificar Histórico**
   - Clique no botão "Histórico"
   - Veja todas as vendas do dia

5. **Operações de Caixa**
   - Clique no botão "Caixa"
   - Teste: Sangria, Reforço, Fechamento

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### Problema 1: "Cliente Supabase não configurado"

**Solução:**
Verifique as variáveis de ambiente no arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lfxietcasaooenffdodr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

---

### Problema 2: "Erro ao gerar número da venda"

**Causa:** A função `generate_sale_number()` não existe.

**Solução:**
Execute o script `create-sales-BASIC.sql` no Supabase SQL Editor.

---

### Problema 3: "Erro ao criar venda: null value in column..."

**Causa:** Existe uma constraint NOT NULL em uma coluna que não está sendo preenchida.

**Solução:**
Execute o script `fix-all-constraints.sql` no Supabase SQL Editor.

---

### Problema 4: "Erro ao carregar produtos"

**Causa:** A tabela de produtos pode não estar configurada corretamente.

**Solução:**
1. Verifique se a tabela `products` existe no Supabase
2. Verifique se há produtos cadastrados
3. Vá em `/produtos` para cadastrar produtos

---

### Problema 5: "Permission denied for table sales"

**Causa:** Políticas RLS (Row Level Security) bloqueando acesso.

**Solução:**
Execute no Supabase SQL Editor:

```sql
-- Habilitar RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_operations ENABLE ROW LEVEL SECURITY;

-- Criar política permissiva (DESENVOLVIMENTO - ajuste para produção)
CREATE POLICY "Enable all for development" ON public.sales FOR ALL USING (true);
CREATE POLICY "Enable all for development" ON public.sale_items FOR ALL USING (true);
CREATE POLICY "Enable all for development" ON public.cash_operations FOR ALL USING (true);
```

**⚠️ IMPORTANTE:** Em produção, ajuste as políticas para restringir acesso adequadamente.

---

## 📊 ESTRUTURA DAS TABELAS

### Tabela: `sales`

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | UUID | Sim | ID único da venda |
| `sale_number` | VARCHAR(50) | Sim | Número da venda (VND-YYYYMMDD-0001) |
| `customer_name` | VARCHAR(255) | Não | Nome do cliente |
| `total_amount` | DECIMAL(10,2) | Sim | Valor total da venda |
| `payment_method` | VARCHAR(50) | Sim | Forma de pagamento |
| `status` | VARCHAR(20) | Não | Status da venda (completed, pending, cancelled) |
| `notes` | TEXT | Não | Observações |
| `created_at` | TIMESTAMPTZ | Não | Data de criação |
| `updated_at` | TIMESTAMPTZ | Não | Data de atualização |

### Tabela: `sale_items`

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | UUID | Sim | ID único do item |
| `sale_id` | UUID | Sim | ID da venda (FK) |
| `product_id` | UUID | Sim | ID do produto |
| `product_name` | VARCHAR(255) | Sim | Nome do produto |
| `product_code` | VARCHAR(100) | Não | Código do produto |
| `unit_price` | DECIMAL(10,2) | Sim | Preço unitário |
| `quantity` | INTEGER | Sim | Quantidade |
| `discount_percentage` | DECIMAL(5,2) | Não | Desconto (%) |
| `subtotal` | DECIMAL(10,2) | Sim | Subtotal do item |
| `created_at` | TIMESTAMPTZ | Não | Data de criação |

### Tabela: `cash_operations`

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | UUID | Sim | ID único da operação |
| `operation_type` | VARCHAR(20) | Sim | Tipo (sangria, reforco, abertura, fechamento) |
| `amount` | DECIMAL(10,2) | Sim | Valor da operação |
| `description` | TEXT | Não | Descrição |
| `created_at` | TIMESTAMPTZ | Não | Data da operação |

---

## 🎯 CHECKLIST DE VERIFICAÇÃO

Use este checklist para garantir que tudo está funcionando:

- [ ] Script `verificar-vendas.js` executou sem erros
- [ ] Todas as 3 tabelas existem (sales, sale_items, cash_operations)
- [ ] Função `generate_sale_number()` funciona
- [ ] Teste de inserção passou
- [ ] Servidor Next.js está rodando (`npm run dev`)
- [ ] PDV abre em `/pdv` sem erros
- [ ] Busca de produtos funciona
- [ ] Adicionar produto ao carrinho funciona
- [ ] Finalizar venda funciona
- [ ] Venda é salva no Supabase
- [ ] Histórico mostra as vendas
- [ ] KPIs são atualizados

---

## 📞 SUPORTE

Se ainda houver problemas após seguir este guia:

1. Execute: `node scripts/verificar-vendas.js > resultado.txt`
2. Execute: Copie o SQL de `diagnostico-vendas-completo.sql` no Supabase e salve os resultados
3. Abra o console do navegador (F12) e verifique erros
4. Verifique os logs do servidor Next.js no terminal

---

## 🚀 PRÓXIMOS PASSOS

Após confirmar que tudo está funcionando:

1. **Cadastrar Produtos**
   - Acesse `/produtos`
   - Cadastre alguns produtos de teste

2. **Testar Vendas Reais**
   - Acesse `/pdv`
   - Faça algumas vendas de teste
   - Verifique se aparecem no histórico

3. **Configurar Relatórios**
   - Implemente relatórios de vendas
   - Gráficos de performance
   - Exportação de dados

4. **Ajustar Políticas RLS**
   - Em produção, configure políticas adequadas
   - Restringir acesso por tenant/usuário

5. **Adicionar Funcionalidades**
   - Impressão de comprovantes
   - Integração com impressora fiscal
   - Sincronização offline
   - Backup automático

---

**✅ Sistema desenvolvido e testado!**
**📅 Data: Outubro 2025**
**🔧 Versão: 1.0**

