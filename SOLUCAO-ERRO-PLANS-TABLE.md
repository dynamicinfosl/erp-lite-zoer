# 🔧 Solução para Erro da Tabela Plans

## ❌ **PROBLEMA IDENTIFICADO:**
```
Error: Erro ao carregar planos: {}
```

O erro ocorre porque a tabela `plans` não existe no banco de dados ou tem uma estrutura incompatível.

## ✅ **SOLUÇÃO:**

### **1. Execute o Script SQL no Supabase**

Acesse o **Supabase Dashboard** → **SQL Editor** e execute:

```sql
-- Cole todo o conteúdo do arquivo:
scripts/create-plans-table-simple.sql
```

### **2. Verificar se Funcionou**

Após executar o script, você deve ver:
- ✅ "Tabela plans criada com sucesso!"
- ✅ 3 planos inseridos (Básico, Profissional, Enterprise)

### **3. Testar no Painel Admin**

1. Acesse: `http://localhost:3000/admin`
2. Vá para a aba **"Planos"**
3. Verifique se os planos aparecem corretamente

---

## 📋 **CONTEÚDO DO SCRIPT SQL:**

```sql
-- Criar tabela plans
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    features JSONB DEFAULT '[]',
    max_users INTEGER DEFAULT 1,
    max_products INTEGER DEFAULT 100,
    max_customers INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir planos padrão
INSERT INTO public.plans (name, description, price, billing_cycle, features, max_users, max_products, max_customers, is_active) VALUES
('Básico', 'Plano ideal para pequenas empresas', 29.90, 'monthly', 
 '["Gestão de produtos", "Gestão de clientes", "Relatórios básicos", "Suporte por email"]', 
 1, 100, 1000, true),

('Profissional', 'Para empresas em crescimento', 59.90, 'monthly', 
 '["Tudo do Básico", "Múltiplos usuários", "Relatórios avançados", "Integração com APIs", "Suporte prioritário"]', 
 5, 1000, 10000, true),

('Enterprise', 'Solução completa para grandes empresas', 99.90, 'monthly', 
 '["Tudo do Profissional", "Usuários ilimitados", "Produtos ilimitados", "Clientes ilimitados", "Suporte 24/7", "Customizações"]', 
 -1, -1, -1, true);
```

---

## 🎯 **RESULTADO ESPERADO:**

Após executar o script, o painel de superadmin deve funcionar perfeitamente com:

✅ **Aba "Usuários"** - Gerenciar clientes
✅ **Aba "Planos"** - Gerenciar planos de assinatura
✅ **Aprovação/Rejeição** de clientes
✅ **Ativação/Desativação** de contas
✅ **CRUD completo** de planos

---

## 🔗 **Links de Acesso:**
- **Superadmin:** `http://localhost:3000/admin`
- **Login Admin:** `http://localhost:3000/admin/login`

**Execute o script SQL e o erro será resolvido!** 🚀
