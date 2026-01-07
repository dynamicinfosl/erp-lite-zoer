/**
 * Inicialização imediata do interceptor de fetch
 * Este arquivo é executado assim que é importado, antes mesmo do React inicializar
 */

import { setupFetchInterceptor } from './fetch-interceptor';

// Executar imediatamente se estiver no browser
if (typeof window !== 'undefined') {
  // Executar imediatamente
  setupFetchInterceptor();
  
  // Também executar quando o DOM estiver pronto (backup)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupFetchInterceptor();
    });
  } else {
    // DOM já está pronto, executar imediatamente
    setupFetchInterceptor();
  }
  
  // Executar também quando a página estiver totalmente carregada (backup extra)
  window.addEventListener('load', () => {
    setupFetchInterceptor();
  });
}

