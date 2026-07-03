'use client';

import { CompleteRegisterForm } from '@/components/auth/CompleteRegisterForm';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Aurora from '@/components/ui/Aurora';

export default function RegisterPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/login?registered=true');
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex bg-white text-slate-800 overflow-hidden font-sans">
      {/* LADO ESQUERDO: Showcase do Produto (Premium light panel) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative flex-col justify-between p-12 bg-slate-50 border-r border-slate-200/60 overflow-hidden select-none">
        {/* Background Aurora animation (Tema Azul) */}
        <div className="absolute inset-0 z-0 opacity-12 pointer-events-none">
          <Aurora
            colorStops={["#0ea5e9", "#3b82f6", "#93c5fd"]}
            blend={0.75}
            amplitude={1.0}
            speed={0.4}
          />
        </div>
        
        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/10">
            <span className="font-black text-xl text-white tracking-tighter">JS</span>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900 flex items-center gap-1.5">
              JUGA Sistemas <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full border border-blue-500/20">PRO v2.0</span>
            </h1>
          </div>
        </div>

        {/* Middle Showcase Content */}
        <div className="relative z-10 my-auto py-12 space-y-10">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-blue-600 uppercase bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              <Sparkles className="h-3 w-3" />
              Gestão Simples & Inteligente
            </span>
            <h2 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Simplifique a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
                gestão completa
              </span>{' '}
              da sua empresa.
            </h2>
            <p className="text-slate-600 text-base leading-relaxed max-w-md">
              A plataforma multiuso do JUGA Sistemas foi desenvolvida para automatizar suas notas fiscais, otimizar finanças e alavancar suas vendas de forma simples e segura.
            </p>
          </div>

          {/* Vantagens List */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Faturamento e Notas Fiscais Integradas</h4>
                <p className="text-xs text-slate-500 mt-0.5">Emita NF-e, NFS-e e NFC-e em segundos com preenchimento inteligente.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Controle de Fluxo de Caixa e DRE</h4>
                <p className="text-xs text-slate-500 mt-0.5">Visão transparente de suas receitas, despesas e margem de lucro real.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Estoque e Fornecedores Inteligentes</h4>
                <p className="text-xs text-slate-500 mt-0.5">Controle automático de entradas e saídas e alertas de nível crítico.</p>
              </div>
            </div>
          </div>

          {/* Glassmorphism Micro-Dashboard */}
          <div className="relative bg-white/70 border border-slate-200/80 rounded-2xl p-6 backdrop-blur-md shadow-xl shadow-slate-200/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Painel de Performance</span>
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Vendas deste mês</span>
                <span className="text-slate-900 font-extrabold">R$ 48.290,00</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full w-[78%] rounded-full" />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Meta: R$ 60.000</span>
                <span className="text-emerald-600 font-semibold">+12.4% vs mês anterior</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer info */}
        <div className="relative z-10 flex items-center justify-between border-t border-slate-200/60 pt-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-blue-600/80" />
            <span>Conexão Segura & Dados Criptografados</span>
          </div>
          <span>Servidores 100% Seguros & Backups Automáticos</span>
        </div>
      </div>

      {/* LADO DIREITO: Form de Cadastro */}
      <div className="flex-1 flex flex-col justify-between bg-slate-50/50 min-h-screen relative overflow-y-auto">
        {/* Floating Top Nav */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center pointer-events-auto z-20">
          <Button
            variant="ghost"
            onClick={handleBackToLogin}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 rounded-lg px-4 py-2 transition-all text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Login
          </Button>

          {/* Logo display visible on mobile only */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="font-black text-sm text-white">JS</span>
            </div>
            <span className="font-bold text-sm text-slate-900">JUGA Sistemas</span>
          </div>
        </div>

        {/* Container Centralizado para o Formulário */}
        <div className="flex-1 flex items-center justify-center px-4 md:px-8 py-24">
          <div className="w-full max-w-xl space-y-6">
            <CompleteRegisterForm 
              onSuccess={handleSuccess}
              onSwitchToLogin={handleBackToLogin}
            />
          </div>
        </div>

        {/* Footer legal */}
        <div className="py-6 border-t border-slate-100 text-center text-xs text-slate-400">
          <p>© 2026 JUGA Sistemas. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
