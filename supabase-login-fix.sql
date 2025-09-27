-- SOLUÇÃO RÁPIDA PARA RESOLVER ERRO DE LOGIN
-- Copie e cole este código no SQL Editor do Supabase

-- NOTA: A configuração de email deve ser feita no Dashboard do Supabase
-- Vá para Authentication > Settings e desabilite "Enable email confirmations"

-- Criar usuário admin
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_sso_user
) VALUES (
  gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'admin@erplite.com',
  crypt('123456', gen_salt('bf')), now(), now(), now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Administrador"}', false
) ON CONFLICT (email) DO NOTHING;

-- Criar tabela users para sistema customizado
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'vendedor',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar outras tabelas necessárias
CREATE TABLE IF NOT EXISTS public.sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- Inserir admin no sistema
INSERT INTO public.users (email, password, role) VALUES 
('admin@erplite.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Configurar RLS básico
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passcode ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_policy ON public.users FOR ALL USING (true);
CREATE POLICY sessions_policy ON public.sessions FOR ALL USING (true);
CREATE POLICY refresh_tokens_policy ON public.refresh_tokens FOR ALL USING (true);
CREATE POLICY user_passcode_policy ON public.user_passcode FOR ALL USING (true);
