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

  // Função SIMPLES - Usa nome do email do usuário
  const loadTenant = async (userId: string) => {
    try {
      // 1. Buscar tenant_id do usuário
      const { data: membership } = await supabase
        .from('user_memberships')
        .select('tenant_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      // Criar nome a partir do email do usuário
      const userName = user?.email 
        ? user.email.split('@')[0].replace(/[^a-zA-Z0-9\s]/g, ' ').trim()
        : 'Meu Negócio';

      if (membership?.tenant_id) {
        // Usar tenant_id real + nome do usuário
        setTenant({
          id: membership.tenant_id,
          name: userName,
          status: 'trial',
        });
        console.log('✅ Tenant configurado:', userName);
      } else {
        // Fallback com UUID padrão válido
        setTenant({
          id: '00000000-0000-0000-0000-000000000000',
          name: userName,
          status: 'trial',
        });
        console.log('⚠️ Usando tenant padrão:', userName);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar tenant:', error);
      const userName = user?.email?.split('@')[0] || 'Meu Negócio';
      setTenant({
        id: '00000000-0000-0000-0000-000000000000',
        name: userName,
        status: 'trial',
      });
    }
  };

  // Carregar sessão inicial - SUPER SIMPLES
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao buscar sessão:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
        
        // Só carregar tenant se houver usuário logado
        if (session?.user && mounted) {
          await loadTenant(session.user.id);
          await refreshSubscription();
        }
        
        // Definir loading como false APÓS carregar tudo
        if (mounted) {
          setLoading(false);
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

    // Listener de mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
      }
      
      if (session?.user && mounted) {
        // Carregar tenant e subscription
        try {
          await loadTenant(session.user.id);
          await refreshSubscription();
        } catch (err) {
          console.error('❌ Erro ao carregar tenant:', err);
        }
      } else if (mounted) {
        setTenant(null);
        setSubscription(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      if (data.user) {
        await loadTenant(data.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, companyName: string) => {
    try {
      // 1. Criar usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) return { error: authError };

      const userId = authData.user?.id;
      if (!userId) return { error: new Error('Usuário não criado') };

      // 2. Criar tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: companyName,
          slug: companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          status: 'trial',
        })
        .select()
        .single();

      if (tenantError) {
        console.error('Erro ao criar tenant:', tenantError);
        return { error: tenantError };
      }

      // 3. Criar membership
      const { error: memberError } = await supabase
        .from('user_memberships')
        .insert({
          user_id: userId,
          tenant_id: tenantData.id,
          role: 'owner',
          is_active: true,
        });

      if (memberError) {
        console.error('Erro ao criar membership:', memberError);
        return { error: memberError };
      }

      // Carregar tenant
      await loadTenant(userId);

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setTenant(null);
    setSubscription(null);
    router.push('/login');
  };

  const refreshTenant = async () => {
    if (user) {
      await loadTenant(user.id);
    }
  };

  const refreshSubscription = async () => {
    if (tenant?.id) {
      try {
        const { data: subscriptionData, error } = await supabase
          .from('subscriptions')
          .select(`
            id,
            status,
            trial_end,
            current_period_end,
            plan:plans(
              id,
              name,
              slug,
              price_monthly,
              price_yearly,
              features,
              limits
            )
          `)
          .eq('tenant_id', tenant.id)
          .single();

        if (error) {
          // Se não encontrou subscription, criar uma trial padrão
          if (error.code === 'PGRST116') {
            console.log('Nenhuma subscription encontrada, criando trial padrão');
            const defaultSubscription = {
              id: 'trial-default',
              status: 'trial',
              trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
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
            };
            setSubscription(defaultSubscription as any);
          } else {
            console.error('Erro ao carregar subscription:', error.message || error);
          }
        } else if (subscriptionData) {
          const normalized = {
            ...subscriptionData,
            trial_ends_at: (subscriptionData as any)?.trial_end || null,
          } as typeof subscriptionData;
          setSubscription(normalized as any);
        }
      } catch (error) {
        console.error('Erro ao carregar subscription:', error instanceof Error ? error.message : error);
      }
    }
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

