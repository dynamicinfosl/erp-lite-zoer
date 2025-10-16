'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useNavigation() {
  const router = useRouter();

  const navigateTo = useCallback((path: string, options?: { replace?: boolean }) => {
    try {
      if (options?.replace) {
        router.replace(path);
      } else {
        router.push(path);
      }
    } catch (error) {
      console.error('Erro na navegação:', error);
      // Fallback: recarregar a página
      window.location.href = path;
    }
  }, [router]);

  const navigateToProductos = useCallback(() => {
    navigateTo('/produtos');
  }, [navigateTo]);

  const navigateToClientes = useCallback(() => {
    navigateTo('/clientes');
  }, [navigateTo]);

  const navigateToPDV = useCallback(() => {
    navigateTo('/pdv');
  }, [navigateTo]);

  const navigateToDashboard = useCallback(() => {
    navigateTo('/dashboard');
  }, [navigateTo]);

  const navigateToVendas = useCallback(() => {
    navigateTo('/vendas');
  }, [navigateTo]);

  const navigateBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      navigateTo('/dashboard');
    }
  }, [router, navigateTo]);

  return {
    navigateTo,
    navigateToProductos,
    navigateToClientes,
    navigateToPDV,
    navigateToDashboard,
    navigateToVendas,
    navigateBack,
    router
  };
}

