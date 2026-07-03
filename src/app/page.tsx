'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { ENABLE_AUTH } from '@/constants/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Aurora from '@/components/ui/Aurora';
import {
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
  ChevronDown,
  Shield,
  Users,
  BarChart3,
  Settings,
  FileText,
  Wallet,
  ShoppingCart,
  Building2,
  Utensils,
  Heart,
  Cpu,
  Truck,
  HardHat,
  Leaf,
  Quote,
  Phone,
  Mail,
  Menu,
  X,
  Play,
  Monitor,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  BadgeCheck,
  Headphones,
  Server,
  StarIcon,
} from 'lucide-react';

/* ──────────────────────────── DATA ──────────────────────────── */

const navLinks = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Como Funciona', href: '#como-funciona' },
  { label: 'Segmentos', href: '#segmentos' },
  { label: 'Planos', href: '#planos' },
  { label: 'FAQ', href: '#faq' },
];

const trustStats = [
  { value: '+500', label: 'Empresas ativas', icon: Building2 },
  { value: '4.9', label: 'Nota de satisfação', icon: Star },
  { value: '24h', label: 'Suporte humanizado', icon: Headphones },
  { value: '99.9%', label: 'Servidor disponível', icon: Server },
];

const features = [
  {
    icon: FileText,
    title: 'Emissão de Notas Fiscais',
    description: 'Emita NF-e, NFS-e e NFC-e de forma simples e rápida. Preenchimento inteligente, envio automático à SEFAZ e armazenamento seguro.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Wallet,
    title: 'Controle Financeiro',
    description: 'Gerencie contas a pagar e receber, fluxo de caixa e DRE. Visão clara de receitas, despesas e margem de lucro em tempo real.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Package,
    title: 'Gestão de Estoque',
    description: 'Controle de entradas e saídas automatizado. Alertas de estoque mínimo, suporte a código de barras e rastreamento de lotes.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: ShoppingCart,
    title: 'Vendas e PDV',
    description: 'Frente de caixa completa com carrinho de compras, múltiplas formas de pagamento, desconto automático e cupom fiscal.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: Users,
    title: 'Gestão de Clientes',
    description: 'Cadastro completo de clientes e fornecedores com histórico de compras, segmentação e sistema de aprovação integrado.',
    color: 'from-rose-500 to-pink-600',
  },
  {
    icon: BarChart3,
    title: 'Relatórios Gerenciais',
    description: 'Gráficos interativos, relatórios de vendas, estoque e financeiro. Exportação em PDF e Excel para tomada de decisão estratégica.',
    color: 'from-cyan-500 to-sky-600',
  },
];

const steps = [
  {
    number: '01',
    title: 'Crie sua conta grátis',
    description: 'Cadastre-se em menos de 2 minutos. Sem cartão de crédito, sem compromisso. Acesso imediato a todas as funcionalidades.',
    icon: Zap,
  },
  {
    number: '02',
    title: 'Configure seu negócio',
    description: 'Insira os dados da sua empresa, configure impostos e cadastre seus produtos. Nosso assistente guia cada etapa.',
    icon: Settings,
  },
  {
    number: '03',
    title: 'Comece a gerenciar',
    description: 'Emita notas, registre vendas e acompanhe suas finanças. Tudo em um só lugar, acessível de qualquer dispositivo.',
    icon: TrendingUp,
  },
];

const segments = [
  { icon: ShoppingCart, label: 'Comércio' },
  { icon: ClipboardList, label: 'Serviços' },
  { icon: Utensils, label: 'Alimentação' },
  { icon: Heart, label: 'Saúde e Beleza' },
  { icon: Cpu, label: 'Tecnologia' },
  { icon: Truck, label: 'Logística' },
  { icon: HardHat, label: 'Construção' },
  { icon: Leaf, label: 'Agronegócio' },
];

const testimonials = [
  {
    name: 'Carlos Mendes',
    role: 'Proprietário',
    company: 'CM Distribuidora',
    text: 'O JUGA simplificou totalmente a gestão da minha distribuidora. Antes eu usava 3 sistemas diferentes, agora tudo está em um só lugar. Reduzi custos e ganhei tempo.',
    rating: 5,
  },
  {
    name: 'Ana Paula Costa',
    role: 'Gerente',
    company: 'Clínica Renova',
    text: 'A emissão de NFS-e ficou muito mais rápida. O suporte é excelente — sempre respondem rápido e resolvem tudo. Recomendo para qualquer empresa de serviços.',
    rating: 5,
  },
  {
    name: 'Ricardo Silva',
    role: 'CEO',
    company: 'TechParts Ltda',
    text: 'O controle de estoque e o PDV são impecáveis. Conseguimos acompanhar cada movimentação em tempo real e isso revolucionou nossa operação.',
    rating: 5,
  },
];

const plans = [
  {
    name: 'Trial',
    priceMonthly: 0,
    priceYearly: 0,
    period: '3 dias grátis',
    description: 'Experimente todas as funcionalidades',
    icon: Zap,
    color: 'from-orange-500 to-red-500',
    features: [
      '1 usuário',
      'Até 50 produtos',
      'Até 100 clientes',
      'Suporte por email',
      'Vendas ilimitadas',
      'Cadastro de empresa',
    ],
  },
  {
    name: 'Básico',
    priceMonthly: 79.9,
    priceYearly: 767.04, // 20% desc (R$ 63,92/mês equivalente)
    period: '/mês',
    description: 'Ideal para pequenas empresas',
    icon: CheckCircle,
    color: 'from-green-500 to-emerald-600',
    features: [
      '1 usuário',
      'Até 50 produtos',
      'Até 100 clientes',
      'Suporte por email',
      'Relatórios básicos',
      'Gestão de estoque',
    ],
  },
  {
    name: 'Profissional',
    priceMonthly: 139.9,
    priceYearly: 1343.04, // 20% desc (R$ 111,92/mês equivalente)
    period: '/mês',
    description: 'Para empresas em crescimento',
    icon: Crown,
    color: 'from-blue-500 to-indigo-600',
    popular: true,
    features: [
      'Até 5 usuários',
      'Até 500 produtos',
      'Até 1.000 clientes',
      'Suporte prioritário',
      'Relatórios avançados',
      'Integração com APIs',
      'Backup automático',
    ],
  },
  {
    name: 'Enterprise',
    priceMonthly: 299.9,
    priceYearly: 2879.04, // 20% desc (R$ 239,92/mês equivalente)
    period: '/mês',
    description: 'Solução completa para grandes empresas',
    icon: Star,
    color: 'from-purple-500 to-pink-600',
    features: [
      'Usuários ilimitados',
      'Produtos ilimitados',
      'Clientes ilimitados',
      'Suporte 24/7',
      'Integrações personalizadas',
      'Suporte dedicado',
      'Customizações avançadas',
    ],
  },
];

const faqs = [
  {
    q: 'É possível testar o sistema antes de contratar?',
    a: 'Sim! Você pode testar todas as funcionalidades do JUGA por 3 dias de forma totalmente gratuita. Não é necessário informar cartão de crédito para iniciar o teste.',
  },
  {
    q: 'Como funciona a emissão de notas fiscais?',
    a: 'O JUGA permite emitir NF-e, NFS-e e NFC-e diretamente pela plataforma, com preenchimento inteligente e envio automático à SEFAZ. Todas as notas ficam armazenadas com segurança para consultas futuras.',
  },
  {
    q: 'Quais segmentos de negócio são atendidos?',
    a: 'O JUGA atende empresas de diversos segmentos como comércio, serviços, alimentação, saúde e beleza, tecnologia, logística e mais. Nosso sistema é flexível e se adapta às necessidades do seu negócio.',
  },
  {
    q: 'Existe custo adicional para emissão de notas fiscais?',
    a: 'Não. Todos os planos pagos incluem a emissão de notas fiscais sem custo adicional. No plano Trial, a emissão também está disponível para testes durante o período gratuito.',
  },
  {
    q: 'Como funciona o suporte técnico?',
    a: 'Nosso suporte é humanizado e eficiente. Você pode entrar em contato por chat ou email. O atendimento funciona de segunda a sexta, das 8h às 18h. Todos os planos incluem suporte gratuito.',
  },
  {
    q: 'Como é feita a cobrança da assinatura?',
    a: 'A cobrança pode ser mensal ou anual. No plano anual, você economiza o equivalente a 2 meses. O pagamento é processado de forma segura e você pode cancelar a qualquer momento.',
  },
  {
    q: 'Meus dados estão seguros?',
    a: 'Sim. Utilizamos criptografia de ponta a ponta, backups automáticos diários e servidores em nuvem com alto nível de segurança. Seus dados estão protegidos seguindo as melhores práticas do mercado e em conformidade com a LGPD.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. Não existe multa ou fidelidade obrigatória. Você pode cancelar seu plano quando quiser diretamente pelas configurações da sua conta.',
  },
];

/* ──────────────────────── COMPONENTS ─────────────────────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200/80 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 px-1 text-left group cursor-pointer"
      >
        <span className="font-semibold text-slate-800 text-[15px] pr-4 group-hover:text-blue-600 transition-colors">
          {q}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-blue-600' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 pb-5' : 'max-h-0'}`}
      >
        <p className="text-slate-600 text-sm leading-relaxed px-1">{a}</p>
      </div>
    </div>
  );
}

/* ──────────────────────── MAIN PAGE ─────────────────────── */

export default function HomePage() {
  const { user, loading } = useSimpleAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    if (ENABLE_AUTH && user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* ═══════════════════ 1. NAVBAR STICKY ═══════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] border-b border-slate-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/20">
                <span className="font-black text-base text-white tracking-tighter">JS</span>
              </div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                JUGA <span className="font-medium text-slate-500">Sistemas</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="px-3.5 py-2 text-[13px] font-semibold text-slate-600 hover:text-blue-600 rounded-lg hover:bg-blue-50/60 transition-all"
                >
                  {l.label}
                </a>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                className="text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/60"
              >
                <Link href="/login">Entrar</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 rounded-xl px-5 text-sm font-semibold"
              >
                <Link href="/register">
                  Começar Grátis
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Mobile toggle */}
            <button
              className="lg:hidden p-2 text-slate-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-2 border-t border-slate-100 mt-2">
                <Button asChild variant="outline" className="w-full justify-center">
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                >
                  <Link href="/register">Começar Grátis</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════ 2. HERO SECTION ═══════════════════ */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        {/* Aurora Background */}
        <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
          <Aurora colorStops={['#0ea5e9', '#3b82f6', '#93c5fd']} blend={0.85} amplitude={1.0} speed={0.3} />
        </div>

        {/* Gradient overlay bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-[1]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/60 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Sistema de Gestão Empresarial Completo
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-slate-900 leading-[1.08] tracking-tight mb-6">
              Simplifique a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
                gestão completa
              </span>{' '}
              da sua empresa
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              O JUGA Sistemas é a plataforma multiuso que centraliza notas fiscais, financeiro, estoque, vendas e
              relatórios. Tudo em um só lugar, acessível de qualquer dispositivo.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/20 rounded-xl px-8 py-6 text-base font-semibold"
                onClick={() => router.push('/register')}
              >
                Começar Teste Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 rounded-xl px-8 py-6 text-base font-semibold"
                onClick={() => {
                  document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Play className="mr-2 h-4 w-4" />
                Ver Funcionalidades
              </Button>
            </div>

            {/* Trust Inline */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-500" /> 3 dias grátis
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-blue-500" /> Dados criptografados
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" /> Sem cartão de crédito
              </span>
            </div>
          </div>

          {/* Dashboard Mockup Preview */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="relative rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-md shadow-[0_30px_80px_rgba(0,0,0,0.08)] overflow-hidden">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-100/80 border-b border-slate-200/60">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 text-center">
                  <div className="inline-flex items-center gap-2 bg-white rounded-lg px-4 py-1 text-xs text-slate-500 border border-slate-200/60">
                    <Lock className="h-3 w-3 text-emerald-500" />
                    app.jugasistemas.com.br/dashboard
                  </div>
                </div>
              </div>
              {/* Screenshot area - simulated dashboard */}
              <div className="p-6 bg-gradient-to-br from-slate-50 to-white">
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {[
                    { label: 'Vendas Hoje', value: 'R$ 4.280', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Notas Emitidas', value: '38', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Clientes Ativos', value: '1.247', color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Produtos', value: '892', color: 'text-amber-600', bg: 'bg-amber-50' },
                  ].map((s, i) => (
                    <div key={i} className={`${s.bg} rounded-xl p-4 border border-slate-100`}>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
                      <p className={`text-xl font-extrabold ${s.color} mt-1`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 bg-white rounded-xl border border-slate-100 p-4 h-32">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Receita Mensal</p>
                    <div className="flex items-end gap-1.5 h-16">
                      {[40, 55, 35, 65, 50, 72, 60, 80, 68, 75, 85, 90].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-100 p-4 h-32">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</p>
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600">NF-e</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Ativo</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600">PDV</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Online</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600">Backup</span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Sincronizado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 3. BARRA DE CONFIANÇA ═══════════════════ */}
      <section className="py-10 bg-slate-50/80 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {trustStats.map((s, i) => (
              <div key={i} className="flex items-center gap-4 justify-center">
                <div className="h-11 w-11 rounded-xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center shrink-0">
                  <s.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-slate-900">{s.value}</p>
                  <p className="text-xs font-medium text-slate-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 4. FUNCIONALIDADES ═══════════════════ */}
      <section id="funcionalidades" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-200/50 px-3 py-1 rounded-full mb-4">
              <LayoutDashboard className="h-3 w-3" />
              Funcionalidades
            </span>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Tudo que você precisa em um só sistema
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Gerencie notas fiscais, finanças, estoque e vendas com uma plataforma integrada e intuitiva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative bg-white border border-slate-200/80 rounded-2xl p-7 hover:shadow-xl hover:shadow-blue-600/5 hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-md`}
                >
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 5. COMO FUNCIONA ═══════════════════ */}
      <section id="como-funciona" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-200/50 px-3 py-1 rounded-full mb-4">
              <BadgeCheck className="h-3 w-3" />
              Como Funciona
            </span>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Comece a usar em 3 passos simples
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Em minutos, sua empresa estará funcionando no JUGA. Sem burocracia, sem complicação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center group">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-blue-300 to-blue-100 z-0" />
                )}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                    <s.icon className="h-8 w-8 text-white" />
                  </div>
                  <span className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">
                    Passo {s.number}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-xs">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 6. SEGMENTOS ATENDIDOS ═══════════════════ */}
      <section id="segmentos" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-200/50 px-3 py-1 rounded-full mb-4">
              <Building2 className="h-3 w-3" />
              Segmentos
            </span>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Feito para o seu tipo de negócio
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Seja qual for o seu segmento, o JUGA se adapta à sua realidade com funcionalidades flexíveis e configuráveis.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {segments.map((s, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-3 p-6 bg-slate-50 border border-slate-200/60 rounded-2xl hover:bg-blue-50 hover:border-blue-200/60 hover:shadow-md transition-all duration-200 group cursor-default"
              >
                <div className="h-12 w-12 rounded-xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center group-hover:bg-blue-100 group-hover:border-blue-300/40 transition-colors">
                  <s.icon className="h-6 w-6 text-slate-500 group-hover:text-blue-600 transition-colors" />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 7. DEPOIMENTOS ═══════════════════ */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-200/50 px-3 py-1 rounded-full mb-4">
              <Quote className="h-3 w-3" />
              Depoimentos
            </span>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Empresas de diferentes segmentos confiam no JUGA para simplificar sua gestão.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200/80 rounded-2xl p-7 hover:shadow-lg transition-shadow duration-300 flex flex-col"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed mb-6 flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {t.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      {t.role} — {t.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 8. PLANOS E PREÇOS ═══════════════════ */}
      <section id="planos" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-200/50 px-3 py-1 rounded-full mb-4">
              <CircleDollarSign className="h-3 w-3" />
              Planos
            </span>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Planos para cada necessidade
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Escolha o plano ideal para o tamanho do seu negócio. Todos incluem suporte e atualizações.
            </p>

            {/* Seletor Mensal/Anual com 20% desconto */}
            <div className="flex items-center justify-center gap-3 mt-8 mb-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const isPopular = plan.popular;
              const isTrial = plan.name === 'Trial';
              
              const currentPrice = isTrial 
                ? 0 
                : isYearly 
                  ? plan.priceYearly 
                  : plan.priceMonthly;
                  
              const priceDisplay = isTrial 
                ? 'Grátis' 
                : `R$ ${currentPrice.toFixed(2).replace('.', ',')}`;

              const periodDisplay = isTrial 
                ? plan.period 
                : isYearly 
                  ? '/ano' 
                  : '/mês';

              return (
                <div
                  key={index}
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
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} mx-auto mb-4 flex items-center justify-center shadow-lg ${
                        isPopular ? 'bg-white/20' : ''
                      }`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className={`text-xl font-bold mb-1 ${isPopular ? 'text-white' : 'text-slate-900'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs mb-5 ${isPopular ? 'text-blue-100' : 'text-slate-500'}`}>
                      {plan.description}
                    </p>

                    <div className="mb-6">
                      <span className={`text-4xl font-extrabold ${isPopular ? 'text-white' : 'text-slate-900'}`}>
                        {priceDisplay}
                      </span>
                      <span className={`text-sm ml-1 ${isPopular ? 'text-blue-100' : 'text-slate-500'}`}>
                        {periodDisplay}
                      </span>
                      {isYearly && !isTrial && (
                        <div className={`text-[10px] mt-1 font-semibold ${isPopular ? 'text-blue-200' : 'text-slate-400'}`}>
                          Equivalente a R$ {(plan.priceYearly / 12).toFixed(2).replace('.', ',')}/mês
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2.5 text-left flex-1 mb-6">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-[13px]">
                          <CheckCircle
                            className={`h-4 w-4 mt-0.5 shrink-0 ${isPopular ? 'text-blue-200' : 'text-emerald-500'}`}
                          />
                          <span className={isPopular ? 'text-blue-50' : 'text-slate-700'}>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full rounded-xl py-3 font-semibold transition-all ${
                        isPopular
                          ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-md'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/10'
                      }`}
                      onClick={() => router.push('/register')}
                    >
                      {isTrial ? 'Começar Grátis' : 'Escolher Plano'}
                      <ChevronRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 9. FAQ ═══════════════════ */}
      <section id="faq" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-200/50 px-3 py-1 rounded-full mb-4">
              Perguntas Frequentes
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Dúvidas? A gente responde.
            </h2>
            <p className="text-base text-slate-600">
              Encontre respostas para as perguntas mais comuns sobre o JUGA Sistemas.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm">
            {faqs.map((f, i) => (
              <FAQItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 10. CTA FINAL + FOOTER ═══════════════════ */}
      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <Aurora colorStops={['#ffffff', '#dbeafe', '#c7d2fe']} blend={0.5} amplitude={1.2} speed={0.4} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já simplificaram sua gestão com o JUGA Sistemas.
            Comece seu teste grátis hoje mesmo.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl rounded-xl px-8 py-6 text-base font-bold"
              onClick={() => router.push('/register')}
            >
              Começar Teste Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8 py-6 text-base font-semibold bg-white/5"
              onClick={() => router.push('/login')}
            >
              Já tenho conta — Entrar
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center">
                  <span className="font-black text-base text-white tracking-tighter">JS</span>
                </div>
                <span className="font-extrabold text-lg">
                  JUGA <span className="font-normal text-slate-400">Sistemas</span>
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-5">
                O ERP inteligente para simplificar a gestão do seu negócio. Notas fiscais, financeiro, estoque e
                vendas em uma única plataforma.
              </p>
              <div className="flex items-center gap-4 text-slate-500">
                <a href="mailto:contato@jugasistemas.com.br" className="hover:text-white transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
                <a href="tel:+5500000000000" className="hover:text-white transition-colors">
                  <Phone className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-sm mb-4 text-slate-300 uppercase tracking-wider">Produto</h4>
              <ul className="space-y-2.5">
                {['Funcionalidades', 'Planos e Preços', 'Notas Fiscais', 'PDV', 'Relatórios'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suporte */}
            <div>
              <h4 className="font-bold text-sm mb-4 text-slate-300 uppercase tracking-wider">Suporte</h4>
              <ul className="space-y-2.5">
                {['Central de Ajuda', 'Documentação', 'Contato', 'Status do Sistema'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-sm mb-4 text-slate-300 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2.5">
                {['Termos de Uso', 'Privacidade', 'Segurança', 'LGPD'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500">
              © 2026 JUGA Sistemas. Todos os direitos reservados.
            </p>
            <p className="text-xs text-slate-600">
              Feito com 💙 para empreendedores brasileiros
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
