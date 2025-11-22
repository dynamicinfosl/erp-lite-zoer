'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { ENABLE_AUTH } from '@/constants/auth';
import { Loader2, ArrowLeft, Shield, Users, BarChart3, Settings } from 'lucide-react';
import { toast } from 'sonner';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, tenant, loading } = useSimpleAuth();

  // ✅ REDIRECIONAMENTO IMEDIATO: Redirecionar assim que usuário estiver logado
  useEffect(() => {
    if (ENABLE_AUTH && !loading && user) {
      console.log('✅ [LOGIN] Usuário logado, redirecionando imediatamente...');
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      console.log('✅ [LOGIN] Redirecionando para:', redirectTo);
      // Redirecionar imediatamente, sem esperar tenant
      router.push(redirectTo);
    }
  }, [user, loading, router, searchParams]);

  // Mostrar mensagem de sucesso se veio do registro
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      toast.success('Cadastro realizado com sucesso! Faça login para continuar.');
    }
  }, [searchParams]);

  // Mostrar loading apenas por um tempo muito curto (máximo 1.5s)
  const [showLoading, setShowLoading] = useState(true);
  
  useEffect(() => {
    // Mostrar loading por no máximo 1.5 segundos
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 1500);
    
    // Se o loading terminar antes, também liberar
    if (!loading) {
      clearTimeout(timer);
      setShowLoading(false);
    }
    
    return () => clearTimeout(timer);
  }, [loading]);
  
  if (showLoading && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Quando autenticação não estiver habilitada, mostrar página de login normalmente

  const handleLoginSuccess = () => {
    if (ENABLE_AUTH) {
      // Verificar se há um parâmetro de redirecionamento
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
    } else {
      // Quando autenticação está desabilitada, apenas redirecionar para dashboard
      router.push('/dashboard');
    }
  };

  const handleSwitchToRegister = () => {
    router.push('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Header com logo e título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold juga-heading mb-2">
            JUGA
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema de gestão empresarial moderno
          </p>
        </div>

        {/* Card principal de login */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <LoginForm 
              onSuccess={handleLoginSuccess}
              onSwitchToRegister={handleSwitchToRegister}
            />
          </CardContent>
        </Card>

        {/* Features destacadas */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <Users className="h-6 w-6 text-blue-600 mb-2" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Clientes</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Gerencie sua base</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <BarChart3 className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Relatórios</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Análise completa</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <Settings className="h-6 w-6 text-purple-600 mb-2" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Configurações</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Personalize o sistema</p>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="mt-6 space-y-3">
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao início
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
