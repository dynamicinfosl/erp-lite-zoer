// Global error handler para promises rejeitadas não tratadas
export function setupGlobalErrorHandlers() {
  // Import dinâmico do toast para evitar problemas de SSR
  let toast: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    toast = require('sonner').toast;
  } catch {}
  // Handler para promises rejeitadas não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevenir que o erro apareça como [object Object]
    const errorMessage = getErrorMessage(event.reason);
    console.error('Error details:', errorMessage);
    if (toast) {
      toast.error(errorMessage);
    }
    
    // Prevenir o comportamento padrão (que mostra [object Object]) apenas em produção
    if (process.env.NODE_ENV === 'production') {
      event.preventDefault();
    }
  });

  // Handler para erros JavaScript não tratados
  window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    
    const errorMessage = getErrorMessage(event.error);
    console.error('Error details:', errorMessage);
    if (toast) {
      toast.error(errorMessage);
    }
  });
}

// Função para converter qualquer erro em string legível
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.toString && typeof error.toString === 'function') {
    return error.toString();
  }
  
  return 'Erro desconhecido';
}

