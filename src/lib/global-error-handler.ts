/**
 * Handler global para erros de parse JSON
 * Captura erros "Unexpected token '<'" e fornece informações úteis
 */

if (typeof window !== 'undefined') {
  // Interceptar erros não capturados
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message) {
      const message = event.error.message;
      
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

