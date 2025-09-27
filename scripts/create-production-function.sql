-- ===================================================================
-- FUNÇÃO SIMPLES PARA PRODUÇÃO - SEM RLS COMPLICADO
-- EXECUTE NO SUPABASE SQL EDITOR
-- ===================================================================

-- Função simples que usa SECURITY DEFINER (ignora RLS)
CREATE OR REPLACE FUNCTION get_user_tenant_simple(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    tenant_id UUID,
    role TEXT,
    tenant_name TEXT,
    tenant_slug TEXT,
    tenant_status TEXT,
    trial_ends_at TIMESTAMPTZ,
    tenant_created_at TIMESTAMPTZ,
    tenant_updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Ignora RLS
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        um.user_id,
        um.tenant_id,
        um.role,
        t.name as tenant_name,
        t.slug as tenant_slug,
        t.status as tenant_status,
        t.trial_ends_at,
        t.created_at as tenant_created_at,
        t.updated_at as tenant_updated_at
    FROM public.user_memberships um
    JOIN public.tenants t ON t.id = um.tenant_id
    WHERE um.user_id = p_user_id
    AND um.is_active = true
    LIMIT 1;
END;
$$;

-- Dar permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION get_user_tenant_simple(UUID) TO authenticated;

-- Verificar se funcionou
SELECT get_user_tenant_simple('5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01'::UUID);


