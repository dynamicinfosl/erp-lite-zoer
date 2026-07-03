'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { ENABLE_AUTH } from '@/constants/auth';
import { Loader2, ShieldCheck, Cloud, LifeBuoy } from 'lucide-react';
import Aurora from '@/components/ui/Aurora';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useSimpleAuth();

  // Redirecionamento imediato caso logado
  useEffect(() => {
    if (ENABLE_AUTH && !loading && user) {
      console.log('✅ [LOGIN] Usuário logado, redirecionando...');
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
    }
  }, [user, loading, router, searchParams]);

  const [showLoading, setShowLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 1500);
    
    if (!loading) {
      clearTimeout(timer);
      setShowLoading(false);
    }
    
    return () => clearTimeout(timer);
  }, [loading]);
  
  if (showLoading && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-500 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  const handleLoginSuccess = () => {
    if (ENABLE_AUTH) {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
    } else {
      router.push('/dashboard');
    }
  };

  const handleSwitchToRegister = () => {
    router.push('/register');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800 py-12 px-4 relative overflow-hidden font-sans">
      {/* ABSOLUTE BACKGROUND AURORA ANIMATION (Ocean Blue Theme) */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <Aurora
          colorStops={["#0ea5e9", "#3b82f6", "#93c5fd"]}
          blend={0.85}
          amplitude={1.0}
          speed={0.3}
        />
      </div>

      {/* TOP HEADER */}
      <div className="text-center max-w-sm mx-auto relative z-10 space-y-2.5">
        <div className="inline-flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/10">
            <span className="font-black text-lg text-white tracking-tighter">JS</span>
          </div>
          <span className="font-black text-xl text-slate-900 tracking-tight">
            JUGA Sistemas
          </span>
        </div>
        <p className="text-slate-500 text-xs font-semibold leading-relaxed uppercase tracking-wider">
          O ERP inteligente para simplificar sua gestão
        </p>
      </div>

      {/* CENTER LOGIN CARD (Glassmorphism white theme) */}
      <div className="w-full max-w-md mx-auto relative z-10 py-6">
        <div className="bg-white/80 border border-slate-200/80 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] backdrop-blur-md">
          <div className="space-y-1.5 mb-6">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Painel de Acesso</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Entrar na Conta</h2>
            <p className="text-xs text-slate-500 font-medium">Informe suas credenciais para acessar o painel</p>
          </div>

          <LoginForm 
            onSuccess={handleLoginSuccess}
            onSwitchToRegister={handleSwitchToRegister}
          />
        </div>
      </div>

      {/* FOOTER TRUST BADGES & LEGAL */}
      <div className="w-full max-w-md mx-auto relative z-10 space-y-6">
        {/* Trust Badges in Portuguese */}
        <div className="grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-6 text-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-8 w-8 rounded-full bg-white border border-slate-200/60 shadow-sm flex items-center justify-center">
              <ShieldCheck className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold text-slate-700">Conexão Segura</span>
            <p className="text-[9px] text-slate-400">Dados criptografados</p>
          </div>
          
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-8 w-8 rounded-full bg-white border border-slate-200/60 shadow-sm flex items-center justify-center">
              <Cloud className="h-4.5 w-4.5 text-indigo-600" />
            </div>
            <span className="text-[10px] font-bold text-slate-700">Nuvem Protegida</span>
            <p className="text-[9px] text-slate-400">Backup automático</p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="h-8 w-8 rounded-full bg-white border border-slate-200/60 shadow-sm flex items-center justify-center">
              <LifeBuoy className="h-4.5 w-4.5 text-violet-600" />
            </div>
            <span className="text-[10px] font-bold text-slate-700">Suporte Técnico</span>
            <p className="text-[9px] text-slate-400">Chat & E-mail incluso</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-[10px] text-slate-400">
          <p>© 2026 JUGA Sistemas. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
