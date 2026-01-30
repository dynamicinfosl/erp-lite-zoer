-- =============================================================================
-- TESTE MANUAL DE UPDATE na tabela cash_sessions
-- Execute no Supabase SQL Editor para testar se o update funciona
-- =============================================================================

-- 1. Ver todas as sessões abertas
SELECT id, status, opened_at, closed_at, opened_by, closed_by 
FROM cash_sessions 
WHERE status = 'open' OR status IS NULL
ORDER BY opened_at DESC 
LIMIT 5;

-- 2. Copie um ID de sessão ABERTA da consulta acima e cole aqui (substitua 'SEU-ID-AQUI')
-- Teste MANUAL de fechamento:
-- UPDATE cash_sessions 
-- SET 
--   status = 'closed',
--   closed_at = NOW(),
--   closed_by = 'Teste Manual'
-- WHERE id = 'SEU-ID-AQUI'
-- RETURNING id, status, closed_at, closed_by;

-- 3. Depois de rodar o UPDATE acima, consulte de novo para confirmar
-- SELECT id, status, opened_at, closed_at, opened_by, closed_by 
-- FROM cash_sessions 
-- WHERE id = 'SEU-ID-AQUI';
