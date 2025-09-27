"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
}

export function LoginForm({
  onSuccess,
  onSwitchToRegister,
  onForgotPassword,
}: LoginFormProps) {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await signIn(data.email, data.password);
      if (result.error) {
        throw result.error;
      }
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.message || err?.errorMessage;
      if (typeof msg === 'string' && /invalid login credentials|Invalid login credentials/i.test(msg)) {
        setError('Credenciais inválidas. Verifique email e senha.');
      } else if (typeof msg === 'string' && /email already registered|User already registered/i.test(msg)) {
        setError('Usuário já cadastrado. Tente Entrar.');
      } else {
        setError('Falha no login. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="flex flex-col items-center justify-center gap-[10px] py-[20px]">
        <div className="text-center text-2xl font-semibold">Welcome back</div>
        <div className="text-center text-sm text-muted-foreground">Sign in to {process.env.NEXT_PUBLIC_APP_NAME}</div>
      </div>
      <CardContent>
        {/* Google登录按钮 */}
        <div className="">
          <GoogleLoginButton />
          <div className="my-[20px] flex items-center">
            <Separator className="flex-1" />
            <span className="mx-3 text-xs uppercase text-muted-foreground">OR</span>
            <Separator className="flex-1" />
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="mb-[4px] h-[22px] text-sm font-medium">Email</div>
            <Input
              id="email"
              type="email"
              placeholder="email"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-[4px] h-[22px] text-sm font-medium">
              <span className="h-[22px]">Password</span>
              {onForgotPassword && (
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs text-muted-foreground hover:underline cursor-pointer"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              placeholder="password"
              {...register("password")}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full my-[10px]"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>

          {onSwitchToRegister && (
            <div className="text-center text-sm flex items-center justify-center gap-2">
              <span className="text-center text-muted-foreground">
                Don't have an account?
              </span>
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="cursor-pointer hover:underline"
                disabled={isLoading}
              >
                Register now
              </button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
