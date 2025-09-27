'use client';

import { useEffect } from 'react';
import { setupGlobalErrorHandlers } from '@/lib/error-handler';

export function ErrorHandler() {
  useEffect(() => {
    // Configurar handlers globais de erro
    setupGlobalErrorHandlers();
  }, []);

  return null; // Este componente não renderiza nada
}

