# Guia Completo: Usando as APIs do ERP no n8n

Este guia explica passo a passo como configurar e usar as APIs do sistema ERP no n8n (ferramenta de automação de workflows).

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração Inicial](#configuração-inicial)
3. [Autenticação](#autenticação)
4. [Endpoints Disponíveis](#endpoints-disponíveis)
5. [Workflows Práticos](#workflows-práticos)
6. [Tratamento de Erros](#tratamento-de-erros)
7. [Dicas e Boas Práticas](#dicas-e-boas-práticas)

---

## Pré-requisitos

- **n8n instalado** (self-hosted ou cloud)
- **API Key** do sistema ERP (obtida em `/admin/api-keys`)
- **URL base** da API (ex: `https://seu-dominio.com`)

---

## Configuração Inicial

### 1. Criar Credential no n8n (Recomendado)

Para reutilizar a API key em múltiplos workflows:

1. Acesse **Settings** → **Credentials**
2. Clique em **Create New**
3. Escolha **Generic Credential Type**
4. Configure:
   - **Name**: `ERP API Key`
   - **Credential Type**: `Header Auth`
   - **Name**: `X-API-Key`
   - **Value**: `erp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (sua API key)
5. Salve

**Alternativa**: Use **Variables de Ambiente** (Settings → Variables):
- **Name**: `ERP_API_KEY`
- **Value**: `erp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Autenticação

Todas as requisições devem incluir o header `X-API-Key`:

### Método 1: Headers Manuais

No nó **HTTP Request**, configure:
- **Header Name**: `X-API-Key`
- **Header Value**: `erp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Método 2: Usando Credential (Recomendado)

1. No nó **HTTP Request**
2. **Authentication**: Selecione a credential criada
3. O header será adicionado automaticamente

### Método 3: Usando Variável de Ambiente

No **Header Value** do HTTP Request:
- `{{ $env.ERP_API_KEY }}`

---

## Endpoints Disponíveis

### Base URL

```
https://seu-dominio.com/api/v1
```

---

## Workflows Práticos

### 1. Criar Venda de Balcão

**Objetivo**: Criar uma venda simples para um cliente.

**Passos**:

1. **Trigger** (Webhook ou Manual)
2. **HTTP Request - Criar Venda**
   - **Method**: `POST`
   - **URL**: `https://seu-dominio.com/api/v1/sales`
   - **Headers**:
     - `X-API-Key`: `{{ $env.ERP_API_KEY }}`
     - `Content-Type`: `application/json`
   - **Body** (JSON):
     ```json
     {
       "customer_name": "{{ $json.customer_name }}",
       "products": [
         {
           "name": "{{ $json.product_name }}",
           "price": {{ $json.product_price }},
           "quantity": {{ $json.quantity }}
         }
       ],
       "total_amount": {{ $json.total }},
       "payment_method": "pix",
       "sale_type": "balcao"
     }
     ```

**Resposta de Sucesso**:
```json
{
  "success": true,
  "data": {
    "sale": {
      "id": 789,
      "sale_number": "VND-000123",
      "total_amount": 100.00,
      ...
    }
  }
}
```

**Capturar ID da venda**:
- Nó **Set**: `sale_id = {{ $json.data.sale.id }}`

---

### 2. Criar Venda de Entrega (Com Entrega Automática)

**Objetivo**: Criar uma venda que já seja marcada para entrega.

**Passos**:

1. **Trigger** (Webhook recebendo pedido)
2. **HTTP Request - Criar Venda**
   - **Method**: `POST`
   - **URL**: `https://seu-dominio.com/api/v1/sales`
   - **Headers**: `X-API-Key`, `Content-Type: application/json`
   - **Body** (JSON):
     ```json
     {
       "customer_name": "{{ $json.customer.name }}",
       "customer_id": {{ $json.customer.id }},
       "products": {{ $json.products }},
       "total_amount": {{ $json.total }},
       "payment_method": "{{ $json.payment_method }}",
       "sale_type": "entrega",
       "delivery_address": "{{ $json.delivery.address }}",
       "delivery_neighborhood": "{{ $json.delivery.neighborhood }}",
       "delivery_phone": "{{ $json.customer.phone }}",
       "delivery_fee": {{ $json.delivery.fee || 0 }}
     }
     ```

**Resposta de Sucesso**:
```json
{
  "success": true,
  "data": {
    "sale": { ... },
    "delivery": {
      "id": 456,
      "sale_id": 789,
      "status": "aguardando",
      ...
    }
  }
}
```

**Nota**: O sistema cria automaticamente o registro na tabela de entregas com status `'aguardando'`.

---

### 3. Workflow Completo: Importar Cliente e Criar Venda

**Objetivo**: Criar cliente se não existir, depois criar a venda.

**Passos**:

1. **Trigger** (Webhook externo)
2. **HTTP Request - Buscar Cliente** (opcional)
   - **Method**: `GET`
   - **URL**: `https://seu-dominio.com/api/v1/customers?search={{ $json.customer.email }}`
   - **Headers**: `X-API-Key`
3. **IF - Cliente Existe?**
   - **Condition**: `{{ $json.data.length > 0 }}`
   - **True**: Cliente encontrado
   - **False**: Criar novo cliente
4. **HTTP Request - Criar Cliente** (se não existe)
   - **Method**: `POST`
   - **URL**: `https://seu-dominio.com/api/v1/customers`
   - **Body**:
     ```json
     {
       "name": "{{ $json.customer.name }}",
       "email": "{{ $json.customer.email }}",
       "phone": "{{ $json.customer.phone }}",
       "document": "{{ $json.customer.document }}",
       "address": "{{ $json.customer.address }}",
       "state": "{{ $json.customer.state }}",
       "zipcode": "{{ $json.customer.zipcode }}"
     }
     ```
   - **Salvar**: `customer_id = {{ $json.data.id }}`
5. **Merge - Juntar Dados**
   - Combinar dados do cliente (encontrado ou criado) com produtos
6. **HTTP Request - Criar Venda**
   - Usar `customer_id` do passo anterior

---

### 4. Sincronizar Produtos (Importação em Lote)

**Objetivo**: Importar produtos de uma planilha ou outra API.

**Passos**:

1. **Trigger** (Schedule diário ou Manual)
2. **HTTP Request - Listar Produtos Externos**
   - Buscar de outro sistema/arquivo
3. **Split In Batches** (processar em lotes de 50)
4. **HTTP Request - Criar/Atualizar Produto**
   - **Method**: `POST`
   - **URL**: `https://seu-dominio.com/api/v1/products`
   - **Body**:
     ```json
     {
       "name": "{{ $json.name }}",
       "sku": "{{ $json.sku }}",
       "barcode": "{{ $json.barcode }}",
       "cost_price": {{ $json.cost_price }},
       "sale_price": {{ $json.sale_price }},
       "stock": {{ $json.stock || 0 }},
       "min_stock": {{ $json.min_stock || 0 }}
     }
     ```
5. **IF - Verificar Sucesso**
   - Se `{{ $json.success === false }}` → Log de erro

---

### 5. Listar Vendas de Entrega (Monitoramento)

**Objetivo**: Buscar vendas de entrega para processamento externo.

**Passos**:

1. **Trigger** (Schedule a cada hora)
2. **HTTP Request - Listar Vendas**
   - **Method**: `GET`
   - **URL**: `https://seu-dominio.com/api/v1/sales?sale_type=entrega&limit=100`
   - **Headers**: `X-API-Key`
3. **Loop - Processar Cada Venda**
   - Para cada item do array `{{ $json.data }}`
4. **Ações por Venda**:
   - Enviar para sistema de logística
   - Notificar cliente
   - Atualizar status externo

**Exemplo de URL Completa**:
```
https://seu-dominio.com/api/v1/sales?sale_type=entrega&limit=50&offset=0
```

---

## Tratamento de Erros

### Verificar Sucesso da Requisição

Use nó **IF** após cada HTTP Request:

**Condition**:
```javascript
{{ $json.success === false }}
```

**True Branch** (Erro):
- **Set**: `error = {{ $json.error }}`
- **Set**: `message = {{ $json.message }}`
- **Enviar notificação** (Email, Slack, etc.)

**False Branch** (Sucesso):
- Continuar workflow normalmente

---

### Exemplo Completo com Tratamento de Erro

1. **HTTP Request**
2. **IF - Verificar Resposta**
   - **Condition**: `{{ $json.success === true }}`
3. **True Branch**:
   - Processar dados com sucesso
4. **False Branch**:
   - **Set**: `error_message = {{ $json.error }}`
   - **HTTP Request** (notificação de erro)
   - **Stop and Error Node** (parar workflow)

---

## Dicas e Boas Práticas

### 1. Variáveis Dinâmicas

**URLs dinâmicas**:
```
https://seu-dominio.com/api/v1/customers/{{ $('HTTP Request Criar Cliente').item.json.data.id }}
```

**Expressões úteis**:
- `{{ $json.data.id }}` - ID da resposta atual
- `{{ $('Nome do Nó').item.json.field }}` - Campo de outro nó
- `{{ $env.ERP_API_KEY }}` - Variável de ambiente

### 2. Headers Reutilizáveis

**Criar Credential**:
1. Settings → Credentials → Create New
2. Generic Credential Type → Header Auth
3. Usar em todos os nós HTTP Request

### 3. Paginação em Listagens

**Loop para buscar todos os registros**:

1. **Set** - `offset = 0`, `limit = 50`
2. **Loop** (até não retornar mais dados):
   - **HTTP Request**: `GET /api/v1/customers?limit={{ $json.limit }}&offset={{ $json.offset }}`
   - **IF**: `{{ $json.data.length > 0 }}`
   - **True**: Processar + Incrementar `offset`
   - **False**: Finalizar loop

**Exemplo de incremento**:
```javascript
{{ $json.offset + $json.limit }}
```

### 4. Rate Limiting

Se fizer muitas requisições seguidas, adicione **Wait Node**:
- Esperar 500ms entre requisições
- Evitar sobrecarga no servidor

### 5. Logs e Debug

**Adicionar logs**:
- Use **Set** para salvar respostas temporárias
- Use **Execute Workflow** para testar partes isoladas

**Exemplo de debug**:
```
Log: {{ JSON.stringify($json, null, 2) }}
```

---

## Exemplos de Expressões n8n

### Buscar Campo de Nó Anterior

```javascript
{{ $('HTTP Request Criar Cliente').item.json.data.id }}
```

### Conditional (Se Existe)

```javascript
{{ $json.data && $json.data.length > 0 }}
```

### Mapear Array de Produtos

```javascript
{{ $json.items.map(item => ({
  "name": item.product_name,
  "price": item.price,
  "quantity": item.quantity
})) }}
```

### Converter Data

```javascript
{{ new Date($json.created_at).toLocaleDateString('pt-BR') }}
```

---

## Troubleshooting

### Problema: "401 - API Key não fornecida"

**Solução**:
- Verifique se o header `X-API-Key` está configurado
- Confirme que o valor está correto (sem espaços extras)

### Problema: "403 - Permissão insuficiente"

**Solução**:
- Verifique as permissões da API key em `/admin/api-keys`
- Adicione a permissão necessária (ex: `sales:create`)

### Problema: "400 - Dados inválidos"

**Solução**:
- Valide o formato JSON do body
- Verifique campos obrigatórios (ex: `name`, `total_amount`)

### Problema: Cliente criado mas não aparece no frontend

**Solução**:
- Clientes criados via API aparecem na **Matriz** por padrão
- Se usar filial, inclua `branch_id` no body ou compartilhe o cliente

---

## Checklist de Workflow

Antes de publicar um workflow, verifique:

- [ ] API Key configurada (Credential ou Header)
- [ ] Tratamento de erros implementado
- [ ] Validação de campos obrigatórios
- [ ] Logs de debug para troubleshooting
- [ ] Rate limiting se necessário
- [ ] Teste manual antes de automatizar

---

## Recursos Adicionais

- **Documentação da API**: Ver `docs/API-EXTERNA.md`
- **Gerenciar API Keys**: `/admin/api-keys` no painel admin
- **Logs do Sistema**: Console do navegador (F12) durante testes

---

## Suporte

Em caso de dúvidas ou problemas:

1. Verifique os logs do n8n
2. Verifique os logs do console (F12) nas requisições
3. Consulte a documentação completa da API em `docs/API-EXTERNA.md`
