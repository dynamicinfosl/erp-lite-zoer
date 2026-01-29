# 🔧 Solução: Coluna user_id faltando em cash_sessions

## ❌ Erro identificado

```
Could not find the 'user_id' column of 'cash_sessions' in the schema cache
```

## 📋 Causa

A coluna `user_id` não existe na tabela `cash_sessions` no banco de dados Supabase, mas o código está tentando usá-la.

## ✅ Solução

Execute o script SQL para adicionar a coluna:

### Passo 1: Abra o Supabase SQL Editor

1. Acesse seu projeto no Supabase
2. Vá em **SQL Editor** (no menu lateral)

### Passo 2: Execute o script

Copie e execute o conteúdo do arquivo:
```
scripts/adicionar-coluna-user-id-cash-sessions.sql
```

### Passo 3: Verifique o resultado

O script deve retornar:
```
✅ Coluna user_id adicionada com sucesso!
```

Ou:
```
⚠️ Coluna user_id já existe
```

### Passo 4: Teste o fechamento do caixa

1. Recarregue a página do PDV (F5)
2. Tente fechar o caixa novamente
3. Deve funcionar sem erros

## 📊 O que a coluna faz

- **Nome:** `user_id`
- **Tipo:** UUID
- **Obrigatório:** Não (NULL permitido)
- **Propósito:** Armazena o ID do usuário que abriu/fechou a sessão de caixa

## 🔍 Por que isso aconteceu?

O arquivo `scripts/create-cash-sessions-table.sql` já tinha a definição da coluna `user_id`, mas quando a tabela foi criada no Supabase, essa coluna pode ter sido omitida ou removida posteriormente.

## ⚠️ Importante

Depois de adicionar a coluna, o sistema poderá:
- Rastrear qual usuário abriu cada sessão de caixa
- Rastrear qual usuário fechou cada sessão de caixa
- Gerar relatórios por operador

---

**Data:** 29/01/2026  
**Versão:** 1.0


