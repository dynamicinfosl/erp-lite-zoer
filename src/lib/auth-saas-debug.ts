// VERSÃO DE DEBUG TEMPORÁRIA
import { createClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'trial' | 'active' | 'suspended' | 'canceled';
  trial_ends_at?: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface UserMembership {
  id: string;
  user_id: string;
  tenant_id: string;
  role: 'superadmin' | 'owner' | 'admin' | 'operator';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tenants?: Tenant;
}

export interface AuthUser extends User {
  memberships?: UserMembership[];
  currentTenant?: Tenant;
}

// Classe para gerenciar autenticação SaaS - VERSÃO DEBUG
export class SaasAuth {
  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    console.log('=== DEBUG AUTH ===');
    console.log('User autenticado:', user.id, user.email);

    // Se for o usuário problema, criar dados mock
    if (user.id === '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01') {
      console.log('🔧 MODO DEBUG: Criando membership fake para teste');
      
      const fakeTenant: Tenant = {
        id: '5305296a-c1a1-4b9d-8934-e7b8bfc82565',
        name: 'Teste Gabriel',
        slug: 'teste-gabriel',
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const fakeMembership: UserMembership = {
        id: '40d6bd12-b8ce-472c-a2e5-4fd448b952fb',
        user_id: user.id,
        tenant_id: fakeTenant.id,
        role: 'owner',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tenants: fakeTenant
      };

      const authUser: AuthUser = {
        ...user,
        memberships: [fakeMembership],
        currentTenant: fakeTenant
      };

      console.log('✅ Dados fake criados:', authUser);
      return authUser;
    }

    // Para outros usuários, tentar buscar normalmente
    const { data: memberships, error } = await supabase
      .from('user_memberships')
      .select(`
        *,
        tenants(*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error('Erro ao buscar memberships:', error);
      return user as AuthUser;
    }

    const authUser: AuthUser = {
      ...user,
      memberships: memberships || [],
      currentTenant: memberships?.[0]?.tenants || undefined
    };

    return authUser;
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}


