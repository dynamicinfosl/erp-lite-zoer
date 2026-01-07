/**
 * Wrapper seguro para fetch que detecta HTML antes de tentar fazer parse de JSON
 * Use este wrapper em vez de fetch() diretamente para evitar erros de parse
 */

interface SafeFetchOptions extends RequestInit {
  skipHtmlCheck?: boolean; // Para casos onde você espera HTML
}

/**
 * Wrapper para fetch que detecta respostas HTML e previne erros de parse JSON
 */
export async function safeFetch(
  input: RequestInfo | URL,
  init?: SafeFetchOptions
): Promise<Response> {
  const response = await fetch(input, init);
  
  // Se skipHtmlCheck estiver ativo, retornar a resposta diretamente
  if (init?.skipHtmlCheck) {
    return response;
  }
  
  // Apenas verificar se for rota de API
  const url = typeof input === 'string' ? input : (input as Request).url || '';
  if (url.includes('/next_api/') || url.includes('/api/')) {
    // Clonar a resposta para verificar sem consumir o stream original
    const clonedResponse = response.clone();
    
    try {
      const text = await clonedResponse.text();
      
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        console.error('❌ [safeFetch] Resposta HTML detectada:', {
          url,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          preview: text.substring(0, 500)
        });
        
        // Criar uma nova resposta com erro JSON em vez de HTML
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
      console.warn('⚠️ [safeFetch] Erro ao verificar HTML:', error);
    }
  }
  
  // Retornar a resposta original se não for HTML
  return response;
}

/**
 * Helper para fazer fetch e parse JSON com segurança
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: SafeFetchOptions
): Promise<T> {
  const response = await safeFetch(input, init);
  
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  
  // Verificar novamente se é HTML (caso o safeFetch não tenha capturado)
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    console.error('❌ [safeFetchJson] Resposta HTML detectada após safeFetch:', {
      url: typeof input === 'string' ? input : input.toString(),
      preview: text.substring(0, 300)
    });
    
    throw new Error('O servidor retornou HTML em vez de JSON. A rota de API pode não existir ou estar com erro.');
  }
  
  // Tentar fazer parse do JSON
  try {
    return JSON.parse(text) as T;
  } catch (parseError) {
    console.error('❌ [safeFetchJson] Erro ao parsear JSON:', parseError);
    console.error('❌ [safeFetchJson] Texto recebido:', text.substring(0, 500));
    throw new Error('Resposta inválida do servidor (JSON malformado)');
  }
}

