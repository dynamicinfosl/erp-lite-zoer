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
  const loadRealTenant = useCallback(async (userId: string): Promise<Tenant> => {
    console.log('🔍 [SIMPLE] Buscando tenant para usuário:', userId);
    
    // ✅ VERSÃO ULTRA SIMPLIFICADA: Usar API route com timeout curto
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch(`/next_api/admin/get-tenant?user_id=${userId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const tenant = result.data;
          console.log('✅ [SIMPLE] Tenant encontrado:', tenant.name, 'ID:', tenant.id);
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
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('⏰ [SIMPLE] Timeout ao buscar tenant via API');
      } else {
        console.error('⚠️ [SIMPLE] Erro ao buscar tenant via API:', error);
      }
    }

    // ✅ FALLBACK SIMPLES: Query direta sem joins complexos
    try {
      const { data: membership, error: memError } = await supabase
        .from('user_memberships')
        .select('tenant_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!memError && membership?.tenant_id) {
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('id, name, status, email, phone, document, address, city, state, zip_code')
          .eq('id', membership.tenant_id)
          .maybeSingle();

        if (!tenantError && tenant) {
          console.log('✅ [SIMPLE] Tenant encontrado via query direta:', tenant.name);
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
      console.error('⚠️ [SIMPLE] Erro na query direta:', error);
    }

    // ✅ ÚLTIMO RECURSO: Retornar null e deixar o sistema criar um tenant padrão depois
    console.warn('⚠️ [SIMPLE] Não foi possível encontrar tenant, retornando null');
    return null as any; // Retornar null para indicar que não encontrou
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
        // Usar timeout de 2 segundos para não travar
        let session: any = null;
        let sessionError: any = null;
        
        try {
          const sessionResult = await Promise.race([
            supabase.auth.getSession(),
            new Promise<{ data: { session: null }, error: null }>((resolve) => 
              setTimeout(() => resolve({ data: { session: null }, error: null }), 2000)
            )
          ]);
          
          if (sessionResult && 'data' in sessionResult) {
            session = sessionResult.data?.session;
            sessionError = sessionResult.error;
          }
        } catch (err) {
          console.error('⚠️ Erro ao buscar sessão:', err);
          sessionError = err;
        }
        
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
          setLoading(true);
          
          console.log('👤 [SIMPLE] Usuário logado, carregando tenant...');
          
          // ✅ VERSÃO SIMPLIFICADA: Carregar tenant de forma direta
          loadRealTenant(session.user.id)
            .then((tenantData) => {
              if (tenantData && tenantData.id) {
                console.log('✅ [SIMPLE] Tenant carregado:', tenantData.name, 'ID:', tenantData.id);
                setTenant(tenantData);
                
                // Carregar subscription em background (não bloqueia redirecionamento)
                fetch(`/next_api/subscriptions?tenant_id=${tenantData.id}`)
                  .then((response) => response.ok ? response.json() : null)
                  .then((result) => {
                    if (result?.success && result.data) {
                      const subData = result.data;
                      const plan = Array.isArray(subData.plan) ? subData.plan[0] : subData.plan;
                      
                      setSubscription({
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
                      });
                    }
                  })
                  .catch((err) => {
                    console.warn('⚠️ [SIMPLE] Subscription não carregada (não crítico):', err);
                  });
              } else {
                console.warn('⚠️ [SIMPLE] Tenant não encontrado, mas continuando login');
                // Não definir tenant - deixar null para que o sistema funcione mesmo assim
                setTenant(null);
              }
            })
            .catch((error) => {
              console.error('❌ [SIMPLE] Erro ao carregar tenant:', error);
              setTenant(null);
            })
            .finally(() => {
              setLoading(false);
            });
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

