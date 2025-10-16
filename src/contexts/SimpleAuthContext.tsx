'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { SubscriptionData } from '@/hooks/usePlanLimits';

interface Tenant {
  id: string;
  name: string;
  status: string;
  email?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  tenant: Tenant | null;
  subscription: SubscriptionData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, companyName: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  refreshTenant: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Função SUPER SIMPLES - Cria tenant local sem depender do banco
  const createDefaultTenant = (userEmail: string) => {
    const userName = userEmail.split('@')[0].replace(/[^a-zA-Z0-9\s]/g, ' ').trim() || 'Meu Negócio';
    return {
      id: '00000000-0000-0000-0000-000000000000',
      name: userName,
      status: 'trial',
    };
  };

  // Função SUPER SIMPLES - Cria subscription padrão
  const createDefaultSubscription = () => {
    return {
      id: 'trial-default',
      status: 'trial',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      plan: {
        id: 'trial-plan',
        name: 'Trial Gratuito',
        slug: 'trial',
        price_monthly: 0,
        price_yearly: 0,
        features: {},
        limits: {
          max_users: 1,
          max_customers: 50,
          max_products: 100,
          max_sales_per_month: 100
        }
      }
    } as any;
  };

  // Função para buscar tenant real da conta logada
  const loadRealTenant = async (userId: string) => {
    try {
      console.log('🔍 Buscando tenant real para usuário:', userId);
      
      // ✅ NOVA SOLUÇÃO: Buscar tenant na tabela tenants baseado no user_id
      try {
        const { data: tenant, error } = await supabase
          .from('tenants')
          .select('id, name, email')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.log('⚠️ Erro ao buscar tenant:', error);
        }

        if (tenant?.id) {
          console.log('✅ Tenant encontrado na tabela tenants:', tenant.name, tenant.email);
          return {
            id: tenant.id,
            name: tenant.name || 'Meu Negócio',
            status: 'trial',
            email: tenant.email,
          };
        }
      } catch (error) {
        console.log('⚠️ Erro ao verificar tenant na tabela tenants:', error);
      }

      // Fallback: usar user_id como tenant_id (compatibilidade)
      console.log('👤 Usando user_id como tenant_id (fallback):', userId);
      return {
        id: userId,
        name: 'Meu Negócio',
        status: 'trial',
      };

    } catch (error) {
      console.error('❌ Erro ao buscar tenant real:', error);
      // Em caso de erro, usar user_id mesmo assim
      return {
        id: userId,
        name: 'Meu Negócio',
        status: 'trial',
      };
    }
  };

  // Carregar sessão inicial - BUSCAR TENANT REAL
  useEffect(() => {
    let mounted = true;

    // Timeout de segurança para evitar loading infinito
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('⚠️ Timeout de loading atingido, forçando loading = false');
        setLoading(false);
      }
    }, 1000); // 1 segundo para dar tempo de buscar tenant

    // Timeout de emergência - sempre para o loading
    const emergencyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('🚨 EMERGENCY: Loading forçado a parar');
        setLoading(false);
      }
    }, 3000); // 3 segundos máximo absoluto

    const initAuth = async () => {
      try {
        console.log('🔄 Iniciando autenticação...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao buscar sessão:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        console.log('📋 Sessão encontrada:', !!session);

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
        
        // Se há usuário logado, buscar tenant real
        if (session?.user && mounted) {
          console.log('👤 Usuário logado, buscando tenant real...');
          const realTenant = await loadRealTenant(session.user.id);
          const defaultSubscription = createDefaultSubscription();
          
          setTenant(realTenant);
          setSubscription(defaultSubscription);
          
          // Limpar localStorage de tenants antigos
          try {
            localStorage.removeItem('lastProductsTenantId');
            localStorage.removeItem('lastCustomersTenantId');
            console.log('🧹 localStorage de tenants limpo');
          } catch (error) {
            console.log('⚠️ Erro ao limpar localStorage:', error);
          }
          
          console.log('✅ Tenant real configurado:', realTenant.name, realTenant.id);
        }
        
        // Definir loading como false
        if (mounted) {
          setLoading(false);
          console.log('✅ Autenticação inicializada com sucesso');
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Executar inicialização
    initAuth();

    // Listener de mudanças - BUSCAR TENANT REAL
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Mudança de auth:', event, !!session);
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
      }
      
      if (session?.user && mounted) {
        console.log('👤 Auth state change - buscando tenant real...');
        const realTenant = await loadRealTenant(session.user.id);
        const defaultSubscription = createDefaultSubscription();
        
        setTenant(realTenant);
        setSubscription(defaultSubscription);
        
        // Limpar localStorage de tenants antigos
        try {
          localStorage.removeItem('lastProductsTenantId');
          localStorage.removeItem('lastCustomersTenantId');
          console.log('🧹 localStorage de tenants limpo (auth state change)');
        } catch (error) {
          console.log('⚠️ Erro ao limpar localStorage:', error);
        }
        
        console.log('✅ Auth state change - tenant real configurado:', realTenant.name, realTenant.id);
      } else if (mounted) {
        setTenant(null);
        setSubscription(null);
        
        // Limpar localStorage quando usuário faz logout
        try {
          localStorage.removeItem('lastProductsTenantId');
          localStorage.removeItem('lastCustomersTenantId');
          console.log('🧹 localStorage de tenants limpo (logout)');
        } catch (error) {
          console.log('⚠️ Erro ao limpar localStorage:', error);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      clearTimeout(emergencyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Tentando login:', email);
      
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (error) {
        console.error('❌ Erro no login:', error.message);
        return { error };
      }

      console.log('✅ Login bem-sucedido:', !!data.user);
      return { error: null };
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, companyName: string) => {
    try {
      console.log('📝 Tentando registro:', email);
      
      // 1. Criar usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error('❌ Erro no registro:', authError.message);
        return { error: authError };
      }

      console.log('✅ Registro bem-sucedido:', !!authData.user);
      return { error: null };
    } catch (error: any) {
      console.error('❌ Erro no registro:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      
      // 1. Fazer signOut do Supabase
      await supabase.auth.signOut();
      
      // 2. Limpar estado local
      setUser(null);
      setSession(null);
      setTenant(null);
      setSubscription(null);
      
      // 3. Limpar dados do localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // 4. Limpar dados do sessionStorage
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      
      // 5. Limpar cookies do Supabase
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const [key] = cookie.trim().split('=');
        if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))) {
          document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
        }
      });
      
      console.log('✅ Logout completo realizado');
      
      // 6. Redirecionar para login
      router.push('/login');
    } catch (error) {
      console.error('❌ Erro durante logout:', error);
      // Mesmo com erro, limpar estado e redirecionar
      setUser(null);
      setSession(null);
      setTenant(null);
      setSubscription(null);
      router.push('/login');
    }
  };

  const refreshTenant = async () => {
    if (user?.id) {
      const realTenant = await loadRealTenant(user.id);
      setTenant(realTenant);
      console.log('✅ Tenant atualizado:', realTenant.name, realTenant.id);
    } else if (user?.email) {
      const defaultTenant = createDefaultTenant(user.email);
      setTenant(defaultTenant);
      console.log('✅ Tenant padrão atualizado:', defaultTenant.name);
    }
  };

  const refreshSubscription = async () => {
    const defaultSubscription = createDefaultSubscription();
    setSubscription(defaultSubscription);
    console.log('✅ Subscription atualizada');
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      tenant,
      subscription,
      loading,
      signIn,
      signUp,
      signOut,
      refreshTenant,
      refreshSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useSimpleAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within SimpleAuthProvider');
  }
  return context;
};
