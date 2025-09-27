-- ============================================
-- SOLUÇÃO FINAL PARA RESOLVER ERRO DE LOGIN
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. CRIAR TABELAS NECESSÁRIAS PARA O SISTEMA
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'vendedor',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.user_passcode (
    id BIGSERIAL PRIMARY KEY,
    pass_object VARCHAR(255) NOT NULL,
    passcode VARCHAR(255) NOT NULL,
    revoked BOOLEAN DEFAULT false,
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. INSERIR USUÁRIO ADMIN (senha: 123456)
INSERT INTO public.users (email, password, role) VALUES 
('admin@erplite.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 3. CONFIGURAR RLS (SEGURANÇA)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passcode ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para funcionamento
CREATE POLICY IF NOT EXISTS users_policy ON public.users FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS sessions_policy ON public.sessions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS refresh_tokens_policy ON public.refresh_tokens FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS user_passcode_policy ON public.user_passcode FOR ALL USING (true);

-- ============================================
-- APÓS EXECUTAR ESTE SQL:
-- 1. Vá para Authentication > Settings no Dashboard
-- 2. Desabilite "Enable email confirmations"
-- 3. Salve as alterações
-- 4. Use as credenciais:
--    Email: admin@erplite.com
--    Senha: 123456
-- ============================================

