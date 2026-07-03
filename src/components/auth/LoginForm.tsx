"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSimpleAuth } from "@/contexts/SimpleAuthContext-Fixed";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";

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
      setError('Por favor, preencha todos os campos.');
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
      setIsLoading(false);
      
      setTimeout(() => {
        const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
        console.log('✅ [LOGIN] Redirecionando para:', redirectTo);
        window.location.href = redirectTo;
      }, 500);
      
    } catch (err: any) {
      console.error('❌ Erro no login:', err);
      const msg = err?.message || err?.errorMessage || '';
      
      if (typeof msg === 'string' && /invalid login credentials|Invalid login credentials/i.test(msg)) {
        setError('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (typeof msg === 'string' && /email not confirmed/i.test(msg)) {
        setError('E-mail pendente de confirmação. Verifique seu e-mail.');
      } else {
        setError('Erro ao autenticar. Tente novamente em instantes.');
      }
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs font-semibold text-red-650 flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          E-mail
        </Label>
        <div className="relative group">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Senha
        </Label>
        <div className="relative group">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Digite sua senha"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/10 rounded-xl transition-all active:scale-95 disabled:opacity-50 mt-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
            Entrando na conta...
          </>
        ) : (
          'Entrar no Sistema'
        )}
      </Button>

      {onSwitchToRegister && (
        <div className="text-center pt-2 border-t border-slate-100 mt-4">
          <p className="text-xs text-slate-550 font-medium">
            Não tem uma conta?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-colors ml-0.5"
              disabled={isLoading}
            >
              Cadastre-se grátis
            </button>
          </p>
        </div>
      )}
    </form>
  );
}
