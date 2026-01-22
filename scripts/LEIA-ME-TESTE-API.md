# Como Testar a API de Produtos

## Problema Identificado

O n8n está retornando produtos **SEM variações** porque está usando o **tenant_id errado** no header da chamada da API.

## Seus Tenants

Você tem 2 tenants no banco:

1. **Tenant A** (ERRADO): `132b42a6-6355-4418-996e-de7eb33f6e34`
   - Produtos: "gatorade (limao)" (ID 1564), "GATORADE UND" (ID 1566)
   - ❌ **SEM variações cadastradas**

2. **Tenant B** (CORRETO): `ffd61c21-81d8-49f0-8b70-b1c0f05f6960`
   - Produto: "gatorade fd" (ID 1032)
   - ✅ **COM 8 variações** (blue berry, frutas citricas, laranja, limão, maracuja, morango, tangerina, uva)

## Como Corrigir no n8n

### 1. Verifique qual API Key está usando

O n8n precisa usar uma **API Key associada ao Tenant B** (`ffd61c21-81d8-49f0-8b70-b1c0f05f6960`).

Vá em: **Configurações > Integrações > API Keys**

- Verifique qual tenant_id está associado à API Key que o n8n está usando
- Se estiver associada ao tenant errado, crie uma nova API Key para o tenant correto

### 2. Como a API funciona

A API externa `/api/v1/products` identifica o tenant através do header `x-api-key`.

Quando você envia uma API Key no header, a API automaticamente:
1. Valida a API Key
2. Identifica o `tenant_id` associado a ela
3. Retorna apenas produtos/variações daquele tenant

**Você NÃO envia o tenant_id manualmente** - ele vem automaticamente da API Key!

## Teste Manual

Execute o script `teste-api-gatorade.sh` para testar:

```bash
# 1. Edite o arquivo e substitua "SUA_API_KEY_AQUI" pela sua API Key
# 2. Execute o script:
bash scripts/teste-api-gatorade.sh
```

## Resultado Esperado

Se estiver usando a API Key correta (Tenant B), a API deve retornar:

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
          "cost_price": "30.00",
          "stock_quantity": -65
        },
        {
          "id": 483,
          "label": "frutas citricas",
          "name": "gatorade (frutas citricas)",
          "sale_price": "35.00",
          "cost_price": "30.00",
          "stock_quantity": -35
        },
        // ... outras 6 variações
      ],
      "price_tiers": []
    }
  ]
}
```

## Resumo da Solução

✅ **API está funcionando corretamente**
❌ **n8n está usando API Key do tenant errado**

**SOLUÇÃO**: Trocar a API Key no n8n para uma que esteja associada ao tenant `ffd61c21-81d8-49f0-8b70-b1c0f05f6960`.
