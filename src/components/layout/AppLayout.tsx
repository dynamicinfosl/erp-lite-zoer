
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { usePathname } from 'next/navigation';
import { ENABLE_AUTH } from '@/constants/auth';
import { TrialProtection } from '@/components/TrialProtection';
import { AuthFallback } from '@/components/AuthFallback';
// Removidos componentes que podem causar problemas

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [forceStopLoading, setForceStopLoading] = useState(false);
  const { user, loading } = useSimpleAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const shouldHideSidebar = useMemo(() => {
    const noSidebarPages = [
      '/login', 
      '/register', 
      '/forgot-password', 
      '/reset-password',
      '/admin/login',  // Página de login do admin sem sidebar
      '/admin-test',   // Página de teste do admin sem sidebar
      '/trial-expirado'  // Página de trial expirado sem sidebar
    ];
    
    
    // Landing page SEMPRE sem sidebar
    if (pathname === '/') {
      return true;
    }

    // Landing page sem auth habilitada também sem sidebar
    if (pathname === '/' && ENABLE_AUTH && !user) {
      return true;
    }

    // Páginas admin específicas sem sidebar (apenas login e teste)
    if (pathname === '/admin/login' || pathname === '/admin-test') {
      return true;
    }
    
    // A página /admin deve ter sidebar (removida da lista de páginas sem sidebar)
    return noSidebarPages.some((page) => pathname === page || pathname?.startsWith(page + '/'));
  }, [pathname, user]);

  // Páginas que precisam de proteção de trial
  const needsTrialProtection = useMemo(() => {
    const trialProtectedPages = [
      '/dashboard',
      '/clientes',
      '/fornecedores',
      '/produtos',
      '/vendas',
      '/financeiro',
      '/relatorios',
      '/configuracoes',
      '/pdv',
      '/estoque',
      '/entregas',
      '/entregador',
      '/ordem-servicos',
      '/perfil-empresa'
    ];
    return trialProtectedPages.some((page) => pathname?.startsWith(page));
  }, [pathname]);

  const isPDV = useMemo(() => pathname?.startsWith('/pdv') ?? false, [pathname]);

  if (shouldHideSidebar) {
    return <main className="min-h-screen w-full">{children}</main>;
  }
  
  // Se página inicial e usuário não logado, sem sidebar (redundância segura)
  if (pathname === '/' && !user) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  if (!ENABLE_AUTH) {
    if (isClient && isPDV) {
      return <main className="min-h-screen w-full">{children}</main>;
    }

    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1 overflow-auto min-h-screen">
            <div className="w-full h-full p-6">
              {needsTrialProtection ? (
                <TrialProtection>{children}</TrialProtection>
              ) : (
                children
              )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Landing page SEMPRE renderiza sem loading (redundância segura)
  if (pathname === '/') {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  // Outras páginas podem mostrar loading
  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    // Se está tentando acessar páginas do admin, não redirecionar (admin tem autenticação própria)
    if (pathname === '/admin/login' || pathname === '/admin' || pathname?.startsWith('/admin/') || pathname === '/admin-test') {
      return <main className="min-h-screen w-full">{children}</main>;
    }
    
    return (
      <AuthFallback forceStopLoading={forceStopLoading}>
        <main className="min-h-screen w-full">{children}</main>
      </AuthFallback>
    );
  }

  if (isPDV) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="flex-1 overflow-auto min-h-screen">
          <div className="w-full h-full p-6">
            {needsTrialProtection ? (
              <TrialProtection>{children}</TrialProtection>
            ) : (
              children
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
