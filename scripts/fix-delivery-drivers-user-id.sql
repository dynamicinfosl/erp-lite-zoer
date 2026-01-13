-- =============================================
-- FIX: Tornar user_id opcional em delivery_drivers
-- =============================================
-- A coluna user_id não é necessária para entregadores
-- (eles são vinculados ao tenant_id, não ao user_id)

-- Verificar se a coluna existe
DO $$
BEGIN
  -- Se a coluna user_id existir e for NOT NULL, torná-la opcional
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'delivery_drivers' 
    AND column_name = 'user_id'
  ) THEN
    -- Tornar a coluna opcional (permite NULL)
    ALTER TABLE public.delivery_drivers 
    ALTER COLUMN user_id DROP NOT NULL;
    
    RAISE NOTICE 'Coluna user_id tornada opcional em delivery_drivers';
  ELSE
    RAISE NOTICE 'Coluna user_id não existe em delivery_drivers';
  END IF;
END $$;
