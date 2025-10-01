'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

// Credenciais de superadmin
const ADMIN_CREDENTIALS = {
  username: 'superadmin',
  password: 'admin2024',
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  // Verificar se já está autenticado
  useEffect(() => {
    const adminAuth = sessionStorage.getItem('adminAuthenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
      router.push('/admin');
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Simular verificação de credenciais
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verificar credenciais
      if (formData.username === ADMIN_CREDENTIALS.username && 
          formData.password === ADMIN_CREDENTIALS.password) {
        
        // Salvar autenticação na sessão
        sessionStorage.setItem('adminAuthenticated', 'true');
        sessionStorage.setItem('adminUser', formData.username);
        
        toast.success('Login administrativo realizado com sucesso!');
        setIsAuthenticated(true);
        router.push('/admin');
      } else {
        setError('Credenciais inválidas. Verifique usuário e senha.');
      }
      
    } catch (err: any) {
      setError('Erro ao realizar login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-600 dark:text-gray-400">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Header com logo e título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-red-600 rounded-2xl shadow-2xl">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso Superadmin
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Painel de controle administrativo do sistema
          </p>
        </div>

        {/* Card principal */}
        <Card className="shadow-2xl border-0 bg-white dark:bg-gray-800">
          <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-center text-xl text-gray-900 dark:text-white flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Login Administrativo
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Usuário
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Digite o usuário admin"
                  required
                  className="w-full h-11"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Digite a senha"
                    required
                    className="w-full h-11 pr-10"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Acessar Painel
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informações de acesso */}
        <div className="mt-6">
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-semibold mb-1">Acesso Restrito</p>
                <p>Esta área é exclusiva para administradores do sistema. Acesso não autorizado será registrado.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informações de credenciais (temporário - remover em produção) */}
        <div className="mt-4">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200 font-mono">
              <strong>Credenciais:</strong><br />
              Usuário: <code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">superadmin</code><br />
              Senha: <code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">admin2024</code>
            </p>
          </div>
        </div>

        {/* Botão de voltar */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
