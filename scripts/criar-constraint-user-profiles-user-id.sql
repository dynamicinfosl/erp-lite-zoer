-- Criar constraint UNIQUE em user_id para permitir ON CONFLICT
-- Execute este script ANTES de executar corrigir-usuarios-sem-perfil.sql

-- Verificar se já existe constraint
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'public.user_profiles'::regclass
AND conname LIKE '%user_id%';

-- Criar constraint UNIQUE se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.user_profiles'::regclass 
        AND conname = 'user_profiles_user_id_key'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
        RAISE NOTICE 'Constraint UNIQUE criada em user_id';
    ELSE
        RAISE NOTICE 'Constraint UNIQUE já existe em user_id';
    END IF;
END $$;
