-- =============================================
-- CORRIGIR PERMISSÕES RLS PARA USER_MEMBERSHIPS
-- Execute no SQL Editor do Supabase
-- =============================================

-- Desabilitar RLS temporariamente para user_memberships
ALTER TABLE public.user_memberships DISABLE ROW LEVEL SECURITY;

-- Ou criar política que permite usuário ver seu próprio membership
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own memberships" ON public.user_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.user_memberships;

-- Criar política simples
CREATE POLICY "Users can view own memberships" ON public.user_memberships
    FOR SELECT
    USING (user_id = auth.uid());

-- Verificar se funcionou
SELECT 
    um.user_id,
    um.role,
    u.email,
    t.name as tenant_name
FROM public.user_memberships um
JOIN auth.users u ON u.id = um.user_id  
JOIN public.tenants t ON t.id = um.tenant_id
WHERE u.email = 'gabrieldesouza100@gmail.com';


