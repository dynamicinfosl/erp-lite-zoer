# Guia: Correção de Ordens de Serviço

## Problemas Identificados e Resolvidos

### ✅ Problema 1: Ordens de Serviço não eram salvas
**Causa**: A tabela `orders` não existia no banco de dados Supabase  
**Solução**: Criado script SQL para criar a tabela completa com RLS e índices

### ✅ Problema 2: Preferências de colunas não eram salvas
**Causa**: Estado não era persistido no localStorage  
**Solução**: Implementado sistema de persistência automática das preferências de colunas

### ✅ Problema 3: Bug na API ao salvar user_id
**Causa**: A API estava convertendo UUID para inteiro  
**Solução**: Corrigido para manter user_id como UUID

---

## 🚀 Como Aplicar a Correção

### Passo 1: Executar Script SQL no Supabase

1. Acesse o **Supabase Dashboard** do seu projeto
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **New Query**
4. Copie e cole o conteúdo do arquivo `scripts/setup-orders-final.sql`
5. Clique em **Run** para executar

O script irá:
- ✅ Criar a tabela `orders` com todos os campos necessários
- ✅ Criar índices para performance
- ✅ Configurar políticas RLS (Row Level Security)
- ✅ Criar triggers para atualização automática de timestamps

### Passo 2: Verificar se funcionou

Execute esta query no SQL Editor:
```sql
SELECT * FROM public.orders LIMIT 5;
```

Se não houver erro, a tabela foi criada com sucesso!

---

## 📋 O que foi alterado

### Arquivos Modificados:

#### 1. `src/app/next_api/orders/route.ts`
- ✅ Corrigido bug ao salvar `user_id` (mantido como UUID)
- ✅ Adicionado campo `data_abertura` ao criar ordem
- ✅ Removida validação desnecessária que comparava UUID com inteiro

#### 2. `src/app/ordem-servicos/page.tsx`
- ✅ Adicionado `getStoredColumnVisibility()` - Recupera preferências salvas
- ✅ Adicionado `setStoredColumnVisibility()` - Salva preferências automaticamente
- ✅ Modificado `setColumnVisibility` para persistir mudanças no localStorage

#### 3. `scripts/setup-orders-final.sql` (NOVO)
- ✅ Script completo para criar tabela `orders`
- ✅ Políticas RLS configuradas para multi-tenancy
- ✅ Índices otimizados para queries
- ✅ Triggers para atualização de timestamps

---

## 🎯 Funcionalidades Agora Disponíveis

### ✨ Ordens de Serviço Persistentes
- ✅ Criar nova ordem de serviço
- ✅ Editar ordem existente
- ✅ Excluir ordem (exceto concluídas)
- ✅ Dados salvos no banco Supabase
- ✅ Persistência automática após atualizar página

### ✨ Preferências de Colunas
- ✅ Marcar/desmarcar colunas visíveis
- ✅ Preferências salvas automaticamente
- ✅ Mantém configuração após atualizar página
- ✅ Preferências isoladas por tenant

---

## 🔍 Como Testar

### Teste 1: Criar Ordem de Serviço
1. Acesse a página de **Ordens de Serviço**
2. Clique em **Nova Ordem**
3. Preencha os campos obrigatórios
4. Clique em **Criar Ordem de Serviço**
5. **Atualize a página (F5)**
6. ✅ A ordem deve aparecer na lista

### Teste 2: Preferências de Colunas
1. Clique no botão **Colunas** (Settings2 icon)
2. Desmarque **Status** e **Prioridade**
3. Observe que as colunas desaparecem
4. **Atualize a página (F5)**
5. ✅ As colunas devem continuar ocultas

### Teste 3: Editar Ordem
1. Clique nos 3 pontos de uma ordem
2. Selecione **Editar**
3. Modifique algum campo
4. Salve
5. **Atualize a página (F5)**
6. ✅ As mudanças devem persistir

---

## 🔒 Segurança (RLS)

A tabela `orders` possui políticas de segurança que garantem:
- ✅ Usuários só veem ordens do seu tenant
- ✅ Usuários só podem criar ordens no seu tenant
- ✅ Usuários só podem editar ordens do seu tenant
- ✅ Ordens concluídas não podem ser deletadas
- ✅ Isolamento completo entre tenants

---

## 📊 Estrutura da Tabela Orders

```sql
CREATE TABLE public.orders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    numero VARCHAR(50) NOT NULL,
    cliente VARCHAR(200) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    prioridade VARCHAR(20) DEFAULT 'media',
    status VARCHAR(20) DEFAULT 'aberta',
    tecnico VARCHAR(100),
    valor_estimado DECIMAL(10,2) DEFAULT 0,
    valor_final DECIMAL(10,2),
    data_prazo TIMESTAMP WITH TIME ZONE,
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚠️ Observações Importantes

1. **Backup**: Se já existir uma tabela `orders` com dados, faça backup antes
2. **Permissões**: Certifique-se de estar logado no Supabase com permissões de admin
3. **Tenant**: As ordens são isoladas por tenant_id automaticamente
4. **localStorage**: As preferências são salvas localmente no navegador

---

## 🐛 Troubleshooting

### Erro: "relation orders does not exist"
**Solução**: Execute o script SQL no Supabase

### Ordens não aparecem após criar
**Solução**: Verifique se o tenant_id está correto e se o RLS está configurado

### Preferências não salvam
**Solução**: Verifique se o localStorage está habilitado no navegador

### Erro ao criar ordem: "user_id must be UUID"
**Solução**: Já foi corrigido no código. Certifique-se de usar a versão atualizada

---

## ✅ Checklist Final

- [ ] Script SQL executado no Supabase
- [ ] Tabela `orders` criada com sucesso
- [ ] Criação de ordem funciona
- [ ] Ordens persistem após F5
- [ ] Edição de ordens funciona
- [ ] Preferências de colunas persistem após F5
- [ ] RLS configurado corretamente

---

**Data**: 2025-10-08  
**Status**: ✅ Correções Implementadas  
**Próximo Passo**: Executar script SQL no Supabase
