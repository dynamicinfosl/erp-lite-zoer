# Correção de Produtos Gatorade - Converter para Variações

## Problema

Os produtos Gatorade foram cadastrados como **produtos individuais separados**:
- "gatorade (limao)" - ID 1564
- "GATORADE UND" - ID 1566
- E possivelmente outros sabores

Cada um tem seu próprio SKU, estoque e preços.

## Solução

Converter para o modelo de **produto pai + variações**:
- 1 produto pai: "GATORADE"
- Várias variações: "LIMAO", "GUARANA", "UVA", etc.

## Como executar

### Opção 1: Via Supabase SQL Editor (Recomendado)

1. Abra o Supabase SQL Editor
2. Cole o conteúdo do arquivo `fix-gatorade-variants.sql`
3. **ALTERE o tenant_id** na linha 8:
   ```sql
   v_tenant_id uuid := '132b42a6-6355-4418-996e-de7eb33f6e34'; -- SEU TENANT AQUI
   ```
4. Execute o script
5. Verifique os logs e os resultados no final

### Opção 2: Via psql

```bash
psql -h seu-host -U postgres -d seu-banco -f scripts/fix-gatorade-variants.sql
```

## O que o script faz

1. **Lista** todos os produtos com "gatorade" no nome
2. **Cria** um produto pai "GATORADE" (se não existir)
3. **Converte** cada produto filho em uma variação do produto pai:
   - Extrai o sabor do nome (ex: "(limao)" → "LIMAO")
   - Cria a variação com estoque, preços e barcode originais
4. **Copia** os tipos de preço do primeiro produto para o pai
5. **Mantém** os produtos originais (não os deleta)

## Após executar

1. Busque por "gatorade" na API
2. Você verá o produto "GATORADE" com todas as variações no array `variants`
3. Os produtos individuais ainda existirão mas podem ser desativados se preferir

## Desativar produtos individuais (opcional)

Se quiser desativar os produtos individuais após migrar para variações:

```sql
UPDATE products 
SET is_active = false
WHERE tenant_id = 'SEU_TENANT_ID'
  AND LOWER(name) LIKE '%gatorade%'
  AND name != 'GATORADE'  -- Não desativar o produto pai
  AND has_variations = false; -- Só desativar produtos sem variações
```

## Rollback (desfazer)

Se precisar desfazer:

```sql
-- Deletar variações criadas
DELETE FROM product_variants 
WHERE product_id = (SELECT id FROM products WHERE name = 'GATORADE' AND tenant_id = 'SEU_TENANT_ID');

-- Deletar produto pai (se foi criado pelo script)
DELETE FROM products 
WHERE name = 'GATORADE' 
  AND sku = 'GATORADE-PAI' 
  AND tenant_id = 'SEU_TENANT_ID';
```

## Aplicar para outros produtos

Este mesmo padrão pode ser aplicado para outros produtos com múltiplos sabores/tamanhos:
- Coca-Cola (lata, 600ml, 2L, etc.)
- Cerveja (diversos sabores)
- Salgadinhos (diversos sabores)

Basta adaptar o script substituindo "gatorade" pelo nome do produto desejado.
