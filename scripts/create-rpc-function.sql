-- ===================================================================
-- CRIAR FUNÇÃO RPC PARA BUSCAR MEMBERSHIPS
-- COPIE E COLE NO SQL EDITOR DO SUPABASE
-- ===================================================================

-- Função para buscar memberships do usuário
CREATE OR REPLACE FUNCTION get_user_memberships(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    tenant_id UUID,
    role TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    tenant_name TEXT,
    tenant_slug TEXT,
    tenant_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        um.id,
        um.user_id,
        um.tenant_id,
        um.role,
        um.is_active,
        um.created_at,
        um.updated_at,
        t.name as tenant_name,
        t.slug as tenant_slug,
        t.status as tenant_status
    FROM public.user_memberships um
    LEFT JOIN public.tenants t ON t.id = um.tenant_id
    WHERE um.user_id = p_user_id
    AND um.is_active = true;
END;
$$;


