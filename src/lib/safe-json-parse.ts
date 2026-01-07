/**
 * Função utilitária para fazer parse seguro de JSON de uma Response
 * Verifica o content-type e detecta HTML antes de tentar fazer parse
 */
export async function safeJsonParse<T = any>(response: Response): Promise<T> {
  // IMPORTANTE: Ler o texto primeiro para verificar se é HTML
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  
  // Verificar se a resposta é HTML (erro comum quando a rota não existe)
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    const preview = text.substring(0, 300);
    console.error('❌ Resposta é HTML em vez de JSON. Content-Type:', contentType);
    console.error('❌ Preview da resposta HTML:', preview);
    throw new Error('O servidor retornou HTML em vez de JSON. A rota de API pode não existir ou estar com erro.');
  }
  
  // Se não for JSON, retornar erro
  if (!contentType.includes('application/json')) {
    const preview = text.substring(0, 200);
    console.error('❌ Resposta não é JSON. Content-Type:', contentType);
    console.error('❌ Preview da resposta:', preview);
    throw new Error(`Resposta inválida: esperado JSON mas recebido ${contentType}`);
  }
  
  // Tentar fazer parse do JSON
  try {
    const json = JSON.parse(text);
    return json as T;
  } catch (parseError) {
    const preview = text.substring(0, 500);
    console.error('❌ Erro ao parsear JSON:', parseError);
    console.error('❌ Preview da resposta:', preview);
    throw new Error('Resposta inválida do servidor (JSON malformado)');
  }
}

/**
 * Função utilitária para fazer parse seguro de JSON com fallback
 * Retorna um objeto padrão se o parse falhar
 */
export async function safeJsonParseWithFallback<T = any>(
  response: Response,
  fallback: T
): Promise<T> {
  try {
    return await safeJsonParse<T>(response);
  } catch (error) {
    console.warn('⚠️ Erro ao parsear JSON, usando fallback:', error);
    return fallback;
  }
}

