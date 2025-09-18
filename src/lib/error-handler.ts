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
    // Alguns erros comuns (rede/refresh de sessão)
    const reason: any = event.reason;
    let message = getErrorMessage(reason);

    const isNetworkError =
      typeof reason === 'object' && (
        /Failed to fetch/i.test(String(reason?.message || '')) ||
        /TypeError: Failed to fetch/i.test(String(reason)) ||
        /NetworkError/i.test(String(reason))
      );

    const isSupabaseRefresh =
      typeof reason === 'object' && (
        /refresh/i.test(String(reason?.message || '')) ||
        /AuthRetryableFetchError/i.test(String(reason?.name || ''))
      );

    if (isNetworkError || isSupabaseRefresh) {
      message = 'Falha de rede/autenticação. Verifique sua conexão e sessão. Tente recarregar ou fazer login novamente.';
    }

    console.error('Unhandled promise rejection:', reason);
    console.error('Error details:', message);
    if (toast) {
      toast.error(message);
    }

    // Suprimir o overlay do Next em dev e prod
    event.preventDefault();
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
  
  // Se for um objeto simples, tentar serializar para JSON para evitar [object Object]
  if (typeof error === 'object' && error !== null) {
    try {
      const json = JSON.stringify(error);
      if (json && json !== '{}') {
        return json;
      }
    } catch {}
    // como fallback, mostrar chaves conhecidas ou o tipo
    const knownFields = ['code', 'status', 'statusText', 'error', 'reason'];
    const summary = knownFields
      .map((k) => (error as Record<string, unknown>)[k])
      .filter((v) => v !== undefined)
      .join(' - ');
    if (summary) return String(summary);
    return Object.prototype.toString.call(error);
  }

  if (error?.toString && typeof error.toString === 'function') {
    return error.toString();
  }
  
  return 'Erro desconhecido';
}

