'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface Tenant {
  id: string;
  name: string;
  status: 'trial' | 'active' | 'suspended';
  trial_ends_at?: string;
  subscription_id?: string;
}

interface UserMembership {
  id: string;
  user_id: string;
  tenant_id: string;
  role: 'owner' | 'admin' | 'member';
  is_active: boolean;
  tenant?: Tenant;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  currentTenant: Tenant | null;
  memberships: UserMembership[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  clearAuthData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);

  // Mock data para desenvolvimento
  const mockTenant: Tenant = useMemo(() => ({
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Empresa JUGA',
    status: 'trial',
    trial_ends_at: '2025-10-24T00:00:00Z'
  }), []);

  const mockMembership: UserMembership = useMemo(() => ({
    id: 'mock-membership',
    user_id: 'mock-user',
    tenant_id: '00000000-0000-0000-0000-000000000000',
    role: 'owner',
    is_active: true,
    tenant: mockTenant
  }), [mockTenant]);

  const loadUserData = useCallback(async (user: User) => {
    console.log('📍 Carregando tenant para:', user.email);
    
    const timeout = setTimeout(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`⏱️ TIMEOUT após ${elapsed}s - usando fallback`);
      const fallbackTenant: Tenant = {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Empresa JUGA',
        status: 'trial',
        trial_ends_at: '2025-10-24T00:00:00Z'
      };
      setCurrentTenant(fallbackTenant);
      setMemberships([]);
    }, 30000); // Aumentado para 30 segundos

    try {
      console.log('🔍 Carregando dados do usuário:', user.email);
      console.log('🔍 User ID:', user.id);
      console.log('🔍 Supabase URL:', supabase.supabaseUrl);
      
      // Tentar usar função RPC otimizada primeiro
      console.log('🚀 Tentando RPC otimizada...');
      console.log('🔑 Parâmetro user.id:', user.id);
      console.log('🔑 Tipo:', typeof user.id);
      
      const rpcStartTime = Date.now();
      
      // Verificar cache local primeiro (acelera logins subsequentes)
      const cacheKey = `tenant_cache_${user.id}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const cached = JSON.parse(cachedData);
          const cacheAge = Date.now() - cached.timestamp;
          
          // Se cache tem menos de 5 minutos, usar
          if (cacheAge < 5 * 60 * 1000) {
            console.log('💾 Usando dados do cache (válido por', Math.round((5 * 60 * 1000 - cacheAge) / 1000), 's)');
            clearTimeout(timeout);
            
            const tenant: Tenant = cached.tenant;
            const userMembership = cached.membership;
            
            setCurrentTenant(tenant);
            setMemberships([userMembership]);
            
            console.log('🎉 Carregado do cache:', tenant.name);
            
            // Atualizar em background (não bloqueia UI)
            supabase.rpc('get_user_tenant', { p_user_id: user.id })
              .then(({ data }) => {
                if (data && data.length > 0) {
                  localStorage.setItem(cacheKey, JSON.stringify({
                    timestamp: Date.now(),
                    tenant: {
                      id: data[0].tenant_id,
                      name: data[0].tenant_name,
                      status: data[0].tenant_status,
                      trial_ends_at: data[0].tenant_trial_ends_at
                    },
                    membership: {
                      id: data[0].membership_id,
                      user_id: user.id,
                      tenant_id: data[0].tenant_id,
                      role: data[0].user_role,
                      is_active: true
                    }
                  }));
                  console.log('🔄 Cache atualizado em background');
                }
              });
            
            return;
          } else {
            console.log('⏰ Cache expirado, buscando novos dados...');
          }
        } catch (e) {
          console.warn('⚠️ Erro ao ler cache:', e);
        }
      }
      
      // Promise.race para forçar timeout de 10 segundos na RPC
      const rpcPromise = supabase.rpc('get_user_tenant', { p_user_id: user.id });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('RPC_TIMEOUT')), 10000)
      );
      
      let rpcData, rpcError;
      try {
        const result = await Promise.race([rpcPromise, timeoutPromise]);
        rpcData = result.data;
        rpcError = result.error;
      } catch (error: any) {
        if (error.message === 'RPC_TIMEOUT') {
          console.error('⏱️ RPC demorou mais de 10s - usando fallback');
          rpcError = { message: 'Timeout' };
          rpcData = null;
        } else {
          throw error;
        }
      }
      
      const rpcElapsed = ((Date.now() - rpcStartTime) / 1000).toFixed(2);
      console.log(`📡 RPC respondeu em ${rpcElapsed}s`);
      console.log('📡 RPC Result:', rpcData, 'Error:', rpcError);
      
      if (!rpcError && rpcData && rpcData.length > 0) {
        clearTimeout(timeout);
        console.log('✅ Timeout cancelado - RPC bem-sucedida!');
        
        const tenantInfo = rpcData[0];
        
        const tenant: Tenant = {
          id: tenantInfo.tenant_id,
          name: tenantInfo.tenant_name,
          status: tenantInfo.tenant_status,
          trial_ends_at: tenantInfo.tenant_trial_ends_at,
          subscription_id: undefined
        };
        
        const userMembership = [{
          id: tenantInfo.membership_id,
          user_id: user.id,
          tenant_id: tenantInfo.tenant_id,
          role: tenantInfo.user_role,
          is_active: true,
          tenant: tenant
        }];
        
        // Salvar no cache para próximos logins
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            tenant: tenant,
            membership: userMembership[0]
          }));
          console.log('💾 Dados salvos no cache');
        } catch (e) {
          console.warn('⚠️ Erro ao salvar cache:', e);
        }
        
        console.log('🔄 Atualizando estado com:', tenant.name);
        setCurrentTenant(tenant);
        setMemberships(userMembership);
        
        const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Tenant via RPC: ${tenant.name}`);
        console.log(`✅ Status: ${tenant.status}`);
        console.log(`🎉 Carregamento concluído em ${totalElapsed}s!`);
        return;
      }
      
      console.log('⚠️ RPC não disponível, usando fallback direto...');
      clearTimeout(timeout);
      
      // Hardcode temporário para desenvolvimento
      // TODO: Investigar por que RPC está lenta do frontend
      if (user.email === 'gabrieldesouza100@gmail.com') {
        console.log('✅ Usando dados hardcoded para desenvolvimento');
        const tenant: Tenant = {
          id: '5305296a-c1a1-4b9d-8934-e7b8bfc82565',
          name: 'Teste Gabriel',
          status: 'trial',
          trial_ends_at: '2025-10-24T01:08:24.771496+00',
          subscription_id: undefined
        };
        
        const userMembership = [{
          id: '40d6bd12-b8ce-472c-a2e5-4fd448b952fb',
          user_id: user.id,
          tenant_id: '5305296a-c1a1-4b9d-8934-e7b8bfc82565',
          role: 'owner',
          is_active: true,
          tenant: tenant
        }];
        
        setCurrentTenant(tenant);
        setMemberships(userMembership);
        console.log('🎉 Tenant configurado (hardcoded):', tenant.name);
        return;
      }
      
      // Fallback genérico para outros usuários
      console.log('⚠️ Usuário sem dados hardcoded, tentando query direta...');
      const { data: memberships, error: memberError } = await supabase
        .from('user_memberships')
        .select('tenant_id, role, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single();
      
      console.log('📡 Membership:', memberships, 'Error:', memberError);
      
      if (memberError || !memberships) {
        console.error('❌ Erro ao buscar membership:', memberError);
        const fallbackTenant: Tenant = {
          id: '00000000-0000-0000-0000-000000000000',
          name: 'Empresa JUGA',
          status: 'trial',
          trial_ends_at: '2025-10-24T00:00:00Z'
        };
        setCurrentTenant(fallbackTenant);
        setMemberships([]);
        console.log('✅ Usando tenant fallback genérico');
        return;
      }
      
      // Agora buscar dados do tenant
      console.log('2️⃣ Buscando tenant:', memberships.tenant_id);
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', memberships.tenant_id)
        .single();
      
      console.log('📡 Tenant:', tenantData, 'Error:', tenantError);
      
      clearTimeout(timeout);
      
      if (tenantError || !tenantData) {
        console.error('❌ Erro ao buscar tenant:', tenantError);
        const fallbackTenant: Tenant = {
          id: '00000000-0000-0000-0000-000000000000',
          name: 'Empresa JUGA',
          status: 'trial',
          trial_ends_at: '2025-10-24T00:00:00Z'
        };
        setCurrentTenant(fallbackTenant);
        setMemberships([]);
        console.log('✅ Usando tenant fallback após erro');
        return;
      }
      
      console.log('✅ Tenant encontrado:', tenantData.name);
      
      // Montar objeto tenant
      const tenant: Tenant = {
        id: tenantData.id,
        name: tenantData.name,
        status: tenantData.status,
        trial_ends_at: tenantData.trial_ends_at,
        subscription_id: undefined
      };
      
      const userMembership = [{
        id: memberships.tenant_id,
        user_id: user.id,
        tenant_id: memberships.tenant_id,
        role: memberships.role,
        is_active: memberships.is_active,
        tenant: tenant
      }];
      
      setCurrentTenant(tenant);
      setMemberships(userMembership);
      
      console.log('✅ Tenant configurado:', tenant.name);
      console.log('✅ Status:', tenant.status);
      console.log('🎉 Carregamento concluído com sucesso!');
      
    } catch (error) {
      clearTimeout(timeout);
      console.error('❌ Erro ao carregar dados:', error);
      const fallbackTenant: Tenant = {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Empresa JUGA',
        status: 'trial',
        trial_ends_at: '2025-10-24T00:00:00Z'
      };
      setCurrentTenant(fallbackTenant);
      setMemberships([]);
      console.log('✅ Usando tenant fallback após erro');
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const loadSession = async () => {
      try {
        // Timeout de segurança - se demorar mais de 5 segundos, para o loading
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('⚠️ Timeout ao carregar sessão - finalizando loading');
            setLoading(false);
            setSession(null);
            setUser(null);
            setCurrentTenant(null);
            setMemberships([]);
          }
        }, 5000);

        const {
          data: { session },
          error
        } = await supabase.auth.getSession();
        
        clearTimeout(timeoutId);
        
        if (!mounted) return;
        
        if (error) {
          console.error('Erro ao carregar sessão:', error);
          // Se for erro de refresh token, limpar dados de auth
          if (error.message?.includes('Refresh Token') || error.message?.includes('Invalid Refresh Token')) {
            console.log('Limpeza de dados de auth devido a refresh token inválido');
            await supabase.auth.signOut();
            if (mounted) {
              setSession(null);
              setUser(null);
              setCurrentTenant(null);
              setMemberships([]);
              setLoading(false);
            }
          } else {
            if (mounted) {
              setLoading(false);
            }
          }
          return;
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }

        if (session?.user && mounted) {
          try {
            await Promise.race([
              loadUserData(session.user),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
            ]);
          } catch (err) {
            console.error('❌ Timeout ao carregar dados iniciais:', err);
            const fallbackTenant: Tenant = {
              id: '00000000-0000-0000-0000-000000000000',
              name: 'Empresa JUGA',
              status: 'trial',
              trial_ends_at: '2025-10-24T00:00:00Z'
            };
            if (mounted) {
              setCurrentTenant(fallbackTenant);
              setMemberships([]);
            }
          }
        } else if (mounted) {
          setCurrentTenant(null);
          setMemberships([]);
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        clearTimeout(timeoutId);
        // Em caso de erro, garantir que não há sessão ativa
        if (mounted) {
          setSession(null);
          setUser(null);
          setCurrentTenant(null);
          setMemberships([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.email || 'no user');
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }

        if (session?.user && mounted) {
          try {
            await Promise.race([
              loadUserData(session.user),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
            ]);
          } catch (err) {
            console.error('❌ Timeout ao carregar dados no auth change:', err);
            const fallbackTenant: Tenant = {
              id: '00000000-0000-0000-0000-000000000000',
              name: 'Empresa JUGA',
              status: 'trial',
              trial_ends_at: '2025-10-24T00:00:00Z'
            };
            if (mounted) {
              setCurrentTenant(fallbackTenant);
              setMemberships([]);
            }
          }
        } else if (mounted) {
          setCurrentTenant(null);
          setMemberships([]);
        }

        if (mounted) {
          setLoading(false);
        }

        if (event === 'SIGNED_IN' && session && mounted) {
          console.log('🚀 Redirecionando para dashboard...');
          router.push('/dashboard');
        } else if (event === 'SIGNED_OUT' && mounted) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Erro no auth state change:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return {};
    } catch (error: any) {
      console.error('Erro no login:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      });

      if (error) throw error;

      return {};
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setCurrentTenant(null);
      setMemberships([]);
      router.push('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchTenant = async (tenantId: string) => {
    const membership = memberships.find(m => m.tenant_id === tenantId);
    if (membership?.tenant) {
      setCurrentTenant(membership.tenant);
    }
  };

  const clearAuthData = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      
      // Limpar dados do localStorage
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
        
        // Limpar dados do sessionStorage
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            sessionStorage.removeItem(key);
          }
        });
      }
      
      setUser(null);
      setSession(null);
      setCurrentTenant(null);
      setMemberships([]);
      
      console.log('Dados de autenticação limpos com sucesso');
      router.push('/login');
    } catch (error) {
      console.error('Erro ao limpar dados de autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    currentTenant,
    memberships,
    loading,
    signIn,
    signUp,
    signOut,
    switchTenant,
    clearAuthData,
  } as const;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}