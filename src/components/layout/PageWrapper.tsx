'use client';

import React, { Suspense } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { PageLoadingSpinner } from '@/components/ui/loading-spinner';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  const { tenant, loading, user } = useSimpleAuth();
  const router = useRouter();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Timeout de 3 segundos para loading infinito
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  // Se está carregando há muito tempo, redirecionar para login
  useEffect(() => {
    if (loadingTimeout && !user) {
      console.log('⏱️ Timeout de loading, redirecionando para login');
      router.replace('/login');
    }
  }, [loadingTimeout, user, router]);

  // Se está carregando, mostrar spinner
  if (loading && !loadingTimeout) {
    return fallback || <PageLoadingSpinner />;
  }

  // Se não tem tenant mas tem usuário, permitir acesso (tenant será criado sob demanda)
  // Se não tem nem tenant nem usuário, redirecionar para login
  if (!tenant?.id && !user) {
    console.log('🔒 Sem tenant e sem usuário, redirecionando para login');
    router.replace('/login');
    return null;
  }

  // Se tem usuário mas não tem tenant, permitir acesso
  // O tenant será criado automaticamente quando necessário
  return <>{children}</>;
}
