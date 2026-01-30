-- =============================================================================
-- REMOVER PERMANENTEMENTE os triggers que bloqueiam fechamento
-- Execute no Supabase SQL Editor
-- =============================================================================

-- 1. REMOVER (DROP) os triggers problemáticos
DROP TRIGGER IF EXISTS trigger_prevent_locked_updates ON cash_sessions;
DROP TRIGGER IF EXISTS trigger_lock_cash_session ON cash_sessions;

-- 2. Desbloquear todas as sessões
UPDATE cash_sessions 
SET is_locked = false, locked_at = NULL
WHERE is_locked = true OR is_locked IS NULL;

-- 3. Verificar que os triggers foram removidos (não deve retornar nada)
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'cash_sessions'
  AND trigger_name IN ('trigger_prevent_locked_updates', 'trigger_lock_cash_session');

-- 4. Testar fechamento (substitua o ID)
UPDATE cash_sessions 
SET 
  status = 'closed',
  closed_at = NOW(),
  closed_by = 'Teste após remover triggers'
WHERE id = 'a6d25588-a85c-46c3-9871-12096b49981d'
RETURNING id, status, closed_at, closed_by;
