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
    id: 'default-tenant',
    name: 'Empresa JUGA',
    status: 'trial',
    trial_ends_at: '2025-10-24T00:00:00Z'
  }), []);

  const mockMembership: UserMembership = useMemo(() => ({
    id: 'mock-membership',
    user_id: 'mock-user',
    tenant_id: 'default-tenant',
    role: 'owner',
    is_active: true,
    tenant: mockTenant
  }), [mockTenant]);

  const loadUserData = useCallback(async (user: User) => {
    try {
      setCurrentTenant(mockTenant);
      setMemberships([mockMembership]);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setCurrentTenant(mockTenant);
      setMemberships([mockMembership]);
    }
  }, [mockTenant, mockMembership]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserData(session.user);
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserData(session.user);
      } else {
        setCurrentTenant(null);
        setMemberships([]);
      }

      setLoading(false);

      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase, loadUserData]);

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