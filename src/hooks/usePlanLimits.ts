'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

export interface PlanLimits {
  max_users: number;
  max_customers: number;
  max_products: number;
  max_sales_per_month: number;
}

export interface PlanUsage {
  users: number;
  customers: number;
  products: number;
  sales_this_month: number;
}

export interface SubscriptionData {
  id: string;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  plan: {
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    price_yearly: number;
    features: Record<string, any>;
    limits: PlanLimits;
  };
  trial_ends_at?: string;
  current_period_end?: string;
}

export interface PlanLimitsHook {
  subscription: SubscriptionData | null;
  usage: PlanUsage;
  limits: PlanLimits | null;
  loading: boolean;
  error: string | null;
  isTrialExpired: boolean;
  daysLeftInTrial: number;
  canCreate: (type: 'customer' | 'product' | 'user') => boolean;
  getUsagePercentage: (type: 'customer' | 'product' | 'user') => number;
  refreshData: () => Promise<void>;
}

export function usePlanLimits(): PlanLimitsHook {
  const supabase = createClientComponentClient();
  const { tenant } = useSimpleAuth();
  
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<PlanUsage>({
    users: 0,
    customers: 0,
    products: 0,
    sales_this_month: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptionData = async () => {
    if (!tenant?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar subscription com plano
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          trial_end,
          current_period_end,
          plan:plans(
            id,
            name,
            slug,
            price_monthly,
            price_yearly,
            features,
            limits
          )
        `)
        .eq('tenant_id', tenant.id)
        .single();

      if (subError) {
        // Se não encontrou subscription, criar uma trial padrão
        if (subError.code === 'PGRST116') {
          console.log('Nenhuma subscription encontrada, criando trial padrão');
          const defaultSubscription = {
            id: 'trial-default',
            status: 'trial',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            plan: {
              id: 'trial-plan',
              name: 'Trial Gratuito',
              slug: 'trial',
              price_monthly: 0,
              price_yearly: 0,
              features: {},
              limits: {
                max_users: 1,
                max_customers: 50,
                max_products: 100,
                max_sales_per_month: 100
              }
            }
          };
          setSubscription(defaultSubscription as any);
        } else {
          console.error('Erro ao buscar subscription:', subError.message || subError);
          throw subError;
        }
      } else {
        // Usar trial_end diretamente
        const normalized = {
          ...subscriptionData,
          trial_ends_at: (subscriptionData as any)?.trial_end || null,
        } as typeof subscriptionData;

        setSubscription(normalized as any);
      }

      // Buscar uso atual
      const [usersResult, customersResult, productsResult, salesResult] = await Promise.all([
        // Contar usuários ativos
        supabase
          .from('user_memberships')
          .select('id', { count: 'exact' })
          .eq('tenant_id', tenant.id)
          .eq('is_active', true),
        
        // Contar clientes
        supabase
          .from('customers')
          .select('id', { count: 'exact' })
          .eq('tenant_id', tenant.id),
        
        // Contar produtos
        supabase
          .from('products')
          .select('id', { count: 'exact' })
          .eq('tenant_id', tenant.id),
        
        // Contar vendas do mês atual (tolerar base sem tabela sales)
        supabase
          .from('sales')
          .select('id', { count: 'exact' })
          .eq('tenant_id', tenant.id)
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .then(r => ({ ...r, count: r.count || 0 }))
          .catch(() => ({ count: 0 }))
      ]);

      setUsage({
        users: usersResult.count || 0,
        customers: customersResult.count || 0,
        products: productsResult.count || 0,
        sales_this_month: (salesResult as any).count || 0,
      });

    } catch (err) {
      console.error('Erro ao carregar dados do plano:', err instanceof Error ? err.message : err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, [tenant?.id]);

  // Verificar se trial expirou
  const isTrialExpired = subscription?.status === 'trial' && 
    subscription?.trial_ends_at && 
    new Date(subscription.trial_ends_at) < new Date();

  // Calcular dias restantes no trial
  const daysLeftInTrial = subscription?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Verificar se pode criar um item
  const canCreate = (type: 'customer' | 'product' | 'user'): boolean => {
    if (!subscription?.plan?.limits) return false;
    if (isTrialExpired) return false;

    const limits = subscription.plan.limits;
    
    switch (type) {
      case 'customer':
        return limits.max_customers === -1 || usage.customers < limits.max_customers;
      case 'product':
        return limits.max_products === -1 || usage.products < limits.max_products;
      case 'user':
        return limits.max_users === -1 || usage.users < limits.max_users;
      default:
        return false;
    }
  };

  // Calcular porcentagem de uso
  const getUsagePercentage = (type: 'customer' | 'product' | 'user'): number => {
    if (!subscription?.plan?.limits) return 0;

    const limits = subscription.plan.limits;
    let current = 0;
    let max = 0;

    switch (type) {
      case 'customer':
        current = usage.customers;
        max = limits.max_customers;
        break;
      case 'product':
        current = usage.products;
        max = limits.max_products;
        break;
      case 'user':
        current = usage.users;
        max = limits.max_users;
        break;
    }

    if (max === -1) return 0; // Ilimitado
    if (max === 0) return 100;
    
    return Math.min(100, (current / max) * 100);
  };

  return {
    subscription,
    usage,
    limits: subscription?.plan?.limits || null,
    loading,
    error,
    isTrialExpired,
    daysLeftInTrial,
    canCreate,
    getUsagePercentage,
    refreshData: loadSubscriptionData,
  };
}
