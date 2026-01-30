/**
 * Sistema de permissões para operadores
 * Permite que admins configurem permissões específicas para cada usuário
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface UserPermissions {
  id?: number;
  user_id: string;
  tenant_id: string;
  
  // Vendas
  can_view_sales: boolean;
  can_create_sales: boolean;
  can_edit_sales: boolean;
  can_cancel_sales: boolean;
  can_view_sales_reports: boolean;
  
  // Financeiro
  can_view_financial: boolean;
  can_edit_financial: boolean;
  can_view_financial_reports: boolean;
  can_manage_payments: boolean;
  
  // Produtos
  can_view_products: boolean;
  can_create_products: boolean;
  can_edit_products: boolean;
  can_delete_products: boolean;
  
  // Clientes
  can_view_customers: boolean;
  can_create_customers: boolean;
  can_edit_customers: boolean;
  can_delete_customers: boolean;
  
  // Estoque
  can_view_stock: boolean;
  can_edit_stock: boolean;
  can_view_stock_reports: boolean;
  
  // Caixa
  can_open_cash: boolean;
  can_close_cash: boolean;
  can_view_cash_history: boolean;
  can_manage_cash_operations: boolean;
  
  // Configurações
  can_view_settings: boolean;
  can_edit_settings: boolean;
  can_manage_users: boolean;
  
  // Relatórios
  can_view_reports: boolean;
  can_export_reports: boolean;
}

/**
 * Permissões padrão para operadores (restritivas)
 */
export const DEFAULT_OPERATOR_PERMISSIONS: Partial<UserPermissions> = {
  can_view_sales: true,
  can_create_sales: true,
  can_edit_sales: false,
  can_cancel_sales: false,
  can_view_sales_reports: false,
  can_view_financial: false,
  can_edit_financial: false,
  can_view_financial_reports: false,
  can_manage_payments: false,
  can_view_products: true,
  can_create_products: false,
  can_edit_products: false,
  can_delete_products: false,
  can_view_customers: true,
  can_create_customers: true,
  can_edit_customers: false,
  can_delete_customers: false,
  can_view_stock: true,
  can_edit_stock: false,
  can_view_stock_reports: false,
  can_open_cash: true,
  can_close_cash: true,
  can_view_cash_history: true,
  can_manage_cash_operations: false,
  can_view_settings: false,
  can_edit_settings: false,
  can_manage_users: false,
  can_view_reports: false,
  can_export_reports: false,
};

/**
 * Permissões padrão para admins (todas permitidas)
 */
export const DEFAULT_ADMIN_PERMISSIONS: Partial<UserPermissions> = {
  can_view_sales: true,
  can_create_sales: true,
  can_edit_sales: true,
  can_cancel_sales: true,
  can_view_sales_reports: true,
  can_view_financial: true,
  can_edit_financial: true,
  can_view_financial_reports: true,
  can_manage_payments: true,
  can_view_products: true,
  can_create_products: true,
  can_edit_products: true,
  can_delete_products: true,
  can_view_customers: true,
  can_create_customers: true,
  can_edit_customers: true,
  can_delete_customers: true,
  can_view_stock: true,
  can_edit_stock: true,
  can_view_stock_reports: true,
  can_open_cash: true,
  can_close_cash: true,
  can_view_cash_history: true,
  can_manage_cash_operations: true,
  can_view_settings: true,
  can_edit_settings: true,
  can_manage_users: true,
  can_view_reports: true,
  can_export_reports: true,
};

/**
 * Buscar permissões de um usuário
 */
export async function getUserPermissions(
  userId: string,
  tenantId: string
): Promise<UserPermissions | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) {
      console.error('[getUserPermissions] Erro:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[getUserPermissions] Exceção:', error);
    return null;
  }
}

/**
 * Tipo para chaves de permissões booleanas (excluindo id, user_id, tenant_id)
 */
type PermissionKey = Exclude<keyof UserPermissions, 'id' | 'user_id' | 'tenant_id'>;

/**
 * Verificar se usuário tem uma permissão específica
 * Se não tiver registro de permissões, verifica se é admin/owner (tem todas as permissões)
 */
export async function checkPermission(
  userId: string,
  tenantId: string,
  permission: PermissionKey
): Promise<boolean> {
  try {
    // Verificar se é admin/owner (tem todas as permissões)
    const { data: membership } = await supabaseAdmin
      .from('user_memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .maybeSingle();

    if (membership?.role === 'owner' || membership?.role === 'admin') {
      return true; // Admins e owners têm todas as permissões
    }

    // Buscar permissões específicas
    const permissions = await getUserPermissions(userId, tenantId);
    
    if (!permissions) {
      // Se não tem registro, verificar role_type do profile
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('role_type')
        .eq('user_id', userId)
        .maybeSingle();

      // Se for admin no profile, permitir tudo
      if (profile?.role_type === 'admin') {
        return true;
      }

      // Se for operador sem permissões configuradas, usar padrões restritivos
      const defaultValue = DEFAULT_OPERATOR_PERMISSIONS[permission];
      return typeof defaultValue === 'boolean' ? defaultValue : false;
    }

    const permissionValue = permissions[permission];
    return typeof permissionValue === 'boolean' ? permissionValue : false;
  } catch (error) {
    console.error('[checkPermission] Erro:', error);
    return false; // Em caso de erro, negar acesso
  }
}

/**
 * Criar ou atualizar permissões de um usuário
 */
export async function saveUserPermissions(
  userId: string,
  tenantId: string,
  permissions: Partial<UserPermissions>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: existing } = await supabaseAdmin
      .from('user_permissions')
      .select('id')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const permissionData: Partial<UserPermissions> = {
      user_id: userId,
      tenant_id: tenantId,
      ...permissions,
    };

    if (existing) {
      // Atualizar
      const { error } = await supabaseAdmin
        .from('user_permissions')
        .update(permissionData)
        .eq('id', existing.id);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Criar
      const { error } = await supabaseAdmin
        .from('user_permissions')
        .insert(permissionData);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Criar permissões padrão para um novo usuário baseado no role_type
 */
export async function createDefaultPermissions(
  userId: string,
  tenantId: string,
  roleType: 'admin' | 'vendedor' | 'financeiro' | 'entregador'
): Promise<void> {
  const defaultPermissions =
    roleType === 'admin'
      ? DEFAULT_ADMIN_PERMISSIONS
      : DEFAULT_OPERATOR_PERMISSIONS;

  await saveUserPermissions(userId, tenantId, {
    user_id: userId,
    tenant_id: tenantId,
    ...defaultPermissions,
  } as Partial<UserPermissions>);
}
