-- Corrigir tipo da coluna delivery_address de JSONB para TEXT
-- Problema: delivery_address foi criado como JSONB mas deveria ser TEXT

DO $$
BEGIN
  -- Verificar se a coluna existe e é JSONB
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'sales' 
    AND column_name = 'delivery_address'
    AND data_type = 'jsonb'
  ) THEN
    -- Alterar de JSONB para TEXT
    ALTER TABLE sales 
    ALTER COLUMN delivery_address TYPE TEXT USING delivery_address::text;
    
    RAISE NOTICE '✅ Coluna delivery_address alterada de JSONB para TEXT';
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'sales' 
    AND column_name = 'delivery_address'
    AND data_type = 'text'
  ) THEN
    RAISE NOTICE 'ℹ️ Coluna delivery_address já é TEXT';
  ELSE
    RAISE NOTICE '⚠️ Coluna delivery_address não existe';
  END IF;
END $$;

-- Verificar o resultado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND column_name = 'delivery_address';
