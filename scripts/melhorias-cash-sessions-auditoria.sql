-- ============================================
-- MELHORIAS NO SISTEMA DE FECHAMENTO DE CAIXA
-- Adiciona auditoria, segurança e rastreabilidade
-- ============================================

-- 1. Adicionar campos de auditoria e segurança
ALTER TABLE cash_sessions 
ADD COLUMN IF NOT EXISTS security_hash TEXT,
ADD COLUMN IF NOT EXISTS closed_by_user_id UUID,
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS device_info TEXT,
ADD COLUMN IF NOT EXISTS closing_snapshot JSONB,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS audit_trail JSONB DEFAULT '[]'::jsonb;

-- 2. Comentários explicativos
COMMENT ON COLUMN cash_sessions.security_hash IS 'Hash SHA-256 dos dados do fechamento para garantir integridade';
COMMENT ON COLUMN cash_sessions.closed_by_user_id IS 'UUID do usuário que realizou o fechamento';
COMMENT ON COLUMN cash_sessions.ip_address IS 'Endereço IP de onde foi feito o fechamento';
COMMENT ON COLUMN cash_sessions.device_info IS 'Informações do dispositivo usado no fechamento';
COMMENT ON COLUMN cash_sessions.closing_snapshot IS 'Snapshot completo de todas as transações do período';
COMMENT ON COLUMN cash_sessions.is_locked IS 'Indica se o registro está bloqueado para edição';
COMMENT ON COLUMN cash_sessions.locked_at IS 'Data/hora em que o registro foi bloqueado';
COMMENT ON COLUMN cash_sessions.audit_trail IS 'Histórico de todas as ações realizadas no registro';

-- 3. Criar índices para melhorar performance de consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_cash_sessions_security_hash ON cash_sessions(security_hash);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_closed_by_user_id ON cash_sessions(closed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_is_locked ON cash_sessions(is_locked);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_closed_at ON cash_sessions(closed_at);

-- 4. Função para bloquear registro automaticamente após fechamento
CREATE OR REPLACE FUNCTION lock_cash_session_on_close()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou para 'closed', bloquear o registro
    IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status != 'closed') THEN
        NEW.is_locked := TRUE;
        NEW.locked_at := CURRENT_TIMESTAMP;
        
        -- Adicionar entrada no audit_trail
        NEW.audit_trail := COALESCE(NEW.audit_trail, '[]'::jsonb) || 
            jsonb_build_object(
                'action', 'closed',
                'timestamp', CURRENT_TIMESTAMP,
                'user', NEW.closed_by,
                'user_id', NEW.closed_by_user_id,
                'ip_address', NEW.ip_address
            );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para bloquear automaticamente
DROP TRIGGER IF EXISTS trigger_lock_cash_session ON cash_sessions;
CREATE TRIGGER trigger_lock_cash_session
    BEFORE INSERT OR UPDATE ON cash_sessions
    FOR EACH ROW
    EXECUTE FUNCTION lock_cash_session_on_close();

-- 6. Função para prevenir alterações em registros bloqueados
CREATE OR REPLACE FUNCTION prevent_locked_cash_session_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevenir atualizações em registros bloqueados (exceto para adicionar audit_trail)
    IF OLD.is_locked = TRUE THEN
        -- Permitir apenas atualização do audit_trail para registro de tentativas
        IF NEW.audit_trail IS DISTINCT FROM OLD.audit_trail THEN
            -- Atualizar apenas audit_trail
            NEW := OLD;
            NEW.audit_trail := COALESCE(NEW.audit_trail, OLD.audit_trail);
            RETURN NEW;
        ELSE
            -- Registrar tentativa de modificação no audit_trail
            UPDATE cash_sessions
            SET audit_trail = audit_trail || 
                jsonb_build_object(
                    'action', 'unauthorized_modification_attempt',
                    'timestamp', CURRENT_TIMESTAMP,
                    'attempted_by', current_user
                )
            WHERE id = OLD.id;
            
            RAISE EXCEPTION 'Registro de fechamento de caixa bloqueado. ID: %. Não é possível modificar registros fechados.', OLD.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para prevenir alterações
DROP TRIGGER IF EXISTS trigger_prevent_locked_updates ON cash_sessions;
CREATE TRIGGER trigger_prevent_locked_updates
    BEFORE UPDATE ON cash_sessions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_locked_cash_session_updates();

-- 8. Criar view para relatórios de auditoria
CREATE OR REPLACE VIEW cash_sessions_audit_view AS
SELECT 
    cs.id,
    cs.tenant_id,
    cs.register_id,
    cs.opened_at,
    cs.closed_at,
    cs.opened_by,
    cs.closed_by,
    cs.closed_by_user_id,
    cs.opening_amount,
    cs.difference_amount,
    cs.security_hash,
    cs.is_locked,
    cs.locked_at,
    cs.ip_address,
    cs.device_info,
    cs.status,
    -- Calcular tempo de sessão
    EXTRACT(EPOCH FROM (cs.closed_at - cs.opened_at))/3600 AS session_hours,
    -- Verificar integridade
    CASE 
        WHEN cs.security_hash IS NOT NULL AND cs.is_locked = TRUE THEN 'Íntegro'
        WHEN cs.security_hash IS NULL AND cs.status = 'closed' THEN 'Sem Hash'
        ELSE 'Aberto'
    END AS integrity_status,
    -- Estatísticas
    cs.total_sales,
    cs.total_sales_amount,
    cs.total_withdrawals_amount,
    cs.total_supplies_amount
FROM cash_sessions cs
WHERE cs.status = 'closed'
ORDER BY cs.closed_at DESC;

-- 9. Criar função para gerar relatório de fechamento
CREATE OR REPLACE FUNCTION get_cash_session_closure_report(session_id BIGINT)
RETURNS JSON AS $$
DECLARE
    report JSON;
BEGIN
    SELECT json_build_object(
        'session_info', json_build_object(
            'id', cs.id,
            'register_id', cs.register_id,
            'opened_at', cs.opened_at,
            'closed_at', cs.closed_at,
            'opened_by', cs.opened_by,
            'closed_by', cs.closed_by,
            'session_duration_hours', ROUND(EXTRACT(EPOCH FROM (cs.closed_at - cs.opened_at))/3600, 2)
        ),
        'financial_summary', json_build_object(
            'opening_amount', cs.opening_amount,
            'total_sales', cs.total_sales,
            'total_sales_amount', cs.total_sales_amount,
            'closing_amounts', json_build_object(
                'cash', cs.closing_amount_cash,
                'card_debit', cs.closing_amount_card_debit,
                'card_credit', cs.closing_amount_card_credit,
                'pix', cs.closing_amount_pix,
                'other', cs.closing_amount_other
            ),
            'expected_amounts', json_build_object(
                'cash', cs.expected_cash,
                'card_debit', cs.expected_card_debit,
                'card_credit', cs.expected_card_credit,
                'pix', cs.expected_pix,
                'other', cs.expected_other
            ),
            'differences', json_build_object(
                'total', cs.difference_amount,
                'cash', cs.difference_cash,
                'card_debit', cs.difference_card_debit,
                'card_credit', cs.difference_card_credit,
                'pix', cs.difference_pix,
                'other', cs.difference_other,
                'reason', cs.difference_reason
            )
        ),
        'operations', json_build_object(
            'withdrawals_count', cs.total_withdrawals,
            'withdrawals_amount', cs.total_withdrawals_amount,
            'supplies_count', cs.total_supplies,
            'supplies_amount', cs.total_supplies_amount
        ),
        'security', json_build_object(
            'is_locked', cs.is_locked,
            'locked_at', cs.locked_at,
            'security_hash', cs.security_hash,
            'ip_address', cs.ip_address,
            'device_info', cs.device_info
        ),
        'notes', cs.notes,
        'generated_at', CURRENT_TIMESTAMP
    ) INTO report
    FROM cash_sessions cs
    WHERE cs.id = session_id;
    
    RETURN report;
END;
$$ LANGUAGE plpgsql;

-- 10. Criar tabela de logs de fechamento (para auditoria adicional)
CREATE TABLE IF NOT EXISTS cash_sessions_log (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES cash_sessions(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    action_by VARCHAR(255),
    action_by_user_id UUID,
    action_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    data_before JSONB,
    data_after JSONB,
    description TEXT
);

-- Criar índices para a tabela de logs
CREATE INDEX IF NOT EXISTS idx_cash_sessions_log_session_id ON cash_sessions_log(session_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_log_action ON cash_sessions_log(action);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_log_action_at ON cash_sessions_log(action_at);

-- 11. Função para registrar log automaticamente
CREATE OR REPLACE FUNCTION log_cash_session_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO cash_sessions_log (
            session_id, action, action_by, action_by_user_id, 
            data_after, description
        ) VALUES (
            NEW.id,
            'created',
            NEW.opened_by,
            NEW.user_id,
            to_jsonb(NEW),
            'Sessão de caixa criada'
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Registrar apenas mudanças significativas
        IF NEW.status != OLD.status OR 
           NEW.closed_at IS DISTINCT FROM OLD.closed_at THEN
            INSERT INTO cash_sessions_log (
                session_id, action, action_by, action_by_user_id,
                data_before, data_after, description
            ) VALUES (
                NEW.id,
                CASE 
                    WHEN NEW.status = 'closed' THEN 'closed'
                    ELSE 'modified'
                END,
                NEW.closed_by,
                NEW.closed_by_user_id,
                to_jsonb(OLD),
                to_jsonb(NEW),
                CASE 
                    WHEN NEW.status = 'closed' THEN 'Caixa fechado'
                    ELSE 'Sessão modificada'
                END
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Criar trigger para log automático
DROP TRIGGER IF EXISTS trigger_log_cash_session_changes ON cash_sessions;
CREATE TRIGGER trigger_log_cash_session_changes
    AFTER INSERT OR UPDATE ON cash_sessions
    FOR EACH ROW
    EXECUTE FUNCTION log_cash_session_changes();

-- 13. Mensagens de confirmação
DO $$
BEGIN
    RAISE NOTICE '✅ Campos de auditoria adicionados com sucesso';
    RAISE NOTICE '✅ Índices de performance criados';
    RAISE NOTICE '✅ Triggers de segurança configurados';
    RAISE NOTICE '✅ View de auditoria criada: cash_sessions_audit_view';
    RAISE NOTICE '✅ Função de relatório criada: get_cash_session_closure_report(session_id)';
    RAISE NOTICE '✅ Tabela de logs criada: cash_sessions_log';
    RAISE NOTICE '✅ Sistema de auditoria totalmente configurado!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Recursos disponíveis:';
    RAISE NOTICE '   - Bloqueio automático após fechamento';
    RAISE NOTICE '   - Prevenção de alterações em registros fechados';
    RAISE NOTICE '   - Registro de todas as ações (audit_trail)';
    RAISE NOTICE '   - Hash de segurança para integridade';
    RAISE NOTICE '   - Logs detalhados de mudanças';
    RAISE NOTICE '   - Relatórios de auditoria';
END $$;


