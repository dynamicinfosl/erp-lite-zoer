-- ============================================
-- SCRIPT DEFINITIVO PARA RESOLVER ERRO DE LOGIN
-- Cole este código no SQL Editor do Supabase
-- ============================================

-- 1. CRIAR TABELA USERS (PRINCIPAL PARA LOGIN)
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'vendedor',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CRIAR TABELA SESSIONS
CREATE TABLE IF NOT EXISTS public.sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id),
    ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CRIAR TABELA REFRESH_TOKENS  
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id),
    session_id BIGINT NOT NULL REFERENCES public.sessions(id),
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CRIAR TABELA USER_PASSCODE (PARA CÓDIGOS DE VERIFICAÇÃO)
CREATE TABLE IF NOT EXISTS public.user_passcode (
    id BIGSERIAL PRIMARY KEY,
    pass_object VARCHAR(255) NOT NULL,
    passcode VARCHAR(255) NOT NULL,
    revoked BOOLEAN DEFAULT false,
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. INSERIR USUÁRIO ADMIN PARA LOGIN
-- Senha hash para '123456': $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO public.users (email, password, role) 
VALUES ('admin@erplite.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 6. CONFIGURAR RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passcode ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR POLÍTICAS PERMISSIVAS PARA FUNCIONAMENTO
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

-- 8. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passcode_pass_object ON public.user_passcode(pass_object);

-- ============================================
-- CREDENCIAIS PARA LOGIN:
-- Email: admin@erplite.com
-- Senha: 123456
-- ============================================
-- 
-- DEPOIS DE EXECUTAR ESTE SQL:
-- 1. Acesse http://localhost:3000
-- 2. Tente fazer login com as credenciais acima
-- 3. Se ainda der erro, vá no Dashboard do Supabase:
--    Authentication > Settings > Disable "Enable email confirmations"
-- ============================================

