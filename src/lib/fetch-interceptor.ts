/**
 * Interceptador global para fetch que detecta HTML antes de fazer parse JSON
 * Este arquivo deve ser importado no início da aplicação (app/layout.tsx ou similar)
 */

// Guard para evitar múltiplas inicializações
let isIntercepted = false;

/**
 * Intercepta todas as chamadas fetch() para detectar respostas HTML
 */
export function setupFetchInterceptor() {
  if (typeof window === 'undefined') {
    return;
  }

  // Se já foi interceptado, não fazer novamente
  if (isIntercepted) {
    return;
  }

  isIntercepted = true;
  const originalFetch = window.fetch;

  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    try {
      const response = await originalFetch(input, init);
      const url = typeof input === 'string' ? input : (input as Request).url || '';
      
      // Apenas interceptar rotas de API
      if (!url || (!url.includes('/next_api/') && !url.includes('/api/'))) {
        return response;
      }
      
      // Verificar o content-type primeiro (mais rápido)
      const contentType = response.headers.get('content-type') || '';
      
      // Se já é JSON, não precisa verificar HTML
      if (contentType.includes('application/json')) {
        return response;
      }
      
      // Clonar a resposta para verificar sem consumir o stream original
      const clonedResponse = response.clone();
      
      try {
        const text = await clonedResponse.text();
        
        // Verificar se é HTML
        const trimmedText = text.trim();
        if (trimmedText.startsWith('<!DOCTYPE') || trimmedText.startsWith('<html')) {
          console.error('❌ [Fetch Interceptor] Resposta HTML detectada em rota de API:', {
            url,
            status: response.status,
            statusText: response.statusText,
            contentType,
            preview: text.substring(0, 500),
            fullUrl: url
          });
          
          // Retornar erro JSON em vez de HTML
          const errorJson = JSON.stringify({
            success: false,
            error: 'O servidor retornou HTML em vez de JSON. A rota de API pode não existir ou estar com erro.',
            errorCode: 'HTML_RESPONSE',
            status: response.status,
            url
          });
          
          return new Response(errorJson, {
            status: response.status || 500,
            statusText: 'HTML Response Error',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }
      } catch (error) {
        // Se houver erro ao ler o texto, retornar a resposta original
        console.warn('⚠️ [Fetch Interceptor] Erro ao verificar HTML:', error);
      }
      
      return response;
    } catch (fetchError) {
      // Filtrar erros de cancelamento esperados (quando componente é desmontado)
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      const errorName = fetchError instanceof Error ? fetchError.name : '';
      
      // Não logar erros de cancelamento esperados
      if (
        errorName === 'AbortError' ||
        errorMessage.includes('aborted') ||
        errorMessage.includes('cancelled') ||
        errorMessage.includes('Component unmounted') ||
        errorMessage.includes('Request timeout')
      ) {
        // Silenciosamente propagar o erro sem logar
        throw fetchError;
      }
      
      // Se houver erro na chamada fetch original, propagar
      console.error('❌ [Fetch Interceptor] Erro na chamada fetch:', fetchError);
      throw fetchError;
    }
  };

  console.log('✅ Fetch interceptor configurado');
}

