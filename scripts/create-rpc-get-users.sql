-- =============================================
-- FUNÇÃO RPC PARA BUSCAR TODOS OS USUÁRIOS DO SISTEMA
-- Execute no SQL Editor do Supabase
-- =============================================

CREATE OR REPLACE FUNCTION get_all_system_users()
RETURNS TABLE (
    id TEXT,
    name TEXT,
    email TEXT,
    role TEXT,
    status TEXT,
    "lastLogin" TEXT,
    "createdAt" TEXT,
    phone TEXT,
    department TEXT,
    permissions TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        um.user_id::TEXT,
        CAST(COALESCE(t.name, 'Usuário') AS TEXT),
        CAST(COALESCE(t.email, u.email, 'Email não disponível') AS TEXT),
        CAST(um.role AS TEXT),
        CAST(
            CASE 
                WHEN um.is_active AND (t.status = 'active' OR t.status = 'trial') THEN 'active'
                ELSE 'inactive'
            END AS TEXT
        ),
        CAST(COALESCE(u.last_sign_in_at, u.created_at) AS TEXT),
        CAST(u.created_at AS TEXT),
        CAST(COALESCE(u.raw_user_meta_data->>'phone', '') AS TEXT),
        CAST(COALESCE(t.slug, 'N/A') AS TEXT),
        ARRAY[]::TEXT[]
    FROM public.user_memberships um
    JOIN auth.users u ON u.id = um.user_id
    LEFT JOIN public.tenants t ON t.id = um.tenant_id
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Testar a função
SELECT * FROM get_all_system_users();

