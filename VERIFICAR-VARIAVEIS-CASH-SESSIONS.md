# 🔍 Verificação de Variáveis de Ambiente - Cash Sessions

## Problema

O sistema está retornando erro 500 ao tentar fechar o caixa. Isso pode estar relacionado às variáveis de ambiente do Supabase não estarem configuradas corretamente.

## Como Verificar

### 1. Acesse o Endpoint de Teste

Acesse no navegador ou via curl:

```
http://localhost:3000/next_api/cash-sessions/test
```

Ou em produção:

```
https://seu-dominio.com/next_api/cash-sessions/test
```

### 2. Verifique a Resposta

A resposta deve mostrar:

```json
{
  "success": true,
  "results": {
    "checks": {
      "env_vars": {
        "NEXT_PUBLIC_SUPABASE_URL": "✅ Configurado",
        "SUPABASE_SERVICE_ROLE_KEY": "✅ Configurado",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "✅ Configurado"
      },
      "connection": "✅ Conexão OK",
      "table_accessible": "✅ Tabela acessível"
    }
  }
}
```

### 3. Se Alguma Variável Estiver ❌

#### Variáveis Necessárias

As seguintes variáveis devem estar configuradas:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - URL do seu projeto Supabase
   - Exemplo: `https://lfxietcasaooenffdodr.supabase.co`

2. **SUPABASE_SERVICE_ROLE_KEY** (RECOMENDADO)
   - Chave de serviço do Supabase (tem permissões completas)
   - Obtenha em: Supabase Dashboard → Settings → API → Service Role Key

3. **NEXT_PUBLIC_SUPABASE_ANON_KEY** (FALLBACK)
   - Chave anônima do Supabase (usada se SERVICE_ROLE_KEY não estiver configurada)
   - Obtenha em: Supabase Dashboard → Settings → API → Anon Key

### 4. Como Configurar

#### Desenvolvimento Local

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Importante:** Reinicie o servidor de desenvolvimento após adicionar as variáveis:

```bash
npm run dev
```

#### Produção (Vercel)

1. Acesse: https://vercel.com/[seu-usuario]/[seu-projeto]/settings/environment-variables
2. Clique em "Add New"
3. Adicione cada variável:
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** `https://seu-projeto.supabase.co`
   - **Environments:** Marque Production, Preview e Development
4. Repita para `SUPABASE_SERVICE_ROLE_KEY` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clique em "Save"
6. **Faça um novo deploy** para aplicar as mudanças

### 5. Verificar se a Tabela Existe

O endpoint de teste também verifica se a tabela `cash_sessions` existe e se todas as colunas necessárias estão presentes.

Se houver erro relacionado a colunas faltantes, execute o script SQL:

```sql
-- Execute no Supabase SQL Editor
-- Ver scripts/add-missing-cash-sessions-columns-only.sql
```

### 6. Problemas Comuns

#### Erro: "Nenhuma chave do Supabase configurada"
- **Solução:** Configure pelo menos `SUPABASE_SERVICE_ROLE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Erro: "Tabela não encontrada"
- **Solução:** Execute o script de criação da tabela `cash_sessions`

#### Erro: "Coluna não existe"
- **Solução:** Execute o script `add-missing-cash-sessions-columns-only.sql`

#### Erro: "Permission denied"
- **Solução:** Verifique se está usando `SUPABASE_SERVICE_ROLE_KEY` (não a anon key) para operações de escrita

### 7. Logs do Servidor

Verifique os logs do servidor para mais detalhes:

```bash
# Desenvolvimento
npm run dev

# Produção (Vercel)
# Verifique os logs no dashboard da Vercel
```

Os logs devem mostrar:
- ✅ Se as variáveis estão configuradas
- ⚠️ Se está usando valores fallback
- ❌ Erros específicos do Supabase

## Próximos Passos

Após verificar e configurar as variáveis:

1. Acesse o endpoint de teste novamente
2. Verifique se todos os checks estão ✅
3. Tente fechar o caixa novamente
4. Se ainda houver erro, verifique os logs do servidor para detalhes específicos



