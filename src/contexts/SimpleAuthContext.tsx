'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

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
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, companyName: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  refreshTenant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
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
        // Fallback com ID padrão
        setTenant({
          id: 'default',
          name: userName,
          status: 'trial',
        });
        console.log('⚠️ Usando tenant padrão:', userName);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar tenant:', error);
      const userName = user?.email?.split('@')[0] || 'Meu Negócio';
      setTenant({
        id: 'default',
        name: userName,
        status: 'trial',
      });
    }
  };

  // Carregar sessão inicial - SUPER SIMPLES
  useEffect(() => {
    // Definir loading como false IMEDIATAMENTE
    setLoading(false);
    
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Só carregar tenant se houver usuário logado
        if (session?.user) {
          loadTenant(session.user.id).catch(err => {
            console.error('Erro ao carregar tenant:', err);
          });
        }
      } catch (error) {
        console.error('Erro ao inicializar auth:', error);
      }
    };

    // Executar em background (não espera)
    initAuth();

    // Listener de mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Carregar tenant em background (não bloqueia)
        loadTenant(session.user.id).catch(err => {
          console.error('Erro ao carregar tenant:', err);
        });
      } else {
        setTenant(null);
      }
    });

    return () => subscription.unsubscribe();
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
    router.push('/login');
  };

  const refreshTenant = async () => {
    if (user) {
      await loadTenant(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      tenant,
      loading,
      signIn,
      signUp,
      signOut,
      refreshTenant,
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

