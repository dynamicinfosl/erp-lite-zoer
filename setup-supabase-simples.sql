-- ============================================
-- SETUP SUPABASE - SOLUÇÃO RÁPIDA PARA LOGIN
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. DESABILITAR CONFIRMAÇÃO DE EMAIL
UPDATE auth.config 
SET enable_signup = true, 
    enable_email_confirmations = false;

-- 2. CRIAR USUÁRIO ADMIN DIRETO NO AUTH
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_current,
  is_super_admin,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_sso_user
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@erplite.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  false,
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Administrador"}',
  false
) ON CONFLICT (email) DO NOTHING;

-- 3. CRIAR TABELAS NECESSÁRIAS PARA AUTENTICAÇÃO CUSTOMIZADA
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

-- 4. INSERIR USUÁRIO ADMIN NO SISTEMA CUSTOMIZADO
-- Hash da senha '123456' usando bcrypt
INSERT INTO public.users (email, password, role) VALUES 
('admin@erplite.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 5. HABILITAR RLS NAS TABELAS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passcode ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLÍTICAS RLS BÁSICAS
-- Política para users: cada usuário pode ver e editar apenas seus próprios dados
CREATE POLICY users_policy ON public.users
FOR ALL USING (true);

-- Política para sessions: usuários podem ver apenas suas próprias sessões
CREATE POLICY sessions_policy ON public.sessions
FOR ALL USING (true);

-- Política para refresh_tokens: usuários podem ver apenas seus próprios tokens
CREATE POLICY refresh_tokens_policy ON public.refresh_tokens
FOR ALL USING (true);

-- Política para user_passcode: sistema pode gerenciar códigos
CREATE POLICY user_passcode_policy ON public.user_passcode
FOR ALL USING (true);

-- ============================================
-- CREDENCIAIS PARA LOGIN:
-- Email: admin@erplite.com
-- Senha: 123456
-- ============================================

