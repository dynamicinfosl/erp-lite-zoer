'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock, Crown, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';

export default function TrialExpiradoPage() {
  const router = useRouter();
  const { user, tenant, refreshSubscription } = useSimpleAuth();
  const [checking, setChecking] = useState(false);

  // Verificar periodicamente se o plano foi ativado
  useEffect(() => {
    if (!tenant?.id) return;

    const checkSubscription = async () => {
      try {
        setChecking(true);
        console.log('🔄 Verificando status do plano...');
        
        // Forçar refresh da subscription
        await refreshSubscription();
        
        // Buscar subscription atualizada diretamente do banco (cache bust)
        const response = await fetch(`/next_api/subscriptions?tenant_id=${tenant.id}&_=${Date.now()}`);
        if (response.ok) {
          const result = await response.json();
          console.log('📦 Subscription:', result.data);
          
          if (result.success && result.data) {
            const subData = result.data;
            const now = new Date();
            
            // Verificar se plano está ativo e não expirado
            const isActive = subData.status === 'active';
            const periodEnd = subData.current_period_end ? new Date(subData.current_period_end) : null;
            const isNotExpired = !periodEnd || periodEnd > now;
            
            console.log('📋 Status:', { 
              isActive, 
              periodEnd: periodEnd?.toISOString(), 
              isNotExpired,
              now: now.toISOString()
            });
            
            if (isActive && isNotExpired) {
              // Plano foi ativado! Redirecionar para dashboard
              console.log('✅ Plano ativado! Redirecionando...');
              router.push('/dashboard');
              return;
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar subscription:', error);
      } finally {
        setChecking(false);
      }
    };

    // Verificar imediatamente
    checkSubscription();
    
    // Verificar a cada 10 segundos
    const interval = setInterval(checkSubscription, 10000);

    return () => clearInterval(interval);
  }, [tenant?.id, router, refreshSubscription]);

  // Redirecionar para assinatura após 5 segundos (se não foi ativado)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!checking) {
        router.push('/assinatura');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [router, checking]);

  const handleUpgrade = () => {
    router.push('/assinatura');
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      // Limpar todos os dados do localStorage e sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      // Redirecionar para login
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-heading">Período de Teste Expirado</h1>
          <p className="text-body">Seu período de teste chegou ao fim. Continue aproveitando todos os recursos!</p>
        </div>

        {/* Card Principal */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-heading">Escolha um Plano</CardTitle>
            <CardDescription className="text-base">
              Mantenha o acesso completo ao sistema escolhendo um de nossos planos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações do Usuário */}
            <div className="bg-white/70 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-heading">Empresa: {tenant?.name || 'N/A'}</p>
                  <p className="text-sm text-body">Usuário: {user?.email || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-red-600 font-medium">Trial Expirado</p>
                  <p className="text-xs text-red-500">0 dias restantes</p>
                </div>
              </div>
            </div>

            {/* Benefícios dos Planos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-heading text-center">O que você ganha com um plano:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-body">Acesso completo ao sistema</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-body">Suporte prioritário</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-body">Atualizações automáticas</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-body">Backup de dados seguro</span>
                </div>
              </div>
            </div>

            {/* Instruções para renovação */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                <p className="font-semibold mb-2">✅ Já renovou seu plano?</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Clique em "Fazer Logout" abaixo</li>
                  <li>Faça login novamente</li>
                  <li>Seu plano renovado será ativado automaticamente</li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleUpgrade}
                className="juga-gradient text-white flex-1 h-12 text-base font-semibold"
              >
                <Crown className="h-5 w-5 mr-2" />
                Escolher Plano Agora
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  setChecking(true);
                  await refreshSubscription();
                  window.location.reload();
                }}
                disabled={checking}
                className="flex-1 h-12 text-base"
              >
                {checking ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Verificar Novamente
                  </>
                )}
              </Button>
            </div>

            {/* Botão de Logout */}
            <div className="pt-4 border-t border-gray-200">
              <Button 
                onClick={handleLogout}
                variant="ghost"
                className="w-full"
              >
                Fazer Logout e Entrar Novamente
              </Button>
            </div>

            {/* Redirecionamento Automático */}
            <Alert className="border-blue-200 bg-blue-50">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Você será redirecionado automaticamente para a página de planos em alguns segundos...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-body">
          <p>Precisa de ajuda? Entre em contato conosco em suporte@empresa.com</p>
        </div>
      </div>
    </div>
  );
}
