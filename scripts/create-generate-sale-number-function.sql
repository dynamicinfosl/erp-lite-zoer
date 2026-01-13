-- =============================================
-- CRIAR/MODIFICAR FUNÇÃO generate_sale_number
-- =============================================
-- Esta função gera números de venda sequenciais começando do 01
-- O formato será: 01, 02, 03, ... até 99, depois 100, 101, etc.

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS generate_sale_number();

-- Criar nova função que gera números começando do 01
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TEXT AS $$
DECLARE
  last_number INTEGER;
  new_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Buscar o último número de venda (extrair apenas números)
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN sale_number ~ '^[0-9]+$' THEN sale_number::INTEGER
        WHEN sale_number ~ '^[0-9]+' THEN (regexp_replace(sale_number, '[^0-9].*', ''))::INTEGER
        ELSE 0
      END
    ),
    0
  ) INTO last_number
  FROM sales;

  -- Incrementar
  new_number := last_number + 1;

  -- Formatar com zero à esquerda (mínimo 2 dígitos: 01, 02, etc.)
  -- Mas permitir números maiores também (100, 101, etc.)
  IF new_number < 10 THEN
    formatted_number := '0' || new_number::TEXT;
  ELSE
    formatted_number := new_number::TEXT;
  END IF;

  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Testar a função
SELECT generate_sale_number() as test_number;

-- Verificar as últimas vendas para confirmar
SELECT sale_number, created_at 
FROM sales 
ORDER BY created_at DESC 
LIMIT 10;
