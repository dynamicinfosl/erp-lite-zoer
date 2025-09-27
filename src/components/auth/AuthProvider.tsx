'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '@/types/auth';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { ENABLE_AUTH } from "@/constants/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, passcode: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      await api.post('/auth/login', { email, password });
      await refreshUser();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, passcode: string)  => {
    try {
      await api.post('/auth/register', { 
        email, 
        password, 
        passcode, 
      });
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
      router.push('/');
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.get('/auth/user');
      setUser(userData);
    } catch (error) {
      setUser(null);
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ENABLE_AUTH) {
      setIsLoading(false);
      return;
    }
    refreshUser();
  }, [refreshUser]);

  if (!ENABLE_AUTH) {
    // Quando autenticação está desabilitada, fornecer um contexto vazio
    const mockValue = {
      user: null,
      isLoading: false,
      login: async () => {},
      register: async () => {},
      logout: async () => {},
      refreshUser: async () => {},
    };
    
    return (
      <AuthContext.Provider value={mockValue}>
        {children}
      </AuthContext.Provider>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}