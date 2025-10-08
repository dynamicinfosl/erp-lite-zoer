-- =============================================
-- CRIAR TABELA DE ORDENS DE SERVIÇO - FINAL
-- =============================================
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela orders (ordens de serviço)
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    cliente VARCHAR(200) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta')),
    status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'concluida', 'cancelada')),
    tecnico VARCHAR(100),
    valor_estimado DECIMAL(10,2) DEFAULT 0,
    valor_final DECIMAL(10,2),
    data_prazo TIMESTAMP WITH TIME ZONE,
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(tenant_id, numero)
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_prioridade ON public.orders(prioridade);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_numero ON public.orders(numero);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS - usuários podem ver ordens do seu tenant
DROP POLICY IF EXISTS "Users can view their tenant orders" ON public.orders;
CREATE POLICY "Users can view their tenant orders" 
ON public.orders FOR SELECT 
USING (
    EXISTS (
        SELECT 1 
        FROM public.user_memberships 
        WHERE user_memberships.user_id = auth.uid() 
        AND user_memberships.tenant_id = orders.tenant_id
        AND user_memberships.is_active = true
    )
);

-- 5. Políticas RLS - usuários podem inserir ordens no seu tenant
DROP POLICY IF EXISTS "Users can insert orders for their tenant" ON public.orders;
CREATE POLICY "Users can insert orders for their tenant" 
ON public.orders FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM public.user_memberships 
        WHERE user_memberships.user_id = auth.uid() 
        AND user_memberships.tenant_id = orders.tenant_id
        AND user_memberships.is_active = true
    )
);

-- 6. Políticas RLS - usuários podem atualizar ordens do seu tenant
DROP POLICY IF EXISTS "Users can update their tenant orders" ON public.orders;
CREATE POLICY "Users can update their tenant orders" 
ON public.orders FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 
        FROM public.user_memberships 
        WHERE user_memberships.user_id = auth.uid() 
        AND user_memberships.tenant_id = orders.tenant_id
        AND user_memberships.is_active = true
    )
);

-- 7. Políticas RLS - usuários podem deletar ordens do seu tenant (exceto concluídas)
DROP POLICY IF EXISTS "Users can delete their tenant orders" ON public.orders;
CREATE POLICY "Users can delete their tenant orders" 
ON public.orders FOR DELETE 
USING (
    EXISTS (
        SELECT 1 
        FROM public.user_memberships 
        WHERE user_memberships.user_id = auth.uid() 
        AND user_memberships.tenant_id = orders.tenant_id
        AND user_memberships.is_active = true
    )
    AND orders.status != 'concluida'
);

-- 8. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();

-- 10. Verificação
SELECT 'Tabela orders criada com sucesso!' as status;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;
