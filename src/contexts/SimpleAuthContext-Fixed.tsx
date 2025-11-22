'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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
  const loadRealTenant = useCallback(async (userId: string) => {
    try {
      console.log('🔍 Buscando tenant real para usuário:', userId);
      
      // ✅ NOVA SOLUÇÃO: Buscar tenant através de user_memberships
      // Priorizar tenant que tem subscription ativa
      try {
        const { data: memberships, error: membershipError } = await supabase
          .from('user_memberships')
          .select(`
            tenant_id,
            tenants (
              id,
              name,
              status,
              email,
              phone,
              document,
              address,
              city,
              state,
              zip_code,
              subscriptions (
                id,
                status,
                current_period_end
              )
            )
          `)
          .eq('user_id', userId)
          .eq('is_active', true);

        if (membershipError) {
          console.log('⚠️ Erro ao buscar membership:', membershipError);
        }

        if (memberships && memberships.length > 0) {
          // Priorizar tenant que tem subscription ativa
          let selectedMembership = memberships.find(m => {
            const tenant = Array.isArray(m.tenants) ? m.tenants[0] : m.tenants;
            if (!tenant) return false;
            const subscriptions = tenant.subscriptions;
            if (Array.isArray(subscriptions) && subscriptions.length > 0) {
              const sub = subscriptions[0];
              return sub.status === 'active' && 
                     (sub.current_period_end ? new Date(sub.current_period_end) > new Date() : true);
            }
            return false;
          });

          // Se não encontrou com subscription ativa, pegar o primeiro
          if (!selectedMembership) {
            selectedMembership = memberships[0];
          }

          const tenant = Array.isArray(selectedMembership.tenants) 
            ? selectedMembership.tenants[0] 
            : selectedMembership.tenants;

          if (tenant) {
            console.log('✅ Tenant encontrado via membership:', tenant.name, 'ID:', tenant.id);
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
        }
      } catch (error) {
        console.log('⚠️ Erro ao verificar membership:', error);
      }

      // ✅ FALLBACK: Tentar buscar tenant diretamente na tabela tenants
      try {
        const { data: tenant, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.log('⚠️ Erro ao buscar tenant direto:', error);
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
  }, [supabase]);

  // Carregar sessão inicial - VERSÃO OTIMIZADA
  useEffect(() => {
    console.log('🔄 Iniciando autenticação...');
    
    let isInitialized = false;
    let mounted = true;
    
    const initAuth = async () => {
      if (isInitialized) return;
      isInitialized = true;
      
      try {
        console.log('🔍 Verificando sessão existente...');
        
        // ✅ PRIMEIRO: Verificação rápida de sessão (não bloqueia)
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null }, error: null }>((resolve) => 
          setTimeout(() => resolve({ data: { session: null }, error: null }), 2000)
        );
        
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as { data: { session: any }, error: any };
        
        if (sessionError) {
          console.error('❌ Erro ao buscar sessão:', sessionError);
          if (mounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
          return;
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
        
        // ✅ LIBERAR LOADING RAPIDAMENTE após verificar sessão
        if (mounted) {
          setLoading(false);
          console.log('✅ Sessão verificada, loading liberado');
        }
        
        // ✅ CARREGAR TENANT E SUBSCRIPTION EM BACKGROUND (não bloqueia)
        if (session?.user && mounted) {
          console.log('👤 Usuário encontrado, carregando dados em background...');
          
          // Carregar tenant de forma assíncrona
          loadRealTenant(session.user.id)
            .then((tenantData) => {
              if (mounted && tenantData) {
                console.log('🏢 Tenant carregado:', tenantData);
                setTenant(tenantData);
                
                // Carregar subscription após carregar tenant
                if (tenantData?.id) {
                  fetch(`/next_api/subscriptions?tenant_id=${tenantData.id}`)
                    .then((response) => {
                      if (response.ok) {
                        return response.json();
                      }
                      return null;
                    })
                    .then((result) => {
                      if (mounted && result?.success && result.data) {
                        const subData = result.data;
                        const plan = Array.isArray(subData.plan) ? subData.plan[0] : subData.plan;
                        
                        const subscriptionData: SubscriptionData = {
                          id: subData.id,
                          status: subData.status || 'trial',
                          trial_ends_at: subData.trial_end || subData.trial_ends_at || undefined,
                          current_period_end: subData.current_period_end || undefined,
                          plan: {
                            id: plan?.id || 'trial',
                            name: plan?.name || 'Trial',
                            slug: plan?.slug || 'trial',
                            price_monthly: plan?.price_monthly || 0,
                            price_yearly: plan?.price_yearly || 0,
                            features: plan?.features || {},
                            limits: plan?.limits || {
                              max_users: 1,
                              max_customers: 100,
                              max_products: 100,
                              max_sales_per_month: 1000,
                            },
                          },
                        };
                        
                        console.log('✅ Subscription carregada:', subscriptionData);
                        setSubscription(subscriptionData);
                      }
                    })
                    .catch((err) => {
                      console.error('⚠️ Erro ao carregar subscription:', err);
                    });
                }
              }
            })
            .catch((err) => {
              console.error('⚠️ Erro ao carregar tenant:', err);
            });
        } else if (mounted) {
          console.log('👤 Nenhum usuário logado');
          setTenant(null);
          setSubscription(null);
        }
      } catch (error) {
        console.error('❌ Erro na autenticação:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setTenant(null);
          setLoading(false);
        }
      }
    };

    // ✅ TIMEOUT REDUZIDO para 3 segundos
    const timeoutId = setTimeout(() => {
      if (!isInitialized && mounted) {
        console.log('⏰ Timeout na inicialização (3s)');
        setLoading(false);
        isInitialized = true;
      }
    }, 3000);

    initAuth().finally(() => {
      clearTimeout(timeoutId);
    });
    
    return () => {
      mounted = false;
    };
  }, [supabase, loadRealTenant]);

  // Escutar mudanças de autenticação - VERSÃO ULTRA SIMPLIFICADA
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setSession(session);
          setUser(session.user);
          // ✅ CORREÇÃO: Carregar tenant após login
          console.log('👤 Usuário logado, carregando tenant...');
          const tenantData = await loadRealTenant(session.user.id);
          console.log('🏢 Tenant carregado após login:', tenantData);
          setTenant(tenantData);
          
          // Carregar subscription após carregar tenant
          if (tenantData?.id) {
            const response = await fetch(`/next_api/subscriptions?tenant_id=${tenantData.id}`);
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                const subData = result.data;
                const plan = Array.isArray(subData.plan) ? subData.plan[0] : subData.plan;
                
                const subscriptionData: SubscriptionData = {
                  id: subData.id,
                  status: subData.status || 'trial',
                  trial_ends_at: subData.trial_end || subData.trial_ends_at || undefined,
                  current_period_end: subData.current_period_end || undefined,
                  plan: {
                    id: plan?.id || 'trial',
                    name: plan?.name || 'Trial',
                    slug: plan?.slug || 'trial',
                    price_monthly: plan?.price_monthly || 0,
                    price_yearly: plan?.price_yearly || 0,
                    features: plan?.features || {},
                    limits: plan?.limits || {
                      max_users: 1,
                      max_customers: 100,
                      max_products: 100,
                      max_sales_per_month: 1000,
                    },
                  },
                };
                
                console.log('✅ Subscription carregada após login:', subscriptionData);
                setSubscription(subscriptionData);
              }
            }
          }
          
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
  }, [supabase, loadRealTenant]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Iniciando login para:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erro no login:', error.message);
        console.error('❌ Código do erro:', error.status);
        return { error };
      }

      console.log('✅ Login bem-sucedido!');
      return {};
    } catch (error: any) {
      console.error('❌ Erro de exceção no login:', error);
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
        
        // Atualizar subscription também
        if (tenantData?.id) {
          await refreshSubscription();
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar tenant:', error);
      }
    }
  };

  const refreshSubscription = async () => {
    if (!tenant?.id) {
      console.log('⚠️ Sem tenant, não é possível buscar subscription');
      return;
    }

    try {
      console.log('🔄 Buscando subscription para tenant:', tenant.id);
      
      // Buscar subscription do banco
      const response = await fetch(`/next_api/subscriptions?tenant_id=${tenant.id}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const subData = result.data;
          const plan = Array.isArray(subData.plan) ? subData.plan[0] : subData.plan;
          
          const subscriptionData: SubscriptionData = {
            id: subData.id,
            status: subData.status || 'trial',
            trial_ends_at: subData.trial_end || subData.trial_ends_at || undefined,
            current_period_end: subData.current_period_end || undefined,
            plan: {
              id: plan?.id || 'trial',
              name: plan?.name || 'Trial',
              slug: plan?.slug || 'trial',
              price_monthly: plan?.price_monthly || 0,
              price_yearly: plan?.price_yearly || 0,
              features: plan?.features || {},
              limits: plan?.limits || {
                max_users: 1,
                max_customers: 100,
                max_products: 100,
                max_sales_per_month: 1000,
              },
            },
          };
          
          console.log('✅ Subscription atualizada:', subscriptionData);
          setSubscription(subscriptionData);
        } else {
          console.log('⚠️ Nenhuma subscription encontrada, usando padrão');
          // Se não encontrou, criar subscription padrão
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
        }
      } else {
        console.log('⚠️ Erro ao buscar subscription, usando padrão');
        // Em caso de erro, usar subscription padrão
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
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar subscription:', error);
      // Em caso de erro, usar subscription padrão
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
    }
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

