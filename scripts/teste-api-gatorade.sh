#!/bin/bash

# Teste direto da API /api/v1/products para buscar "gatorade"
# SUBSTITUA os valores abaixo:

# 1. Seu API Key (encontre em: Configurações > Integrações > API Keys)
API_KEY="SUA_API_KEY_AQUI"

# 2. URL da sua aplicação
API_URL="https://erp-lite-zoer-new.vercel.app/api/v1/products"

echo "🔍 Testando API de Produtos - Busca por 'gatorade'"
echo "================================================"
echo ""
echo "Tenant ID: ffd61c21-81d8-49f0-8b70-b1c0f05f6960"
echo "Termo de busca: gatorade"
echo ""

# Fazer chamada à API
curl -X GET "$API_URL?search=gatorade&limit=10" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  | jq '.'

echo ""
echo "================================================"
echo "✅ Se retornou o produto ID 1032 com 8 variações = API OK!"
echo "❌ Se retornou produtos ID 1564/1566 sem variações = n8n está usando tenant errado!"
