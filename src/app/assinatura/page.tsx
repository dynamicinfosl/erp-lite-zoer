'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { formatPrice } from '@/lib/plan-utils';
import Aurora from '@/components/ui/Aurora';
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
  RefreshCw,
  Sparkles,
  Receipt,
  ArrowUpRight,
  ChevronRight,
  TrendingDown
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
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: string[];
  popular?: boolean;
};

const subscriptionInfo: Record<PlanId, SubscriptionInfo> = {
  trial: {
    name: 'Trial Gratuito',
    icon: Zap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    daysLeft: 3,
    totalDays: 3,
  },
  basic: {
    name: 'Plano Básico',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
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
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    price: 'R$ 299,90/mês',
  },
};

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    priceMonthly: 79.9,
    priceYearly: 767.04,
    description: 'Ideal para pequenas empresas',
    features: ['Até 500 clientes', 'Até 1.000 produtos', 'Vendas ilimitadas', 'Relatórios básicos', 'Suporte por email'],
  },
  {
    id: 'pro',
    name: 'Profissional',
    priceMonthly: 139.9,
    priceYearly: 1343.04,
    description: 'Para empresas em crescimento',
    popular: true,
    features: [
      'Até 10.000 clientes',
      'Até 10.000 produtos',
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
    priceMonthly: 299.9,
    priceYearly: 2879.04,
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
    loading: loadingLimits,
    error: errorLimits,
    isTrialExpired,
    daysLeftInTrial,
    getUsagePercentage,
    refreshData
  } = usePlanLimits();
  
  const { refreshSubscription, tenant } = useSimpleAuth();
  
  const hasRefreshed = useRef(false);

  // Estados locais para dados reais do banco
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [isYearly, setIsYearly] = useState(false);

  // Buscar faturas reais do banco
  const loadInvoices = async () => {
    if (!tenant?.id) return;
    try {
      setLoadingInvoices(true);
      const res = await fetch(`/next_api/admin/payment-records?tenant_id=${encodeURIComponent(tenant.id)}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setInvoices(result.data);
        }
      }
    } catch (err) {
      console.error('❌ Erro ao carregar faturas:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Forçar refresh inicial da subscription e carregar faturas
  useEffect(() => {
    const init = async () => {
      if (!tenant?.id) return;
      if (hasRefreshed.current) return;
      hasRefreshed.current = true;
      
      try {
        await refreshSubscription();
        await refreshData();
        await loadInvoices();
      } catch (error) {
        console.error('❌ Erro na sincronização inicial:', error);
      }
    };
    
    const timer = setTimeout(init, 500);
    return () => clearTimeout(timer);
  }, [tenant?.id]);

  // Recarregar faturas quando o tenant id estiver disponível
  useEffect(() => {
    if (tenant?.id) {
      loadInvoices();
    }
  }, [tenant?.id]);

  // Mapear status e slug para PlanId
  const getCurrentPlan = (): PlanId => {
    if (!subscription) return 'trial';
    
    if (subscription.status === 'active' && subscription.plan?.slug) {
      const slug = subscription.plan.slug.toLowerCase().trim();
      const slugMap: Record<string, PlanId> = {
        'free': 'trial',
        'trial': 'trial',
        'basic': 'basic',
        'basico': 'basic',
        'pro': 'pro',
        'professional': 'pro',
        'profissional': 'pro',
        'enterprise': 'enterprise',
        'empresarial': 'enterprise'
      };
      return slugMap[slug] || 'trial';
    }
    
    if (subscription.status === 'trial') return 'trial';
    
    return 'trial';
  };
  
  const currentPlan: PlanId = getCurrentPlan();
  const currentInfo = subscriptionInfo[currentPlan];
  const CurrentIcon = currentInfo.icon;

  // Processar Checkout Stripe
  const handleSelectPlan = async (planId: PlanId) => {
    if (planId === currentPlan) return;
    if (!tenant?.id) {
      alert('Erro: Conta de usuário ou tenant não carregado.');
      return;
    }

    try {
      setIsProcessing(true);
      setSelectedPlan(planId);

      const planUuidMap: Record<string, string> = {
        basic: '880509a7-0b5c-4f9c-a8f6-e95fda14808b',
        pro: 'bcdfed13-c598-4551-b388-89bb1af328f0',
        enterprise: 'fe073523-6a3a-4a82-953b-86b0fca84231',
      };

      const planUUID = planUuidMap[planId];
      if (!planUUID) throw new Error('UUID do plano não mapeado.');

      const response = await fetch('/next_api/payments/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          plan_slug: planId,
          plan_id: planUUID,
          billing_period: isYearly ? 'yearly' : 'monthly',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Erro ao criar sessão de checkout no Stripe');
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error('❌ Erro no checkout:', err);
      alert(err.message || 'Erro ao processar redirecionamento de pagamento.');
      setSelectedPlan(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Gerenciar Assinatura via Stripe Portal
  const handleManageBilling = async () => {
    if (!tenant?.id) return;
    try {
      setIsProcessing(true);
      const res = await fetch('/next_api/payments/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenant.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Não foi possível acessar o portal de pagamentos.');
      }
      window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || 'Erro ao abrir portal do Stripe.');
    } finally {
      setIsProcessing(false);
    }
  };

  const usageLimits = useMemo(() => [
    { 
      label: 'Clientes', 
      current: usage.customers, 
      total: limits?.max_customers === -1 ? 'Ilimitado' : limits?.max_customers || 0,
      percent: getUsagePercentage('customer')
    },
    { 
      label: 'Produtos', 
      current: usage.products, 
      total: limits?.max_products === -1 ? 'Ilimitado' : limits?.max_products || 0,
      percent: getUsagePercentage('product')
    },
    { 
      label: 'Usuários', 
      current: usage.users, 
      total: limits?.max_users === -1 ? 'Ilimitado' : limits?.max_users || 0,
      percent: getUsagePercentage('user')
    },
  ], [usage, limits]);

  if (loadingLimits || loadingInvoices) {
    return (
      <div className="flex items-center justify-center min-h-[500px] relative overflow-hidden bg-slate-50/50">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <Aurora colorStops={['#0ea5e9', '#3b82f6', '#93c5fd']} blend={0.8} amplitude={1.0} speed={0.3} />
        </div>
        <div className="text-center relative z-10">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  if (errorLimits) {
    return (
      <div className="flex items-center justify-center min-h-[500px] relative overflow-hidden bg-slate-50/50 p-6">
        <div className="text-center bg-white border border-slate-200 p-8 rounded-2xl shadow-lg max-w-md w-full">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Erro de Carregamento</h3>
          <p className="text-slate-600 text-sm mb-6">{errorLimits}</p>
          <Button onClick={refreshData} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-slate-50/50 min-h-screen w-full">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0 opacity-[0.08] pointer-events-none">
        <Aurora colorStops={['#0ea5e9', '#3b82f6', '#93c5fd']} blend={0.8} amplitude={1.0} speed={0.3} />
      </div>

      <div className="relative z-10 max-w-[1920px] mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 w-full">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200/50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              Faturamento & Assinatura
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Faturamento</h1>
            <p className="text-slate-500 text-sm">Gerencie seu plano, faturas de cobrança e portal financeiro</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await refreshSubscription();
                await refreshData();
                await loadInvoices();
              }}
              className="border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-xl"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Sincronizar
            </Button>
            <Badge className="bg-slate-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <CurrentIcon className="h-4 w-4" />
              {currentInfo.name}
            </Badge>
          </div>
        </div>

        {/* DASHBOARD GRID - 2 COLUNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* COLUNA ESQUERDA (PLAN DETAILS & RESOURCE LIMITS) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* PLAN CARD */}
            <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-2xl p-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentInfo.bgColor} ${currentInfo.color}`}>
                    <CurrentIcon className="h-3.5 w-3.5" />
                    {currentPlan === 'trial' ? 'Período de Teste' : 'Assinatura Ativa'}
                  </span>
                  
                  <h2 className="text-2xl font-bold text-slate-900">
                    {currentPlan === 'trial' ? 'Trial Gratuito' : subscription?.plan?.name || currentInfo.name}
                  </h2>
                  
                  <p className="text-slate-600 text-sm max-w-md">
                    {currentPlan === 'trial' 
                      ? 'Você está no período inicial de teste. Aproveite todas as funcionalidades liberadas antes de escolher um plano definitivo.' 
                      : 'Sua assinatura está ativa e sendo renovada automaticamente direto pelo seu método de pagamento Stripe.'
                    }
                  </p>
                </div>
                
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-center sm:text-right min-w-[160px] self-stretch sm:self-auto flex flex-col justify-center">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Período atual</span>
                  <span className="text-lg font-bold text-slate-950 mt-1">
                    {currentPlan === 'trial'
                      ? `${daysLeftInTrial} ${daysLeftInTrial === 1 ? 'dia restante' : 'dias restantes'}`
                      : subscription?.current_period_end
                        ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR')
                        : 'Ativo'
                    }
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {currentPlan === 'trial' ? 'Sem compromisso' : 'Renovação Stripe'}
                  </span>
                </div>
              </div>

              {/* Alertas de Vencimento do Trial */}
              {currentPlan === 'trial' && (
                <div className={`mt-6 border p-4 rounded-xl flex items-start gap-3 ${
                  isTrialExpired 
                    ? 'border-red-200 bg-red-50/50' 
                    : daysLeftInTrial <= 1 
                      ? 'border-red-200 bg-red-50/50 animate-pulse' 
                      : 'border-amber-200 bg-amber-50/30'
                }`}>
                  <AlertCircle className={`h-5 w-5 mt-0.5 shrink-0 ${isTrialExpired || daysLeftInTrial <= 1 ? 'text-red-500' : 'text-amber-500'}`} />
                  <div>
                    <h4 className={`font-bold text-sm ${isTrialExpired || daysLeftInTrial <= 1 ? 'text-red-900' : 'text-amber-900'}`}>
                      {isTrialExpired ? 'Seu período de teste expirou' : 'Seu trial está quase acabando!'}
                    </h4>
                    <p className={`text-xs mt-0.5 ${isTrialExpired || daysLeftInTrial <= 1 ? 'text-red-700' : 'text-amber-700'}`}>
                      {isTrialExpired 
                        ? 'Selecione e contrate um dos planos abaixo para reativar as funções e continuar utilizando a plataforma.' 
                        : `Resta apenas ${daysLeftInTrial} ${daysLeftInTrial === 1 ? 'dia' : 'dias'}. Salve seus dados escolhendo seu plano.`
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* RESOURCE LIMITS */}
            <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Uso do Plano</h3>
                <p className="text-slate-500 text-xs">Acompanhe o consumo de recursos permitidos em seu pacote</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {usageLimits.map((lim) => (
                  <div key={lim.label} className="border border-slate-200/60 rounded-xl p-4 bg-white/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{lim.label}</span>
                      <span className="text-xs font-bold text-slate-900">{lim.current} / {lim.total}</span>
                    </div>
                    <Progress value={lim.percent} className="h-2 bg-slate-100" />
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{lim.percent.toFixed(0)}% utilizado</span>
                      {lim.percent >= 95 && <Badge variant="destructive" className="text-[9px] px-1 py-0 scale-90">Crítico</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA (METHOD & HISTORY) */}
          <div className="space-y-6">
            
            {/* PAYMENT METHOD */}
            <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-slate-700" />
                  Pagamento Recorrente
                </h3>
                <p className="text-slate-500 text-xs">Formas de faturamento e cartões salvos</p>
              </div>

              {currentPlan === 'trial' ? (
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-center">
                  <p className="text-xs text-slate-600 font-medium">Nenhum cartão cadastrado ainda.</p>
                  <p className="text-[10px] text-slate-400 mt-1">O cadastro do cartão é feito no Checkout ao escolher seu plano.</p>
                </div>
              ) : (
                <div className="border border-slate-200/60 rounded-xl p-4 bg-white/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 bg-gradient-to-br from-slate-900 to-slate-800 rounded flex items-center justify-center text-white text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm">
                      Stripe
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Cobrança Recorrente</p>
                      <p className="text-[10px] text-slate-500">Cartão seguro via gateway</p>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={handleManageBilling}
                    disabled={isProcessing}
                    className="h-8 text-xs border-slate-200 hover:bg-slate-50 rounded-lg shrink-0"
                  >
                    Gerenciar
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>

            {/* REAL INVOICES HISTORY */}
            <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-slate-700" />
                    Histórico Financeiro
                  </h3>
                  <p className="text-slate-500 text-xs">Faturas e pagamentos realizados</p>
                </div>
                <Badge variant="outline" className="border-slate-200 text-slate-700 bg-white">{invoices.length}</Badge>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {invoices.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-xl text-center">
                    <AlertCircle className="h-7 w-7 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 font-semibold">Nenhuma fatura registrada.</p>
                    <p className="text-[10px] text-slate-400 mt-1">O histórico aparecerá quando uma assinatura Stripe for confirmada.</p>
                  </div>
                ) : (
                  invoices.map((inv) => {
                    const isPaid = inv.status === 'confirmed' || inv.status === 'paid';
                    const isPending = inv.status === 'pending';
                    const formattedDate = new Date(inv.payment_date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    });
                    const invoiceRef = inv.invoice_number || `FAT-${inv.id.slice(0, 8).toUpperCase()}`;

                    return (
                      <div 
                        key={inv.id} 
                        className="border border-slate-200/50 rounded-xl p-3.5 bg-white/40 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{invoiceRef}</span>
                            <Badge 
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                isPaid 
                                  ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' 
                                  : isPending 
                                    ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' 
                                    : 'bg-red-500/10 text-red-700 border border-red-500/20'
                              }`}
                            >
                              {isPaid ? 'Paga' : isPending ? 'Pendente' : 'Vencida'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <Calendar className="h-3 w-3" />
                            <span>{formattedDate}</span>
                            <span>•</span>
                            <span className="capitalize">{inv.payment_method?.replace('_', ' ')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-extrabold text-slate-950">
                            {formatPrice(Number(inv.amount))}
                          </span>
                          {inv.receipt_url && (
                            <a 
                              href={inv.receipt_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-sm bg-white"
                              title="Baixar Recibo PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

        {/* SECTION TABELA DE PLANOS */}
        <div className="space-y-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Altere seu Plano</h2>
              <p className="text-slate-500 text-sm">Contrate ou faça upgrade da sua licença a qualquer momento</p>
            </div>
            
            {/* SWITCH MENSAL / ANUAL */}
            <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-full w-fit shadow-sm">
              <span className={`text-sm font-semibold ${!isYearly ? 'text-blue-600' : 'text-slate-500'}`}>Mensal</span>
              <button
                type="button"
                onClick={() => setIsYearly(!isYearly)}
                className="w-12 h-6 rounded-full bg-blue-100 border border-blue-200 p-0.5 transition-colors relative cursor-pointer"
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-blue-600 transition-transform ${
                    isYearly ? 'translate-x-6' : 'translate-x-0'
                  }`}
                  style={{ width: '1.125rem', height: '1.125rem' }}
                />
              </button>
              <span className={`text-sm font-semibold flex items-center gap-1.5 ${isYearly ? 'text-blue-600' : 'text-slate-500'}`}>
                Anual
                <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Economize 20%
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isPopular = plan.popular;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                    isPopular
                      ? 'border-blue-500 shadow-xl shadow-blue-600/10 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-xl hover:shadow-blue-600/5'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-white text-blue-700 text-[11px] font-bold px-4 py-1 rounded-full shadow-md border border-blue-100">
                        Mais Popular
                      </span>
                    </div>
                  )}

                  <div className="p-7 text-center flex-1 flex flex-col">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                        plan.id === 'basic' 
                          ? 'from-emerald-400 to-emerald-600' 
                          : plan.id === 'pro' 
                            ? 'from-blue-400 to-blue-600' 
                            : 'from-violet-400 to-violet-600'
                      } mx-auto mb-4 flex items-center justify-center shadow-lg ${
                        isPopular ? 'bg-white/20' : ''
                      }`}
                    >
                      {plan.id === 'basic' && <CheckCircle className="h-7 w-7 text-white" />}
                      {plan.id === 'pro' && <Crown className="h-7 w-7 text-white" />}
                      {plan.id === 'enterprise' && <Shield className="h-7 w-7 text-white" />}
                    </div>
                    
                    <h3 className={`text-xl font-bold mb-1 ${isPopular ? 'text-white' : 'text-slate-900'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs mb-5 ${isPopular ? 'text-blue-100' : 'text-slate-500'}`}>
                      {plan.description}
                    </p>

                    <div className="mb-6">
                      <span className={`text-4xl font-extrabold ${isPopular ? 'text-white' : 'text-slate-900'}`}>
                        R$ {(isYearly ? plan.priceYearly : plan.priceMonthly).toFixed(2).replace('.', ',')}
                      </span>
                      <span className={`text-sm ml-1 ${isPopular ? 'text-blue-100' : 'text-slate-500'}`}>
                        {isYearly ? '/ano' : '/mês'}
                      </span>
                      {isYearly && (
                        <div className={`text-[10px] mt-1 font-semibold ${isPopular ? 'text-blue-200' : 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/20'} px-2 py-0.5 rounded-md w-fit mx-auto`}>
                          Equivalente a R$ {(plan.priceYearly / 12).toFixed(2).replace('.', ',')}/mês
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2.5 text-left flex-1 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-[13px]">
                          <CheckCircle
                            className={`h-4 w-4 mt-0.5 shrink-0 ${isPopular ? 'text-blue-200' : 'text-emerald-500'}`}
                          />
                          <span className={isPopular ? 'text-blue-50' : 'text-slate-700'}>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full rounded-xl py-3 font-semibold transition-all ${
                        currentPlan === plan.id
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : isPopular
                            ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-md'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/10'
                      }`}
                      disabled={currentPlan === plan.id || isProcessing}
                      onClick={() => handleSelectPlan(plan.id as PlanId)}
                    >
                      {currentPlan === plan.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          Plano Atual
                        </div>
                      ) : selectedPlan === plan.id && isProcessing ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processando...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          Escolher Plano
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
