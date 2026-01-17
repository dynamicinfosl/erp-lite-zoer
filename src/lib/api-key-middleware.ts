// Middleware para validação de API Keys em endpoints públicos
import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey, checkApiKeyPermission } from './api-key-utils';

export interface ApiKeyContext {
  tenant_id: string;
  api_key_id: string;
  permissions: string[];
}

/**
 * Middleware para validar API Key do header X-API-Key
 * Extrai tenant_id e adiciona ao contexto da requisição
 */
export function withApiKeyAuth(
  handler: (
    request: NextRequest,
    context: ApiKeyContext
  ) => Promise<NextResponse>,
  requiredPermission?: string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Extrair API key do header
      const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');

      if (!apiKey) {
        return NextResponse.json(
          {
            success: false,
            error: 'API Key não fornecida',
            message: 'É necessário fornecer uma API Key no header X-API-Key',
          },
          { status: 401 }
        );
      }

      // Verificar API key
      const keyData = await verifyApiKey(apiKey);

      if (!keyData) {
        return NextResponse.json(
          {
            success: false,
            error: 'API Key inválida',
            message: 'A API Key fornecida é inválida, expirada ou foi revogada',
          },
          { status: 401 }
        );
      }

      // Verificar permissão específica se requerida
      if (requiredPermission) {
        const hasPermission = await checkApiKeyPermission(apiKey, requiredPermission);
        if (!hasPermission) {
          return NextResponse.json(
            {
              success: false,
              error: 'Permissão insuficiente',
              message: `Esta operação requer a permissão: ${requiredPermission}`,
            },
            { status: 403 }
          );
        }
      }

      // Criar contexto com dados da API key
      const context: ApiKeyContext = {
        tenant_id: keyData.tenant_id,
        api_key_id: keyData.id,
        permissions: keyData.permissions,
      };

      // Executar handler com contexto
      return await handler(request, context);
    } catch (error) {
      console.error('❌ Erro no middleware de API key:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro interno do servidor',
          message: error instanceof Error ? error.message : 'Erro desconhecido',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Extrai tenant_id de uma API key validada
 * Útil para endpoints que precisam apenas do tenant_id
 */
export async function getTenantIdFromApiKey(request: NextRequest): Promise<string | null> {
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
  if (!apiKey) {
    return null;
  }

  const keyData = await verifyApiKey(apiKey);
  return keyData?.tenant_id || null;
}
