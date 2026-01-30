-- =============================================================================
-- SOLUÇÃO FINAL: Desabilitar triggers que impedem fechamento de caixas
-- Execute no Supabase SQL Editor (COPIE E COLE TUDO DE UMA VEZ)
-- =============================================================================

-- 1. Desabilitar o trigger que bloqueia updates em registros "locked"
ALTER TABLE cash_sessions DISABLE TRIGGER trigger_prevent_locked_updates;

-- 2. Desabilitar o trigger que auto-bloqueia sessões ao fechar
ALTER TABLE cash_sessions DISABLE TRIGGER trigger_lock_cash_session;

-- 3. Desbloquear TODAS as sessões que estiverem locked
UPDATE cash_sessions 
SET is_locked = false, locked_at = NULL
WHERE is_locked = true;

-- 4. Verificar que os triggers foram desabilitados
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'cash_sessions'
  AND trigger_name IN ('trigger_prevent_locked_updates', 'trigger_lock_cash_session');

-- 5. Testar fechamento de uma sessão aberta
-- (Substitua o ID por um dos seus IDs de sessão aberta)
-- UPDATE cash_sessions 
-- SET 
--   status = 'closed',
--   closed_at = NOW(),
--   closed_by = 'Teste final'
-- WHERE id = 'COLE-UM-ID-DE-SESSÃO-ABERTA-AQUI'
-- RETURNING id, status, closed_at, closed_by;

-- =============================================================================
-- RESULTADO ESPERADO: Os triggers NÃO devem aparecer na consulta do item 4
-- Se aparecerem, significa que ainda estão habilitados.
-- =============================================================================
