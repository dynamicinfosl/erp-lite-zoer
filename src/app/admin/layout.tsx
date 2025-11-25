'use client';

import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  
  // Páginas sem sidebar (apenas login)
  const noSidebarPages = ['/admin/login', '/admin-test'];
  const shouldHideSidebar = noSidebarPages.some(page => pathname === page);

  if (shouldHideSidebar) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="w-full">
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
          <SidebarTrigger className="text-foreground" />
        </div>
        <main className="flex-1 overflow-auto min-h-screen w-full">
          <div className="w-full h-full p-4 sm:p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
