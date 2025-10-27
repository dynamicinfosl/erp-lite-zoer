# Teste de Login após Registro

## Problema Identificado

Após criar uma conta através do botão "Começar Grátis" na página inicial, alguns usuários estão recebendo o erro "Invalid login credentials" ao tentar fazer login.

## Causas Possíveis

1. **Senha com caracteres especiais**: O Supabase pode ter problemas com certos caracteres especiais na senha
2. **Delay na criação**: Pode haver um pequeno delay entre a criação do usuário e a possibilidade de fazer login
3. **Cache do navegador**: Credenciais antigas podem estar em cache
4. **Erro de digitação**: Email ou senha digitados incorretamente

## Solução Implementada

Adicionamos logs detalhados em:
- `src/contexts/SimpleAuthContext-Fixed.tsx` - função `signIn`
- `src/app/next_api/register-complete/route.ts` - criação de usuário
- `src/components/auth/LoginForm.tsx` - mensagens de erro mais claras

## Como Testar

### 1. Limpar Cache do Navegador
```bash
# No Chrome/Edge
Ctrl + Shift + Delete
# Ou navegue para DevTools > Application > Clear Storage > Clear site data
```

### 2. Criar Novo Usuário
1. Acesse `http://localhost:3000`
2. Clique em "Começar Grátis"
3. Preencha todos os dados do formulário
4. **Anote o email e senha exatos que você digitou**
5. Finalize o cadastro

### 3. Verificar Logs do Servidor
Observe no terminal do servidor (npm run dev) se aparecem estas mensagens:
```
🚀 Iniciando cadastro completo...
👤 Criando usuário no Supabase Auth...
📧 Email: seu@email.com
✅ Usuário criado com sucesso!
👤 User ID: ...
```

### 4. Tentar Login
1. Você será redirecionado para `/login`
2. Digite o **mesmo email e senha** do cadastro
3. Clique em "Entrar"

### 5. Verificar Logs de Login
No terminal, você deve ver:
```
🔐 Iniciando login para: seu@email.com
✅ Login bem-sucedido!
```

## Como Debugar

### Ver logs no console do navegador
1. Abra DevTools (F12)
2. Vá para a aba Console
3. Procure por mensagens com emojis (🔐, ✅, ❌)

### Verificar usuário no Supabase
1. Acesse o Supabase Dashboard
2. Vá para Authentication > Users
3. Procure pelo email cadastrado
4. Verifique se o usuário foi criado corretamente

### Testar login manualmente
Use a API do Supabase diretamente:

```javascript
// No console do navegador (ajuste as variáveis)
const email = 'seu@email.com';
const password = 'sua_senha';

const response = await fetch('https://lfxietcasaooenffdodr.supabase.co/auth/v1/token?grant_type=password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ'
  },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
console.log(data);
```

## Dicas Importantes

1. **Use senhas simples para teste**: Evite caracteres especiais complexos inicialmente
2. **Copie e cole as credenciais**: Para evitar erros de digitação
3. **Aguarde alguns segundos**: Após o cadastro, aguarde 2-3 segundos antes de fazer login
4. **Verifique o email**: Certifique-se de que o email foi digitado corretamente (sem espaços extras)

## Próximos Passos

Se o problema persistir após seguir estas instruções:
1. Capture os logs completos do terminal
2. Capture os logs do console do navegador
3. Anote o email e horário exato do teste
4. Verifique se o usuário foi criado no Supabase Dashboard

