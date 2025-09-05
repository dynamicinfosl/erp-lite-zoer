# Configuração do Supabase para ERP Lite

## 1. Configurações de Autenticação

### No Dashboard do Supabase:

1. **Acesse:** https://supabase.com/dashboard
2. **Vá para:** Authentication → Settings
3. **Configure:**

#### Email Confirmation
- **Disable email confirmations** (para desenvolvimento)
- Ou configure um provedor de email (Resend, SendGrid, etc.)

#### Site URL
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** 
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/dashboard`

#### Auth Providers
- **Email:** Habilitado
- **Confirm email:** Desabilitado (para desenvolvimento)

## 2. Configurações de RLS (Row Level Security)

### Execute este SQL no SQL Editor:

```sql
-- Desabilitar confirmação de email para desenvolvimento
UPDATE auth.config 
SET enable_signup = true, 
    enable_email_confirmations = false;

-- Ou criar usuário admin diretamente
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@erplite.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Criar perfil para o admin
INSERT INTO user_profiles (user_id, name, role_type) 
SELECT id, 'Administrador', 'admin' 
FROM auth.users 
WHERE email = 'admin@erplite.com';
```

## 3. Configurações de Desenvolvimento

### No arquivo .env.local:
```env
NEXT_PUBLIC_ENABLE_AUTH=true
NEXT_PUBLIC_SUPABASE_URL=https://lfxietcasaooenffdodr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Teste de Login

### Credenciais padrão:
- **Email:** admin@erplite.com
- **Senha:** 123456

## 5. Solução Rápida

Se quiser pular a confirmação de email:

1. **Authentication → Settings**
2. **Disable "Enable email confirmations"**
3. **Save changes**
4. **Teste o login novamente**
