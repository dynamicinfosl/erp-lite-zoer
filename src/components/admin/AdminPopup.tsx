'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface AdminPopupProps {
  onClose?: () => void;
}

export function AdminPopup({ onClose }: AdminPopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  // Credenciais de acesso administrativo (você pode alterar estas)
  const adminCredentials = {
    username: 'admin',
    password: 'admin123',
    // Credenciais alternativas
    altUsername: 'juga_admin',
    altPassword: 'juga2024'
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    // Verificar credenciais
    const isValidCredentials = 
      (credentials.username === adminCredentials.username && credentials.password === adminCredentials.password) ||
      (credentials.username === adminCredentials.altUsername && credentials.password === adminCredentials.altPassword);

    if (!isValidCredentials) {
      setError('Credenciais inválidas. Verifique o usuário e senha.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Abrir painel admin em nova janela
      const adminWindow = window.open(
        '/admin',
        'adminPanel',
        'width=1400,height=900,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
      );

      if (adminWindow) {
        // Focar na nova janela
        adminWindow.focus();
        
        // Fechar popup de login
        onClose?.();
        
        toast.success('Painel administrativo aberto em nova janela');
      } else {
        throw new Error('Não foi possível abrir a nova janela. Verifique se os popups estão bloqueados.');
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao abrir painel administrativo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-red-200 bg-white dark:bg-gray-800">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-red-600 rounded-xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl text-gray-900 dark:text-white">
            Acesso Administrativo
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Credenciais para abrir o painel de controle
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Usuário Administrativo
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={credentials.username}
                onChange={handleInputChange}
                placeholder="Digite o usuário admin"
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha Administrativa
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={handleInputChange}
                  placeholder="Digite a senha admin"
                  required
                  className="w-full pr-10"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Abrindo...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Painel Admin
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>


        </CardContent>
      </Card>
    </div>
  );
}
