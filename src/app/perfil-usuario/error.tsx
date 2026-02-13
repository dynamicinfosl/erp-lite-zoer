'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function PerfilUsuarioError({
  error,
  reset,
}: {
  error: Error & { digest?: string; cause?: any };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro no console para debug
    console.error('❌ Erro na página de perfil do usuário:', error);
  }, [error]);

  const handleReset = () => {
    reset();
  };

  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="flex h-screen w-full items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <CardTitle className="text-red-600 dark:text-red-400">
              Erro ao carregar perfil
            </CardTitle>
          </div>
          <CardDescription>
            Não foi possível carregar a página de perfil do usuário. Por favor, tente novamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error?.message && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                {error.message}
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleReset}
              variant="default"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
            
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && error?.stack && (
            <details className="mt-4">
              <summary className="text-xs text-gray-500 cursor-pointer mb-2">
                Detalhes técnicos (desenvolvimento)
              </summary>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

