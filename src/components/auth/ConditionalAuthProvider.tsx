'use client';

import React from 'react';
import { AuthProvider } from './AuthProvider';
import { SupabaseAuthProvider } from './SupabaseAuthProvider';
import { ENABLE_AUTH } from '@/constants/auth';

interface ConditionalAuthProviderProps {
  children: React.ReactNode;
}

export function ConditionalAuthProvider({ children }: ConditionalAuthProviderProps) {
  if (ENABLE_AUTH) {
    // Usar Supabase para autenticação real
    return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
  }
  
  return <>{children}</>;
}
