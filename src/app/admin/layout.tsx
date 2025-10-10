'use client';

import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
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
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:ml-60 scrollbar-hide">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
