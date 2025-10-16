'use client';

import React, { useEffect } from 'react';

interface ForceLoadingFixProps {
  children: React.ReactNode;
}

export function ForceLoadingFix({ children }: ForceLoadingFixProps) {
  useEffect(() => {
    // Forçar parada do loading após 2 segundos máximo
    const forceStopLoading = setTimeout(() => {
      // Remover qualquer loading spinner que possa estar travado
      const loadingElements = document.querySelectorAll('[data-loading="true"]');
      loadingElements.forEach(element => {
        element.removeAttribute('data-loading');
        element.style.display = 'none';
      });

      // Log para debug
      console.log('🔧 ForceLoadingFix: Loading forçado a parar após 2s');
    }, 2000);

    return () => clearTimeout(forceStopLoading);
  }, []);

  return <>{children}</>;
}

