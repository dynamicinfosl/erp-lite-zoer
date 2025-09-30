'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, signIn, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    adminCode: ''
  });

  // Verificar se o usuário já está logado como admin
  useEffect(() => {
    if (!loading && user) {
      // Verificar se é admin
      const isAdmin = checkIsAdmin(user);
      if (isAdmin) {
        router.push('/admin');
      }
    }
  }, [user, loading, router]);

  function checkIsAdmin(user: any): boolean {
    if (!user) return false;
    if (typeof user === 'object' && user !== null) {
      const userObj = user as { user_metadata?: { role?: string }; isAdmin?: boolean };
      return userObj.user_metadata?.role === 'admin' || Boolean(userObj.isAdmin);
    }
    return false;
  }

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
    
    if (!formData.email || !formData.password || !formData.adminCode) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    // Verificar código de administrador
    const validAdminCodes = [
      'ADMIN2024',
      'JUGA-ADMIN',
      'SUPER-ADMIN',
      '123456',
      'admin123'
    ];

    if (!validAdminCodes.includes(formData.adminCode)) {
      setError('Código de administrador inválido');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await signIn(formData.email, formData.password);
      
      if (result.error) {
        throw result.error;
      }

      // Verificar se o usuário é admin após login
      const isAdmin = checkIsAdmin(user);
      if (!isAdmin) {
        throw new Error('Este usuário não possui privilégios de administrador');
      }

      toast.success('Login administrativo realizado com sucesso!');
      router.push('/admin');
      
    } catch (err: any) {
      const msg = err?.message || err?.errorMessage;
      if (typeof msg === 'string' && /invalid login credentials|Invalid login credentials/i.test(msg)) {
        setError('Credenciais inválidas. Verifique email e senha.');
      } else if (typeof msg === 'string' && /privilégios de administrador/i.test(msg)) {
        setError('Este usuário não possui privilégios de administrador.');
      } else {
        setError('Falha no login administrativo. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-600 dark:text-gray-400">Verificando autenticação...</p>
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
            <div className="p-3 bg-red-600 rounded-xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso Administrativo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Painel de controle do sistema ERP Lite
          </p>
        </div>

        {/* Card principal */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl text-gray-900 dark:text-white">
              Login de Administrador
            </CardTitle>
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
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@empresa.com"
                  required
                  className="w-full"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Digite sua senha"
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

              <div className="space-y-2">
                <Label htmlFor="adminCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Código de Administrador
                </Label>
                <Input
                  id="adminCode"
                  name="adminCode"
                  type="password"
                  value={formData.adminCode}
                  onChange={handleInputChange}
                  placeholder="Digite o código de admin"
                  required
                  className="w-full"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Códigos válidos: ADMIN2024, JUGA-ADMIN, SUPER-ADMIN, 123456, admin123
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Acessar Painel Admin
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informações adicionais */}
        <div className="mt-6 text-center">
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Acesso Restrito:</strong> Esta área é exclusiva para administradores do sistema.
            </p>
          </div>
        </div>

        {/* Botão de voltar */}
        <div className="mt-6 text-center">
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
  );
}
