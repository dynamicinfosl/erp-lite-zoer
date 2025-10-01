'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { ENABLE_AUTH } from '@/constants/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ChevronRight,
  Mail,
  Building2,
  Phone
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Users,
    title: 'Gestão de Clientes',
    description: 'Organize e gerencie sua base de clientes com facilidade e eficiência'
  },
  {
    icon: Package,
    title: 'Controle de Estoque',
    description: 'Monitore seu inventário em tempo real com alertas inteligentes'
  },
  {
    icon: BarChart3,
    title: 'Relatórios Avançados',
    description: 'Análises detalhadas para tomada de decisões estratégicas'
  },
  {
    icon: TrendingUp,
    title: 'Vendas e PDV',
    description: 'Sistema completo de ponto de venda integrado'
  },
  {
    icon: Lock,
    title: 'Segurança',
    description: 'Dados protegidos com criptografia e backup automático'
  },
  {
    icon: Settings,
    title: 'Configuração Flexível',
    description: 'Personalize o sistema conforme suas necessidades'
  },
];

const plans = [
  {
    name: 'Trial',
    price: 0,
    period: '30 dias grátis',
    description: 'Experimente todas as funcionalidades',
    icon: Zap,
    color: 'from-orange-500 to-red-500',
    features: [
      '1 usuário',
      'Até 100 produtos',
      'Até 100 clientes',
      'Suporte por email',
      'Vendas ilimitadas'
    ]
  },
  {
    name: 'Básico',
    price: 29.90,
    period: '/mês',
    description: 'Ideal para pequenas empresas',
    icon: CheckCircle,
    color: 'from-green-500 to-emerald-500',
    features: [
      'Até 3 usuários',
      'Até 1.000 produtos',
      'Até 1.000 clientes',
      'Suporte email e chat',
      'Relatórios básicos'
    ]
  },
  {
    name: 'Profissional',
    price: 59.90,
    period: '/mês',
    description: 'Para empresas em crescimento',
    icon: Crown,
    color: 'from-blue-500 to-indigo-500',
    popular: true,
    features: [
      'Até 10 usuários',
      'Até 10.000 produtos',
      'Até 10.000 clientes',
      'Suporte prioritário',
      'API completa',
      'Multi-usuários',
      'Relatórios avançados'
    ]
  },
  {
    name: 'Enterprise',
    price: 99.90,
    period: '/mês',
    description: 'Para grandes empresas',
    icon: Star,
    color: 'from-purple-500 to-pink-500',
    features: [
      'Usuários ilimitados',
      'Produtos ilimitados',
      'Clientes ilimitados',
      'Suporte dedicado 24/7',
      'API completa',
      'White-label',
      'Customizações'
    ]
  },
];

export default function HomePage() {
  const { user, loading } = useSimpleAuth();
  const router = useRouter();
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // Se autenticação estiver ativada e usuário logado, redirecionar
  useEffect(() => {
    if (ENABLE_AUTH && user) {
      router.push('/dashboard');
    }
  }, [user, router]);

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
                {ENABLE_AUTH ? (
                  <>
                    <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                      <Link href="/login">Entrar</Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href="/login">Começar Grátis</Link>
                    </Button>
                  </>
                ) : (
                  <Button asChild variant="secondary">
                    <Link href="/dashboard">Acessar Sistema</Link>
                  </Button>
                )}
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
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6" onClick={() => setShowRegisterForm(true)}>
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
                  <span>30 dias grátis</span>
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
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
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
              return (
                <Card 
                  key={index} 
                  className={`relative border-2 hover:shadow-2xl transition-all duration-300 ${
                    plan.popular 
                      ? 'border-blue-500 shadow-xl scale-105' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 hover:bg-blue-700 px-4 py-1">
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8 pt-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                    
                    <div className="mt-6">
                      <div className="text-5xl font-bold text-gray-900">
                        {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                      </div>
                      <div className="text-gray-600 text-sm mt-1">{plan.period}</div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => setShowRegisterForm(true)}
                    >
                      {plan.price === 0 ? 'Começar Grátis' : 'Escolher Plano'}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
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
              onClick={() => setShowRegisterForm(true)}
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

      {/* Modal de Registro */}
      {showRegisterForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md mx-auto shadow-2xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Criar Conta</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowRegisterForm(false)}
                >
                  ✕
                </Button>
              </div>
              <CardDescription>
                Comece seu teste grátis de 30 dias agora
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <form className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome da Empresa</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Minha Empresa Ltda" 
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      type="email"
                      placeholder="seu@email.com" 
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      type="tel"
                      placeholder="(00) 00000-0000" 
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Senha</label>
                  <Input 
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  size="lg"
                  onClick={(e) => {
                    e.preventDefault();
                    if (ENABLE_AUTH) {
                      router.push('/login?tab=register');
                    } else {
                      router.push('/dashboard');
                    }
                  }}
                >
                  Criar Minha Conta Grátis
                </Button>
              </form>

              <p className="text-xs text-gray-500 text-center mt-4">
                Ao criar uma conta, você concorda com nossos{' '}
                <Link href="#" className="text-blue-600 hover:underline">Termos de Uso</Link>
                {' '}e{' '}
                <Link href="#" className="text-blue-600 hover:underline">Política de Privacidade</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
