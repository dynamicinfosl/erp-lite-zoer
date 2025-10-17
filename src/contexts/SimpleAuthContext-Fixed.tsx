'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getSupabaseInstance } from '@/lib/supabase-client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { SubscriptionData } from '@/hooks/usePlanLimits';

interface Tenant {
  id: string;
  name: string;
  status: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
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
  const [loading, setLoading] = useState(true); // ✅ INICIAR COM LOADING
  
      const router = useRouter();
      // Usar o cliente Supabase singleton global
      const supabase = React.useMemo(() => getSupabaseInstance(), []);

  // Função SUPER SIMPLES - Cria tenant local
  const createDefaultTenant = (userId: string) => {
    return {
      id: userId, // Usar user ID como ID único
      name: 'Minha Empresa',
      status: 'trial',
    };
  };

  // Função para buscar tenant real da conta logada
  const loadRealTenant = async (userId: string) => {
    try {
      console.log('🔍 Buscando tenant real para usuário:', userId);
      
      // ✅ NOVA SOLUÇÃO: Buscar tenant na tabela tenants baseado no user_id
      try {
        const { data: tenant, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.log('⚠️ Erro ao buscar tenant:', error);
        }

        if (tenant?.id) {
          console.log('✅ Tenant encontrado na tabela tenants:', tenant.name);
          return {
            id: tenant.id,
            name: tenant.name || 'Meu Negócio',
            status: tenant.status || 'trial',
            email: tenant.email,
            phone: tenant.phone,
            document: tenant.document,
            address: tenant.address,
            city: tenant.city,
            state: tenant.state,
            zip_code: tenant.zip_code,
          };
        }
      } catch (error) {
        console.log('⚠️ Erro ao verificar tenant na tabela tenants:', error);
      }

      // ✅ FALLBACK GARANTIDO: Sempre retornar um tenant válido
      console.log('👤 Usando user_id como tenant_id (fallback garantido):', userId);
      const fallbackTenant = createDefaultTenant(userId);
      console.log('✅ Tenant fallback criado:', fallbackTenant);
      return fallbackTenant;

    } catch (error) {
      console.error('❌ Erro ao buscar tenant real:', error);
      // ✅ FALLBACK FINAL: Sempre retornar um tenant válido
      const fallbackTenant = createDefaultTenant(userId);
      console.log('✅ Tenant fallback final criado:', fallbackTenant);
      return fallbackTenant;
    }
  };

  // Carregar sessão inicial - VERSÃO ULTRA SIMPLIFICADA
  useEffect(() => {
    console.log('🔄 Iniciando autenticação...');
    
    let isInitialized = false;
    
    const initAuth = async () => {
      if (isInitialized) return;
      isInitialized = true;
      
      try {
        console.log('🔍 Verificando sessão existente...');
        
        // Verificação simples e direta
        const { data: { session } } = await supabase.auth.getSession();
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 Usuário encontrado:', session.user.email);
          // Buscar tenant de forma mais simples
          const tenantData = await loadRealTenant(session.user.id);
          console.log('🏢 Tenant carregado:', tenantData);
          setTenant(tenantData);
        } else {
          console.log('👤 Nenhum usuário logado');
          setTenant(null);
        }
      } catch (error) {
        console.error('❌ Erro na autenticação:', error);
        setSession(null);
        setUser(null);
        setTenant(null);
      } finally {
        setLoading(false);
        console.log('✅ Autenticação inicializada');
      }
    };

    // Timeout mais curto
    const timeoutId = setTimeout(() => {
      if (!isInitialized) {
        console.log('⏰ Timeout na inicialização');
        setLoading(false);
        isInitialized = true;
      }
    }, 10000); // 10 segundos

    initAuth().finally(() => {
      clearTimeout(timeoutId);
    });
  }, [supabase]);

  // Escutar mudanças de autenticação - VERSÃO ULTRA SIMPLIFICADA
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setSession(session);
          setUser(session.user);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setTenant(null);
          setSubscription(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return {};
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, companyName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: companyName,
          },
        },
      });

      if (error) {
        return { error };
      }

      return {};
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Iniciando logout...');
      
      // Limpar todos os dados locais
      setSession(null);
      setUser(null);
      setTenant(null);
      setSubscription(null);
      
      // Limpar localStorage e sessionStorage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        // Limpar especificamente os dados do Supabase
        const supabaseKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('sb-')
        );
        supabaseKeys.forEach(key => localStorage.removeItem(key));
        
        const sessionKeys = Object.keys(sessionStorage).filter(key => 
          key.includes('supabase') || key.includes('sb-')
        );
        sessionKeys.forEach(key => sessionStorage.removeItem(key));
      }
      
      // Fazer logout no Supabase
      await supabase.auth.signOut();
      
      console.log('✅ Logout concluído');
      router.push('/login');
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
      // Mesmo com erro, redirecionar para login
      router.push('/login');
    }
  };

  const refreshTenant = async () => {
    if (user?.id) {
      try {
        console.log('🔄 Atualizando tenant para usuário:', user.id);
        const tenantData = await loadRealTenant(user.id);
        console.log('🏢 Tenant atualizado:', tenantData);
        setTenant(tenantData);
      } catch (error) {
        console.error('❌ Erro ao atualizar tenant:', error);
      }
    }
  };

  const refreshSubscription = async () => {
    // Implementação simplificada
    setSubscription({
      id: '00000000-0000-0000-0000-000000000000',
      plan: {
        id: 'trial',
        name: 'Trial',
        slug: 'trial',
        price_monthly: 0,
        price_yearly: 0,
        features: {},
        limits: {
          max_users: 1,
          max_customers: 100,
          max_products: 100,
          max_sales_per_month: 1000,
        },
      },
      status: 'trial',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  const value: AuthContextType = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSimpleAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
}

