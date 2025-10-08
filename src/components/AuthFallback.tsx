'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

interface AuthFallbackProps {
  children: React.ReactNode;
}

export function AuthFallback({ children }: AuthFallbackProps) {
  const router = useRouter();
  const { user, loading } = useSimpleAuth();

  useEffect(() => {
    // Se não está carregando e não tem usuário, redirecionar para login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Se está carregando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="text-body">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não tem usuário, não renderizar nada (será redirecionado)
  if (!user) {
    return null;
  }

  // Se tem usuário, renderizar children
  return <>{children}</>;
}





