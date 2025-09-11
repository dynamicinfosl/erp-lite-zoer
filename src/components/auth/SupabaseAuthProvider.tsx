'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Configurar handler global para promises rejeitadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Tratar diferentes tipos de erro
      let errorMessage = 'Erro não tratado';
      
      if (event.reason === null || event.reason === undefined) {
        errorMessage = 'Promise rejeitada sem motivo';
      } else if (typeof event.reason === 'string') {
        errorMessage = event.reason;
      } else if (typeof event.reason === 'object') {
        if (event.reason.message) {
          errorMessage = event.reason.message;
        } else if (Object.keys(event.reason).length === 0) {
          errorMessage = 'Objeto vazio rejeitado';
        } else {
          errorMessage = JSON.stringify(event.reason);
        }
      }
      
      console.error('Error details:', errorMessage);
      console.error('Stack trace:', event.reason?.stack);
      
      // Não prevenir o comportamento padrão para permitir debugging
      // event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Obter sessão inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Erro ao obter sessão:', error);
        } else if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Erro ao obter sessão inicial:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          toast.success('Login realizado com sucesso!');
        } else if (event === 'SIGNED_OUT') {
          toast.success('Logout realizado com sucesso!');
        }
      }
    );

    return () => {
      mounted = false;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw new Error(error.message || 'Erro ao fazer login');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      const errorMessage = error?.message || error?.toString() || 'Erro ao fazer login';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Erro ao criar conta');
      }
      
      if (data.user) {
        toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
      } else {
        toast.success('Conta criada com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro no registro:', error);
      const errorMessage = error?.message || error?.toString() || 'Erro ao criar conta';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message || 'Erro ao fazer logout');
      }
    } catch (error: any) {
      console.error('Erro no logout:', error);
      const errorMessage = error?.message || error?.toString() || 'Erro ao fazer logout';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const user = await getCurrentUser();
      setUser(user);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}
