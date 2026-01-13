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
    
    // ✅ Garantir que só executa no cliente
    if (typeof window === 'undefined') {
      console.log('⏭️ [SIMPLE] Skip - SSR context');
      return createDefaultTenant(userId);
    }
    
    // ✅ VERSÃO ULTRA SIMPLIFICADA: Usar API route com timeout curto
    let controller: AbortController | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let isAborted = false;
    
    try {
      controller = new AbortController();
      timeoutId = setTimeout(() => {
        if (!isAborted) {
          isAborted = true;
          controller?.abort();
        }
      }, 5000); // 5s timeout
      
      const response = await fetch(`/next_api/admin/get-tenant?user_id=${userId}`, {
        signal: controller.signal
      });
      
      // Limpar timeout se a requisição completou com sucesso
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
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
      // Limpar timeout em caso de erro
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.warn('⏰ [SIMPLE] Timeout ao buscar tenant via API (esperado)');
        // Não propagar o erro, apenas continuar com o fallback
      } else {
        console.error('⚠️ [SIMPLE] Erro ao buscar tenant via API:', error);
      }
    } finally {
      // Garantir limpeza do timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    // ✅ FALLBACK SIMPLES: Query direta priorizando tenant com subscription válida
    try {
      console.log('🔍 Buscando tenant com subscription válida para user:', userId);
      
      // Primeiro: buscar TODOS os memberships ativos
      const { data: memberships, error: memError } = await supabase
        .from('user_memberships')
        .select('tenant_id, created_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!memError && memberships && memberships.length > 0) {
        console.log(`📋 Encontrados ${memberships.length} tenant(s) para o usuário`);
        
        // Se houver múltiplos tenants, verificar qual tem subscription válida
        if (memberships.length > 1) {
          console.warn(`⚠️ ATENÇÃO: Usuário tem ${memberships.length} tenants! Priorizando o com subscription válida...`);
          
          // Buscar subscriptions para cada tenant
          for (const mem of memberships) {
            const { data: subscription } = await supabase
              .from('subscriptions')
              .select('id, status, current_period_end, trial_end')
              .eq('tenant_id', mem.tenant_id)
              .maybeSingle();
            
            if (subscription) {
              const now = new Date();
              const isValid = (
                (subscription.status === 'active' && subscription.current_period_end && new Date(subscription.current_period_end) > now) ||
                (subscription.status === 'trial' && subscription.trial_end && new Date(subscription.trial_end) > now)
              );
              
              if (isValid) {
                console.log(`✅ Tenant com subscription válida encontrado: ${mem.tenant_id}`);
                const { data: tenant } = await supabase
                  .from('tenants')
                  .select('id, name, status, email, phone, document, address, city, state, zip_code')
                  .eq('id', mem.tenant_id)
                  .maybeSingle();
                
                if (tenant) {
                  console.log('✅ [PRIORITY] Usando tenant com subscription válida:', tenant.name);
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
            }
          }
          
          console.warn('⚠️ Nenhum tenant com subscription válida, usando o mais recente');
        }
        
        // Usar o primeiro (mais recente) se não houver subscription válida
        const membership = memberships[0];
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
    // ✅ Garantir que só executa no cliente
    if (typeof window === 'undefined') {
      console.log('⏭️ [SIMPLE] Skip auth init - SSR context');
      return;
    }
    
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
          
          // Verificar status de aprovação do usuário
          fetch(`/next_api/user-profiles?user_id=${session.user.id}`)
            .then((response) => {
              if (response.ok) {
                return response.json();
              }
              return null;
            })
            .then((profileResult) => {
              // Verificar status de aprovação apenas se o perfil existir
              if (mounted && profileResult?.data?.profile) {
                const profile = profileResult.data.profile;
                
                // Determinar status de aprovação baseado em is_active
                // is_active = true → aprovado
                // is_active = false → rejeitado/inativo
                // is_active = null/undefined → pendente
                let approvalStatus = 'pending';
                if (profile.is_active === true) {
                  approvalStatus = 'approved';
                } else if (profile.is_active === false) {
                  approvalStatus = 'rejected';
                }
                
                console.log('📋 Status de aprovação:', approvalStatus, { 
                  is_active: profile.is_active
                });
                
                // Se o usuário foi rejeitado (is_active = false), bloquear acesso
                if (approvalStatus === 'rejected') {
                  console.warn('❌ Usuário rejeitado ou inativo');
                  
                  // Fazer logout e redirecionar para página de aprovação pendente
                  if (mounted) {
                    supabase.auth.signOut().then(() => {
                      if (typeof window !== 'undefined') {
                        window.location.href = '/aprovacao-pendente?status=rejected';
                      }
                    });
                  }
                  return;
                }
                
                // Se está pendente, permitir acesso temporário
                if (approvalStatus === 'pending') {
                  console.log('⏳ Usuário pendente de aprovação, mas permitindo acesso temporário');
                  // Não bloquear, apenas logar
                }
              } else {
                // Se não há perfil, permitir acesso (será criado automaticamente)
                console.log('📝 Perfil não encontrado, permitindo acesso (será criado automaticamente)');
              }
              
              // Se aprovado ou não há perfil, continuar carregando tenant
              // Carregar tenant de forma assíncrona
              loadRealTenant(session.user.id)
                .then((tenantData) => {
                  if (mounted && tenantData) {
                    console.log('🏢 Tenant carregado:', tenantData);
                    setTenant(tenantData);
                    
                    // Carregar subscription após carregar tenant
                    if (tenantData?.id) {
                      // ✅ ADICIONAR CACHE BUSTING para forçar busca atualizada
                      const cacheBuster = `_=${Date.now()}`;
                      console.log(`🔄 Buscando subscription atualizada para tenant: ${tenantData.id}`);
                      
                      fetch(`/next_api/subscriptions?tenant_id=${tenantData.id}&${cacheBuster}`, {
                        cache: 'no-store', // Desabilitar cache HTTP
                        headers: {
                          'Cache-Control': 'no-cache, no-store, must-revalidate',
                          'Pragma': 'no-cache'
                        }
                      })
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
                            
                            console.log('📦 [INIT] Subscription recebida do banco:', {
                              id: subData.id,
                              status: subData.status,
                              current_period_end: subData.current_period_end,
                              trial_end: subData.trial_end,
                              trial_ends_at: subData.trial_ends_at,
                              plan_name: plan?.name
                            });
                            
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
                            
                            console.log('✅ Subscription carregada e configurada:', {
                              status: subscriptionData.status,
                              current_period_end: subscriptionData.current_period_end,
                              trial_ends_at: subscriptionData.trial_ends_at
                            });
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
            })
            .catch((err) => {
              console.error('⚠️ Erro ao verificar aprovação:', err);
              // Em caso de erro, permitir acesso (não bloquear)
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
          setLoading(false); // ✅ Liberar loading imediatamente para redirecionar rápido
          
          console.log('👤 [FAST] Usuário logado, carregando tenant em background...');
          
          // ✅ Carregar tenant em background (não bloqueia redirecionamento)
          loadRealTenant(session.user.id)
            .then((tenantData) => {
              if (tenantData && tenantData.id) {
                console.log('✅ [FAST] Tenant carregado:', tenantData.name, 'ID:', tenantData.id);
                setTenant(tenantData);
                
                // Carregar subscription em background
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
                    console.warn('⚠️ [FAST] Subscription não carregada (não crítico):', err);
                  });
              } else {
                console.warn('⚠️ [FAST] Tenant não encontrado após tentativas');
              }
            })
            .catch((error) => {
              console.error('❌ [FAST] Erro ao carregar tenant:', error);
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
      
      // Buscar subscription do banco com cache busting
      const cacheBuster = `_=${Date.now()}`;
      const response = await fetch(`/next_api/subscriptions?tenant_id=${tenant.id}&${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔍 [refreshSubscription] Resultado da busca:', {
          success: result.success,
          hasData: !!result.data,
          message: result.message
        });
        
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
          return; // IMPORTANTE: retornar aqui para não tentar criar
        } else {
          console.log('⚠️ Nenhuma subscription encontrada na resposta. Mensagem:', result.message);
          console.log('⚠️ Verificando se realmente não existe antes de criar...');
          // Tentar criar subscription automaticamente via API
          try {
            const createResponse = await fetch('/next_api/subscriptions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tenant_id: tenant.id,
                plan_id: null, // Deixar API escolher o plano padrão
                status: 'trial'
              })
            });
            
            const createResult = await createResponse.json();
            
            if (createResponse.ok && createResult.success && createResult.data) {
              const subData = createResult.data;
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
              
              console.log('✅ Subscription criada automaticamente:', subscriptionData);
              setSubscription(subscriptionData);
              return;
            } else {
              const errorMessage = createResult?.error || createResult?.message || 'Erro desconhecido ao criar subscription';
              console.error('❌ Erro ao criar subscription:', {
                status: createResponse.status,
                statusText: createResponse.statusText,
                result: createResult,
                error: errorMessage
              });
              // Não lançar erro, apenas logar - o sistema pode funcionar sem subscription
            }
          } catch (createError: any) {
            const errorDetails = {
              message: createError?.message || 'Erro desconhecido',
              name: createError?.name || 'Error',
              stack: createError?.stack,
              toString: createError?.toString?.() || String(createError)
            };
            console.error('❌ Erro ao tentar criar subscription:', errorDetails);
            // Não lançar erro, apenas logar - o sistema pode funcionar sem subscription
          }
          
          // Se não conseguiu criar, usar subscription padrão com trial de 7 dias
          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + 7);
          
          setSubscription({
            id: '00000000-0000-0000-0000-000000000000',
            plan: {
              id: 'trial',
              name: 'Trial Gratuito',
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
            trial_ends_at: trialEndDate.toISOString(),
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

