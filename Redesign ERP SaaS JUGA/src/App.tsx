import React, { useState } from 'react';
import { AppLayout } from './components/juga-layout';
import { DashboardPage } from './components/dashboard-page';
import { ClientesPage } from './components/clientes-page';
import { PDVPage } from './components/pdv-page';
import { LoginPage } from './components/login-page';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { JugaKPICard, JugaProgressCard } from './components/juga-components';
import { 
  Crown, 
  Check, 
  X, 
  Star,
  TrendingUp,
  Users,
  Shield,
  Zap,
  BarChart3
} from 'lucide-react';

// Página de demonstração das páginas disponíveis
function DemoPage() {
  const [currentPage, setCurrentPage] = useState('showcase');

  const pages = [
    { id: 'showcase', label: 'Showcase', component: null },
    { id: 'login', label: 'Login/Register', component: <LoginPage /> },
    { id: 'dashboard', label: 'Dashboard', component: <DashboardPage /> },
    { id: 'clientes', label: 'Clientes', component: <ClientesPage /> },
    { id: 'pdv', label: 'PDV', component: <PDVPage /> },
    { id: 'assinatura', label: 'Assinatura', component: <AssinaturaPage /> },
  ];

  const currentPageData = pages.find(p => p.id === currentPage);

  if (currentPage === 'login') {
    return <LoginPage />;
  }

  if (currentPage === 'pdv') {
    return (
      <div className="min-h-screen">
        <div className="fixed top-4 right-4 z-50">
          <Button variant="outline" onClick={() => setCurrentPage('showcase')} className="bg-white shadow-lg">
            Voltar ao Showcase
          </Button>
        </div>
        <PDVPage />
      </div>
    );
  }

  if (currentPage !== 'showcase' && currentPageData?.component) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card p-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <h1 className="text-heading font-semibold">JUGA ERP - Demo: {currentPageData.label}</h1>
            <Button variant="outline" onClick={() => setCurrentPage('showcase')}>
              Voltar ao Showcase
            </Button>
          </div>
        </div>
        <AppLayout currentPage={currentPage}>
          {currentPageData.component}
        </AppLayout>
      </div>
    );
  }

  return <ShowcasePage onPageChange={setCurrentPage} />;
}

// Página de Showcase
function ShowcasePage({ onPageChange }: { onPageChange: (page: string) => void }) {
  return (
    <div className="min-h-screen bg-juga-surface">
      {/* Hero Section */}
      <section className="juga-gradient text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold text-3xl">J</span>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold">JUGA</h1>
              <p className="text-white/80">ERP SaaS Redesign</p>
            </div>
          </div>
          <h2 className="text-5xl font-bold mb-6">Sistema de Gestão Empresarial Moderno</h2>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Redesign completo do ERP JUGA com nova identidade visual, componentes modernos e experiência de usuário premium para pequenas e médias empresas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-juga-primary hover:bg-white/90"
              onClick={() => onPageChange('dashboard')}
            >
              Ver Dashboard
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white/10"
              onClick={() => onPageChange('login')}
            >
              Página de Login
            </Button>
          </div>
        </div>
      </section>

      {/* Design System Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-heading mb-4">Novo Sistema de Design</h2>
            <p className="text-body text-lg">Paleta de cores, componentes e padrões visuais modernos</p>
          </div>

          {/* Color Palette */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div>
              <h3 className="text-xl font-semibold text-heading mb-6">Paleta de Cores</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-juga-primary rounded-lg"></div>
                  <div>
                    <p className="font-medium text-heading">JUGA Primary</p>
                    <p className="text-caption text-sm">#1e40af</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-juga-accent rounded-lg"></div>
                  <div>
                    <p className="font-medium text-heading">JUGA Accent</p>
                    <p className="text-caption text-sm">#06b6d4</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-juga-success rounded-lg"></div>
                  <div>
                    <p className="font-medium text-heading">Success</p>
                    <p className="text-caption text-sm">#10b981</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-juga-warning rounded-lg"></div>
                  <div>
                    <p className="font-medium text-heading">Warning</p>
                    <p className="text-caption text-sm">#f59e0b</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-heading mb-6">Componentes Exemplo</h3>
              <div className="space-y-4">
                <JugaKPICard
                  title="Vendas Hoje"
                  value="R$ 12.450"
                  description="Últimas 24h"
                  trend="up"
                  trendValue="+12.5%"
                  icon={<TrendingUp className="h-5 w-5" />}
                  color="primary"
                />
                <JugaProgressCard
                  title="Meta Mensal"
                  description="Progresso atual"
                  progress={68}
                  total={100000}
                  current={68000}
                  color="success"
                />
              </div>
            </div>
          </div>

          {/* Pages Preview */}
          <div>
            <h3 className="text-xl font-semibold text-heading mb-6">Páginas Disponíveis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: 'login', title: 'Login & Registro', desc: 'Autenticação com onboarding', icon: '🔐' },
                { id: 'dashboard', title: 'Dashboard', desc: 'Visão geral e métricas', icon: '📊' },
                { id: 'clientes', title: 'Clientes', desc: 'Gestão completa de clientes', icon: '👥' },
                { id: 'pdv', title: 'PDV', desc: 'Ponto de venda otimizado', icon: '💰' },
                { id: 'assinatura', title: 'Assinatura', desc: 'Planos e pricing', icon: '⭐' },
              ].map((page) => (
                <Card 
                  key={page.id} 
                  className="juga-card cursor-pointer hover:juga-shadow-glow transition-all"
                  onClick={() => onPageChange(page.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">{page.icon}</div>
                    <h4 className="font-semibold text-heading mb-2">{page.title}</h4>
                    <p className="text-body text-sm mb-4">{page.desc}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      Ver Página
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-juga-surface-elevated">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-heading mb-4">Características do Redesign</h2>
            <p className="text-body text-lg">Modernização completa com foco na experiência do usuário</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: 'Design System Completo',
                description: 'Tokens, componentes e padrões consistentes em toda a aplicação'
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: 'UX Otimizada',
                description: 'Interface intuitiva e workflows otimizados para produtividade'
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: 'Acessibilidade',
                description: 'Contraste adequado, navegação por teclado e leitores de tela'
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: 'Performance',
                description: 'Carregamento rápido e interações fluidas'
              },
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: 'Responsivo',
                description: 'Funciona perfeitamente em desktop, tablet e mobile'
              },
              {
                icon: <Star className="h-8 w-8" />,
                title: 'Premium Look',
                description: 'Visual moderno e profissional que transmite confiança'
              },
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-juga-primary/10 text-juga-primary rounded-xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-heading mb-2">{feature.title}</h3>
                <p className="text-body">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Página de Assinatura
function AssinaturaPage() {
  const plans = [
    {
      name: 'Starter',
      price: 'R$ 49',
      period: '/mês',
      description: 'Ideal para pequenos negócios',
      features: [
        'Até 5 usuários',
        'Dashboard básico',
        'Gestão de clientes',
        'Relatórios simples',
        'Suporte por email',
      ],
      limitations: [
        'Integrações limitadas',
        'Sem automações',
        'Sem API'
      ],
      highlighted: false,
    },
    {
      name: 'Professional',
      price: 'R$ 99',
      period: '/mês',
      description: 'Para empresas em crescimento',
      features: [
        'Até 20 usuários',
        'Dashboard avançado',
        'Todos os módulos',
        'Relatórios completos',
        'Automações',
        'Integrações',
        'API completa',
        'Suporte prioritário',
      ],
      limitations: [],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Personalizado',
      period: '',
      description: 'Para grandes empresas',
      features: [
        'Usuários ilimitados',
        'Personalização completa',
        'Integração dedicada',
        'SLA garantido',
        'Gerente de conta',
        'Treinamento dedicado',
        'Implantação assistida',
      ],
      limitations: [],
      highlighted: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-heading text-3xl mb-4">Escolha seu Plano</h1>
        <p className="text-body text-lg mb-6">
          Comece com 14 dias grátis. Cancele a qualquer momento.
        </p>
        <div className="inline-flex bg-juga-surface-elevated p-1 rounded-lg">
          <button className="px-4 py-2 bg-juga-primary text-white rounded-md">Mensal</button>
          <button className="px-4 py-2 text-juga-text-secondary">Anual (2 meses grátis)</button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className={`juga-card relative ${plan.highlighted ? 'juga-shadow-glow border-juga-primary' : ''}`}>
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-juga-primary text-white px-4 py-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Mais Popular
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-heading">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-juga-primary">
                {plan.price}
                <span className="text-lg text-juga-text-muted font-normal">{plan.period}</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button 
                className={`w-full ${plan.highlighted ? 'juga-gradient text-white' : ''}`}
                variant={plan.highlighted ? 'default' : 'outline'}
              >
                {plan.name === 'Enterprise' ? 'Falar com Vendas' : 'Começar Agora'}
              </Button>
              
              <div className="space-y-3">
                <p className="font-medium text-heading text-sm">Incluído:</p>
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-juga-success flex-shrink-0" />
                    <span className="text-body text-sm">{feature}</span>
                  </div>
                ))}
                
                {plan.limitations.length > 0 && (
                  <>
                    <p className="font-medium text-heading text-sm mt-4">Não incluído:</p>
                    {plan.limitations.map((limitation) => (
                      <div key={limitation} className="flex items-center gap-2">
                        <X className="h-4 w-4 text-juga-text-muted flex-shrink-0" />
                        <span className="text-caption text-sm">{limitation}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Plan Status */}
      <Card className="juga-card max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-heading flex items-center gap-2">
            <Star className="h-5 w-5 text-juga-warning" />
            Seu Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-heading">Trial Gratuito</p>
              <p className="text-body text-sm">Acesso completo por tempo limitado</p>
            </div>
            <Badge className="bg-juga-warning/10 text-juga-warning">7 dias restantes</Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-body">Progresso do trial</span>
              <span className="text-heading">7/14 dias</span>
            </div>
            <JugaProgressCard
              title=""
              progress={50}
              color="warning"
              className="p-0 border-0 shadow-none"
            />
          </div>
          
          <Button className="w-full juga-gradient text-white">
            Fazer Upgrade Agora
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function App() {
  return <DemoPage />;
}