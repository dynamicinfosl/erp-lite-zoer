-- Script para verificar a constraint user_memberships_role_check
-- Execute este script no SQL Editor do Supabase para ver quais valores são permitidos

-- 1. Verificar a definição da constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'user_memberships_role_check'
AND conrelid = 'public.user_memberships'::regclass;

-- 2. Verificar a estrutura da tabela
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_memberships'
AND column_name = 'role';

-- 3. Verificar valores atuais na tabela
SELECT DISTINCT role, COUNT(*) as count
FROM public.user_memberships
GROUP BY role
ORDER BY role;
