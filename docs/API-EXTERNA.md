# Documentação da API Externa

Esta documentação descreve as APIs públicas do sistema ERP para acesso externo via API Keys.

## Autenticação

Todas as requisições devem incluir o header `X-API-Key` com a chave de API válida:

```
X-API-Key: erp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

A API Key é obtida através do endpoint `/next_api/api-keys` (acesso administrativo necessário).

### Formato de Resposta Padrão

Todas as respostas seguem o formato:

```json
{
  "success": true,
  "data": { ... }
}
```

Em caso de erro:

```json
{
  "success": false,
  "error": "Mensagem de erro",
  "message": "Detalhes adicionais (opcional)"
}
```

### Códigos de Status HTTP

- `200` - Sucesso
- `400` - Erro de validação (dados inválidos)
- `401` - Não autenticado (API Key inválida ou ausente)
- `403` - Sem permissão (API Key não tem permissão para a operação)
- `404` - Recurso não encontrado
- `409` - Conflito (ex.: venda de entrega duplicada)
- `500` - Erro interno do servidor

## Endpoints

### Base URL

```
https://seu-dominio.com/api/v1
```

### Vendas

#### Criar Venda

**POST** `/api/v1/sales`

Cria uma nova venda. Quando `sale_type='entrega'`, cria automaticamente o registro de entrega.

**Body:**

```json
{
  "customer_id": 123,                    // Opcional - ID do cliente cadastrado
  "customer_name": "João Silva",         // Obrigatório se customer_id não fornecido
  "products": [
    {
      "product_id": 456,                 // Opcional - ID do produto cadastrado
      "name": "Produto Exemplo",         // Obrigatório
      "price": 29.90,                    // Obrigatório - Preço unitário
      "quantity": 2                      // Obrigatório - Quantidade
    }
  ],
  "total_amount": 59.80,                 // Obrigatório - Valor total da venda
  "payment_method": "pix",               // Obrigatório: "dinheiro" | "pix" | "cartao_debito" | "cartao_credito" | "boleto"
  "sale_type": "entrega",                // Opcional: "balcao" | "entrega" (padrão: "balcao")
  "delivery_address": "Rua Exemplo, 123", // Obrigatório se sale_type="entrega"
  "delivery_neighborhood": "Centro",     // Opcional
  "delivery_phone": "11999999999",       // Obrigatório se sale_type="entrega"
  "delivery_fee": 5.00,                  // Opcional - Taxa de entrega
  "notes": "Observações da venda"        // Opcional
}
```

**Resposta de Sucesso:**

```json
{
  "success": true,
  "data": {
    "sale": {
      "id": 789,
      "sale_number": "VND-000123",
      "customer_id": 123,
      "customer_name": "João Silva",
      "total_amount": 59.80,
      "payment_method": "pix",
      "sale_type": "entrega",
      "created_at": "2025-01-16T10:30:00Z"
    },
    "delivery": {
      "id": 456,
      "sale_id": 789,
      "status": "aguardando",
      "delivery_address": "Rua Exemplo, 123",
      "delivery_fee": 5.00
    }
  }
}
```

**Nota:** Quando `sale_type='entrega'`, o sistema cria automaticamente um registro na tabela de entregas com status `'aguardando'`.

**Vendas de entrega repetidas:** Para evitar duplicidade, o sistema **não permite** criar duas vendas de entrega para o mesmo cliente com o mesmo valor total em um intervalo de 10 minutos. Se isso ocorrer, a API retorna status `409` (Conflito) com a mensagem de erro e os dados da venda duplicada (`duplicate_sale_id`, `duplicate_sale_number`, `duplicate_created_at`).

#### Listar Vendas

**GET** `/api/v1/sales`

Lista vendas do tenant.

**Query Parameters:**

- `limit` (opcional, padrão: 50) - Número de registros por página
- `offset` (opcional, padrão: 0) - Deslocamento para paginação
- `sale_type` (opcional) - Filtrar por tipo: "balcao" | "entrega"

**Exemplo:**

```
GET /api/v1/sales?limit=20&offset=0&sale_type=entrega
```

**Resposta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 789,
      "sale_number": "VND-000123",
      "customer_name": "João Silva",
      "total_amount": 59.80,
      "payment_method": "pix",
      "sale_type": "entrega",
      "created_at": "2025-01-16T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "count": 1
  }
}
```

### Clientes

#### Criar Cliente

**POST** `/api/v1/customers`

Cria um novo cliente.

**Body:**

```json
{
  "name": "João Silva",                  // Obrigatório
  "email": "joao@example.com",           // Opcional
  "phone": "11999999999",                // Opcional
  "document": "12345678900",             // Opcional - CPF/CNPJ
  "address": "Rua Exemplo, 123",         // Opcional
  "neighborhood": "Centro",              // Opcional
  "state": "SP",                         // Opcional - UF (2 caracteres)
  "zipcode": "01310-100",                // Opcional - CEP
  "notes": "Observações do cliente",     // Opcional
  "is_active": true,                     // Opcional (padrão: true)
  "branch_id": 1                         // Opcional: ID da filial (se omitido, cria na matriz)
}
```

**Observação (Matriz x Filial):**

- Se você **não** informar `branch_id`, o cliente será cadastrado na **matriz** (`created_at_branch_id = NULL`).
- Se você informar `branch_id`, o cliente será cadastrado diretamente naquela **filial** e aparecerá no frontend quando estiver visualizando essa filial.

**Resposta de Sucesso:**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "11999999999",
    "document": "12345678900",
    "address": "Rua Exemplo, 123",
    "neighborhood": "Centro",
    "state": "SP",
    "zipcode": "01310-100",
    "is_active": true,
    "created_at": "2025-01-16T10:30:00Z"
  }
}
```

#### Listar Clientes

**GET** `/api/v1/customers`

Lista clientes do tenant.

**Query Parameters:**

- `limit` (opcional, padrão: 50) - Número de registros por página
- `offset` (opcional, padrão: 0) - Deslocamento para paginação
- `is_active` (opcional) - Filtrar por status: "true" | "false"
- `search` (opcional) - Buscar por nome, email ou documento. **A busca é flexível e ignora acentos**: buscar "joao" encontra "joão", buscar "maria" encontra "maría", etc.

**Exemplo:**

```
GET /api/v1/customers?limit=20&is_active=true&search=joao
GET /api/v1/customers?search=joao silva  # Encontra "João Silva", "JOAO SILVA", etc.
```

#### Buscar Cliente por ID

**GET** `/api/v1/customers/[customerId]`

Busca um cliente específico por ID.

**Exemplo:**

```
GET /api/v1/customers/123
```

### Produtos

#### Criar Produto

**POST** `/api/v1/products`

Cria um novo produto.

**Body:**

```json
{
  "name": "Produto Exemplo",             // Obrigatório
  "sku": "PROD-001",                     // Opcional - Gerado automaticamente se não fornecido
  "barcode": "7891234567890",            // Opcional - Código de barras
  "description": "Descrição do produto", // Opcional
  "cost_price": 20.00,                   // Obrigatório - Preço de custo
  "sale_price": 29.90,                   // Obrigatório - Preço de venda
  "stock": 100,                          // Opcional - Estoque inicial (padrão: 0)
  "min_stock": 10,                       // Opcional - Estoque mínimo (padrão: 0)
  "unit": "UN",                          // Opcional - Unidade (padrão: "UN")
  "is_active": true                      // Opcional (padrão: true)
}
```

**Resposta de Sucesso:**

```json
{
  "success": true,
  "data": {
    "id": 456,
    "name": "Produto Exemplo",
    "sku": "PROD-001",
    "barcode": "7891234567890",
    "cost_price": 20.00,
    "sale_price": 29.90,
    "stock_quantity": 100,
    "min_stock": 10,
    "unit": "UN",
    "is_active": true,
    "created_at": "2025-01-16T10:30:00Z"
  }
}
```

#### Listar Produtos

**GET** `/api/v1/products`

Lista produtos do tenant.

**Query Parameters:**

- `limit` (opcional, padrão: 50) - Número de registros por página
- `offset` (opcional, padrão: 0) - Deslocamento para paginação
- `is_active` (opcional) - Filtrar por status: "true" | "false"
- `search` (opcional) - Buscar por nome, SKU ou código de barras. **A busca é flexível e ignora acentos**: buscar "cafe" encontra "café", buscar "joao" encontra "joão", etc.

**Exemplo:**

```
GET /api/v1/products?limit=20&is_active=true&search=exemplo
GET /api/v1/products?search=cafe  # Encontra "café", "Café", "CAFÉ", etc.
GET /api/v1/products?search=joao   # Encontra "joão", "João", "JOAO", etc.
```

#### Buscar Produto por ID

**GET** `/api/v1/products/[productId]`

Busca um produto específico por ID.

**Exemplo:**

```
GET /api/v1/products/456
```

## Gerenciamento de API Keys

### Criar API Key

**POST** `/next_api/api-keys`

Cria uma nova API key para um tenant. Requer autenticação administrativa.

**Body:**

```json
{
  "tenant_id": "uuid-do-tenant",
  "name": "Integração WooCommerce",
  "permissions": ["sales:create", "customers:create", "products:read"],
  "expires_at": null  // Opcional - Data de expiração (null = nunca expira)
}
```

**Resposta:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-da-key",
    "api_key": "erp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "name": "Integração WooCommerce",
    "permissions": ["sales:create", "customers:create", "products:read"],
    "created_at": "2025-01-16T10:30:00Z"
  },
  "warning": "Guarde esta API key em local seguro. Ela não será exibida novamente."
}
```

⚠️ **Importante:** A API key é retornada apenas uma vez. Guarde-a em local seguro.

### Listar API Keys

**GET** `/next_api/api-keys?tenant_id=uuid-do-tenant`

Lista todas as API keys de um tenant. Requer autenticação administrativa.

### Revogar API Key

**DELETE** `/next_api/api-keys/[keyId]`

Revoga (desativa) uma API key. Requer autenticação administrativa.

## Permissões

As API keys podem ter permissões específicas para limitar o acesso:

- `sales:create` - Criar vendas
- `sales:read` - Listar vendas
- `customers:create` - Criar clientes
- `customers:read` - Listar e buscar clientes
- `products:create` - Criar produtos
- `products:read` - Listar e buscar produtos

Se a API key não tiver permissões definidas (array vazio), ela tem acesso total.

## Exemplos de Uso

### Exemplo 1: Criar Venda de Balcão

```bash
curl -X POST https://seu-dominio.com/api/v1/sales \
  -H "X-API-Key: erp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "João Silva",
    "products": [
      {
        "name": "Produto A",
        "price": 29.90,
        "quantity": 2
      }
    ],
    "total_amount": 59.80,
    "payment_method": "pix",
    "sale_type": "balcao"
  }'
```

### Exemplo 2: Criar Venda de Entrega

```bash
curl -X POST https://seu-dominio.com/api/v1/sales \
  -H "X-API-Key: erp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Maria Santos",
    "products": [
      {
        "name": "Produto B",
        "price": 49.90,
        "quantity": 1
      }
    ],
    "total_amount": 49.90,
    "payment_method": "cartao_credito",
    "sale_type": "entrega",
    "delivery_address": "Av. Paulista, 1000",
    "delivery_neighborhood": "Bela Vista",
    "delivery_phone": "11987654321",
    "delivery_fee": 10.00
  }'
```

### Exemplo 3: Criar Cliente

```bash
curl -X POST https://seu-dominio.com/api/v1/customers \
  -H "X-API-Key: erp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "11999999999",
    "document": "12345678900",
    "address": "Rua Exemplo, 123",
    "neighborhood": "Centro",
    "state": "SP",
    "zipcode": "01310-100"
  }'
```

### Exemplo 4: Listar Vendas de Entrega

```bash
curl -X GET "https://seu-dominio.com/api/v1/sales?sale_type=entrega&limit=20" \
  -H "X-API-Key: erp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## Tratamento de Erros

Todas as respostas de erro seguem o formato:

```json
{
  "success": false,
  "error": "Mensagem de erro principal",
  "message": "Detalhes adicionais (opcional)"
}
```

### Erros Comuns

- **API Key não fornecida**: `401 - API Key não fornecida`
- **API Key inválida**: `401 - API Key inválida`
- **Sem permissão**: `403 - Permissão insuficiente`
- **Dados inválidos**: `400 - Mensagem específica do erro`
- **Recurso não encontrado**: `404 - Recurso não encontrado`

## Notas Importantes

1. **Vendas de Entrega**: Quando `sale_type='entrega'`, os campos `delivery_address` e `delivery_phone` são obrigatórios. O sistema cria automaticamente um registro na tabela de entregas.

2. **IDs de Clientes e Produtos**: Os campos `customer_id` e `product_id` são opcionais. Se não fornecidos, o sistema usa apenas os nomes fornecidos.

3. **Paginação**: Todos os endpoints de listagem suportam paginação via `limit` e `offset`.

4. **Busca**: Os endpoints de listagem suportam busca via parâmetro `search`.

5. **Segurança**: Nunca exponha sua API key em código cliente ou repositórios públicos. Use variáveis de ambiente.
