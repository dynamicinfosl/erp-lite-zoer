# Como Funciona: Operador vs Admin

## 📋 Resumo

O sistema diferencia **Operadores** de **Admins** usando múltiplas tabelas:

### 1. `user_memberships` (Constraint: só aceita 'owner' ou 'admin')
- **Todos os usuários** (Admin e Operador) são inseridos como `'admin'` nesta tabela
- Apenas **Owners** têm `role: 'owner'`
- **Por quê?** A constraint do banco só aceita esses dois valores

### 2. `user_profiles.role_type` (Valores: 'admin', 'vendedor', 'financeiro', 'entregador')
- **Admin**: `role_type: 'admin'`
- **Operador**: `role_type: 'vendedor'` (quando `role: 'member'` vem do frontend)
- **Aqui é onde você diferencia Admin de Operador!**

### 3. `user_branch_memberships.role` (Valores: 'operator', 'manager', 'admin')
- Usado para controle de permissões por filial
- Operadores têm `role: 'operator'` aqui

---

## 🔧 Como Criar Limitações para Operadores

### Opção 1: Verificar `user_profiles.role_type`
```typescript
// Verificar se é operador
const isOperator = userProfile?.role_type === 'vendedor';

if (isOperator) {
  // Aplicar limitações
  // Ex: não pode criar outros usuários, não pode ver configurações avançadas, etc.
}
```

### Opção 2: Criar função helper
```typescript
async function getUserRoleType(userId: string): Promise<'admin' | 'vendedor' | 'financeiro' | 'entregador' | null> {
  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('role_type')
    .eq('user_id', userId)
    .single();
  
  return data?.role_type || null;
}

// Usar:
const roleType = await getUserRoleType(user.id);
const isOperator = roleType === 'vendedor';
```

---

## ✅ O que foi corrigido:

1. **POST (criar usuário)**:
   - `role: 'member'` (Operador) → `user_profiles.role_type: 'vendedor'`
   - `role: 'admin'` → `user_profiles.role_type: 'admin'`
   - Ambos → `user_memberships.role: 'admin'` (exceto owners)

2. **PUT (atualizar usuário)**:
   - Atualiza `user_profiles.role_type` quando o perfil é alterado
   - Mantém `user_memberships.role` como 'admin' ou 'owner'

---

## 🎯 Próximos Passos (se necessário):

1. **Criar componentes de proteção**:
   - `<OperatorProtection>` - só permite operadores
   - `<AdminOnly>` - só permite admins

2. **Adicionar verificações em rotas API**:
   - Verificar `user_profiles.role_type` antes de permitir ações administrativas

3. **Criar políticas RLS** (se necessário):
   - Operadores só veem seus próprios dados
   - Admins veem tudo do tenant
