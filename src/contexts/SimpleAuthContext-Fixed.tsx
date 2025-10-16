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
  const [loading, setLoading] = useState(false); // ✅ INICIAR SEM LOADING
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Função SUPER SIMPLES - Cria tenant local
  const createDefaultTenant = (userEmail: string) => {
    const userName = userEmail.split('@')[0].replace(/[^a-zA-Z0-9\s]/g, ' ').trim() || 'Meu Negócio';
    return {
      id: '00000000-0000-0000-0000-000000000000',
      name: userName,
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

  // Carregar sessão inicial - VERSÃO INSTANTÂNEA
  useEffect(() => {
    console.log('🔄 Iniciando autenticação INSTANTÂNEA...');
    
    // Verificar sessão de forma síncrona
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.log('⚠️ Erro na sessão, usando fallback');
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('👤 Usuário encontrado:', session.user.email);
        setTenant({
          id: session.user.id,
          name: 'Meu Negócio',
          status: 'trial',
        });
      } else {
        console.log('👤 Nenhum usuário logado');
        setTenant(null);
      }
      
      setLoading(false);
      console.log('✅ Autenticação inicializada (instantânea)');
    }).catch((error) => {
      console.error('❌ Erro na autenticação:', error);
      setLoading(false);
    });
  }, []);

  // Escutar mudanças de autenticação - VERSÃO SIMPLIFICADA
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setSession(session);
          setUser(session.user);
          // Usar tenant simples sem buscar no banco
          setTenant({
            id: session.user.id,
            name: 'Meu Negócio',
            status: 'trial',
          });
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setTenant(null);
          setSubscription(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
    }
  };

  const refreshTenant = async () => {
    if (user?.id) {
      try {
        const tenantData = await loadRealTenant(user.id);
        setTenant(tenantData);
      } catch (error) {
        console.error('❌ Erro ao atualizar tenant:', error);
      }
    }
  };

  const refreshSubscription = async () => {
    // Implementação simplificada
    setSubscription({
      plan: 'trial',
      status: 'active',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      limits: {
        products: 100,
        customers: 100,
        sales: 1000,
      },
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

