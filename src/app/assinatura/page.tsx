'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Calendar, Users, Package, CheckCircle, Crown, Zap, Shield } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assinatura</h1>
          <p className="text-muted-foreground">Gerencie seu plano e faturamento</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <CurrentIcon className={`h-4 w-4 ${currentInfo.color}`} />
          {currentInfo.name}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CurrentIcon className={`h-5 w-5 ${currentInfo.color}`} />
            Sua Assinatura Atual
          </CardTitle>
          <CardDescription>
            {currentPlan === 'trial' ? 'Você está no período de teste gratuito' : 'Detalhes do seu plano atual'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPlan === 'trial' && currentInfo.daysLeft && currentInfo.totalDays ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dias restantes:</span>
                <span className="text-2xl font-bold text-orange-600">{currentInfo.daysLeft} dias</span>
              </div>
              <Progress value={(currentInfo.daysLeft / currentInfo.totalDays) * 100} className="h-2" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>0 de {currentInfo.totalDays} dias usados</span>
                <span>{currentInfo.daysLeft} dias restantes</span>
              </div>
            </>
          ) : currentPlan !== 'trial' && currentInfo.price ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Valor Mensal</p>
                  <p className="text-lg font-bold">{currentInfo.price}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Próxima Cobrança</p>
                  <p className="text-sm text-muted-foreground">24 Out 2025</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Limites de Uso</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {usageLimits.map(({ label, current, total }) => (
                <div key={label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <span className="text-sm font-medium">
                      {current} / {total}
                    </span>
                  </div>
                  <Progress value={(current / total) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Escolha seu Plano</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary">Mais Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="py-4">
                  <span className="text-3xl font-bold">R$ {plan.price.toFixed(2)}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} disabled={currentPlan === plan.id}>
                  {currentPlan === plan.id ? 'Plano Atual' : 'Escolher Plano'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Método de Pagamento
          </CardTitle>
          <CardDescription>Configure seu método de pagamento preferido</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center">VISA</div>
              <div>
                <p className="font-medium">**** **** **** 4242</p>
                <p className="text-sm text-muted-foreground">Expira 12/2025</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturas</CardTitle>
          <CardDescription>Suas faturas mais recentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: '24 Set 2025', amount: 'R$ 59,90', status: 'Paga', invoice: 'INV-001' },
              { date: '24 Ago 2025', amount: 'R$ 59,90', status: 'Paga', invoice: 'INV-002' },
              { date: '24 Jul 2025', amount: 'R$ 59,90', status: 'Paga', invoice: 'INV-003' },
            ].map((invoice) => (
              <div key={invoice.invoice} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="text-sm">
                  <p className="font-medium">{invoice.invoice}</p>
                  <p className="text-muted-foreground">{invoice.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-green-600">
                    {invoice.status}
                  </Badge>
                  <span className="font-medium">{invoice.amount}</span>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}