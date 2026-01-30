-- Tabela de permissões de usuários
-- Permite que admins configurem permissões específicas para operadores

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Permissões de Vendas
  can_view_sales BOOLEAN NOT NULL DEFAULT true,
  can_create_sales BOOLEAN NOT NULL DEFAULT true,
  can_edit_sales BOOLEAN NOT NULL DEFAULT false,
  can_cancel_sales BOOLEAN NOT NULL DEFAULT false,
  can_view_sales_reports BOOLEAN NOT NULL DEFAULT false,
  
  -- Permissões de Financeiro
  can_view_financial BOOLEAN NOT NULL DEFAULT false,
  can_edit_financial BOOLEAN NOT NULL DEFAULT false,
  can_view_financial_reports BOOLEAN NOT NULL DEFAULT false,
  can_manage_payments BOOLEAN NOT NULL DEFAULT false,
  
  -- Permissões de Produtos
  can_view_products BOOLEAN NOT NULL DEFAULT true,
  can_create_products BOOLEAN NOT NULL DEFAULT false,
  can_edit_products BOOLEAN NOT NULL DEFAULT false,
  can_delete_products BOOLEAN NOT NULL DEFAULT false,
  
  -- Permissões de Clientes
  can_view_customers BOOLEAN NOT NULL DEFAULT true,
  can_create_customers BOOLEAN NOT NULL DEFAULT true,
  can_edit_customers BOOLEAN NOT NULL DEFAULT false,
  can_delete_customers BOOLEAN NOT NULL DEFAULT false,
  
  -- Permissões de Estoque
  can_view_stock BOOLEAN NOT NULL DEFAULT true,
  can_edit_stock BOOLEAN NOT NULL DEFAULT false,
  can_view_stock_reports BOOLEAN NOT NULL DEFAULT false,
  
  -- Permissões de Caixa
  can_open_cash BOOLEAN NOT NULL DEFAULT true,
  can_close_cash BOOLEAN NOT NULL DEFAULT true,
  can_view_cash_history BOOLEAN NOT NULL DEFAULT true,
  can_manage_cash_operations BOOLEAN NOT NULL DEFAULT false, -- reforços/sangrias
  
  -- Permissões de Configurações
  can_view_settings BOOLEAN NOT NULL DEFAULT false,
  can_edit_settings BOOLEAN NOT NULL DEFAULT false,
  can_manage_users BOOLEAN NOT NULL DEFAULT false,
  
  -- Permissões de Relatórios
  can_view_reports BOOLEAN NOT NULL DEFAULT false,
  can_export_reports BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: um usuário só pode ter um registro de permissões por tenant
  UNIQUE(user_id, tenant_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_tenant_id ON public.user_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_tenant ON public.user_permissions(user_id, tenant_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_permissions_updated_at();

-- Comentários
COMMENT ON TABLE public.user_permissions IS 'Armazena permissões específicas de cada usuário por tenant';
COMMENT ON COLUMN public.user_permissions.can_cancel_sales IS 'Permite cancelar vendas';
COMMENT ON COLUMN public.user_permissions.can_view_financial IS 'Permite visualizar módulo financeiro';
COMMENT ON COLUMN public.user_permissions.can_manage_cash_operations IS 'Permite fazer reforços e sangrias no caixa';

-- Habilitar RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver suas próprias permissões
CREATE POLICY "Users can view own permissions"
  ON public.user_permissions FOR SELECT
  USING (auth.uid() = user_id);

-- Política: admins podem ver todas as permissões do tenant
CREATE POLICY "Admins can view tenant permissions"
  ON public.user_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_memberships
      WHERE user_id = auth.uid()
      AND tenant_id = user_permissions.tenant_id
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );

-- Política: admins podem gerenciar permissões do tenant
CREATE POLICY "Admins can manage tenant permissions"
  ON public.user_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_memberships
      WHERE user_id = auth.uid()
      AND tenant_id = user_permissions.tenant_id
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );
