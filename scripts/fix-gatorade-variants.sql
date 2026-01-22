-- Script para corrigir produtos Gatorade: converter produtos individuais em variações
-- Problema: Cada sabor está cadastrado como produto separado, deveria ser variações de um produto pai
-- Solução: Criar produto pai "GATORADE" e migrar produtos existentes para variações

-- Substitua o tenant_id pelo seu tenant
-- Exemplo: '132b42a6-6355-4418-996e-de7eb33f6e34'
DO $$
DECLARE
  v_tenant_id uuid := '132b42a6-6355-4418-996e-de7eb33f6e34'; -- ALTERAR AQUI
  v_parent_product_id bigint;
  v_product record;
  v_variant_label text;
BEGIN
  -- 1. Verificar produtos Gatorade existentes
  RAISE NOTICE '=== Verificando produtos Gatorade ===';
  FOR v_product IN 
    SELECT id, name, sku, sale_price, cost_price, stock_quantity
    FROM products
    WHERE tenant_id = v_tenant_id
      AND LOWER(name) LIKE '%gatorade%'
    ORDER BY id
  LOOP
    RAISE NOTICE 'Produto encontrado: ID=%, Nome=%, SKU=%, Estoque=%', 
      v_product.id, v_product.name, v_product.sku, v_product.stock_quantity;
  END LOOP;

  -- 2. Verificar se já existe um produto pai "GATORADE"
  SELECT id INTO v_parent_product_id
  FROM products
  WHERE tenant_id = v_tenant_id
    AND LOWER(name) = 'gatorade'
    AND is_active = true
  LIMIT 1;

  -- 3. Se não existe, criar produto pai
  IF v_parent_product_id IS NULL THEN
    RAISE NOTICE '=== Criando produto pai GATORADE ===';
    
    INSERT INTO products (
      tenant_id,
      user_id,
      name,
      sku,
      cost_price,
      sale_price,
      stock_quantity,
      min_stock,
      unit,
      is_active,
      has_variations,
      created_at,
      updated_at
    ) VALUES (
      v_tenant_id,
      '00000000-0000-0000-0000-000000000000',
      'GATORADE',
      'GATORADE-PAI', -- SKU único para o produto pai
      5, -- Preço base (pode ajustar)
      7, -- Preço base (pode ajustar)
      0, -- Estoque do pai não é usado quando há variações
      0,
      'UNIDADE',
      true,
      true, -- Tem variações
      NOW(),
      NOW()
    )
    RETURNING id INTO v_parent_product_id;
    
    RAISE NOTICE 'Produto pai criado com ID: %', v_parent_product_id;
  ELSE
    RAISE NOTICE 'Produto pai já existe com ID: %', v_parent_product_id;
  END IF;

  -- 4. Criar variações para cada produto Gatorade existente
  RAISE NOTICE '=== Criando variações ===';
  
  FOR v_product IN 
    SELECT id, name, sku, barcode, unit, sale_price, cost_price, stock_quantity
    FROM products
    WHERE tenant_id = v_tenant_id
      AND LOWER(name) LIKE '%gatorade%'
      AND id != v_parent_product_id -- Não incluir o próprio pai
    ORDER BY id
  LOOP
    -- Extrair o sabor do nome (ex: "gatorade (limao)" -> "LIMAO")
    v_variant_label := UPPER(TRIM(REGEXP_REPLACE(v_product.name, '.*\((.*)\).*', '\1', 'i')));
    
    -- Se não conseguiu extrair entre parênteses, usar o nome completo
    IF v_variant_label = UPPER(v_product.name) THEN
      v_variant_label := UPPER(TRIM(REGEXP_REPLACE(v_product.name, 'GATORADE\s*', '', 'i')));
    END IF;
    
    -- Se ainda está vazio, usar um padrão
    IF v_variant_label = '' OR v_variant_label IS NULL THEN
      v_variant_label := 'VARIACAO_' || v_product.id;
    END IF;
    
    RAISE NOTICE 'Criando variação: % (de produto ID: %)', v_variant_label, v_product.id;
    
    -- Inserir variação (ou atualizar se já existe)
    INSERT INTO product_variants (
      tenant_id,
      product_id,
      label,
      name,
      barcode,
      unit,
      sale_price,
      cost_price,
      stock_quantity,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      v_tenant_id,
      v_parent_product_id,
      v_variant_label,
      v_product.name,
      v_product.barcode,
      v_product.unit,
      v_product.sale_price,
      v_product.cost_price,
      v_product.stock_quantity,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (tenant_id, product_id, LOWER(label))
    DO UPDATE SET
      name = EXCLUDED.name,
      sale_price = EXCLUDED.sale_price,
      cost_price = EXCLUDED.cost_price,
      stock_quantity = EXCLUDED.stock_quantity,
      updated_at = NOW();
    
    RAISE NOTICE '✓ Variação criada: %', v_variant_label;
  END LOOP;

  -- 5. Copiar price_tiers do primeiro produto filho para o produto pai (se não tiver)
  INSERT INTO product_price_tiers (tenant_id, product_id, price_type_id, price, created_at, updated_at)
  SELECT 
    v_tenant_id,
    v_parent_product_id,
    ppt.price_type_id,
    ppt.price,
    NOW(),
    NOW()
  FROM product_price_tiers ppt
  WHERE ppt.tenant_id = v_tenant_id
    AND ppt.product_id IN (
      SELECT id FROM products 
      WHERE tenant_id = v_tenant_id 
        AND LOWER(name) LIKE '%gatorade%'
        AND id != v_parent_product_id
      LIMIT 1
    )
    AND NOT EXISTS (
      SELECT 1 FROM product_price_tiers
      WHERE tenant_id = v_tenant_id
        AND product_id = v_parent_product_id
        AND price_type_id = ppt.price_type_id
    );

  RAISE NOTICE '=== Processo concluído ===';
  RAISE NOTICE 'Produto pai ID: %', v_parent_product_id;
  RAISE NOTICE 'Execute SELECT * FROM products WHERE id = % para ver o produto pai', v_parent_product_id;
  RAISE NOTICE 'Execute SELECT * FROM product_variants WHERE product_id = % para ver as variações', v_parent_product_id;
  
END $$;

-- Verificar resultado
SELECT 
  p.id as produto_pai_id,
  p.name as produto_pai_nome,
  COUNT(pv.id) as total_variacoes
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id
WHERE p.name = 'GATORADE'
GROUP BY p.id, p.name;

-- Ver as variações criadas
SELECT 
  pv.id,
  pv.label,
  pv.name,
  pv.sale_price,
  pv.stock_quantity
FROM product_variants pv
JOIN products p ON p.id = pv.product_id
WHERE p.name = 'GATORADE'
ORDER BY pv.label;
