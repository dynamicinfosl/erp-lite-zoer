# Sistema de Permissões para Operadores

## 📋 O que foi criado:

1. **Tabela `user_permissions`** - Armazena permissões específicas de cada usuário
2. **API `/next_api/user-permissions`** - Gerencia permissões (GET, POST, PUT)
3. **Componente `UserPermissionsEditor`** - Interface para configurar permissões
4. **Biblioteca `src/lib/permissions.ts`** - Funções helper para verificar permissões
5. **Integração na página de usuários** - Botão "Permissões" para operadores

## 🚀 Como usar:

### 1. Execute o script SQL no Supabase:

```sql
-- Execute o arquivo: scripts/create-user-permissions-table.sql
```

### 2. Criar um usuário Operador:

1. Vá em **Configurações → Usuários**
2. Clique em **"Novo Usuário"**
3. Preencha os dados e selecione **"Operador"** no perfil
4. Clique em **"Criar"**

### 3. Configurar permissões do Operador:

1. Na lista de usuários, encontre o operador criado
2. Clique no botão **"Permissões"** (ícone de engrenagem)
3. Configure as permissões desejadas:
   - ✅ **Cancelar vendas** - Desmarque para impedir cancelamentos
   - ✅ **Visualizar financeiro** - Marque para permitir acesso ao módulo financeiro
   - ✅ **Gerenciar reforços/sangrias** - Marque para permitir operações de caixa
   - E outras permissões conforme necessário
4. Clique em **"Salvar Permissões"**

## 🔒 Permissões disponíveis:

### Vendas
- Visualizar vendas
- Criar vendas
- Editar vendas
- **Cancelar vendas** ⚠️
- Ver relatórios de vendas

### Financeiro
- Visualizar financeiro
- Editar financeiro
- Ver relatórios financeiros
- Gerenciar pagamentos

### Produtos
- Visualizar produtos
- Criar produtos
- Editar produtos
- Excluir produtos

### Clientes
- Visualizar clientes
- Criar clientes
- Editar clientes
- Excluir clientes

### Caixa
- Abrir caixa
- Fechar caixa
- Ver histórico de caixas
- Gerenciar reforços/sangrias

### Configurações
- Visualizar configurações
- Editar configurações
- Gerenciar usuários

### Relatórios
- Visualizar relatórios
- Exportar relatórios

## 💡 Como usar permissões no código:

```typescript
import { checkPermission } from '@/lib/permissions';

// Verificar se usuário pode cancelar vendas
const canCancel = await checkPermission(userId, tenantId, 'can_cancel_sales');
if (!canCancel) {
  toast.error('Você não tem permissão para cancelar vendas');
  return;
}

// Verificar se usuário pode acessar financeiro
const canViewFinancial = await checkPermission(userId, tenantId, 'can_view_financial');
if (!canViewFinancial) {
  // Redirecionar ou ocultar menu
  return;
}
```

## ⚠️ Importante:

- **Admins e Owners** têm **todas as permissões** automaticamente
- **Operadores** precisam ter permissões configuradas explicitamente
- Se um operador não tiver permissões configuradas, usa-se os **padrões restritivos**
- Permissões são **por tenant** (multi-tenant)

## 🔧 Próximos passos (opcional):

1. Adicionar verificações de permissão nas rotas de API
2. Criar componentes de proteção (`<RequirePermission>`)
3. Ocultar menus/funcionalidades baseado em permissões
4. Adicionar logs de auditoria para ações sensíveis
