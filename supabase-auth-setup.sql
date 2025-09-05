-- ===========================================
-- CONFIGURAÇÃO DE AUTENTICAÇÃO DO SUPABASE
-- ===========================================

-- 1. Desabilitar confirmação de email para desenvolvimento
-- (Execute no SQL Editor do Supabase)

-- 2. Criar usuário admin diretamente
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  confirmed_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@erplite.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  '',
  now(),
  '',
  null,
  '',
  '',
  null,
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Administrador", "role": "admin"}',
  false,
  now(),
  now(),
  null,
  null,
  '',
  '',
  null,
  now(),
  '',
  0,
  null,
  '',
  null,
  false,
  null
) ON CONFLICT (email) DO NOTHING;

-- 3. Criar perfil para o admin
INSERT INTO user_profiles (user_id, name, role_type) 
SELECT id, 'Administrador', 'admin' 
FROM auth.users 
WHERE email = 'admin@erplite.com'
ON CONFLICT (user_id) DO NOTHING;

-- 4. Verificar se o usuário foi criado
SELECT 
  u.email,
  u.email_confirmed_at,
  p.name,
  p.role_type
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.email = 'admin@erplite.com';
