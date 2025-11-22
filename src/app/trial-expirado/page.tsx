'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock, Crown, ArrowRight, CheckCircle } from 'lucide-react';
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
        // Forçar refresh da subscription
        await refreshSubscription();
        
        // Buscar subscription atualizada
        const response = await fetch(`/next_api/subscriptions?tenant_id=${tenant.id}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const subData = result.data;
            const now = new Date();
            
            // Verificar se plano está ativo e não expirado
            const isActive = subData.status === 'active';
            const periodEnd = subData.current_period_end ? new Date(subData.current_period_end) : null;
            const isNotExpired = !periodEnd || periodEnd > now;
            
            if (isActive && isNotExpired) {
              // Plano foi ativado! Redirecionar para dashboard
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-heading">Período de Teste Expirado</h1>
          <p className="text-body text-lg">
            Seu período gratuito de 7 dias chegou ao fim
          </p>
        </div>

        {/* Card Principal */}
        <Card className="juga-card border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-800 flex items-center justify-center gap-2">
              <Clock className="h-6 w-6" />
              Acesso Restrito
            </CardTitle>
            <CardDescription className="text-red-700 text-base">
              Para continuar usando o sistema, escolha um dos nossos planos
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
                {checking ? 'Verificando...' : 'Verificar Novamente'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className="flex-1 h-12 text-base"
              >
                Voltar ao Início
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





