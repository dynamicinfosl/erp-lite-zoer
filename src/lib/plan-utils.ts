import { createClient } from '@supabase/supabase-js';
import { PlanLimits, PlanUsage } from '@/hooks/usePlanLimits';

// Criar instância do Supabase para uso no servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    // Para vendas, permitir sempre (modo trial/desenvolvimento)
    if (operation === 'create_sale') {
      return { canProceed: true };
    }

    // Buscar subscription atual
    console.log(`🔍 Validando plano para tenant: ${tenantId}, operação: ${operation}`);
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        status,
        trial_end,
        trial_ends_at,
        current_period_end,
        plan:plans(limits)
      `)
      .eq('tenant_id', tenantId)
      .single();

    if (subError) {
      console.log('⚠️ Subscription não encontrada, permitindo operação (modo trial):', subError.message);
      return { canProceed: true };
    }

    if (!subscription) {
      console.log('⚠️ Nenhum plano encontrado, permitindo operação (modo trial)');
      return { canProceed: true };
    }

    console.log('📦 Subscription encontrada:', {
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      plan: subscription.plan
    });

    const now = new Date();

    // Verificar se trial expirou (verificar ambos os campos para compatibilidade)
    const trialEndDate = subscription.trial_end || subscription.trial_ends_at;
    if (subscription.status === 'trial' && trialEndDate) {
      const trialEnd = new Date(trialEndDate);
      if (trialEnd < now) {
        return { 
          canProceed: false, 
          reason: 'Período de teste expirado. Faça upgrade do seu plano.',
          trialExpired: true 
        };
      }
    }

    // Verificar se plano ativo expirou (current_period_end)
    if (subscription.status === 'active') {
      if (subscription.current_period_end) {
        const periodEnd = new Date(subscription.current_period_end);
        if (periodEnd < now) {
          return { 
            canProceed: false, 
            reason: 'Plano expirado. Entre em contato com o suporte para renovar.',
            trialExpired: true 
          };
        }
        // Se chegou aqui, plano está ativo e válido - continuar para verificar limites
      } else {
        // Plano ativo mas sem data de expiração - permitir (pode ser plano ilimitado)
        console.log('⚠️ Plano ativo sem current_period_end, permitindo operação');
      }
    }

    // Verificar se plano está inativo
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

    console.log('📊 Limites do plano:', limits);
    console.log('📈 Uso atual:', usage);

    if (!limits) {
      console.warn('⚠️ Limites do plano não encontrados, permitindo operação');
      return { canProceed: true }; // Permitir se não há limites definidos
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

    const trialEndsAt = status === 'trial' 
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
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
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
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

