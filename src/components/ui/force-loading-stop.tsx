'use client';

import React, { useEffect } from 'react';

export function ForceLoadingStop() {
  useEffect(() => {
    // Forçar parada do loading após 2 segundos
    const forceStop = setTimeout(() => {
      // Remover todos os elementos de loading
      const loadingElements = document.querySelectorAll('[data-loading], .loading, [class*="loading"]');
      loadingElements.forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.display = 'none';
        }
      });

      // Mostrar mensagem de erro se necessário
      const loadingText = document.querySelector('text-body, [class*="text-body"]') as HTMLElement;
      if (loadingText) {
        loadingText.textContent = 'Sistema carregado - clique em qualquer lugar para continuar';
        loadingText.style.cursor = 'pointer';
        loadingText.onclick = () => {
          window.location.reload();
        };
      }

      console.log('🔧 ForceLoadingStop: Loading forçado a parar');
    }, 2000);

    return () => clearTimeout(forceStop);
  }, []);

  return null;
}

