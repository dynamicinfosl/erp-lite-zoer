-- =============================================
-- CRIAR TABELA DE ORDENS DE SERVIÇO - VERSÃO SIMPLES
-- =============================================

-- 1. Criar tabela orders
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
    
    UNIQUE(tenant_id, numero)
);

-- 2. Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- 3. Habilitar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. Política simples - usuários podem ver suas próprias ordens
DROP POLICY IF EXISTS "Users can manage their orders" ON public.orders;
CREATE POLICY "Users can manage their orders" 
ON public.orders FOR ALL 
USING (user_id = auth.uid());

-- 5. Inserir dados de exemplo
INSERT INTO public.orders (user_id, tenant_id, numero, cliente, tipo, descricao, prioridade, status, tecnico, valor_estimado, data_prazo) VALUES
(
    auth.uid(),
    (SELECT id FROM public.tenants LIMIT 1),
    'OS-2024-001',
    'João Silva',
    'Reparo Equipamento',
    'Reparo no sistema de refrigeração',
    'alta',
    'aberta',
    'Carlos Santos',
    350.00,
    '2024-01-20 18:00:00'
),
(
    auth.uid(),
    (SELECT id FROM public.tenants LIMIT 1),
    'OS-2024-002',
    'Maria Oliveira',
    'Manutenção Preventiva',
    'Limpeza e verificação geral',
    'media',
    'em_andamento',
    'Pedro Costa',
    150.00,
    '2024-01-18 17:00:00'
)
ON CONFLICT DO NOTHING;

-- 6. Verificar se foi criada
SELECT 'Tabela orders criada com sucesso!' as status;
SELECT COUNT(*) as total_ordens FROM public.orders;

