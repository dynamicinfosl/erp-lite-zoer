'use client';

import React, { Suspense } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { PageLoadingSpinner } from '@/components/ui/loading-spinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

export function PageWrapper({ 
  children, 
  requireAuth = true, 
  fallback 
}: PageWrapperProps) {
  const { user, tenant, loading } = useSimpleAuth();
  const router = useRouter();

  useEffect(() => {
    // Se não requer autenticação, não fazer nada
    if (!requireAuth) return;

    // Se ainda está carregando, aguardar
    if (loading) return;

    // Se não está logado, redirecionar para login
    if (!user || !tenant?.id) {
      console.log('🔒 Usuário não autenticado, redirecionando para login');
      router.replace('/login');
      return;
    }

    console.log('✅ Usuário autenticado:', user.email, 'Tenant:', tenant.id);
  }, [user, tenant, loading, requireAuth, router]);

  // Se está carregando, mostrar spinner
  if (loading) {
    return fallback || <PageLoadingSpinner />;
  }

  // Se requer autenticação mas não está logado, não mostrar nada (será redirecionado)
  if (requireAuth && (!user || !tenant?.id)) {
    return null;
  }

  // Renderizar conteúdo
  return (
    <Suspense fallback={<PageLoadingSpinner />}>
      {children}
    </Suspense>
  );
}

// Componente específico para páginas que precisam de tenant
export function TenantPageWrapper({ 
  children, 
  fallback 
}: Omit<PageWrapperProps, 'requireAuth'>) {
  const { tenant, loading } = useSimpleAuth();

  if (loading) {
    return fallback || <PageLoadingSpinner />;
  }

  if (!tenant?.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Carregando informações da conta...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
