
'use client';

import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AuthenticatedLayout } from './AuthenticatedLayout';
import { usePathname } from 'next/navigation';
import { ENABLE_AUTH } from '@/constants/auth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Garantir que a lógica de layout só seja aplicada no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Páginas que não devem ter sidebar (login, registro, etc.)
  const noSidebarPages = ['/login', '/register', '/forgot-password', '/reset-password'];
  const shouldHideSidebar = isClient && noSidebarPages.some(page => pathname?.startsWith(page));

  // Se for uma página sem sidebar, renderizar apenas o conteúdo
  if (shouldHideSidebar) {
    return (
      <main className="min-h-screen w-full">
        <div className="w-full h-full">
          {children}
        </div>
      </main>
    );
  }

  // Se autenticação estiver desabilitada, usar sidebar sem autenticação
  if (!ENABLE_AUTH) {
    // PDV fullscreen sem sidebar
    if (isClient && pathname?.startsWith('/pdv')) {
      return (
        <main className="min-h-screen w-full">
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      );
    }

    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1 overflow-auto min-h-screen">
            <div className="w-full h-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Se autenticação estiver habilitada, usar o layout autenticado
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
