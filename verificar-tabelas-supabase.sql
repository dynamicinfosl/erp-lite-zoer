-- ============================================
-- VERIFICAR SE AS TABELAS EXISTEM NO SUPABASE
-- Execute este SQL primeiro no Supabase SQL Editor
-- ============================================

-- 1. VERIFICAR QUAIS TABELAS EXISTEM
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'sessions', 'refresh_tokens', 'user_passcode');

-- 2. SE NÃO APARECER NENHUMA TABELA, EXECUTE ESTE SCRIPT:

-- Criar tabela users
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'vendedor',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela refresh_tokens
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela user_passcode
CREATE TABLE IF NOT EXISTS public.user_passcode (
    id BIGSERIAL PRIMARY KEY,
    pass_object VARCHAR(255) NOT NULL,
    passcode VARCHAR(255) NOT NULL,
    revoked BOOLEAN DEFAULT false,
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. INSERIR USUÁRIO ADMIN PARA TESTE
INSERT INTO public.users (email, password, role) 
VALUES ('admin@erplite.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 4. CONFIGURAR RLS (IMPORTANTE!)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passcode ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS PERMISSIVAS (TEMPORÁRIAS)
DROP POLICY IF EXISTS "users_access_policy" ON public.users;
CREATE POLICY "users_access_policy" ON public.users
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "sessions_access_policy" ON public.sessions;
CREATE POLICY "sessions_access_policy" ON public.sessions
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "refresh_tokens_access_policy" ON public.refresh_tokens;
CREATE POLICY "refresh_tokens_access_policy" ON public.refresh_tokens
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "user_passcode_access_policy" ON public.user_passcode;
CREATE POLICY "user_passcode_access_policy" ON public.user_passcode
    FOR ALL USING (true) WITH CHECK (true);

-- 6. VERIFICAR SE O USUÁRIO FOI CRIADO
SELECT id, email, role FROM public.users WHERE email = 'admin@erplite.com';

-- ============================================
-- APÓS EXECUTAR, TESTE:
-- Email: admin@erplite.com
-- Senha: 123456
-- ============================================

