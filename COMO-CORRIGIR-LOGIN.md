# 🔧 COMO CORRIGIR O ERRO DE LOGIN - SOLUÇÃO COMPLETA

## ❌ **Problema Identificado:**
O erro 401 (Unauthorized) acontece porque a `POSTGREST_SERVICE_ROLE` no arquivo `.env.local` está com uma chave inválida.

## ✅ **SOLUÇÃO PASSO A PASSO:**

### **1. OBTER A SERVICE ROLE KEY REAL:**

1. **Acesse:** https://supabase.com/dashboard
2. **Entre no seu projeto:** `lfxietcasaooenffdodr`
3. **Vá para:** Settings → API
4. **Procure por:** "Project API keys"
5. **Copie a chave:** `service_role` (NÃO a anon key)

### **2. ATUALIZAR O ARQUIVO .env.local:**

Substitua esta linha no arquivo `.env.local`:
```
POSTGREST_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.Zi62wfEY8ZF8eVHqD-sWuSw2WO5pPAYtKABt3XPaIWE
```

Por:
```
POSTGREST_SERVICE_ROLE=SUA_SERVICE_ROLE_KEY_REAL_AQUI
```

### **3. VERIFICAR SE O SQL FOI EXECUTADO:**

Execute este SQL no Supabase para verificar se as tabelas existem:
```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'sessions', 'refresh_tokens', 'user_passcode');

-- Verificar se o usuário admin foi criado
SELECT email, role FROM public.users WHERE email = 'admin@erplite.com';
```

### **4. SE AS TABELAS NÃO EXISTEM, EXECUTE ESTE SQL:**

```sql
-- CRIAR TABELAS NECESSÁRIAS
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'vendedor',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- INSERIR USUÁRIO ADMIN
INSERT INTO public.users (email, password, role) 
VALUES ('admin@erplite.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;

-- CONFIGURAR RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passcode ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS users_policy ON public.users FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS sessions_policy ON public.sessions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS refresh_tokens_policy ON public.refresh_tokens FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS user_passcode_policy ON public.user_passcode FOR ALL USING (true);
```

### **5. REINICIAR O SERVIDOR:**

```bash
# Parar o servidor (Ctrl+C no terminal)
# Depois executar:
npm run dev
```

### **6. TESTAR LOGIN:**
- **Email:** `admin@erplite.com`
- **Senha:** `123456`

## 🚨 **IMPORTANTE:**
A Service Role Key é SENSÍVEL e deve ser mantida em segredo. Ela bypassa todas as políticas RLS e deve ser usada apenas no servidor.

## ❓ **Se ainda não funcionar:**
1. Verifique se todas as variáveis estão corretas
2. Execute `npm run test-connection` para testar
3. Verifique os logs do servidor para erros específicos

