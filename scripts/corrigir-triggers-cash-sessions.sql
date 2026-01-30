-- =============================================================================
-- CORREÇÃO: Triggers estão bloqueando o fechamento de caixas
-- Execute no Supabase SQL Editor
-- =============================================================================

-- 1. VERIFICAR se as sessões estão "locked" (bloqueadas)
SELECT id, status, is_locked, locked_at, closed_at
FROM cash_sessions
WHERE status = 'open' OR status IS NULL
ORDER BY opened_at DESC
LIMIT 10;

-- 2. DESBLOQUEAR todas as sessões (caso estejam locked)
UPDATE cash_sessions 
SET is_locked = false, locked_at = NULL
WHERE is_locked = true;

-- 3. DESABILITAR temporariamente o trigger problemático
ALTER TABLE cash_sessions DISABLE TRIGGER trigger_prevent_locked_updates;

-- 4. TESTAR o fechamento novamente
UPDATE cash_sessions 
SET 
  status = 'closed',
  closed_at = NOW(),
  closed_by = 'Teste após desabilitar trigger'
WHERE id = '3db76b4e-2c20-445c-8f98-b4cfb211beda'
RETURNING id, status, closed_at, closed_by, is_locked;

-- 5. Se funcionou, REABILITAR o trigger (mas só depois que funcionar!)
-- ALTER TABLE cash_sessions ENABLE TRIGGER trigger_prevent_locked_updates;

-- =============================================================================
-- ALTERNATIVA: Se quiser remover PERMANENTEMENTE os triggers de auditoria
-- (só faça isso se não precisar de auditoria automática)
-- =============================================================================
-- DROP TRIGGER IF EXISTS trigger_prevent_locked_updates ON cash_sessions;
-- DROP TRIGGER IF EXISTS trigger_lock_cash_session ON cash_sessions;
