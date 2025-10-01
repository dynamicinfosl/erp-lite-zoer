-- =============================================
-- FUNÇÃO OTIMIZADA PARA BUSCAR TENANT DO USUÁRIO
-- Execute no SQL Editor do Supabase
-- =============================================

CREATE OR REPLACE FUNCTION get_user_tenant(p_user_id UUID)
RETURNS TABLE (
    tenant_id UUID,
    tenant_name TEXT,
    tenant_slug TEXT,
    tenant_status TEXT,
    tenant_trial_ends_at TIMESTAMPTZ,
    user_role TEXT,
    membership_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as tenant_id,
        t.name::TEXT as tenant_name,
        t.slug::TEXT as tenant_slug,
        t.status::TEXT as tenant_status,
        t.trial_ends_at as tenant_trial_ends_at,
        um.role::TEXT as user_role,
        um.id as membership_id
    FROM public.user_memberships um
    INNER JOIN public.tenants t ON t.id = um.tenant_id
    WHERE um.user_id = p_user_id 
    AND um.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Testar a função com seu user_id
SELECT * FROM get_user_tenant('5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01');

-- Deve retornar:
-- tenant_name: "Teste Gabriel"
-- tenant_status: "trial"
-- user_role: "owner"


