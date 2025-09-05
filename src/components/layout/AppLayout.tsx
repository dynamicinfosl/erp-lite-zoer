
'use client';

import React from 'react';
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

  // Se autenticação estiver desabilitada, usar sidebar sem autenticação
  if (!ENABLE_AUTH) {
    if (pathname === '/login') {
      return <>{children}</>;
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
