"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSimpleAuth } from "@/contexts/SimpleAuthContext-Fixed";
import { Loader2, Mail, Lock, AlertTriangle } from "lucide-react";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginForm({
  onSuccess,
  onSwitchToRegister,
}: LoginFormProps) {
  const { signIn } = useSimpleAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔐 Tentando fazer login com:', formData.email);
      
      const result: any = await signIn(formData.email, formData.password);
      
      if (result.error) {
        throw result.error;
      }
      
      console.log('✅ [LOGIN] Login bem-sucedido! Redirecionando...');
      // Redirecionar imediatamente após login bem-sucedido
      setIsLoading(false);
      // Pequeno delay para garantir que o estado do usuário foi atualizado
      setTimeout(() => {
        const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
        console.log('✅ [LOGIN] Redirecionando para:', redirectTo);
        window.location.href = redirectTo;
      }, 500);
      
    } catch (err: any) {
      console.error('❌ Erro no login:', err);
      const msg = err?.message || err?.errorMessage || '';
      
      if (typeof msg === 'string' && /invalid login credentials|Invalid login credentials/i.test(msg)) {
        setError('Email ou senha incorretos. Certifique-se de usar as mesmas credenciais do cadastro.');
      } else if (typeof msg === 'string' && /email not confirmed/i.test(msg)) {
        setError('Email não confirmado. Verifique sua caixa de entrada.');
      } else {
        setError('Erro ao fazer login. Tente novamente em alguns instantes.');
      }
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            className="pl-10 h-11"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-semibold">
          Senha
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Digite sua senha"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            className="pl-10 h-11"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-semibold"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </Button>

      {onSwitchToRegister && (
        <div className="text-center text-sm">
          <span className="text-gray-600">Não tem uma conta? </span>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-blue-600 hover:underline font-medium"
            disabled={isLoading}
          >
            Cadastre-se grátis
          </button>
        </div>
      )}
    </form>
  );
}
