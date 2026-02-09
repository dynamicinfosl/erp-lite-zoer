/**
 * Handler global para erros de parse JSON
 * Captura erros "Unexpected token '<'" e fornece informações úteis
 */

if (typeof window !== 'undefined') {
  const handleChunkLoadError = (message?: string) => {
    if (!message) return false;

    const isChunkError =
      message.includes('ChunkLoadError') ||
      message.includes('Loading chunk') ||
      message.includes('Failed to fetch dynamically imported module');

    if (!isChunkError) return false;

    // Evitar loop de reload
    const key = 'chunk-load-reload-at';
    const lastReloadAt = Number(sessionStorage.getItem(key) || 0);
    const now = Date.now();

    if (now - lastReloadAt < 60_000) {
      return true;
    }

    sessionStorage.setItem(key, String(now));
    console.warn('⚠️ [Global Error Handler] ChunkLoadError detectado. Recarregando...');
    window.location.reload();
    return true;
  };

  // Interceptar erros não capturados
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message) {
      const message = event.error.message;

      if (handleChunkLoadError(message)) {
        return;
      }
      
      // Verificar se é o erro de parse JSON com HTML
      if (message.includes("Unexpected token '<'") || 
          message.includes("<!DOCTYPE") ||
          message.includes("is not valid JSON")) {
        
        console.error('❌ [Global Error Handler] Erro de parse JSON detectado:', {
          message: event.error.message,
          stack: event.error.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
        
        // Não prevenir o comportamento padrão, apenas logar
        // O interceptor de fetch deve ter tratado isso, mas se não tratou, logamos aqui
      }
    }
  });

  // Interceptar promessas rejeitadas não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message) {
      const message = event.reason.message;

      if (handleChunkLoadError(message)) {
        return;
      }
      
      // Verificar se é o erro de parse JSON com HTML
      if (message.includes("Unexpected token '<'") || 
          message.includes("<!DOCTYPE") ||
          message.includes("is not valid JSON")) {
        
        console.error('❌ [Global Error Handler] Promise rejeitada com erro de parse JSON:', {
          message: event.reason.message,
          stack: event.reason.stack
        });
        
        // Não prevenir o comportamento padrão, apenas logar
      }
    }
  });
}

