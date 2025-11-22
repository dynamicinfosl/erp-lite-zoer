# Scripts de Diagnóstico e Correção - Planos e Subscriptions

## Problemas Identificados

1. **Select de planos não carrega** - Mostra apenas "Carregando planos..."
2. **Cliente ainda aparece como expirado** - Mesmo após ativar o plano

## Ordem de Execução dos Scripts

### 1. DIAGNÓSTICO INICIAL
Execute primeiro: `diagnostico-planos-subscriptions.sql`

Este script vai mostrar:
- Se existem planos na tabela `plans`
- Status de RLS (Row Level Security) nas tabelas
- Todas as subscriptions e seus status
- Tenants sem subscription

**Como executar:**
1. Abra o Supabase Dashboard
2. Vá em SQL Editor
3. Cole o conteúdo do arquivo `diagnostico-planos-subscriptions.sql`
4. Execute e analise os resultados

### 2. CRIAR PLANOS (SE NECESSÁRIO)
Se o diagnóstico mostrar que não há planos, execute: `criar-planos-basicos.sql`

Este script cria 3 planos básicos:
- Plano Básico (R$ 29,90/mês)
- Plano Profissional (R$ 79,90/mês)
- Plano Enterprise (R$ 199,90/mês)

### 3. CORRIGIR SUBSCRIPTION DE UM TENANT ESPECÍFICO
Execute: `corrigir-subscription-ativa.sql`

**IMPORTANTE:** Antes de executar, você precisa:
1. Identificar o `tenant_id` do cliente que está com problema
2. Identificar o `plan_id` do plano que deseja ativar
3. Definir a data de expiração desejada

**Como encontrar o tenant_id:**
- No painel admin, ao abrir o modal do usuário, veja o ID do tenant
- Ou execute no SQL Editor:
```sql
SELECT id, name, email FROM tenants WHERE email = 'email_do_cliente@exemplo.com';
```

**Como encontrar o plan_id:**
- Execute no SQL Editor:
```sql
SELECT id, name, slug FROM plans WHERE is_active = true;
```

**Exemplo de uso:**
```sql
-- Substitua os valores abaixo:
UPDATE subscriptions
SET 
  status = 'active',
  current_period_start = NOW(),
  current_period_end = '2025-12-31T23:59:59'::timestamp,
  trial_end = NULL,
  trial_ends_at = NULL,
  updated_at = NOW()
WHERE tenant_id = '123e4567-e89b-12d3-a456-426614174000'; -- ID do tenant
```

### 4. CRIAR SUBSCRIPTION (SE O TENANT NÃO TIVER)
Se o tenant não tiver subscription, execute: `criar-subscription-para-tenant.sql`

### 5. DESABILITAR RLS TEMPORARIAMENTE (APENAS PARA TESTE)
Se suspeitar que RLS está bloqueando, execute: `desabilitar-rls-temporariamente.sql`

**ATENÇÃO:** 
- Use apenas para diagnóstico
- Reabilite o RLS após verificar o problema
- Descomente as linhas no final do script para reabilitar

## Verificações Adicionais

### Verificar se a API está funcionando
Após executar os scripts, teste a API diretamente:
```
GET https://seu-dominio.com/next_api/plans
```

Deve retornar:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Plano Básico",
      "slug": "basic",
      ...
    }
  ]
}
```

### Verificar logs do servidor
Os logs agora incluem informações detalhadas:
- `📋 GET /next_api/plans - Iniciando busca de planos...`
- `✅ Planos encontrados: X`
- `⚠️ Nenhum plano ativo encontrado!`

## Problemas Comuns

### 1. "Nenhum plano encontrado"
**Causa:** Tabela `plans` está vazia ou todos os planos estão com `is_active = false`
**Solução:** Execute `criar-planos-basicos.sql`

### 2. "Erro ao listar planos: permission denied"
**Causa:** RLS está bloqueando a leitura
**Solução:** 
- Verifique as políticas RLS com o script de diagnóstico
- Temporariamente desabilite RLS para teste (não deixe desabilitado em produção!)

### 3. "Subscription não encontrada"
**Causa:** Tenant não tem subscription criada
**Solução:** Execute `criar-subscription-para-tenant.sql`

### 4. "Subscription está como 'trial' mas deveria ser 'active'"
**Causa:** Status não foi atualizado corretamente
**Solução:** Execute `corrigir-subscription-ativa.sql`

## Próximos Passos Após Executar Scripts

1. Recarregue a página do admin
2. Abra o modal de gerenciar usuários
3. Verifique se os planos aparecem no select
4. Ative um plano para um cliente
5. Peça ao cliente para fazer logout/login
6. Verifique se o cliente consegue usar as funções

