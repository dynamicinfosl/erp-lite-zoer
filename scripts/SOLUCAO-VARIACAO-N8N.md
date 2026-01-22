# ✅ SOLUÇÃO: Como fazer as variações aparecerem no n8n

## 🎯 Problema Identificado

Você tem **2 tenants** no banco de dados:

1. **Tenant A** (`132b42a6-6355-4418-996e-de7eb33f6e34`)
   - 438 produtos
   - **0 variações** ❌

2. **Tenant B** (`ffd61c21-81d8-49f0-8b70-b1c0f05f6960`)
   - 436 produtos
   - **36 variações** ✅ (incluindo as 8 do Gatorade)

O n8n está usando uma **API Key do Tenant A**, por isso as variações não aparecem!

**Você não tem nenhuma API Key criada para o Tenant B.**

## 📝 Solução: Criar Nova API Key

### Passo 1: Acessar a Interface do Sistema

1. Faça login no sistema com uma conta do **Tenant B** (`ffd61c21-81d8-49f0-8b70-b1c0f05f6960`)
2. Vá em: **Configurações > Integrações > API Keys** (ou acesse diretamente: `/configuracoes/integracoes`)

### Passo 2: Criar Nova API Key

1. Clique em **"+ Nova API Key"** ou **"Criar API Key"**
2. Preencha:
   - **Nome**: "Integração n8n - Pit Stop" (ou qualquer nome descritivo)
   - **Permissões**: Selecione as permissões necessárias (sales, products, customers, etc)
   - **Expira em**: Deixe em branco (nunca expira) ou defina uma data

3. Clique em **"Criar"** ou **"Salvar"**

### Passo 3: Copiar a API Key

⚠️ **ATENÇÃO**: A API Key **só será exibida UMA vez**!

1. Copie a API Key completa que aparece na tela
2. Guarde em local seguro (gerenciador de senhas, arquivo criptografado, etc)
3. Formato da chave: uma string longa alfanumérica

### Passo 4: Atualizar no n8n

1. Acesse seu workflow no n8n
2. Localize o nó que faz a chamada para `/api/v1/products`
3. Atualize o header `x-api-key` com a **nova API Key do Tenant B**

Exemplo de configuração no n8n:

```
Headers:
  x-api-key: [COLE_AQUI_SUA_API_KEY]
  Content-Type: application/json
```

### Passo 5: Testar

Faça uma busca por "gatorade" no n8n.

**Resultado esperado**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1032,
      "name": "gatorade fd",
      "sku": "2006226387503",
      "variants": [
        {
          "id": 486,
          "label": "blue berry",
          "name": "gatorade (blue berry)",
          "sale_price": "35.00",
          "stock_quantity": -65
        },
        {
          "id": 483,
          "label": "frutas citricas",
          "name": "gatorade (frutas citricas)",
          "sale_price": "35.00",
          "stock_quantity": -35
        }
        // ... mais 6 variações
      ]
    }
  ]
}
```

## 🔍 Como Identificar o Tenant Correto

Se você tem múltiplos logins/contas:

1. Faça login no sistema
2. Abra o **Console do Navegador** (F12)
3. Execute: `localStorage.getItem('tenant_id')`
4. Confirme que retorna: `ffd61c21-81d8-49f0-8b70-b1c0f05f6960`

Se retornar outro tenant_id, faça logout e login com a conta correta.

## 📊 Resumo

| Item | Tenant A (Errado) | Tenant B (Correto) |
|------|-------------------|-------------------|
| ID | `132b42a6-6355-4418-996e-de7eb33f6e34` | `ffd61c21-81d8-49f0-8b70-b1c0f05f6960` |
| Produtos | 438 | 436 |
| Variações | **0** ❌ | **36** ✅ |
| API Keys | Tem (n8n usa essa) | **Não tem** ❌ |

**Solução**: Criar API Key para Tenant B e usar no n8n!

## ⚠️ Observação Importante

A API externa **NÃO permite** que você especifique manualmente o `tenant_id`.

O tenant é **automaticamente identificado** através da API Key que você envia no header `x-api-key`.

Por isso é crucial usar a API Key correta!

## ✅ Após Resolver

Depois de criar e usar a nova API Key:

1. Teste a busca no n8n
2. Confirme que as variações aparecem
3. Caso ainda tenha problemas, me avise com o resultado da chamada da API
