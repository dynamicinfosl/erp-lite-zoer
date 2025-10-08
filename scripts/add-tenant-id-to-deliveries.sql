-- =============================================
-- ADICIONAR TENANT_ID À TABELA DELIVERIES
-- =============================================

-- 1. Adicionar coluna tenant_id se não existir
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 2. Criar índice para melhorar performance de buscas por tenant
CREATE INDEX IF NOT EXISTS idx_deliveries_tenant_id ON deliveries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_user_id ON deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON deliveries(created_at DESC);

-- 3. Atualizar RLS (Row Level Security) para deliveries
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS - usuários só podem ver entregas do seu tenant
DROP POLICY IF EXISTS "Users can view their tenant deliveries" ON deliveries;
CREATE POLICY "Users can view their tenant deliveries" 
ON deliveries FOR SELECT 
USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM user_memberships 
        WHERE user_id = auth.uid() 
        AND is_active = true
    )
);

-- 5. Políticas RLS - usuários podem inserir entregas no seu tenant
DROP POLICY IF EXISTS "Users can insert deliveries for their tenant" ON deliveries;
CREATE POLICY "Users can insert deliveries for their tenant" 
ON deliveries FOR INSERT 
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id 
        FROM user_memberships 
        WHERE user_id = auth.uid() 
        AND is_active = true
    )
);

-- 6. Políticas RLS - usuários podem atualizar entregas do seu tenant
DROP POLICY IF EXISTS "Users can update their tenant deliveries" ON deliveries;
CREATE POLICY "Users can update their tenant deliveries" 
ON deliveries FOR UPDATE 
USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM user_memberships 
        WHERE user_id = auth.uid() 
        AND is_active = true
    )
);

-- 7. Políticas RLS - usuários podem deletar entregas do seu tenant (se não entregues)
DROP POLICY IF EXISTS "Users can delete their tenant deliveries" ON deliveries;
CREATE POLICY "Users can delete their tenant deliveries" 
ON deliveries FOR DELETE 
USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM user_memberships 
        WHERE user_id = auth.uid() 
        AND is_active = true
    )
    AND status != 'entregue'
);

-- 8. Verificação
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'deliveries' 
AND column_name IN ('tenant_id', 'user_id', 'status')
ORDER BY ordinal_position;


