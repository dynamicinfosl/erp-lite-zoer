-- Verificar se há default na coluna user_id que possa estar causando problema
SELECT 
    column_name,
    column_default,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cash_sessions'
  AND column_name = 'user_id';

-- Se houver um default problemático, removê-lo:
-- ALTER TABLE cash_sessions ALTER COLUMN user_id DROP DEFAULT;



