-- =============================================
-- CRIAR TABELA ORDERS (INGLÊS) - FINAL
-- =============================================

-- 1. Criar tabela orders (ordens de serviço)
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    numero VARCHAR(50) NOT NULL,
    cliente VARCHAR(200) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    prioridade VARCHAR(20) DEFAULT 'media',
    status VARCHAR(20) DEFAULT 'aberta',
    tecnico VARCHAR(100),
    valor_estimado DECIMAL(10,2) DEFAULT 0,
    valor_final DECIMAL(10,2),
    data_prazo TIMESTAMP WITH TIME ZONE,
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- 4. Política simples para desenvolvimento
CREATE POLICY "Allow all for authenticated users" ON public.orders 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

-- 5. Verificação
SELECT 'Tabela orders criada com sucesso!' as status;

-- 6. Contar registros existentes
SELECT COUNT(*) as total_orders FROM public.orders;

-- 7. Mostrar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;
