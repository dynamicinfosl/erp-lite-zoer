# 🔍 DEBUG - API DE ORDERS

## 🎯 Problema Identificado
> "Botão funciona, mas não cria a ordem - verificar API"

## 🔧 Sistema de Debug Implementado

### **1. Logs Detalhados na API**
```typescript
// POST /next_api/orders
console.log('🔍 POST /next_api/orders - INÍCIO');
console.log('📊 Context:', { hasToken: !!context?.token, hasPayload: !!context?.payload?.sub });
console.log('📝 Body recebido:', JSON.stringify(body, null, 2));
console.log('🔄 Tentando usar CrudOperations...');
console.log('📤 Dados para criar:', JSON.stringify(orderData, null, 2));
console.log('✅ Ordem criada no banco:', order);
// OU
console.log('⚠️ Tabela orders não encontrada, usando dados mockados:', tableError);
console.log('🎭 Retornando dados mockados:', JSON.stringify(mockOrder, null, 2));
```

### **2. Logs Detalhados no Frontend**
```typescript
// handleAddOrdem
console.log('🔍 handleAddOrdem - INÍCIO');
console.log('📊 tenant:', tenant);
console.log('📝 newOrdem:', newOrdem);
console.log('📤 Enviando request:', JSON.stringify(requestBody, null, 2));
console.log('📥 Response status:', res.status);
console.log('📥 Response ok:', res.ok);
console.log('📦 Response data:', JSON.stringify(responseData, null, 2));
console.log('🆕 Nova ordem:', newOrder);
console.log('📋 Lista atualizada:', updatedOrders.length, 'ordens');
```

### **3. Script de Teste da API**
- ✅ **Arquivo:** `scripts/test-orders-api.js`
- ✅ **Testa GET:** Listar ordens
- ✅ **Testa POST:** Criar ordem
- ✅ **Logs detalhados** de cada operação

---

## 🧪 Como Testar Agora

### **Passo 1: Abrir Console do Navegador**
- F12 → Console
- Limpar console (Ctrl+L)

### **Passo 2: Preencher Formulário**
- **Cliente:** "João Silva"
- **Tipo:** "Reparo"
- **Descrição:** "Teste de reparo"

### **Passo 3: Clicar em "Criar Ordem de Serviço"**

### **Passo 4: Observar Logs no Console**

---

## 📊 Cenários Possíveis

### **Cenário 1: API não é chamada**
```
❌ Não aparece: "🔍 handleAddOrdem - INÍCIO"
🔧 Problema: Botão não está chamando a função
```

### **Cenário 2: Falha na autenticação**
```
✅ Log: "🔍 handleAddOrdem - INÍCIO"
✅ Log: "📊 tenant: null"
❌ Log: "❌ Tenant não encontrado"
🔧 Problema: useSimpleAuth não está funcionando
```

### **Cenário 3: Campos não preenchidos**
```
✅ Log: "🔍 handleAddOrdem - INÍCIO"
✅ Log: "📊 tenant: {...}"
❌ Log: "❌ Campos obrigatórios não preenchidos"
🔧 Problema: Campos não estão sendo salvos no estado
```

### **Cenário 4: API retorna erro**
```
✅ Log: "✅ Validações passaram, fazendo POST..."
✅ Log: "📤 Enviando request: {...}"
❌ Log: "❌ Erro na resposta: 500"
🔧 Problema: Erro na API (tabela não existe, etc.)
```

### **Cenário 5: API funciona mas não atualiza lista**
```
✅ Log: "📦 Response data: {...}"
✅ Log: "🆕 Nova ordem: {...}"
✅ Log: "📋 Lista atualizada: X ordens"
❌ Ordem não aparece na tela
🔧 Problema: Estado não está sendo atualizado
```

---

## 🎯 Próximos Passos

### **Após o teste, me informe:**

1. **Qual cenário aconteceu?** (1, 2, 3, 4 ou 5)
2. **Quais logs apareceram?** (copie os logs do console)
3. **Há algum erro em vermelho?** (se sim, copie o erro)

### **Com base no resultado:**

- **Cenário 1:** Corrijo o onClick do botão
- **Cenário 2:** Corrijo a autenticação
- **Cenário 3:** Corrijo o estado do formulário
- **Cenário 4:** Corrijo a API ou crio a tabela
- **Cenário 5:** Corrijo a atualização do estado

---

## 🚀 Teste Alternativo

Se quiser testar a API diretamente:

```javascript
// Cole no console do navegador
fetch('/next_api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 'test',
    cliente: 'Teste',
    tipo: 'Teste',
    descricao: 'Teste'
  })
}).then(r => r.json()).then(console.log);
```

---

**Status:** 🔍 **DEBUG IMPLEMENTADO - AGUARDANDO TESTE E LOGS**

Data: 7 de outubro de 2025



