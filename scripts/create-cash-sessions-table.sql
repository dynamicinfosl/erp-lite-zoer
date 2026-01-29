-- Tabela para gerenciar sessões de caixa (abertura e fechamento)
-- Esta tabela armazena o histórico completo de cada período de trabalho do caixa

CREATE TABLE IF NOT EXISTS cash_sessions (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID, -- ID do usuário que abriu/fechou
    register_id VARCHAR(50) NOT NULL DEFAULT '1', -- ID do caixa/terminal
    
    -- Status da sessão
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    
    -- Informações de abertura
    opened_by VARCHAR(255) NOT NULL, -- Nome/email do operador que abriu
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    opening_amount DECIMAL(10,2) NOT NULL DEFAULT 0, -- Valor inicial em dinheiro
    
    -- Informações de fechamento
    closed_by VARCHAR(255), -- Nome/email do operador que fechou
    closed_at TIMESTAMP WITH TIME ZONE, -- Data/hora do fechamento
    
    -- Valores contados no fechamento (por método de pagamento)
    closing_amount_cash DECIMAL(10,2), -- Dinheiro físico contado
    closing_amount_card_debit DECIMAL(10,2), -- Total cartão débito
    closing_amount_card_credit DECIMAL(10,2), -- Total cartão crédito
    closing_amount_pix DECIMAL(10,2), -- Total PIX
    closing_amount_other DECIMAL(10,2), -- Outros métodos
    
    -- Valores esperados (calculados)
    expected_cash DECIMAL(10,2),
    expected_card_debit DECIMAL(10,2),
    expected_card_credit DECIMAL(10,2),
    expected_pix DECIMAL(10,2),
    expected_other DECIMAL(10,2),
    
    -- Diferenças (sobras/faltas)
    difference_amount DECIMAL(10,2), -- Diferença total
    difference_cash DECIMAL(10,2), -- Diferença em dinheiro
    difference_card_debit DECIMAL(10,2),
    difference_card_credit DECIMAL(10,2),
    difference_pix DECIMAL(10,2),
    difference_other DECIMAL(10,2),
    difference_reason TEXT, -- Justificativa da diferença
    
    -- Estatísticas do período
    total_sales INTEGER DEFAULT 0, -- Quantidade de vendas
    total_sales_amount DECIMAL(10,2) DEFAULT 0, -- Valor total vendido
    total_refunds INTEGER DEFAULT 0, -- Quantidade de devoluções
    total_refunds_amount DECIMAL(10,2) DEFAULT 0, -- Valor total devolvido
    total_withdrawals INTEGER DEFAULT 0, -- Quantidade de sangrias
    total_withdrawals_amount DECIMAL(10,2) DEFAULT 0, -- Valor total sangrado
    total_supplies INTEGER DEFAULT 0, -- Quantidade de reforços
    total_supplies_amount DECIMAL(10,2) DEFAULT 0, -- Valor total reforçado
    
    -- Observações
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_cash_sessions_tenant_id ON cash_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_opened_at ON cash_sessions(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_closed_at ON cash_sessions(closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_tenant_status ON cash_sessions(tenant_id, status);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_cash_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cash_sessions_updated_at
    BEFORE UPDATE ON cash_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_cash_sessions_updated_at();

-- Comentários para documentação
COMMENT ON TABLE cash_sessions IS 'Armazena sessões de abertura e fechamento de caixa';
COMMENT ON COLUMN cash_sessions.register_id IS 'ID do caixa/terminal (pode ser configurável)';
COMMENT ON COLUMN cash_sessions.opening_amount IS 'Valor inicial em dinheiro quando o caixa foi aberto';
COMMENT ON COLUMN cash_sessions.closing_amount_cash IS 'Valor em dinheiro físico contado no fechamento';
COMMENT ON COLUMN cash_sessions.difference_amount IS 'Diferença total entre valores esperados e contados';
COMMENT ON COLUMN cash_sessions.total_sales IS 'Quantidade de vendas realizadas no período';

-- Habilitar RLS (Row Level Security) se necessário
-- ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;

-- Política de acesso (ajustar conforme necessário)
-- CREATE POLICY "Users can view their tenant's cash sessions"
-- ON cash_sessions FOR SELECT
-- TO authenticated
-- USING (EXISTS (SELECT 1 FROM user_memberships WHERE tenant_id = cash_sessions.tenant_id AND user_id = auth.uid()));




