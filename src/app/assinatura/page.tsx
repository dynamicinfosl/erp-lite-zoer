'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { JugaKPICard, JugaProgressCard } from '@/components/dashboard/JugaComponents';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { formatPrice, calculateYearlyDiscount } from '@/lib/plan-utils';
import { 
  CreditCard, 
  Calendar, 
  Users, 
  Package, 
  CheckCircle, 
  Crown, 
  Zap, 
  Shield,
  Download,
  AlertCircle,
  TrendingUp,
  Clock,
  User,
  Loader2,
  RefreshCw
} from 'lucide-react';

type PlanId = 'trial' | 'basic' | 'pro' | 'enterprise';

type SubscriptionInfo = {
  name: string;
  icon: typeof Zap;
  color: string;
  bgColor: string;
  daysLeft?: number;
  totalDays?: number;
  price?: string;
};

type Plan = {
  id: Exclude<PlanId, 'trial'>;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
};

const subscriptionInfo: Record<PlanId, SubscriptionInfo> = {
  trial: {
    name: 'Trial Gratuito',
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    daysLeft: 7,
    totalDays: 7,
  },
  basic: {
    name: 'Plano Básico',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    price: 'R$ 79,90/mês',
  },
  pro: {
    name: 'Plano Profissional',
    icon: Crown,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    price: 'R$ 139,90/mês',
  },
  enterprise: {
    name: 'Enterprise',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    price: 'R$ 299,90/mês',
  },
};

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 79.9,
    description: 'Ideal para pequenas empresas',
    features: ['Até 1.000 clientes', 'Até 500 produtos', 'Vendas ilimitadas', 'Relatórios básicos', 'Suporte por email'],
  },
  {
    id: 'pro',
    name: 'Profissional',
    price: 139.9,
    description: 'Para empresas em crescimento',
    popular: true,
    features: [
      'Até 10.000 clientes',
      'Até 5.000 produtos',
      'Vendas ilimitadas',
      'Relatórios avançados',
      'Suporte prioritário',
      'API completa',
      'Multi-usuários',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299.9,
    description: 'Para grandes empresas',
    features: [
      'Clientes ilimitados',
      'Produtos ilimitados',
      'Vendas ilimitadas',
      'Relatórios personalizados',
      'Suporte dedicado',
      'API completa',
      'Multi-usuários ilimitados',
      'White-label',
    ],
  },
];

export default function AssinaturaPage() {
  const {
    subscription,
    usage,
    limits,
    loading,
    error,
    isTrialExpired,
    daysLeftInTrial,
    canCreate,
    getUsagePercentage,
    refreshData
  } = usePlanLimits();
  
  const { refreshSubscription } = useSimpleAuth();
  
  const { tenant } = useSimpleAuth();
  
  // Forçar refresh da subscription ao carregar a página
  useEffect(() => {
    const refresh = async () => {
      if (!tenant?.id) {
        console.log('⚠️ Sem tenant, aguardando...');
        return;
      }
      
      console.log('🔄 Forçando refresh da subscription na página de assinatura...');
      try {
        await refreshSubscription();
        await refreshData();
      } catch (error) {
        console.error('❌ Erro ao atualizar subscription:', error);
      }
    };
    
    // Aguardar um pouco para garantir que o tenant esteja carregado
    const timer = setTimeout(refresh, 500);
    return () => clearTimeout(timer);
  }, [tenant?.id, refreshSubscription, refreshData]);

  // Estados para modal de pagamento
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Determinar plano atual baseado nos dados reais
  const getCurrentPlan = (): PlanId => {
    if (!subscription) {
      console.log('⚠️ Sem subscription, retornando trial');
      return 'trial';
    }
    
    console.log('🔍 getCurrentPlan - subscription:', {
      status: subscription.status,
      plan_slug: subscription.plan?.slug,
      plan_name: subscription.plan?.name,
      current_period_end: subscription.current_period_end,
      trial_ends_at: subscription.trial_ends_at
    });
    
    // Se status é active e tem plano, usar o slug do plano
    if (subscription.status === 'active' && subscription.plan?.slug) {
      const slug = subscription.plan.slug.toLowerCase().trim();
      // Mapear slugs para PlanId
      const slugMap: Record<string, PlanId> = {
        'free': 'trial',
        'trial': 'trial',
        'basic': 'basic',
        'basico': 'basic',
        'pro': 'pro',
        'professional': 'pro', // Mapear professional para pro
        'profissional': 'pro',
        'enterprise': 'enterprise',
        'empresarial': 'enterprise'
      };
      
      const mappedPlan = slugMap[slug] || 'trial';
      console.log('✅ Plano mapeado:', slug, '->', mappedPlan);
      return mappedPlan;
    }
    
    // Se status é active mas não tem slug, tentar pelo nome do plano
    if (subscription.status === 'active' && subscription.plan?.name) {
      const planName = subscription.plan.name.toLowerCase();
      if (planName.includes('básico') || planName.includes('basic')) return 'basic';
      if (planName.includes('profissional') || planName.includes('professional') || planName.includes('pro')) return 'pro';
      if (planName.includes('enterprise') || planName.includes('empresarial')) return 'enterprise';
    }
    
    // Se status é trial, retornar trial
    if (subscription.status === 'trial') {
      console.log('⚠️ Status é trial');
      return 'trial';
    }
    
    // Verificar se tem current_period_end válido (plano ativo)
    if (subscription.current_period_end) {
      const periodEnd = new Date(subscription.current_period_end);
      const now = new Date();
      if (periodEnd > now) {
        // Plano ativo mas sem slug claro, tentar inferir
        console.log('⚠️ Plano ativo mas sem slug claro, retornando pro como padrão');
        return 'pro'; // Assumir pro como padrão para planos ativos
      }
    }
    
    console.log('⚠️ Retornando trial como padrão');
    return 'trial';
  };
  
  const currentPlan: PlanId = getCurrentPlan();
  
  // Log para debug
  useEffect(() => {
    console.log('📋 Página de Assinatura - Estado atual:', {
      subscription_status: subscription?.status,
      subscription_plan_slug: subscription?.plan?.slug,
      subscription_plan_name: subscription?.plan?.name,
      currentPlan,
      subscription
    });
  }, [subscription, currentPlan]);
  
  const currentInfo = subscriptionInfo[currentPlan];
  const CurrentIcon = currentInfo.icon;

  // Função para selecionar plano
  const handleSelectPlan = async (planId: PlanId) => {
    if (planId === currentPlan) return;
    
    console.log('🎯 Plano selecionado:', planId);
    
    const planData = plans.find(plan => plan.id === planId);
    if (!planData) {
      console.error('❌ Plano não encontrado:', planId);
      return;
    }

    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  // Função para sucesso do pagamento
  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      setIsProcessing(true);
      console.log('💳 Dados do pagamento:', paymentData);
      
      // Simular criação de assinatura
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Assinatura criada:', paymentData);
      
      setShowPaymentModal(false);
      setSelectedPlan(null);
      refreshData();
      
    } catch (error) {
      console.error('❌ Erro ao criar assinatura:', error);
      alert('Erro ao processar assinatura. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Usar dados reais do hook
  const usageLimits = useMemo(
    () => [
      { 
        label: 'Clientes', 
        current: usage.customers, 
        total: limits?.max_customers === -1 ? 'Ilimitado' : limits?.max_customers || 0 
      },
      { 
        label: 'Produtos', 
        current: usage.products, 
        total: limits?.max_products === -1 ? 'Ilimitado' : limits?.max_products || 0 
      },
      { 
        label: 'Usuários', 
        current: usage.users, 
        total: limits?.max_users === -1 ? 'Ilimitado' : limits?.max_users || 0 
      },
    ],
    [usage, limits],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-juga-surface">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-juga-primary mx-auto mb-4" />
          <p className="text-body">Carregando informações do plano...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-juga-surface">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-juga-error mx-auto mb-4" />
          <p className="text-juga-error mb-4">Erro ao carregar dados do plano</p>
          <Button onClick={refreshData} variant="outline" className="px-4 py-2 sm:px-5 sm:py-2.5 bg-juga-surface-elevated border-juga-border text-heading hover:bg-juga-surface-card">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-juga-surface min-h-screen">
      {/* Header - Responsivo */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Assinatura</h1>
          <p className="text-sm sm:text-base text-body">Gerencie seu plano e faturamento</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-fit">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              console.log('🔄 Refresh manual da subscription...');
              await refreshSubscription();
              await refreshData();
            }}
            className="text-xs bg-juga-surface-elevated border-juga-border text-heading hover:bg-juga-surface-card"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Atualizar
          </Button>
          <Badge variant="secondary" className="px-3 py-1 bg-juga-surface-elevated border-juga-border text-heading">
            <CurrentIcon className="h-3 w-3" />
            {currentInfo.name}
          </Badge>
          {currentPlan === 'trial' && daysLeftInTrial > 0 && (
            <Badge 
              variant={daysLeftInTrial <= 3 ? "destructive" : daysLeftInTrial <= 7 ? "default" : "outline"} 
              className="px-3 py-1 animate-pulse"
            >
              <Clock className="h-3 w-3" />
              {daysLeftInTrial} {daysLeftInTrial === 1 ? 'dia restante' : 'dias restantes'}
            </Badge>
          )}
          {isTrialExpired && (
            <Badge variant="destructive" className="px-3 py-1">
              <AlertCircle className="h-3 w-3" />
              Trial Expirado
            </Badge>
          )}
        </div>
      </div>


      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <JugaKPICard
          title="Plano Atual"
          value={
            currentPlan === 'trial' 
              ? currentInfo.name
              : subscription?.plan?.name || currentInfo.name
          }
          description={
            currentPlan === 'trial' 
              ? `Período de teste${daysLeftInTrial > 0 ? ` - ${daysLeftInTrial} ${daysLeftInTrial === 1 ? 'dia' : 'dias'} restantes` : ' - Expirado'}`
              : (() => {
                  // Para planos não-trial, mostrar preço ou nome
                  if (subscription?.plan?.price_monthly && subscription.plan.price_monthly > 0) {
                    return `${formatPrice(subscription.plan.price_monthly)}/mês`;
                  }
                  if (subscription?.plan?.name) {
                    return subscription.plan.name;
                  }
                  return currentInfo.price || 'Plano ativo';
                })()
          }
          color="primary"
          icon={<CurrentIcon className="h-5 w-5" />}
          trend="neutral"
          trendValue={
            currentPlan === 'trial' 
              ? daysLeftInTrial > 0 
                ? `${daysLeftInTrial} ${daysLeftInTrial === 1 ? 'dia' : 'dias'} restantes`
                : 'Expirado'
              : subscription?.current_period_end
                ? `Expira em ${new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}`
                : 'Ativo'
          }
          className={`min-h-[120px] sm:min-h-[140px] ${
            currentPlan === 'trial' && daysLeftInTrial <= 3 ? 'ring-2 ring-red-200' : ''
          }`}
        />
        <JugaKPICard
          title="Clientes"
          value={`${usageLimits[0].current} / ${usageLimits[0].total}`}
          description={`${getUsagePercentage('customer').toFixed(0)}% utilizado`}
          color="success"
          icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
          trend="up"
          trendValue="Do limite"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Produtos"
          value={`${usageLimits[1].current} / ${usageLimits[1].total}`}
          description={`${getUsagePercentage('product').toFixed(0)}% utilizado`}
          color="primary"
          icon={<Package className="h-4 w-4 sm:h-5 sm:w-5" />}
          trend="neutral"
          trendValue="Do limite"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Usuários"
          value={`${usageLimits[2].current} / ${usageLimits[2].total}`}
          description="Usuários ativos"
          color="accent"
          icon={<User className="h-4 w-4 sm:h-5 sm:w-5" />}
          trend="neutral"
          trendValue="Do limite"
          className="min-h-[120px] sm:min-h-[140px]"
        />
      </div>

      {/* Status da Assinatura */}
      <Card className="juga-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-heading">
            <CurrentIcon className={`h-5 w-5 ${currentInfo.color}`} />
            Sua Assinatura Atual
          </CardTitle>
          <CardDescription className="text-sm">
            {currentPlan === 'trial' ? 'Você está no período de teste gratuito' : 'Detalhes do seu plano atual'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentPlan === 'trial' ? (
            <>
              {/* Contagem de Dias - Layout Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6">
                {/* Card Principal - Dias Restantes */}
                <JugaKPICard
                  title={isTrialExpired ? 'Trial Expirado' : 'Dias Restantes'}
                  value={isTrialExpired ? '0' : daysLeftInTrial.toString()}
                  description={isTrialExpired ? 'Período finalizado' : 
                             daysLeftInTrial === 1 ? 'dia restante' : 'dias restantes'}
                  trend={isTrialExpired ? 'down' : 
                         daysLeftInTrial <= 3 ? 'down' : 
                         daysLeftInTrial <= 7 ? 'neutral' : 'up'}
                  trendValue={isTrialExpired ? 'Expirado' :
                             daysLeftInTrial <= 3 ? 'Crítico' :
                             daysLeftInTrial <= 7 ? 'Atenção' : 'Ativo'}
                  icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />}
                  color={isTrialExpired ? 'error' : 
                         daysLeftInTrial <= 3 ? 'error' : 
                         daysLeftInTrial <= 7 ? 'warning' : 'success'}
                  className="min-h-[120px] sm:min-h-[140px]"
                />

                {/* Card de Progresso */}
                <JugaKPICard
                  title="Progresso do Teste"
                  value={(() => {
                    if (isTrialExpired) return '100%';
                    // Calcular dias totais do trial (7 dias padrão)
                    const totalTrialDays = 7;
                    const daysUsed = Math.max(0, totalTrialDays - daysLeftInTrial);
                    const progress = Math.min(100, Math.max(0, Math.round((daysUsed / totalTrialDays) * 100)));
                    return `${progress}%`;
                  })()}
                  description={(() => {
                    if (isTrialExpired) return '7 de 7 dias utilizados';
                    const totalTrialDays = 7;
                    const daysUsed = Math.max(0, Math.min(totalTrialDays, totalTrialDays - daysLeftInTrial));
                    return `${daysUsed} de ${totalTrialDays} dias utilizados`;
                  })()}
                  trend="neutral"
                  trendValue={isTrialExpired ? 'Completo' : 'Em andamento'}
                  icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
                  color="primary"
                  className="min-h-[120px] sm:min-h-[140px]"
                />

                {/* Card de Status */}
                <JugaKPICard
                  title="Status do Trial"
                  value={isTrialExpired ? 'Expirado' :
                         daysLeftInTrial <= 3 ? 'Crítico' :
                         daysLeftInTrial <= 7 ? 'Atenção' : 'Ativo'}
                  description="Estado atual"
                  trend={isTrialExpired ? 'down' : 
                         daysLeftInTrial <= 3 ? 'down' : 
                         daysLeftInTrial <= 7 ? 'neutral' : 'up'}
                  trendValue={isTrialExpired ? 'Finalizado' :
                             daysLeftInTrial <= 3 ? 'Urgente' :
                             daysLeftInTrial <= 7 ? 'Próximo' : 'Normal'}
                  icon={isTrialExpired ? 
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" /> :
                        daysLeftInTrial <= 3 ? 
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" /> :
                        daysLeftInTrial <= 7 ? 
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5" /> :
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
                  color={isTrialExpired ? 'error' : 
                         daysLeftInTrial <= 3 ? 'error' : 
                         daysLeftInTrial <= 7 ? 'warning' : 'success'}
                  className="min-h-[120px] sm:min-h-[140px]"
                />
              </div>

              {/* Alerta de Urgência - Estilo Dashboard */}
              {(isTrialExpired || daysLeftInTrial <= 7) && (
                <div className={`juga-card border ${
                  isTrialExpired
                    ? 'border-juga-error/20 bg-juga-error/5'
                    : daysLeftInTrial <= 3 
                    ? 'border-juga-error/20 bg-juga-error/5' 
                    : 'border-juga-warning/20 bg-juga-warning/5'
                }`}>
                  <div className="flex items-start gap-3 p-4">
                    <div className={`p-2 rounded-lg ${
                      isTrialExpired ? 'bg-juga-error/10' :
                      daysLeftInTrial <= 3 ? 'bg-juga-error/10' : 'bg-juga-warning/10'
                    }`}>
                      <AlertCircle className={`h-5 w-5 ${
                        isTrialExpired ? 'text-juga-error' :
                        daysLeftInTrial <= 3 ? 'text-juga-error' : 'text-juga-warning'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold text-heading ${
                        isTrialExpired ? 'text-juga-error' :
                        daysLeftInTrial <= 3 ? 'text-juga-error' : 'text-juga-warning'
                      }`}>
                        {isTrialExpired 
                          ? 'Período de teste expirado' 
                          : daysLeftInTrial <= 3 
                          ? 'Seu período de teste está quase acabando!' 
                          : 'Seu período de teste está chegando ao fim'
                        }
                      </h4>
                      <p className={`text-sm mt-1 text-body ${
                        isTrialExpired ? 'text-juga-error/80' :
                        daysLeftInTrial <= 3 ? 'text-juga-error/80' : 'text-juga-warning/80'
                      }`}>
                        {isTrialExpired 
                          ? 'Escolha um plano para continuar usando o sistema.'
                          : daysLeftInTrial <= 3 
                          ? 'Escolha um plano agora para não perder acesso ao sistema.'
                          : 'Escolha um plano abaixo para continuar usando o sistema após o período gratuito.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : isTrialExpired ? (
            <div className="bg-juga-error/5 border border-juga-error/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-juga-error mt-0.5" />
                <div>
                  <p className="font-medium text-heading">Período de teste expirado</p>
                  <p className="text-sm text-body mt-1">
                    Seu período de teste expirou. Escolha um plano para continuar usando o sistema.
                  </p>
                </div>
              </div>
            </div>
          ) : (currentPlan as string) !== 'trial' && subscription?.plan ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-juga-surface-elevated border border-juga-border rounded-lg">
                  <div className={`p-2 rounded-lg ${currentInfo.bgColor}`}>
                    <CreditCard className={`h-5 w-5 ${currentInfo.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-caption">Plano</p>
                    <p className="text-lg font-bold text-heading">{subscription.plan.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-juga-surface-elevated border border-juga-border rounded-lg">
                  <div className={`p-2 rounded-lg ${currentInfo.bgColor}`}>
                    <CreditCard className={`h-5 w-5 ${currentInfo.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-caption">Valor Mensal</p>
                    <p className="text-lg font-bold text-heading">{formatPrice(subscription.plan.price_monthly)}/mês</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-juga-surface-elevated border border-juga-border rounded-lg">
                  <div className="p-2 rounded-lg bg-juga-primary/10">
                    <Calendar className="h-5 w-5 text-juga-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-caption">Data de Expiração</p>
                    <p className="text-lg font-bold text-heading">
                      {subscription.current_period_end 
                        ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
              {subscription.current_period_end && (
                <div className="p-4 bg-juga-primary/10 border border-juga-primary/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-juga-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-heading">
                        Seu plano está ativo até {new Date(subscription.current_period_end).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-body mt-1">
                        A renovação será automática na data de expiração.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Uso dos Recursos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {usageLimits.map(({ label, current, total }) => (
                <JugaProgressCard
                  key={label}
                  title={label}
                  description={`${current} de ${total}`}
                  progress={label === 'Clientes' ? getUsagePercentage('customer') : 
                           label === 'Produtos' ? getUsagePercentage('product') : 
                           getUsagePercentage('user')}
                  current={current}
                  total={typeof total === 'number' ? total : undefined}
                  color="primary"
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planos Disponíveis */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-heading">Escolha seu Plano</h2>
          <Badge variant="outline" className="bg-juga-surface-elevated border-juga-border text-heading">3 planos disponíveis</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative transition-all juga-card hover:shadow-lg flex flex-col ${
                plan.popular 
                  ? 'border-juga-primary shadow-lg scale-105 ring-2 ring-juga-primary/20' 
                  : 'hover:border-juga-primary/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="juga-gradient text-white">Mais Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4">
                  {plan.id === 'basic' && (
                    <div className="w-12 h-12 rounded-full bg-juga-success/20 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-juga-success" />
                    </div>
                  )}
                  {plan.id === 'pro' && (
                    <div className="w-12 h-12 rounded-full bg-juga-primary/20 flex items-center justify-center">
                      <Crown className="h-6 w-6 text-juga-primary" />
                    </div>
                  )}
                  {plan.id === 'enterprise' && (
                    <div className="w-12 h-12 rounded-full bg-juga-accent/20 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-juga-accent" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-xl text-heading">{plan.name}</CardTitle>
                <CardDescription className="mt-2 text-body">{plan.description}</CardDescription>
                <div className="py-4">
                  <span className="text-4xl font-bold text-heading">R$ {plan.price.toFixed(2)}</span>
                  <span className="text-caption text-sm">/mês</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-juga-success mt-0.5 flex-shrink-0" />
                      <span className="text-body">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <Button 
                    className={`w-full px-4 py-2.5 sm:px-5 sm:py-3 transition-all duration-200 ${
                      currentPlan === plan.id 
                        ? 'bg-juga-surface-elevated text-body border-juga-border cursor-not-allowed' 
                        : plan.popular 
                        ? 'juga-gradient text-white hover:shadow-lg hover:scale-105' 
                        : 'bg-juga-surface-elevated text-juga-primary border-juga-primary hover:bg-juga-primary/10 hover:border-juga-primary'
                    }`}
                    variant={currentPlan === plan.id ? 'outline' : plan.popular ? 'default' : 'outline'} 
                    disabled={currentPlan === plan.id || isProcessing}
                    onClick={() => handleSelectPlan(plan.id as PlanId)}
                  >
                    {currentPlan === plan.id ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Plano Atual
                      </div>
                    ) : selectedPlan === plan.id && isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Escolher Plano
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Método de Pagamento */}
      <Card className="juga-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-heading">
            <CreditCard className="h-5 w-5" />
            Método de Pagamento
          </CardTitle>
          <CardDescription>Configure seu método de pagamento preferido</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-juga-border rounded-lg bg-juga-surface-elevated hover:bg-juga-surface-card transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 juga-gradient rounded text-white text-xs font-bold flex items-center justify-center">
                VISA
              </div>
              <div>
                <p className="font-medium text-heading">**** **** **** 4242</p>
                <p className="text-sm text-caption">Expira 12/2025</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="px-3 py-2 bg-juga-surface-elevated border-juga-border text-heading hover:bg-juga-surface-card">
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Faturas */}
      <Card className="juga-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-heading">Histórico de Faturas</CardTitle>
              <CardDescription className="text-sm">Suas faturas mais recentes</CardDescription>
            </div>
            <Badge variant="outline" className="bg-juga-surface-elevated border-juga-border text-heading">3 faturas</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: '24 Set 2025', amount: 'R$ 59,90', status: 'Paga', invoice: 'INV-001' },
              { date: '24 Ago 2025', amount: 'R$ 59,90', status: 'Paga', invoice: 'INV-002' },
              { date: '24 Jul 2025', amount: 'R$ 59,90', status: 'Paga', invoice: 'INV-003' },
            ].map((invoice) => (
              <div 
                key={invoice.invoice} 
                className="flex items-center justify-between p-4 border border-juga-border rounded-lg bg-juga-surface-elevated hover:bg-juga-surface-card transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-juga-success/20 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-juga-success" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-heading">{invoice.invoice}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-caption" />
                      <p className="text-sm text-caption">{invoice.date}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge variant="outline" className="text-juga-success border-juga-success/30 bg-juga-success/10 mb-1">
                      {invoice.status}
                    </Badge>
                    <p className="font-semibold text-lg text-heading">{invoice.amount}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2 px-2.5 py-1.5 text-body hover:bg-juga-surface-card">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Pagamento */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          plan={plans.find(plan => plan.id === selectedPlan)!}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
