'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { ENABLE_AUTH } from '@/constants/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  ArrowRight,
  CheckCircle,
  Zap,
  Package,
  TrendingUp,
  Lock,
  Sparkles,
  Crown,
  Star,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Users,
    title: 'Gestão de Clientes',
    description:
      'Cadastro completo com dados pessoais, endereço, histórico de compras e status de aprovação. Sistema de aprovação/rejeição para novos clientes.',
    color: 'from-indigo-500 to-sky-500',
    titleColor: 'text-indigo-700 dark:text-indigo-300',
  },
  {
    icon: Package,
    title: 'Controle de Estoque',
    description:
      'Gestão completa de produtos com controle de entrada, saída, alertas de estoque baixo e produtos próximos do vencimento. Suporte a códigos de barras.',
    color: 'from-emerald-500 to-teal-500',
    titleColor: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    icon: BarChart3,
    title: 'Relatórios Avançados',
    description:
      'Relatórios de vendas, clientes, produtos, financeiro e operacional. Gráficos interativos e exportação para PDF/Excel. Análise de performance e tendências.',
    color: 'from-violet-500 to-fuchsia-500',
    titleColor: 'text-violet-700 dark:text-violet-300',
  },
  {
    icon: TrendingUp,
    title: 'Vendas e PDV',
    description:
      'Sistema de ponto de venda completo com carrinho de compras, cálculo automático de impostos, formas de pagamento e geração de cupons fiscais.',
    color: 'from-amber-500 to-orange-500',
    titleColor: 'text-amber-700 dark:text-amber-300',
  },
  {
    icon: Lock,
    title: 'Segurança e Multi-tenant',
    description:
      'Sistema SaaS com isolamento de dados por empresa. Autenticação robusta, criptografia de dados e backup automático. Controle de acesso por perfis.',
    color: 'from-cyan-600 to-blue-600',
    titleColor: 'text-cyan-700 dark:text-cyan-300',
  },
  {
    icon: Settings,
    title: 'Configuração Flexível',
    description:
      'Planos de assinatura personalizáveis (Básico, Profissional, Enterprise). Configurações por empresa, integrações via API e customização de campos.',
    color: 'from-purple-500 to-pink-500',
    titleColor: 'text-purple-700 dark:text-purple-300',
  },
];

const plans = [
  {
    name: 'Trial',
    price: 0,
    period: '7 dias grátis',
    description: 'Experimente todas as funcionalidades',
    icon: Zap,
    color: 'from-orange-500 to-red-500',
    features: [
      '1 usuário',
      'Até 50 produtos',
      'Até 100 clientes',
      'Suporte por email',
      'Vendas ilimitadas',
      'Cadastro completo de empresa'
    ]
  },
  {
    name: 'Básico',
    price: 49.90,
    period: '/mês',
    description: 'Ideal para pequenas empresas',
    icon: CheckCircle,
    color: 'from-green-500 to-emerald-500',
    features: [
      '1 usuário',
      'Até 50 produtos',
      'Até 100 clientes',
      'Suporte por email',
      'Relatórios básicos',
      'Gestão de estoque'
    ]
  },
  {
    name: 'Profissional',
    price: 99.90,
    period: '/mês',
    description: 'Para empresas em crescimento',
    icon: Crown,
    color: 'from-blue-500 to-indigo-500',
    popular: true,
    features: [
      'Até 5 usuários',
      'Até 500 produtos',
      'Até 1.000 clientes',
      'Suporte prioritário',
      'Relatórios avançados',
      'Integração com APIs',
      'Backup automático'
    ]
  },
  {
    name: 'Enterprise',
    price: 299.90,
    period: '/mês',
    description: 'Solução completa para grandes empresas',
    icon: Star,
    color: 'from-purple-500 to-pink-500',
    features: [
      'Usuários ilimitados',
      'Produtos ilimitados',
      'Clientes ilimitados',
      'Suporte 24/7',
      'Integrações personalizadas',
      'Suporte dedicado',
      'Customizações avançadas'
    ]
  },
];

export default function HomePage() {
  const { user, loading } = useSimpleAuth();
  const router = useRouter();

  // Se autenticação estiver ativada e usuário logado, redirecionar
  useEffect(() => {
    if (ENABLE_AUTH && user && !loading) {
      console.log('🔄 Usuário logado, redirecionando para dashboard...');
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Landing page NUNCA mostra loading - renderiza diretamente

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative">
          {/* Navbar */}
          <nav className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">JUGA</span>
              </div>
              <div className="flex items-center gap-4">
                <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/login">Começar Grátis</Link>
                </Button>
              </div>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="container mx-auto px-6 py-20 lg:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-6 bg-white/20 border-white/30 text-white backdrop-blur-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                Sistema Completo de Gestão Empresarial
              </Badge>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Gerencie seu negócio de forma
                <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  simples e inteligente
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-white/90 mb-10 max-w-3xl mx-auto">
                JUGA é a solução completa para pequenas e médias empresas. 
                Controle vendas, estoque, clientes e finanças em um só lugar.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6" onClick={() => router.push('/register')}>
                  Começar Teste Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/10 hover:bg-white/20 text-white border-white/30">
                  Ver Demonstração
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="mt-16 flex items-center justify-center gap-8 text-white/70 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>7 dias grátis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>Dados seguros</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Sem cartão</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Um sistema completo para gerenciar todos os aspectos do seu negócio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className={`rounded-2xl p-[1px] bg-gradient-to-br ${feature.color}`}>
                <Card className="rounded-2xl bg-white dark:bg-gray-900 border border-transparent shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className={`text-xl ${feature.titleColor || 'text-gray-900 dark:text-white'}`}>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-gray-900 dark:text-gray-100 leading-relaxed">{feature.description}</p>
                </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Planos para cada necessidade
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Escolha o plano ideal para o tamanho do seu negócio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const buttonIconForPlan = (name: string) => {
                switch (name) {
                  case 'Trial':
                    return Zap;
                  case 'Básico':
                    return CheckCircle;
                  case 'Profissional':
                    return Crown;
                  default:
                    return Star;
                }
              };
              const ButtonIcon = buttonIconForPlan(plan.name);
              const CardInner = (
                <Card 
                  key={index} 
                  className={`relative border-2 hover:shadow-2xl transition-all duration-300 rounded-2xl h-full flex flex-col ${
                    plan.popular 
                      ? 'border-blue-500 shadow-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 hover:scale-105 hover:shadow-blue-500/50' 
                      : 'border-gray-200 hover:border-blue-300 bg-white dark:bg-gray-950 hover:-translate-y-1 hover:border-blue-300 hover:shadow-2xl'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-1 font-semibold">
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8 pt-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className={`text-2xl mb-2 ${plan.popular ? 'text-white' : ''}`}>{plan.name}</CardTitle>
                    <CardDescription className={`text-sm ${plan.popular ? 'text-blue-100' : ''}`}>{plan.description}</CardDescription>
                    
                    <div className="mt-6">
                      <div className={`text-5xl font-bold ${plan.popular ? 'text-white' : ''}`}>
                        {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                      </div>
                      <div className={`text-sm mt-1 ${plan.popular ? 'text-blue-100' : 'text-gray-600 dark:text-white'}`}>{plan.period}</div>
                       {plan.price > 0 && (
                         <div
                           className={`inline-block mt-3 text-xs font-medium px-3 py-1 rounded-full ${
                             plan.popular 
                               ? 'bg-white text-blue-700' 
                               : `bg-gradient-to-r text-white ${
                                   plan.name === 'Básico'
                                     ? 'from-emerald-600 to-teal-600'
                                     : 'from-purple-600 to-fuchsia-600'
                                 }`
                           }`}
                         >
                           Economize 2 meses no anual
                         </div>
                       )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col flex-grow pt-6 pb-6">
                    <ul className="space-y-3 flex-grow mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <CheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${plan.popular ? 'text-white' : 'text-green-600'}`} />
                          <span className={plan.popular ? 'text-white' : 'text-gray-700 dark:text-white'}>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className={`w-full transition rounded-2xl font-semibold inline-flex items-center justify-center gap-1 sm:gap-2 md:gap-3 py-4 sm:py-5 md:py-5 pl-5 sm:pl-6 md:pl-7 pr-4 sm:pr-5 md:pr-6 shadow-md hover:shadow-lg ${
                        plan.popular 
                          ? 'bg-white text-blue-700 hover:bg-blue-50 border-2 border-white/20 hover:border-white/40' 
                          : `text-white bg-gradient-to-r hover:brightness-110 ring-1 ring-white/10 hover:ring-white/40 focus-visible:ring-2 focus-visible:ring-white/60 ${
                              plan.name === 'Trial'
                                ? 'from-orange-500 to-red-500'
                                : plan.name === 'Básico'
                                ? 'from-emerald-600 to-teal-600'
                                : 'from-purple-600 to-fuchsia-600'
                            }`
                      }`}
                      variant="default"
                      size="lg"
                      onClick={() => router.push('/register')}
                    >
                      <ButtonIcon className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm md:text-base whitespace-nowrap">
                        {plan.price === 0 ? 'Começar Grátis' : 'Escolher Plano'}
                      </span>
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 flex-shrink-0" />
                    </Button>
                  </CardContent>
                </Card>
              );

              return plan.popular ? (
                <div key={`wrap-${index}`} className={`rounded-2xl p-[2px] bg-gradient-to-br ${plan.color}`}>
                  {CardInner}
                </div>
              ) : (
                  CardInner
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já confiam no JUGA
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-6"
              onClick={() => router.push('/register')}
            >
              Começar Teste Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            {!ENABLE_AUTH && (
              <Button 
                asChild
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                <Link href="/dashboard">Ver Sistema</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">JUGA</span>
              </div>
              <p className="text-gray-400 text-sm">
                Sistema moderno de gestão empresarial para pequenas e médias empresas.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Funcionalidades</Link></li>
                <li><Link href="#" className="hover:text-white transition">Preços</Link></li>
                <li><Link href="#" className="hover:text-white transition">Demonstração</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Central de Ajuda</Link></li>
                <li><Link href="#" className="hover:text-white transition">Documentação</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contato</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Termos de Uso</Link></li>
                <li><Link href="#" className="hover:text-white transition">Privacidade</Link></li>
                <li><Link href="#" className="hover:text-white transition">Segurança</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 JUGA. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
