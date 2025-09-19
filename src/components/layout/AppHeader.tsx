'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Home } from 'lucide-react';
import { ENABLE_AUTH } from '@/constants/auth';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backUrl?: string;
  showLogoutButton?: boolean;
  className?: string;
}

export function AppHeader({
  title,
  subtitle,
  showBackButton = false,
  backUrl = '/dashboard',
  showLogoutButton = true,
  className = ''
}: AppHeaderProps) {
  const router = useRouter();
  
  // Usar autenticação do Supabase quando habilitada
  let logout = () => {};
  
  if (ENABLE_AUTH) {
    try {
      const supabaseAuth = useSupabaseAuth();
      logout = supabaseAuth?.signOut || (() => {});
    } catch (error) {
      console.error('Erro na autenticação do header:', error);
      logout = () => {};
    }
  }

  const handleLogout = () => {
    if (confirm('Deseja sair do sistema?')) {
      if (ENABLE_AUTH) {
        // Se autenticação estiver habilitada, fazer logout
        logout();
        router.push('/login');
      } else {
        // Se autenticação estiver desabilitada, ir para home
        router.push('/');
      }
    }
  };

  const handleBack = () => {
    router.push(backUrl);
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Voltar
          </Button>
        )}
        
        {title && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
            {subtitle && (
              <p className="text-sm sm:text-base text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {showLogoutButton && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      )}
    </div>
  );
}
