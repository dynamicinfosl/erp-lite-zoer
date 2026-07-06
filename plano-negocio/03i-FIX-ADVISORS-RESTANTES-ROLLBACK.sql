-- ROLLBACK: Reverter correções dos advisors restantes
-- Projeto: lfxietcasaooenffdodr
-- Executar caso a migration 03h cause problemas

-- ============================================================
-- 1. Remover policy de financial_transactions
-- ============================================================
DROP POLICY IF EXISTS "financial_transactions_tenant_policy" ON public.financial_transactions;

-- ============================================================
-- 2. Restaurar funções sem SET search_path
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_next_manifest_number(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
declare
  v_count bigint;
begin
  select count(*) + 1 into v_count
  from public.delivery_manifests
  where tenant_id = p_tenant_id;

  return 'Entrega ' || v_count::text;
end;
$$;

CREATE OR REPLACE FUNCTION public.update_user_permissions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_expected_amounts(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_expected_cash DECIMAL(10,2);
    v_expected_card DECIMAL(10,2);
    v_expected_pix DECIMAL(10,2);
    v_expected_other DECIMAL(10,2);
BEGIN
    SELECT
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'pix' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'other' THEN amount ELSE 0 END), 0)
    INTO v_expected_cash, v_expected_card, v_expected_pix, v_expected_other
    FROM cash_transactions
    WHERE session_id = p_session_id
    AND type NOT IN ('closing');

    UPDATE cash_sessions
    SET
        expected_amount_cash = v_expected_cash,
        expected_amount_card = v_expected_card,
        expected_amount_pix = v_expected_pix,
        expected_amount_other = v_expected_other,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_sale_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  last_number INTEGER;
  new_number INTEGER;
  formatted_number TEXT;
BEGIN
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

  new_number := last_number + 1;

  IF new_number < 10 THEN
    formatted_number := '0' || new_number::TEXT;
  ELSE
    formatted_number := new_number::TEXT;
  END IF;

  RETURN formatted_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_payment_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_cash_differences(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE cash_sessions
    SET
        difference_cash = closing_amount_cash - expected_amount_cash,
        difference_card = closing_amount_card - expected_amount_card,
        difference_pix = closing_amount_pix - expected_amount_pix,
        difference_other = closing_amount_other - expected_amount_other,
        total_difference = (closing_amount_cash - expected_amount_cash) +
                          (closing_amount_card - expected_amount_card) +
                          (closing_amount_pix - expected_amount_pix) +
                          (closing_amount_other - expected_amount_other),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.lock_cash_session_on_close()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status != 'closed') THEN
        NEW.is_locked := TRUE;
        NEW.locked_at := CURRENT_TIMESTAMP;

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
$$;

CREATE OR REPLACE FUNCTION public.prevent_locked_cash_session_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.is_locked = TRUE THEN
        IF NEW.audit_trail IS DISTINCT FROM OLD.audit_trail THEN
            NEW := OLD;
            NEW.audit_trail := COALESCE(NEW.audit_trail, OLD.audit_trail);
            RETURN NEW;
        ELSE
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
$$;

CREATE OR REPLACE FUNCTION public.get_cash_session_closure_report(p_session_id text)
RETURNS json
LANGUAGE plpgsql
AS $$
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
    WHERE cs.id::TEXT = p_session_id;

    RETURN report;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_cash_session_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO cash_sessions_log (
            session_id, action, action_by, action_by_user_id,
            data_after, description
        ) VALUES (
            NEW.id::TEXT,
            'created',
            NEW.opened_by,
            NEW.user_id,
            to_jsonb(NEW),
            'Sessão de caixa criada'
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status != OLD.status OR
           NEW.closed_at IS DISTINCT FROM OLD.closed_at THEN
            INSERT INTO cash_sessions_log (
                session_id, action, action_by, action_by_user_id,
                data_before, data_after, description
            ) VALUES (
                NEW.id::TEXT,
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
$$;
