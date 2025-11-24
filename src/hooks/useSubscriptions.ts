'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  amount: number;
  currency: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  canceled_at?: string;
  metadata?: any;
}

interface CreateSubscriptionData {
  plan_id: string;
  payment_method: string;
  payment_data?: any;
  amount: number;
  currency?: string;
}

export function useSubscriptions() {
  const { user } = useSimpleAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/next_api/subscriptions?user_id=${user.id}`);
      
      // Verificar content-type antes de fazer parse
      const contentType = response.headers.get('content-type') || '';
      let result: any;
      if (contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (parseError) {
          console.error('❌ Erro ao parsear JSON:', parseError);
          throw new Error('Resposta inválida do servidor (não é JSON)');
        }
      } else {
        const text = await response.text();
        console.error('❌ Resposta não é JSON:', text.substring(0, 100));
        throw new Error('Resposta inválida do servidor');
      }

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao buscar assinaturas');
      }

      setSubscriptions(result.data || []);
    } catch (error) {
      console.error('❌ Erro ao buscar assinaturas:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createSubscription = async (data: CreateSubscriptionData) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/next_api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          user_id: user.id,
        }),
      });

      // Verificar content-type antes de fazer parse
      const contentType = response.headers.get('content-type') || '';
      let result: any;
      if (contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (parseError) {
          console.error('❌ Erro ao parsear JSON:', parseError);
          throw new Error('Resposta inválida do servidor (não é JSON)');
        }
      } else {
        const text = await response.text();
        console.error('❌ Resposta não é JSON:', text.substring(0, 100));
        throw new Error('Resposta inválida do servidor');
      }

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar assinatura');
      }

      // Atualizar lista de assinaturas
      await fetchSubscriptions();

      return result.data;
    } catch (error) {
      console.error('❌ Erro ao criar assinatura:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (subscriptionId: string, data: Partial<Subscription>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/next_api/subscriptions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: subscriptionId,
          ...data,
        }),
      });

      // Verificar content-type antes de fazer parse
      const contentType = response.headers.get('content-type') || '';
      let result: any;
      if (contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (parseError) {
          console.error('❌ Erro ao parsear JSON:', parseError);
          throw new Error('Resposta inválida do servidor (não é JSON)');
        }
      } else {
        const text = await response.text();
        console.error('❌ Resposta não é JSON:', text.substring(0, 100));
        throw new Error('Resposta inválida do servidor');
      }

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar assinatura');
      }

      // Atualizar lista de assinaturas
      await fetchSubscriptions();

      return result.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar assinatura:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/next_api/subscriptions?id=${subscriptionId}`, {
        method: 'DELETE',
      });

      // Verificar content-type antes de fazer parse
      const contentType = response.headers.get('content-type') || '';
      let result: any;
      if (contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (parseError) {
          console.error('❌ Erro ao parsear JSON:', parseError);
          throw new Error('Resposta inválida do servidor (não é JSON)');
        }
      } else {
        const text = await response.text();
        console.error('❌ Resposta não é JSON:', text.substring(0, 100));
        throw new Error('Resposta inválida do servidor');
      }

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao cancelar assinatura');
      }

      // Atualizar lista de assinaturas
      await fetchSubscriptions();

      return result.data;
    } catch (error) {
      console.error('❌ Erro ao cancelar assinatura:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getActiveSubscription = () => {
    return subscriptions.find(sub => sub.status === 'active');
  };

  const getCurrentPlan = () => {
    const activeSubscription = getActiveSubscription();
    return activeSubscription?.plan_id || 'trial';
  };

  const isSubscriptionActive = () => {
    const activeSubscription = getActiveSubscription();
    return !!activeSubscription;
  };

  const getDaysUntilRenewal = () => {
    const activeSubscription = getActiveSubscription();
    if (!activeSubscription) return null;

    const endDate = new Date(activeSubscription.current_period_end);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  useEffect(() => {
    if (user?.id) {
      fetchSubscriptions();
    }
  }, [user?.id, fetchSubscriptions]);

  return {
    subscriptions,
    loading,
    error,
    fetchSubscriptions,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    getActiveSubscription,
    getCurrentPlan,
    isSubscriptionActive,
    getDaysUntilRenewal,
  };
}
