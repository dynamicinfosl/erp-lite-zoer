import { useEffect, useState } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';

export function useAuthLoading() {
  const { loading: authLoading, tenant, user } = useSimpleAuth();

  // Simplificar: só mostrar loading se o contexto ainda está carregando
  const isLoading = authLoading;
  const hasUser = !!user;
  const hasTenant = !!tenant;

  return {
    isLoading,
    hasUser,
    hasTenant,
    isAuthenticated: !!user,
  };
}
