'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { JugaKPICard, JugaProgressCard } from '@/components/dashboard/JugaComponents';
import { CreditCard, Calendar, Users, Package, CheckCircle, Crown, Zap, Shield, TrendingUp, Download } from 'lucide-react';

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
    daysLeft: 14,
    totalDays: 30,
  },
  basic: {
    name: 'Plano Básico',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    price: 'R$ 29,90/mês',
  },
  pro: {
    name: 'Plano Profissional',
    icon: Crown,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    price: 'R$ 59,90/mês',
  },
  enterprise: {
    name: 'Enterprise',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    price: 'R$ 99,90/mês',
  },
};

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 29.9,
    description: 'Ideal para pequenas empresas',
    features: ['Até 1.000 clientes', 'Até 500 produtos', 'Vendas ilimitadas', 'Relatórios básicos', 'Suporte por email'],
  },
  {
    id: 'pro',
    name: 'Profissional',
    price: 59.9,
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
    price: 99.9,
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
  const [currentPlan] = useState<PlanId>('trial');
  const currentInfo = subscriptionInfo[currentPlan];
  const CurrentIcon = currentInfo.icon;

  const usageLimits = useMemo(
    () => [
      { label: 'Clientes', current: 45, total: 1000 },
      { label: 'Produtos', current: 23, total: 500 },
      { label: 'Usuários', current: 1, total: 1 },
    ],
    [],
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header - Responsivo */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Assinatura</h1>
          <p className="text-sm sm:text-base text-body">Gerencie seu plano e faturamento de forma simples</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 w-fit">
          <CurrentIcon className={`h-4 w-4 ${currentInfo.color}`} />
          {currentInfo.name}
        </Badge>
      </div>

      {/* KPI Cards - Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <JugaKPICard
          title="Plano Atual"
          value={currentInfo.name}
          description={currentPlan === 'trial' ? 'Período de teste' : currentInfo.price || ''}
          icon={<CurrentIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="primary"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        {currentPlan === 'trial' && currentInfo.daysLeft ? (
          <JugaKPICard
            title="Dias Restantes"
            value={`${currentInfo.daysLeft}`}
            description={`de ${currentInfo.totalDays} dias`}
            trend="down"
            trendValue="Trial gratuito"
            icon={<Calendar className="h-4 w-4 sm:h-5 sm:w-5" />}
            color="warning"
            className="min-h-[120px] sm:min-h-[140px]"
          />
        ) : (
          <JugaKPICard
            title="Próxima Cobrança"
            value="24 Out"
            description={currentInfo.price || ''}
            icon={<CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />}
            color="accent"
            className="min-h-[120px] sm:min-h-[140px]"
          />
        )}
        <JugaKPICard
          title="Status"
          value="Ativo"
          description="Pagamento em dia"
          trend="up"
          trendValue="Renovação automática"
          icon={<CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="success"
          className="min-h-[120px] sm:min-h-[140px]"
        />
      </div>

      {/* Limites de Uso */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {usageLimits.map(({ label, current, total }) => (
          <JugaProgressCard
            key={label}
            title={label}
            description={`${current} de ${total} utilizados`}
            progress={(current / total) * 100}
            total={total}
            current={current}
            color={current / total > 0.8 ? 'warning' : 'success'}
          />
        ))}
      </div>

      {/* Planos Disponíveis */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-heading">Escolha seu Plano</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`juga-card relative flex flex-col ${plan.popular ? 'ring-2 ring-primary shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="juga-gradient text-white">Mais Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-6">
                <CardTitle className="text-lg sm:text-xl text-heading">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="py-6">
                  <span className="text-3xl sm:text-4xl font-bold text-heading">R$ {plan.price.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 space-y-6">
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-body">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full mt-auto"
                  variant="outline"
                  disabled={currentPlan === plan.id}
                >
                  {currentPlan === plan.id ? 'Plano Atual' : 'Escolher Plano'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Método de Pagamento e Histórico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="juga-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl text-heading flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Método de Pagamento
            </CardTitle>
            <CardDescription className="text-sm">Configure seu método de pagamento preferido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 bg-blue-600 rounded text-white text-xs font-bold flex items-center justify-center">
                  VISA
                </div>
                <div>
                  <p className="font-medium text-heading">**** **** **** 4242</p>
                  <p className="text-sm text-muted-foreground">Expira 12/2025</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl text-heading">Histórico de Faturas</CardTitle>
            <CardDescription className="text-sm">Suas faturas mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { date: '24 Set 2025', amount: 'R$ 59,90', status: 'Paga', invoice: 'INV-001' },
                { date: '24 Ago 2025', amount: 'R$ 59,90', status: 'Paga', invoice: 'INV-002' },
                { date: '24 Jul 2025', amount: 'R$ 59,90', status: 'Paga', invoice: 'INV-003' },
              ].map((invoice) => (
                <div 
                  key={invoice.invoice} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="text-sm min-w-0 flex-1">
                    <p className="font-medium text-heading">{invoice.invoice}</p>
                    <p className="text-muted-foreground text-xs">{invoice.date}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {invoice.status}
                    </Badge>
                    <span className="font-medium text-heading hidden sm:inline">{invoice.amount}</span>
                    <Button variant="ghost" size="sm" className="p-2">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}