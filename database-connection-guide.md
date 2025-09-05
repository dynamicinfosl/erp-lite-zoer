# Guia de Conexão Direta com PostgreSQL

## 🔗 String de Conexão
```
postgresql://postgres:[97872715Ga!]@db.lfxietcasaooenffdodr.supabase.co:5432/postgres
```

## 🛠️ Ferramentas Recomendadas

### 1. **pgAdmin** (Gratuito)
- **Download:** https://www.pgadmin.org/download/
- **Configuração:**
  - Host: `db.lfxietcasaooenffdodr.supabase.co`
  - Port: `5432`
  - Database: `postgres`
  - Username: `postgres`
  - Password: `[97872715Ga!]`
  - SSL Mode: `Require`

### 2. **DBeaver** (Gratuito)
- **Download:** https://dbeaver.io/download/
- **Configuração:**
  - Database: PostgreSQL
  - Host: `db.lfxietcasaooenffdodr.supabase.co`
  - Port: `5432`
  - Database: `postgres`
  - Username: `postgres`
  - Password: `[97872715Ga!]`
  - SSL: Habilitado

### 3. **TablePlus** (Pago, mas tem trial)
- **Download:** https://tableplus.com/
- **Configuração:** Similar ao DBeaver

## 📊 O que você pode fazer com a conexão direta:

### ✅ **Vantagens:**
1. **Visualizar dados** em tempo real
2. **Executar SQL** diretamente
3. **Gerenciar usuários** na tabela `auth.users`
4. **Confirmar emails** manualmente
5. **Inserir dados** de teste
6. **Backup/Restore** do banco
7. **Monitorar performance**

### 🔧 **Comandos Úteis:**

#### Confirmar email de usuário:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'gabrieldesouza104@gmail.com';
```

#### Ver todos os usuários:
```sql
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

#### Ver perfis de usuários:
```sql
SELECT u.email, p.name, p.role_type 
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id;
```

#### Inserir dados de teste:
```sql
-- Inserir categorias
INSERT INTO categories (name, description, color) VALUES
('Refrigerantes', 'Bebidas gaseificadas', '#e74c3c'),
('Cervejas', 'Cervejas nacionais', '#f39c12');

-- Inserir produtos
INSERT INTO products (user_id, category_id, name, sku, sale_price, stock_quantity) VALUES
('SEU_USER_ID_AQUI', 1, 'Coca-Cola 350ml', 'COCA350', 4.50, 50),
('SEU_USER_ID_AQUI', 1, 'Pepsi 350ml', 'PEPSI350', 4.20, 30);
```

## 🚀 **Próximos Passos:**

1. **Instale uma ferramenta** (recomendo DBeaver)
2. **Configure a conexão** com os dados acima
3. **Execute o SQL** do `app.sql` se ainda não executou
4. **Confirme o email** do usuário admin
5. **Teste o login** no sistema

## ⚠️ **Importante:**
- A string de conexão contém a senha real
- Mantenha-a segura
- Use apenas em ambiente de desenvolvimento
- Para produção, use variáveis de ambiente
