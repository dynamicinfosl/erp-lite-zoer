'use client';

import { useEffect } from 'react';
import { setupFetchInterceptor } from '@/lib/fetch-interceptor';

/**
 * Componente que configura o interceptor de fetch no lado do cliente
 * Deve ser usado no layout principal da aplicação
 */
export function FetchInterceptorSetup() {
  useEffect(() => {
    setupFetchInterceptor();
  }, []);

  return null; // Componente não renderiza nada
}

