'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AprovacaoPendentePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-yellow-500 rounded-full">
              <Clock className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Aprovação Pendente</CardTitle>
          <CardDescription className="text-base mt-2">
            Seu cadastro está aguardando aprovação do administrador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Você não tem acesso ao sistema até que um administrador aprove seu cadastro.
              Você receberá um e-mail quando sua conta for aprovada.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>• Seu cadastro foi recebido com sucesso</p>
            <p>• Nossa equipe está analisando sua solicitação</p>
            <p>• Você será notificado por e-mail quando for aprovado</p>
          </div>

          <div className="pt-4">
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para o login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

