// Global error handler para promises rejeitadas não tratadas
export function setupGlobalErrorHandlers() {
  // Handler para promises rejeitadas não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevenir que o erro apareça como [object Object]
    if (event.reason && typeof event.reason === 'object') {
      const errorMessage = event.reason?.message || 
                          event.reason?.toString() || 
                          'Erro não tratado';
      console.error('Error details:', errorMessage);
    }
    
    // Prevenir o comportamento padrão (que mostra [object Object])
    event.preventDefault();
  });

  // Handler para erros JavaScript não tratados
  window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    
    if (event.error && typeof event.error === 'object') {
      const errorMessage = event.error?.message || 
                          event.error?.toString() || 
                          'Erro JavaScript não tratado';
      console.error('Error details:', errorMessage);
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

