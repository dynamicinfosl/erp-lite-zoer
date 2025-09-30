'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, UserPlus, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CreateAdminUserProps {
  onSuccess?: () => void;
}

export function CreateAdminUser({ onSuccess }: CreateAdminUserProps) {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    adminCode: ''
  });

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
    
    // Validações
    if (!formData.email || !formData.password || !formData.fullName || !formData.adminCode) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
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

      // Criar usuário com role de admin
      const result = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        role: 'admin'
      });

      if (result.error) {
        throw result.error;
      }

      toast.success('Usuário administrador criado com sucesso!');
      
      // Limpar formulário
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        adminCode: ''
      });

      onSuccess?.();
      
    } catch (err: any) {
      const msg = err?.message || err?.errorMessage;
      if (typeof msg === 'string' && /email already registered|User already registered/i.test(msg)) {
        setError('Este email já está cadastrado no sistema.');
      } else if (typeof msg === 'string' && /invalid email/i.test(msg)) {
        setError('Email inválido. Verifique o formato.');
      } else {
        setError('Erro ao criar usuário administrador. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-center">
          <Shield className="h-5 w-5 text-red-600" />
          Criar Usuário Admin
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
            <Label htmlFor="fullName" className="text-sm font-medium">
              Nome Completo
            </Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Nome completo do administrador"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
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
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Mínimo 6 caracteres"
                required
                className="pr-10"
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
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirmar Senha
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Digite a senha novamente"
                required
                className="pr-10"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminCode" className="text-sm font-medium">
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
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
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
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Criando...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Administrador
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Atenção:</p>
              <ul className="space-y-1">
                <li>• O usuário criado terá privilégios administrativos completos</li>
                <li>• Mantenha o código de administrador seguro</li>
                <li>• Use senhas fortes e únicas</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
