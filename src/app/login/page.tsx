'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { ENABLE_AUTH } from '@/constants/auth';
import { Loader2, ArrowLeft, Shield, Users, BarChart3, Settings } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useSimpleAuth();
  const [activeTab, setActiveTab] = useState('login');

  // Redirecionar se já estiver logado (apenas quando autenticação estiver habilitada)
  useEffect(() => {
    if (ENABLE_AUTH && !loading && user) {
      // Verificar se há um parâmetro de redirecionamento
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
    }
  }, [user, loading, router]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
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
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
    } else {
      // Quando autenticação está desabilitada, apenas redirecionar para dashboard
      router.push('/dashboard');
    }
  };

  const handleRegisterSuccess = () => {
    if (ENABLE_AUTH) {
      setActiveTab('login');
      // Mostrar mensagem de sucesso ou redirecionar
    } else {
      // Quando autenticação está desabilitada, redirecionar para dashboard
      router.push('/dashboard');
    }
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

        {/* Card principal com tabs */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="text-sm font-medium">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="register" className="text-sm font-medium">
                  Registrar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="login" className="space-y-4">
                <LoginForm 
                  onSuccess={handleLoginSuccess}
                  onSwitchToRegister={() => setActiveTab('register')}
                />
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <RegisterForm 
                  onSuccess={handleRegisterSuccess}
                  onSwitchToLogin={() => setActiveTab('login')}
                />
              </TabsContent>
            </Tabs>
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
