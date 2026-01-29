# Proteção Contra Vendas Duplicadas - API Externa

**Data:** 27/01/2026  
**Endpoint:** `POST /api/v1/sales`  
**Status:** ✅ **IMPLEMENTADO**

---

## 🎯 Objetivo

Impedir a criação de vendas duplicadas através da API externa, evitando erros de integração e pedidos repetidos acidentalmente.

---

## 🚫 Critérios de Bloqueio

Uma venda é considerada **DUPLICADA** quando possui todas as características idênticas a uma venda já existente:

### 1. ✅ Mesmo Cliente
- Verificado por `customer_id` (se fornecido)
- OU por `customer_name` (se customer_id não fornecido)
- Ignora "Cliente Avulso" (permite múltiplas vendas avulsas)

### 2. ✅ Mesmo Valor Total
- `total_amount` exatamente igual
- Validação numérica precisa (ex: 59.80 = 59.80)

### 3. ✅ Mesmo Dia
- Vendas criadas no mesmo dia (00h00 - 23h59)
- **ANTES:** Janela de 10 minutos
- **AGORA:** Dia inteiro (24 horas)

### 4. ✅ Mesma Quantidade de Produtos
- Número de itens no array `products` igual
- Exemplo: 3 produtos = 3 produtos
- **NOVO critério** (não validava antes)

---

## 📋 Exemplo de Bloqueio

### Venda Original (criada às 10:00)
```json
{
  "customer_id": 123,
  "customer_name": "João Silva",
  "products": [
    { "name": "Produto A", "price": 29.90, "quantity": 2 },
    { "name": "Produto B", "price": 15.00, "quantity": 1 }
  ],
  "total_amount": 74.80,
  "payment_method": "pix",
  "sale_type": "entrega"
}
```
**Status:** ✅ Criada com sucesso

---

### Tentativa de Duplicação (às 15:00 do mesmo dia)
```json
{
  "customer_id": 123,
  "customer_name": "João Silva",
  "products": [
    { "name": "Produto C", "price": 50.00, "quantity": 1 },
    { "name": "Produto D", "price": 24.80, "quantity": 1 }
  ],
  "total_amount": 74.80,  // ✅ Mesmo valor
  "payment_method": "cartao_credito",  // ⚠️ Forma de pagamento diferente, mas não importa
  "sale_type": "balcao"  // ⚠️ Tipo diferente, mas não importa
}
```

**Status:** ❌ **BLOQUEADA**

**Resposta HTTP 409:**
```json
{
  "success": false,
  "error": "Venda duplicada detectada. Já existe uma venda para este cliente com o mesmo valor, mesma quantidade de produtos e criada no mesmo dia.",
  "duplicate_sale_id": 789,
  "duplicate_sale_number": "VND-000123",
  "duplicate_sale_type": "entrega",
  "duplicate_created_at": "2026-01-27T10:00:00Z",
  "duplicate_product_count": 2
}
```

---

## ✅ Exemplo de Venda Permitida

### Caso 1: Valor Diferente
```json
{
  "customer_id": 123,
  "total_amount": 74.79,  // ✅ Diferente (74.80 vs 74.79)
  "products": [ ... ]  // 2 produtos
}
```
**Status:** ✅ Permitida (valor diferente)

---

### Caso 2: Quantidade de Produtos Diferente
```json
{
  "customer_id": 123,
  "total_amount": 74.80,  // Mesmo valor
  "products": [
    { "name": "Produto E", "price": 74.80, "quantity": 1 }  // ✅ 1 produto (diferente de 2)
  ]
}
```
**Status:** ✅ Permitida (quantidade de produtos diferente)

---

### Caso 3: Cliente Diferente
```json
{
  "customer_id": 456,  // ✅ Cliente diferente
  "total_amount": 74.80,
  "products": [ ... ]  // 2 produtos
}
```
**Status:** ✅ Permitida (cliente diferente)

---

### Caso 4: Dia Diferente
```json
{
  "customer_id": 123,
  "total_amount": 74.80,
  "products": [ ... ]  // 2 produtos
  // Criada no dia seguinte (28/01/2026)
}
```
**Status:** ✅ Permitida (dia diferente)

---

## 🔍 Fluxo de Validação

```
1. Recebe requisição POST /api/v1/sales
   ↓
2. Valida campos obrigatórios (produtos, total_amount, etc)
   ↓
3. Verifica se cliente está identificado
   ├─ customer_id fornecido? → SIM
   ├─ customer_name fornecido e != "Cliente Avulso"? → SIM
   └─ Caso contrário → PULAR validação de duplicata
   ↓
4. Buscar vendas do mesmo cliente (customer_id ou customer_name)
   ├─ Com mesmo valor (total_amount)
   ├─ Criadas hoje (created_at >= início do dia)
   └─ Da API externa (sale_source = 'api')
   ↓
5. Para cada venda encontrada:
   ├─ Buscar itens (sale_items)
   ├─ Contar quantidade de itens
   └─ Comparar com quantidade de produtos na requisição
   ↓
6. Se encontrou venda com mesma quantidade:
   ├─ Retornar erro 409 (Conflito)
   └─ Incluir dados da venda duplicada na resposta
   ↓
7. Senão:
   └─ Continuar criação da venda normalmente
```

---

## 📊 Comparação: ANTES vs AGORA

| Critério | ANTES | AGORA |
|----------|-------|-------|
| **Cliente** | ✅ Validava | ✅ Validava |
| **Valor** | ✅ Validava | ✅ Validava |
| **Janela de tempo** | ⏰ 10 minutos | ⏰ **Dia inteiro** |
| **Qtd de produtos** | ❌ Não validava | ✅ **Validava** |
| **Efetividade** | 🟡 Média | 🟢 **Alta** |

---

## 🎯 Casos de Uso

### ✅ Protege Contra
- Cliques duplos em sistemas de integração
- Reenvio automático de webhooks
- Erros de sincronização de pedidos
- Tentativas de criar o mesmo pedido 2x no mesmo dia

### ⚠️ NÃO Protege Contra
- Cliente fazendo 2 pedidos legítimos no mesmo dia
  - **Solução:** Valores diferentes OU quantidade de produtos diferente
- Vendas avulsas (sem cliente identificado)
  - **Motivo:** Não há como identificar duplicata sem cliente

---

## 🔧 Implementação Técnica

### Arquivo Modificado
- ✅ `src/app/api/v1/sales/route.ts` (linhas 83-140)

### Mudanças
1. **Janela de tempo:** De 10 minutos para dia inteiro
   ```typescript
   // ANTES
   const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
   
   // AGORA
   const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
   ```

2. **Validação de quantidade de produtos:**
   ```typescript
   const productCount = products.length;
   
   // Para cada venda encontrada, buscar itens
   const { data: existingItems } = await supabaseAdmin
     .from('sale_items')
     .select('id')
     .eq('sale_id', existing.id);
   
   // Comparar quantidade
   if (existingItems.length === productCount) {
     return 409; // Duplicata!
   }
   ```

---

## 📚 Documentação Atualizada

- ✅ `docs/API-EXTERNA.md` - Seção "Vendas repetidas" atualizada
- ✅ Adicionado campo `duplicate_product_count` na resposta de erro 409

---

## 🧪 Testes Recomendados

### Teste 1: Bloqueio de duplicata exata
```bash
# 1ª requisição
POST /api/v1/sales
{ customer_id: 123, total_amount: 50.00, products: [{...}, {...}] }
# Espera: 200 OK

# 2ª requisição (mesmo dia, mesmos dados)
POST /api/v1/sales
{ customer_id: 123, total_amount: 50.00, products: [{...}, {...}] }
# Espera: 409 Conflict
```

### Teste 2: Permitir valor diferente
```bash
POST /api/v1/sales
{ customer_id: 123, total_amount: 50.01, products: [{...}, {...}] }
# Espera: 200 OK (valor diferente)
```

### Teste 3: Permitir quantidade de produtos diferente
```bash
POST /api/v1/sales
{ customer_id: 123, total_amount: 50.00, products: [{...}] }  # 1 produto
# Espera: 200 OK (qtd diferente)
```

### Teste 4: Permitir no dia seguinte
```bash
# Aguardar até meia-noite (00h00 do próximo dia)
POST /api/v1/sales
{ customer_id: 123, total_amount: 50.00, products: [{...}, {...}] }
# Espera: 200 OK (dia diferente)
```

---

## 🎊 Status Final

**Proteção implementada com sucesso!** ✅

A API externa agora possui validação robusta contra vendas duplicadas, considerando:
- ✅ Cliente
- ✅ Valor total
- ✅ Dia completo (não apenas 10 minutos)
- ✅ Quantidade de produtos

**Data de implementação:** 27/01/2026  
**Ambiente:** Produção  
**Compatibilidade:** Retrocompatível (não quebra integrações existentes)
