/**
 * Função utilitária para fazer parse seguro de JSON de uma Response
 * Verifica o content-type antes de tentar fazer parse
 */
export async function safeJsonParse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  
  // Se não for JSON, retornar erro
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    const preview = text.substring(0, 200);
    console.error('❌ Resposta não é JSON. Content-Type:', contentType);
    console.error('❌ Preview da resposta:', preview);
    throw new Error(`Resposta inválida: esperado JSON mas recebido ${contentType}`);
  }
  
  // Tentar fazer parse do JSON
  try {
    const json = await response.json();
    return json as T;
  } catch (parseError) {
    const text = await response.text();
    const preview = text.substring(0, 200);
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

