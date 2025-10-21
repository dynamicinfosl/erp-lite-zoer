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

export interface AuthUser extends User {
  currentTenant?: Tenant;
  role?: string;
}

// Sistema de autenticação SIMPLIFICADO para produção
export class ProductionAuth {
  
  static async signUp(email: string, password: string, userData: { 
    name: string; 
    companyName: string; 
    phone?: string 
  }) {
    try {
      if (!supabase) {
        throw new Error('Cliente Supabase não configurado');
      }

      // 1. Criar usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      // 2. Criar tenant diretamente na tabela, sem RLS complicado
      const tenantSlug = userData.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);

      // Usar service role se disponível, senão usar client normal
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';
      const serviceSupabase = createClient(supabaseUrl!, serviceRoleKey);
      
      const { data: tenant, error: tenantError } = await serviceSupabase
        .from('tenants')
        .insert({
          name: userData.companyName,
          slug: tenantSlug + '-' + Date.now(), // Garantir unicidade
          status: 'trial',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (tenantError) {
        console.error('Erro ao criar tenant:', tenantError);
        throw new Error('Erro ao criar empresa: ' + tenantError.message);
      }

      // 3. Criar membership
      const { error: membershipError } = await serviceSupabase
        .from('user_memberships')
        .insert({
          user_id: authData.user.id,
          tenant_id: tenant.id,
          role: 'owner',
          is_active: true
        });

      if (membershipError) {
        console.error('Erro ao criar membership:', membershipError);
        // Não falhar por isso, continuar
      }

      return {
        user: authData.user,
        tenant,
        session: authData.session
      };

    } catch (error: any) {
      console.error('Erro no signup:', error);
      throw error;
    }
  }

  static async signIn(email: string, password: string) {
    if (!supabase) {
      throw new Error('Cliente Supabase não configurado');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  static async signOut() {
    if (!supabase) {
      throw new Error('Cliente Supabase não configurado');
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      if (!supabase) {
        return null;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      console.log('🔍 Usuário autenticado:', user.email);

      // MODO ULTRA SIMPLES - usar cliente normal (sem service role)
      // Com RLS desabilitado, deve funcionar
      const { data: memberships, error: membershipError } = await supabase
        .from('user_memberships')
        .select('*, tenants(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);

      if (membershipError) {
        console.log('❌ Erro ao buscar membership:', membershipError.message);
        // Retornar usuário sem tenant - vai para onboarding
        return {
          ...user,
          currentTenant: undefined,
          role: undefined
        } as AuthUser;
      }

      if (!memberships || memberships.length === 0) {
        console.log('❌ Nenhum membership encontrado');
        return {
          ...user,
          currentTenant: undefined,
          role: undefined
        } as AuthUser;
      }

      const membership = memberships[0];
      const tenant = membership.tenants;

      if (!tenant) {
        console.log('❌ Tenant não encontrado');
        return {
          ...user,
          currentTenant: undefined,
          role: membership.role
        } as AuthUser;
      }

      console.log('✅ Tenant encontrado:', tenant.name);

      const authUser: AuthUser = {
        ...user,
        currentTenant: tenant,
        role: membership.role
      };

      return authUser;

    } catch (error) {
      console.error('💥 Erro geral no getCurrentUser:', error);
      // Em caso de erro, retornar usuário sem tenant
      try {
        if (!supabase) {
          return null;
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        return user ? { ...user, currentTenant: undefined, role: undefined } as AuthUser : null;
      } catch {
        return null;
      }
    }
  }
}
