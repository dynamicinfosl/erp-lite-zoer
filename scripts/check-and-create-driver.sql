-- ============================================
-- Verificar e criar entregador Lucas
-- ============================================

-- 1. Verificar se a tabela existe e tem dados
SELECT 
    'Estrutura da tabela delivery_drivers' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'delivery_drivers'
ORDER BY ordinal_position;

-- 2. Verificar RLS
SELECT 
    'RLS Status' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'delivery_drivers';

-- 3. Listar policies
SELECT 
    'Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'delivery_drivers';

-- 4. Listar todos os entregadores
SELECT 
    'Entregadores existentes' as info,
    *
FROM public.delivery_drivers;

-- 5. Criar ou atualizar o entregador Lucas
INSERT INTO public.delivery_drivers (
    id,
    tenant_id,
    name,
    phone,
    vehicle_type,
    vehicle_plate,
    is_active,
    created_at,
    updated_at
) VALUES (
    6,
    '132b42a6-6355-4418-996e-de7eb33f6e34',
    'Lucas',
    '21927773828',
    'moto',
    NULL,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    vehicle_type = EXCLUDED.vehicle_type,
    vehicle_plate = EXCLUDED.vehicle_plate,
    is_active = EXCLUDED.is_active,
    tenant_id = EXCLUDED.tenant_id,
    updated_at = NOW();

-- 6. Verificar se foi criado
SELECT 
    'Entregador Lucas após insert' as info,
    *
FROM public.delivery_drivers
WHERE id = 6;
