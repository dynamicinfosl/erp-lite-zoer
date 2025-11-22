# ❌ PROBLEMA IDENTIFICADO: Cliente Supabase não configurado

## O que está acontecendo?

O endpoint `/next_api/subscriptions` está retornando:
```
Cliente Supabase não configurado
```

Isso significa que as **variáveis de ambiente** não estão configuradas no **Vercel**.

## Variáveis que DEVEM estar configuradas

No **Vercel Dashboard**, vá em:
1. Seu projeto → Settings → Environment Variables

E adicione estas variáveis:

### NEXT_PUBLIC_SUPABASE_URL
```
https://lfxietcasaooenffdodr.supabase.co
```

### NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ
```

### SUPABASE_SERVICE_ROLE_KEY
**Esta é a chave crítica que está faltando!**
Você precisa pegar esta chave no seu projeto Supabase:
1. Acesse: https://supabase.com/dashboard/project/lfxietcasaooenffdodr/settings/api
2. Copie a **service_role key** (secret)
3. Cole no Vercel como `SUPABASE_SERVICE_ROLE_KEY`

## Como adicionar no Vercel

1. Acesse: https://vercel.com/[seu-usuario]/[seu-projeto]/settings/environment-variables
2. Clique em "Add New"
3. Adicione cada variável:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://lfxietcasaooenffdodr.supabase.co`
   - Environments: Marque **Production**, **Preview**, e **Development**
4. Repita para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **IMPORTANTE:** Adicione `SUPABASE_SERVICE_ROLE_KEY` (esta é a que está faltando!)
6. Clique em "Save"

## Após adicionar as variáveis

1. Faça um novo deploy ou vá em "Deployments"
2. Clique nos 3 pontinhos no último deploy
3. Clique em "Redeploy"
4. Aguarde o deploy completar

## Como verificar se funcionou

Após o redeploy, acesse:
```
https://www.jugasistemas.com.br/next_api/subscriptions/test
```

Se as variáveis estiverem corretas, você verá:
```json
{
  "success": true,
  "results": {
    "checks": {
      "env_vars": {
        "NEXT_PUBLIC_SUPABASE_URL": "✅ Configurado",
        "SUPABASE_SERVICE_ROLE_KEY": "✅ Configurado"
      },
      "connection": "✅ Conexão OK"
    }
  }
}
```

## Por que isso aconteceu?

As variáveis de ambiente existem no código local (`env.local.fixed`), mas não foram configuradas no Vercel (ambiente de produção). O Supabase precisa dessas variáveis para funcionar.

## Ainda com problemas?

Se após adicionar as variáveis e fazer redeploy ainda não funcionar:
1. Verifique se copiou as chaves corretas
2. Verifique se não há espaços em branco no início/fim das variáveis
3. Certifique-se de que marcou "Production" ao adicionar as variáveis
4. Aguarde alguns minutos após o redeploy

