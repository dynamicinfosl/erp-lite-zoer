
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { usePathname } from 'next/navigation';
import { ENABLE_AUTH } from '@/constants/auth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
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
      '/admin'  // Excluir painel admin do sidebar
    ];
    // Landing page SEMPRE sem sidebar
    if (pathname === '/') return true;

    // Landing page sem auth habilitada também sem sidebar
    if (pathname === '/' && ENABLE_AUTH && !user) return true;

    return noSidebarPages.some((page) => pathname?.startsWith(page));
  }, [pathname, user]);

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
            <div className="w-full h-full p-6">{children}</div>
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

  if (!user || isPDV) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="flex-1 overflow-auto min-h-screen">
          <div className="w-full h-full p-6">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
