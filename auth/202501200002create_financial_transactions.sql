CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('receita', 'despesa')),
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    due_date DATE,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their tenant's transactions
CREATE POLICY "Users can view their tenant's financial transactions."
ON financial_transactions FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM user_memberships WHERE tenant_id = financial_transactions.tenant_id AND user_id = auth.uid()));

-- Policy for authenticated users to insert transactions for their tenant
CREATE POLICY "Users can insert financial transactions for their tenant."
ON financial_transactions FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM user_memberships WHERE tenant_id = financial_transactions.tenant_id AND user_id = auth.uid()));

-- Policy for authenticated users to update their tenant's transactions
CREATE POLICY "Users can update their tenant's financial transactions."
ON financial_transactions FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM user_memberships WHERE tenant_id = financial_transactions.tenant_id AND user_id = auth.uid()));

-- Policy for authenticated users to delete their tenant's transactions
CREATE POLICY "Users can delete their tenant's financial transactions."
ON financial_transactions FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM user_memberships WHERE tenant_id = financial_transactions.tenant_id AND user_id = auth.uid()));
