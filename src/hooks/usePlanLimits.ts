'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';

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
  const { tenant, subscription } = useSimpleAuth();
  
  const [usage, setUsage] = useState<PlanUsage>({
    users: 0,
    customers: 0,
    products: 0,
    sales_this_month: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Usar subscription do contexto de auth (já configurada)
  const currentSubscription = subscription || {
    id: 'trial-default',
    status: 'trial' as const,
    trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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

  const loadUsageData = useCallback(async () => {
    if (!tenant?.id) {
      setLoading(false);
      setUsage({
        users: 0,
        customers: 0,
        products: 0,
        sales_this_month: 0,
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Para simplificar, usar dados mockados
      // Em produção, isso seria buscado do banco
      setUsage({
        users: 1,
        customers: 0,
        products: 0,
        sales_this_month: 0,
      });

    } catch (err) {
      console.error('Erro ao carregar dados de uso:', err instanceof Error ? err.message : err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    // Carregar dados de uso apenas se necessário
    loadUsageData();
  }, [tenant?.id, loadUsageData]);

  // Verificar se trial ou plano ativo expirou
  const now = new Date();
  const isTrialExpired = Boolean(
    currentSubscription?.status === 'trial' && 
    currentSubscription?.trial_ends_at && 
    new Date(currentSubscription.trial_ends_at) < now
  );
  
  const isActivePlanExpired = Boolean(
    currentSubscription?.status === 'active' && 
    currentSubscription?.current_period_end && 
    new Date(currentSubscription.current_period_end) < now
  );
  
  const isPlanExpired = isTrialExpired || isActivePlanExpired;

  // Calcular dias restantes no trial ou plano ativo
  const daysLeftInTrial = currentSubscription?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(currentSubscription.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  
  const daysLeftInPlan = currentSubscription?.current_period_end
    ? Math.max(0, Math.ceil((new Date(currentSubscription.current_period_end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Verificar se pode criar um item
  const canCreate = (type: 'customer' | 'product' | 'user'): boolean => {
    if (!currentSubscription?.plan?.limits) return true; // Permitir se não há limites
    if (isPlanExpired) return false;

    const limits = currentSubscription.plan.limits;
    
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
    if (!currentSubscription?.plan?.limits) return 0;

    const limits = currentSubscription.plan.limits;
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
    subscription: currentSubscription,
    usage,
    limits: currentSubscription?.plan?.limits || null,
    loading,
    error,
    isTrialExpired: isPlanExpired, // Retornar isPlanExpired para manter compatibilidade
    daysLeftInTrial: daysLeftInTrial || daysLeftInPlan,
    canCreate,
    getUsagePercentage,
    refreshData: loadUsageData,
  };
}
