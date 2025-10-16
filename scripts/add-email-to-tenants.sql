-- ============================================
-- SCRIPT: Adicionar Email na Tabela Tenants
-- ============================================
-- Este script adiciona a coluna 'email' na tabela 'tenants' e 
-- preenche com o email do usuário correspondente do auth.users

-- IMPORTANTE: Execute este script no Supabase SQL Editor

-- ============================================
-- 1. ADICIONAR COLUNA EMAIL (se não existir)
-- ============================================

-- Adicionar coluna email se ela não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' 
        AND column_name = 'email'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE tenants ADD COLUMN email VARCHAR(255);
        RAISE NOTICE 'Coluna email adicionada à tabela tenants';
    ELSE
        RAISE NOTICE 'Coluna email já existe na tabela tenants';
    END IF;
END $$;

-- ============================================
-- 2. ATUALIZAR EMAILS DOS TENANTS EXISTENTES
-- ============================================

-- Atualizar emails baseado no id (tenant_id) correspondente ao user_id do auth.users
UPDATE tenants 
SET email = au.email
FROM auth.users au
WHERE tenants.id::text = au.id::text
  AND au.email IS NOT NULL;

-- ============================================
-- 3. VERIFICAR RESULTADOS
-- ============================================

-- Mostrar todos os tenants com seus emails
SELECT 
    id,
    email,
    trial_ends_at,
    created_at
FROM tenants 
ORDER BY created_at DESC;

-- Contar quantos tenants têm email preenchido
SELECT 
    COUNT(*) as total_tenants,
    COUNT(email) as tenants_com_email,
    COUNT(*) - COUNT(email) as tenants_sem_email
FROM tenants;

-- ============================================
-- 4. MENSAGEM DE SUCESSO
-- ============================================

SELECT '✅ Emails adicionados/atualizados na tabela tenants com sucesso!' as resultado;
