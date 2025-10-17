import { createClient } from '@supabase/supabase-js';
import { PlanLimits, PlanUsage } from '@/hooks/usePlanLimits';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificar se as variáveis estão definidas
if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis do Supabase não configuradas em plan-utils:', {
    url: !!supabaseUrl,
    key: !!supabaseKey
  });
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface PlanValidationResult {
  canProceed: boolean;
  reason?: string;
  limitExceeded?: boolean;
  trialExpired?: boolean;
}

/**
 * Verifica se o tenant pode realizar uma operação baseada no plano
 */
export async function validatePlanLimits(
  tenantId: string,
  operation: 'create_customer' | 'create_product' | 'create_user' | 'create_sale'
): Promise<PlanValidationResult> {

  try {
    if (!supabase) {
      console.error('Cliente Supabase não configurado em validatePlanLimits');
      return { canProceed: false, reason: 'Cliente Supabase não configurado' };
    }

    // Buscar subscription atual
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        status,
        trial_end,
        plan:plans(limits)
      `)
      .eq('tenant_id', tenantId)
      .single();

    if (subError) {
      console.error('Erro ao buscar subscription:', subError);
      return { canProceed: false, reason: 'Erro ao verificar plano' };
    }

    if (!subscription) {
      return { canProceed: false, reason: 'Nenhum plano ativo encontrado' };
    }

    // Verificar se trial expirou
    if (subscription.status === 'trial' && subscription.trial_end) {
      const trialEnd = new Date(subscription.trial_end);
      if (trialEnd < new Date()) {
        return { 
          canProceed: false, 
          reason: 'Período de teste expirado. Faça upgrade do seu plano.',
          trialExpired: true 
        };
      }
    }

    // Verificar se plano está ativo
    if (subscription.status !== 'trial' && subscription.status !== 'active') {
      return { 
        canProceed: false, 
        reason: 'Plano inativo. Entre em contato com o suporte.',
        limitExceeded: true 
      };
    }

    // Buscar uso atual
    const usage = await getCurrentUsage(tenantId);
    const plan = Array.isArray(subscription.plan) ? subscription.plan[0] : subscription.plan;
    const limits = plan?.limits;

    if (!limits) {
      return { canProceed: false, reason: 'Limites do plano não encontrados' };
    }

    // Verificar limites específicos
    switch (operation) {
      case 'create_customer':
        if (limits.max_customers !== -1 && usage.customers >= limits.max_customers) {
          return { 
            canProceed: false, 
            reason: `Limite de ${limits.max_customers} clientes atingido. Faça upgrade do seu plano.`,
            limitExceeded: true 
          };
        }
        break;

      case 'create_product':
        if (limits.max_products !== -1 && usage.products >= limits.max_products) {
          return { 
            canProceed: false, 
            reason: `Limite de ${limits.max_products} produtos atingido. Faça upgrade do seu plano.`,
            limitExceeded: true 
          };
        }
        break;

      case 'create_user':
        if (limits.max_users !== -1 && usage.users >= limits.max_users) {
          return { 
            canProceed: false, 
            reason: `Limite de ${limits.max_users} usuários atingido. Faça upgrade do seu plano.`,
            limitExceeded: true 
          };
        }
        break;

      case 'create_sale':
        if (limits.max_sales_per_month !== -1 && usage.sales_this_month >= limits.max_sales_per_month) {
          return { 
            canProceed: false, 
            reason: `Limite de ${limits.max_sales_per_month} vendas por mês atingido. Faça upgrade do seu plano.`,
            limitExceeded: true 
          };
        }
        break;
    }

    return { canProceed: true };

  } catch (error) {
    console.error('Erro na validação do plano:', error);
    return { canProceed: false, reason: 'Erro interno na verificação do plano' };
  }
}

/**
 * Busca o uso atual do tenant
 */
export async function getCurrentUsage(tenantId: string): Promise<PlanUsage> {

  try {
    if (!supabase) {
      console.error('Cliente Supabase não configurado em getCurrentUsage');
      return {
        users: 0,
        customers: 0,
        products: 0,
        sales_this_month: 0,
      };
    }

    const [usersResult, customersResult, productsResult, salesResult] = await Promise.all([
      // Contar usuários ativos
      supabase
        .from('user_memberships')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('is_active', true),
      
      // Contar clientes
      supabase
        .from('customers')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId),
      
      // Contar produtos
      supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId),
      
      // Contar vendas do mês atual
      supabase
        .from('sales')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ]);

    return {
      users: usersResult.count || 0,
      customers: customersResult.count || 0,
      products: productsResult.count || 0,
      sales_this_month: salesResult.count || 0,
    };

  } catch (error) {
    console.error('Erro ao buscar uso atual:', error);
    return {
      users: 0,
      customers: 0,
      products: 0,
      sales_this_month: 0,
    };
  }
}

/**
 * Cria uma subscription para um tenant
 */
export async function createSubscription(
  tenantId: string,
  planId: string,
  status: 'trial' | 'active' = 'trial'
): Promise<{ success: boolean; error?: string }> {

  try {
    if (!supabase) {
      return { success: false, error: 'Cliente Supabase não configurado' };
    }

    const trialEndsAt = status === 'trial' 
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 dias
      : null;

    const { error } = await supabase
      .from('subscriptions')
      .insert({
        tenant_id: tenantId,
        plan_id: planId,
        status,
        trial_ends_at: trialEndsAt,
        current_period_start: new Date().toISOString(),
        current_period_end: status === 'active' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
          : null,
      });

    if (error) {
      console.error('Erro ao criar subscription:', error);
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('Erro ao criar subscription:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Atualiza o plano de um tenant
 */
export async function updateTenantPlan(
  tenantId: string,
  newPlanId: string
): Promise<{ success: boolean; error?: string }> {

  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan_id: newPlanId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        trial_ends_at: null, // Remove trial ao fazer upgrade
      })
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Erro ao atualizar plano:', error);
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Formata preço em reais
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

/**
 * Calcula desconto anual
 */
export function calculateYearlyDiscount(monthlyPrice: number, yearlyPrice: number): number {
  const monthlyTotal = monthlyPrice * 12;
  const discount = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100;
  return Math.round(discount);
}

