"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSimpleAuth } from "@/contexts/SimpleAuthContext-Fixed";
import { Loader2, User, Building2 } from "lucide-react";
import { CompleteRegisterForm } from "./CompleteRegisterForm";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({
  onSuccess,
  onSwitchToLogin,
}: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationType, setRegistrationType] = useState<'simple' | 'complete'>('complete');

  const handleSimpleRegistration = async (email: string, password: string, companyName: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Usar email como nome da empresa temporariamente (usuário pode editar depois no perfil)
      const finalCompanyName = companyName || email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
      
      // Aqui você implementaria a lógica de cadastro simples
      // Por enquanto, vamos simular um sucesso
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Aqui você implementaria a lógica de cadastro completo
      // Por enquanto, vamos simular um sucesso
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Criar Conta</h1>
            <p className="text-gray-600">Escolha o tipo de cadastro que melhor se adequa à sua empresa</p>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={registrationType} onValueChange={(value) => setRegistrationType(value as 'simple' | 'complete')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="complete" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Cadastro Completo
              </TabsTrigger>
              <TabsTrigger value="simple" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Cadastro Rápido
              </TabsTrigger>
            </TabsList>

            <TabsContent value="complete" className="space-y-6">
              <CompleteRegisterForm 
                onSuccess={handleCompleteRegistration}
                onSwitchToLogin={onSwitchToLogin}
              />
            </TabsContent>

            <TabsContent value="simple" className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Cadastro Rápido</h3>
                <p className="text-sm text-gray-600">
                  Apenas email, senha e nome da empresa. 
                  Você pode completar os dados depois no perfil.
                </p>
              </div>

              <SimpleRegisterForm 
                onSuccess={handleSimpleRegistration}
                onSwitchToLogin={onSwitchToLogin}
                isLoading={isLoading}
                error={error}
              />
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para cadastro simples
function SimpleRegisterForm({ 
  onSuccess, 
  onSwitchToLogin, 
  isLoading, 
  error 
}: { 
  onSuccess: (email: string, password: string, companyName: string) => void;
  onSwitchToLogin?: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return;
    }
    
    onSuccess(formData.email, formData.password, formData.companyName);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail *
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="seu@email.com"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="companyName" className="text-sm font-medium">
          Nome da Empresa *
        </label>
        <input
          id="companyName"
          type="text"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Minha Empresa"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Senha *
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirmar Senha *
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite a senha novamente"
            required
          />
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando conta...
          </>
        ) : (
          'Criar Conta'
        )}
      </Button>
    </form>
  );
}