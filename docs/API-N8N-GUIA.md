# Guia Completo: Usando as APIs do ERP no n8n

Este guia explica passo a passo como configurar e usar as APIs do sistema ERP no n8n (ferramenta de automação de workflows).

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração Inicial](#configuração-inicial)
3. [Autenticação](#autenticação)
4. [Endpoints Disponíveis](#endpoints-disponíveis)
5. [Exemplos Avulsos](#exemplos-avulsos)
6. [Workflows Práticos](#workflows-práticos)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Dicas e Boas Práticas](#dicas-e-boas-práticas)

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

## Exemplos Avulsos

Esta seção mostra exemplos simples e diretos de cada endpoint, sem necessidade de workflows complexos. Use estes exemplos para testes rápidos ou operações avulsas.

### 1. Criar Cliente

**Nó HTTP Request**:
- **Method**: `POST`
- **URL**: `https://seu-dominio.com/api/v1/customers`
- **Authentication**: `ERP API Key` (ou header `X-API-Key`)
- **Content-Type**: `application/json`
- **Body** (JSON):
  ```json
  {
    "name": "Maria Santos",
    "email": "maria@example.com",
    "phone": "11987654321",
    "document": "12345678900",
    "address": "Av. Paulista, 1000",
    "neighborhood": "Bela Vista",
    "state": "SP",
    "zipcode": "01310-100"
  }
  ```

**Resposta**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Maria Santos",
    "email": "maria@example.com",
    "phone": "11987654321",
    ...
  }
}
```

---

### 2. Listar Clientes

**Nó HTTP Request**:
- **Method**: `GET`
- **URL**: `https://seu-dominio.com/api/v1/customers?limit=50&search=maria`
- **Authentication**: `ERP API Key`

**Resposta**:
```json
{
  "success": true,
  "data": [
    { "id": 123, "name": "Maria Santos", ... },
    ...
  ],
  "pagination": { "limit": 50, "offset": 0, "count": 1 }
}
```

**Parâmetros de Query**:
- `limit`: Número de registros (padrão: 50)
- `offset`: Para paginação (padrão: 0)
- `search`: Buscar por nome, email ou documento
- `is_active`: Filtrar por status (`true` ou `false`)

---

### 3. Buscar Cliente por ID

**Nó HTTP Request**:
- **Method**: `GET`
- **URL**: `https://seu-dominio.com/api/v1/customers/123`
- **Authentication**: `ERP API Key`

**Resposta**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Maria Santos",
    "email": "maria@example.com",
    ...
  }
}
```

---

### 4. Criar Produto

**Nó HTTP Request**:
- **Method**: `POST`
- **URL**: `https://seu-dominio.com/api/v1/products`
- **Authentication**: `ERP API Key`
- **Content-Type**: `application/json`
- **Body** (JSON):
  ```json
  {
    "name": "Notebook Dell",
    "sku": "NOTE-001",
    "barcode": "7891234567890",
    "description": "Notebook Dell Inspiron 15",
    "cost_price": 2500.00,
    "sale_price": 3299.90,
    "stock": 10,
    "min_stock": 5,
    "unit": "UN"
  }
  ```

**Resposta**:
```json
{
  "success": true,
  "data": {
    "id": 456,
    "name": "Notebook Dell",
    "sku": "NOTE-001",
    "sale_price": 3299.90,
    "stock_quantity": 10,
    ...
  }
}
```

---

### 5. Listar Produtos

**Nó HTTP Request**:
- **Method**: `GET`
- **URL**: `https://seu-dominio.com/api/v1/products?limit=50&search=notebook`
- **Authentication**: `ERP API Key`

**Resposta**:
```json
{
  "success": true,
  "data": [
    { "id": 456, "name": "Notebook Dell", ... },
    ...
  ],
  "pagination": { "limit": 50, "offset": 0, "count": 1 }
}
```

**Parâmetros de Query**:
- `limit`: Número de registros (padrão: 50)
- `offset`: Para paginação (padrão: 0)
- `search`: Buscar por nome, SKU ou código de barras
- `is_active`: Filtrar por status (`true` ou `false`)

---

### 6. Buscar Produto por ID

**Nó HTTP Request**:
- **Method**: `GET`
- **URL**: `https://seu-dominio.com/api/v1/products/456`
- **Authentication**: `ERP API Key`

**Resposta**:
```json
{
  "success": true,
  "data": {
    "id": 456,
    "name": "Notebook Dell",
    "sku": "NOTE-001",
    "sale_price": 3299.90,
    ...
  }
}
```

---

### 7. Criar Venda de Balcão

**Nó HTTP Request**:
- **Method**: `POST`
- **URL**: `https://seu-dominio.com/api/v1/sales`
- **Authentication**: `ERP API Key`
- **Content-Type**: `application/json`
- **Body** (JSON):
  ```json
  {
    "customer_name": "João Silva",
    "products": [
      {
        "name": "Produto A",
        "price": 29.90,
        "quantity": 2
      },
      {
        "product_id": 456,
        "name": "Notebook Dell",
        "price": 3299.90,
        "quantity": 1
      }
    ],
    "total_amount": 3359.70,
    "payment_method": "pix",
    "sale_type": "balcao",
    "notes": "Venda realizada na loja física"
  }
  ```

**Resposta**:
```json
{
  "success": true,
  "data": {
    "sale": {
      "id": 789,
      "sale_number": "VND-000123",
      "total_amount": 3359.70,
      "payment_method": "pix",
      "sale_type": "balcao",
      ...
    }
  }
}
```

---

### 8. Criar Venda de Entrega (Com Entrega Automática)

**Nó HTTP Request**:
- **Method**: `POST`
- **URL**: `https://seu-dominio.com/api/v1/sales`
- **Authentication**: `ERP API Key`
- **Content-Type**: `application/json`
- **Body** (JSON):

**Opção 1: Usar endereço do cliente cadastrado (Recomendado)**
```json
{
  "customer_id": 123,
  "customer_name": "Maria Santos",
  "products": [
    {
      "product_id": 456,
      "name": "Notebook Dell",
      "price": 3299.90,
      "quantity": 1
    }
  ],
  "total_amount": 3299.90,
  "payment_method": "cartao_credito",
  "sale_type": "entrega"
}
```
*Nota: Se o cliente tiver endereço cadastrado, ele será usado automaticamente. Os campos `delivery_address`, `delivery_phone`, `delivery_neighborhood` e `delivery_fee` (frete) são opcionais.*

**Opção 2: Fornecer endereço manualmente (sobrescreve endereço do cliente)**
```json
{
  "customer_id": 123,
  "customer_name": "Maria Santos",
  "products": [
    {
      "product_id": 456,
      "name": "Notebook Dell",
      "price": 3299.90,
      "quantity": 1
    }
  ],
  "total_amount": 3304.90,
  "payment_method": "cartao_credito",
  "sale_type": "entrega",
  "delivery_address": "Av. Paulista, 1000",
  "delivery_neighborhood": "Bela Vista",
  "delivery_phone": "11987654321",
  "delivery_fee": 5.00
}
```
*Nota: `delivery_fee` é o frete (valor opcional). Se não fornecido, será 0.00.*

**Opção 3: Criar entrega sem endereço**
```json
{
  "customer_name": "Cliente Avulso",
  "products": [
    {
      "name": "Produto A",
      "price": 29.90,
      "quantity": 2
    }
  ],
  "total_amount": 59.80,
  "payment_method": "pix",
  "sale_type": "entrega"
}
```

**Resposta**:
```json
{
  "success": true,
  "data": {
    "sale": {
      "id": 789,
      "sale_number": "VND-000124",
      "total_amount": 3304.90,
      "sale_type": "entrega",
      ...
    },
    "delivery": {
      "id": 456,
      "sale_id": 789,
      "status": "aguardando",
      "delivery_address": "Av. Paulista, 1000",
      "delivery_fee": 5.00
    }
  }
}
```

**Nota**: 
- Quando `sale_type` é `"entrega"`, o sistema cria automaticamente o registro de entrega com status `'aguardando'`.
- **Campos de entrega são opcionais**:
  - `delivery_address`: Endereço de entrega (opcional)
  - `delivery_neighborhood`: Bairro (opcional)
  - `delivery_phone`: Telefone para contato na entrega (opcional)
  - `delivery_fee`: Frete/valor da entrega (opcional, padrão: 0.00)
- Se você fornecer `customer_id` e o cliente tiver endereço cadastrado, o sistema usa automaticamente esse endereço.
- **Prioridade**: Campos fornecidos manualmente (`delivery_address`, `delivery_phone`) têm prioridade sobre o endereço cadastrado do cliente.
- Se o cliente não tiver endereço e você não fornecer, a entrega será criada sem endereço (campos `null`).

---

### 9. Listar Vendas

**Nó HTTP Request**:
- **Method**: `GET`
- **URL**: `https://seu-dominio.com/api/v1/sales?sale_type=entrega&limit=50`
- **Authentication**: `ERP API Key`

**Resposta**:
```json
{
  "success": true,
  "data": [
    {
      "id": 789,
      "sale_number": "VND-000124",
      "customer_name": "Maria Santos",
      "total_amount": 3304.90,
      "sale_type": "entrega",
      ...
    },
    ...
  ],
  "pagination": { "limit": 50, "offset": 0, "count": 1 }
}
```

**Parâmetros de Query**:
- `limit`: Número de registros (padrão: 50)
- `offset`: Para paginação (padrão: 0)
- `sale_type`: Filtrar por tipo (`balcao` ou `entrega`)

---

### 10. Criar Cliente em Filial Específica

**Nó HTTP Request**:
- **Method**: `POST`
- **URL**: `https://seu-dominio.com/api/v1/customers`
- **Authentication**: `ERP API Key`
- **Content-Type**: `application/json`
- **Body** (JSON):
  ```json
  {
    "name": "Carlos Oliveira",
    "email": "carlos@example.com",
    "phone": "11976543210",
    "branch_id": 2
  }
  ```

**Resposta**:
```json
{
  "success": true,
  "data": {
    "id": 124,
    "name": "Carlos Oliveira",
    "branch_id": 2,
    ...
  }
}
```

**Observação**: 
- Se você **não** informar `branch_id`, o cliente será cadastrado na **Matriz** (aparece apenas na visualização da matriz).
- Se informar `branch_id`, o cliente será cadastrado naquela **filial** específica.

---

### 11. Listar Clientes com Paginação

**Nó HTTP Request**:
- **Method**: `GET`
- **URL**: `https://seu-dominio.com/api/v1/customers?limit=20&offset=0`
- **Authentication**: `ERP API Key`

**Para próxima página**:
- **URL**: `https://seu-dominio.com/api/v1/customers?limit=20&offset=20`

---

### 12. Listar Produtos com Filtros

**Nó HTTP Request**:
- **Method**: `GET`
- **URL**: `https://seu-dominio.com/api/v1/products?is_active=true&search=notebook&limit=100`
- **Authentication**: `ERP API Key`

**Exemplos de URLs**:
- Buscar por SKU: `?search=NOTE-001`
- Produtos inativos: `?is_active=false`
- Buscar por código de barras: `?search=7891234567890`

---

### 13. Buscar Vendas por Nome, Telefone ou CPF

**Nó HTTP Request**:
- **Method**: `GET`
- **URL**: `https://seu-dominio.com/api/v1/sales?search=Maria Santos`
- **Authentication**: `ERP API Key`

**Resposta**:
```json
{
  "success": true,
  "data": [
    {
      "id": 789,
      "sale_number": "VND-000123",
      "customer_name": "Maria Santos",
      "total_amount": 3299.90,
      ...
    },
    ...
  ],
  "pagination": { "limit": 50, "offset": 0, "count": 1 }
}
```

**Exemplos de URLs**:
- Buscar por nome: `?search=Maria Santos`
- Buscar por telefone: `?search=11987654321`
- Buscar por CPF: `?search=12345678900`
- Combinar filtros: `?search=Maria&sale_type=entrega&limit=20`

**Nota**: O parâmetro `search` busca em `customers.name`, `customers.phone`, `customers.document` e `sales.customer_name`.

---

### 14. Transformar Venda em Entrega

**Nó HTTP Request**:
- **Method**: `PATCH`
- **URL**: `https://seu-dominio.com/api/v1/sales/789`
- **Authentication**: `ERP API Key`
- **Content-Type**: `application/json`
- **Body** (JSON):

**Opção 1: Usar endereço do cliente cadastrado (Recomendado)**
```json
{
  "sale_type": "entrega"
}
```
*Se o cliente tiver endereço cadastrado, será usado automaticamente.*

**Opção 2: Fornecer endereço manualmente**
```json
{
  "sale_type": "entrega",
  "delivery_address": "Av. Paulista, 1000",
  "delivery_neighborhood": "Bela Vista",
  "delivery_phone": "11987654321",
  "delivery_fee": 5.00,
  "notes": "Entrega agendada para amanhã"
}
```

**Resposta**:
```json
{
  "success": true,
  "data": {
    "sale": {
      "id": 789,
      "sale_number": "VND-000123",
      "sale_type": "entrega",
      ...
    },
    "delivery": {
      "id": 456,
      "sale_id": 789,
      "status": "aguardando",
      "delivery_address": "Av. Paulista, 1000",
      ...
    }
  }
}
```

**Nota**: 
- O sistema cria automaticamente o registro de entrega com status `'aguardando'` se não existir.
- Se já existir entrega, atualiza os dados fornecidos.
- Campos de entrega (`delivery_address`, `delivery_phone`, `delivery_fee`) são opcionais.

---

### 15. Atualizar Dados do Cliente

**Nó HTTP Request**:
- **Method**: `PATCH`
- **URL**: `https://seu-dominio.com/api/v1/customers/123`
- **Authentication**: `ERP API Key`
- **Content-Type**: `application/json`
- **Body** (JSON):
  ```json
  {
    "document": "12345678900",
    "phone": "11987654321",
    "address": "Av. Paulista, 1000",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "zipcode": "01310-100"
  }
  ```

**Resposta**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Maria Santos",
    "document": "12345678900",
    "phone": "11987654321",
    "address": "Av. Paulista, 1000",
    ...
  }
}
```

**Campos atualizáveis**:
- `name`: Nome do cliente
- `email`: E-mail
- `phone`: Telefone
- `document`: CPF/CNPJ
- `address`: Endereço completo
- `neighborhood`: Bairro
- `city`: Cidade
- `state`: Estado (UF - 2 caracteres)
- `zipcode`: CEP
- `notes`: Observações
- `is_active`: Status ativo/inativo (`true` ou `false`)

**Nota**: 
- Apenas os campos fornecidos no body serão atualizados.
- Útil para completar cadastros de clientes (ex: adicionar CPF quando faltar).
- Ideal para agentes de IA que precisam completar informações de clientes.

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

**Opção 1: Usar endereço do cliente automaticamente (Recomendado)**
```json
{
  "customer_name": "{{ $json.customer.name }}",
  "customer_id": {{ $json.customer.id }},
  "products": {{ $json.products }},
  "total_amount": {{ $json.total }},
  "payment_method": "{{ $json.payment_method }}",
  "sale_type": "entrega"
}
```
*O sistema usa automaticamente o endereço cadastrado do cliente se disponível. `delivery_fee` (frete) é opcional.*

**Opção 2: Fornecer endereço manualmente (sobrescreve endereço do cliente)**
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

**Nota**: 
- O sistema cria automaticamente o registro na tabela de entregas com status `'aguardando'`.
- **Campos de entrega são opcionais**: 
  - `delivery_address`: Endereço de entrega (opcional)
  - `delivery_neighborhood`: Bairro (opcional)
  - `delivery_phone`: Telefone para contato na entrega (opcional)
  - `delivery_fee`: Frete/valor da entrega (opcional, padrão: 0.00)
- Se você fornecer `customer_id` e o cliente tiver endereço cadastrado, o sistema usa automaticamente esse endereço.
- Campos fornecidos manualmente têm prioridade sobre o endereço cadastrado do cliente.

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

### 6. Buscar Pedidos do Cliente

**Objetivo**: Buscar todas as vendas de um cliente específico usando nome, telefone ou CPF.

**Passos**:

1. **Trigger** (Webhook recebendo solicitação ou Manual)
2. **HTTP Request - Buscar Vendas**
   - **Method**: `GET`
   - **URL**: `https://seu-dominio.com/api/v1/sales?search={{ $json.customer_search }}`
   - **Headers**: `X-API-Key`

**Exemplos de busca**:
- Por nome: `?search=João Silva`
- Por telefone: `?search=11999999999`
- Por CPF: `?search=12345678900`

3. **Processar Resultados**
   - Loop sobre `{{ $json.data }}`
   - Exibir informações de cada venda

---

### 7. Transformar Venda de Balcão em Entrega

**Objetivo**: Converter uma venda de balcão em venda de entrega após o cliente solicitar entrega.

**Passos**:

1. **Trigger** (Webhook recebendo solicitação de entrega)
2. **HTTP Request - Transformar em Entrega**
   - **Method**: `PATCH`
   - **URL**: `https://seu-dominio.com/api/v1/sales/{{ $json.sale_id }}`
   - **Headers**: `X-API-Key`, `Content-Type: application/json`
   - **Body** (JSON):
     ```json
     {
       "sale_type": "entrega",
       "delivery_address": "{{ $json.delivery_address }}",
       "delivery_phone": "{{ $json.phone }}",
       "delivery_fee": {{ $json.delivery_fee || 0 }}
     }
     ```

**Nota**: Se o cliente já tiver endereço cadastrado, não é necessário fornecer `delivery_address` manualmente.

---

### 8. Completar Cadastro do Cliente (Agente IA)

**Objetivo**: Atualizar dados faltantes de um cliente (ex: CPF, endereço) quando um agente de IA coletar essas informações.

**Passos**:

1. **Trigger** (Webhook do agente IA ou Manual)
2. **HTTP Request - Buscar Cliente**
   - **Method**: `GET`
   - **URL**: `https://seu-dominio.com/api/v1/customers?search={{ $json.customer_search }}`
   - **Headers**: `X-API-Key`
3. **IF - Cliente Encontrado?**
   - **Condition**: `{{ $json.data.length > 0 }}`
   - **True**: Cliente encontrado, verificar campos faltantes
   - **False**: Cliente não encontrado, criar novo cliente
4. **IF - Campos Faltantes?**
   - Verificar se `{{ $json.data[0].document }}` está vazio
   - Ou verificar outros campos faltantes
5. **HTTP Request - Atualizar Cliente**
   - **Method**: `PATCH`
   - **URL**: `https://seu-dominio.com/api/v1/customers/{{ $json.data[0].id }}`
   - **Body**:
     ```json
     {
       "document": "{{ $json.collected_cpf }}",
       "address": "{{ $json.collected_address }}",
       "phone": "{{ $json.collected_phone }}"
     }
     ```

**Exemplo de uso com Agente IA**:
- Agente IA pergunta o CPF do cliente
- Verifica se o cliente existe no sistema
- Se existir e não tiver CPF, atualiza usando esta API
- Se não existir, cria novo cliente com todas as informações

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
