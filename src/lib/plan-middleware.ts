import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validatePlanLimits } from './plan-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificar se as variáveis estão definidas
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variáveis do Supabase não configuradas:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceKey
  });
}

// Cliente com service role para operações administrativas (fallback para anon key)
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface PlanMiddlewareOptions {
  operation: 'create_customer' | 'create_product' | 'create_user' | 'create_sale';
  tenantId: string;
}

/**
 * Middleware para verificar limites do plano antes de operações
 */
export async function planMiddleware(
  request: NextRequest,
  options: PlanMiddlewareOptions
): Promise<NextResponse | null> {
  try {
    const { operation, tenantId } = options;

    // Verificar se tenantId foi fornecido
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID é obrigatório' },
        { status: 400 }
      );
    }

    // Validar limites do plano
    const validation = await validatePlanLimits(tenantId, operation);

    if (!validation.canProceed) {
      return NextResponse.json(
        { 
          error: validation.reason,
          limitExceeded: validation.limitExceeded,
          trialExpired: validation.trialExpired,
          operation
        },
        { status: 403 }
      );
    }

    // Se passou na validação, retorna null para continuar
    return null;

  } catch (error) {
    console.error('Erro no middleware de planos:', error);
    return NextResponse.json(
      { error: 'Erro interno na verificação do plano' },
      { status: 500 }
    );
  }
}

/**
 * Hook para usar em componentes React
 */
export function usePlanValidation() {
  const validateOperation = async (
    operation: 'create_customer' | 'create_product' | 'create_user' | 'create_sale',
    tenantId: string
  ) => {
    try {
      const validation = await validatePlanLimits(tenantId, operation);
      return validation;
    } catch (error) {
      console.error('Erro na validação:', error);
      return {
        canProceed: false,
        reason: 'Erro na verificação do plano'
      };
    }
  };

  return { validateOperation };
}

/**
 * Decorator para APIs que precisam verificar limites
 */
export function withPlanValidation(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  operation: 'create_customer' | 'create_product' | 'create_user' | 'create_sale'
) {
  return async (request: NextRequest, context: any) => {
    try {
      // Extrair tenantId do request (pode vir de diferentes lugares)
      const reqClone = request.clone();
      const body = await reqClone.json();
      const tenantId = body.tenant_id || context.params?.tenantId;

      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant ID é obrigatório' },
          { status: 400 }
        );
      }

      // Permitir pular validação em ambientes de desenvolvimento
      const skipValidation = process.env.NODE_ENV !== 'production'
        || process.env.NEXT_PUBLIC_DISABLE_PLAN_VALIDATION === 'true'
        || tenantId === '00000000-0000-0000-0000-000000000000';
      if (skipValidation) {
        return handler(request, context);
      }

      // Verificar limites
      const validation = await validatePlanLimits(tenantId, operation);

      if (!validation.canProceed) {
        return NextResponse.json(
          { 
            error: validation.reason,
            limitExceeded: validation.limitExceeded,
            trialExpired: validation.trialExpired
          },
          { status: 403 }
        );
      }

      // Se passou na validação, executar o handler original
      return handler(request, context);

    } catch (error) {
      console.error('Erro no decorator de validação:', error);
      return NextResponse.json(
        { error: 'Erro interno na verificação do plano' },
        { status: 500 }
      );
    }
  };
}

/**
 * Função para verificar se um tenant tem acesso a uma funcionalidade
 */
export async function checkFeatureAccess(
  tenantId: string,
  feature: string
): Promise<{ hasAccess: boolean; reason?: string }> {
  try {
    if (!supabaseAdmin) {
      return { hasAccess: false, reason: 'Cliente Supabase não configurado' };
    }

    // Buscar subscription e plano
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        status,
        trial_ends_at,
        plan:plans(features)
      `)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !subscription) {
      return { hasAccess: false, reason: 'Plano não encontrado' };
    }

    // Verificar se trial expirou
    if (subscription.status === 'trial' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      if (trialEnd < new Date()) {
        return { hasAccess: false, reason: 'Trial expirado' };
      }
    }

    // Verificar se plano está ativo
    if (subscription.status !== 'trial' && subscription.status !== 'active') {
      return { hasAccess: false, reason: 'Plano inativo' };
    }

    // Verificar se feature está disponível no plano
    const features = subscription.plan?.features || {};
    const hasFeature = features[feature] === true;

    if (!hasFeature) {
      return { hasAccess: false, reason: 'Funcionalidade não disponível no seu plano' };
    }

    return { hasAccess: true };

  } catch (error) {
    console.error('Erro ao verificar acesso à funcionalidade:', error);
    return { hasAccess: false, reason: 'Erro interno' };
  }
}

