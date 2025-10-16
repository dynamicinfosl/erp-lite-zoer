'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { usePlanLimits } from '@/hooks/usePlanLimits';

interface TrialProtectionProps {
  children: React.ReactNode;
}

export function TrialProtection({ children }: TrialProtectionProps) {
  const router = useRouter();
  const { tenant } = useSimpleAuth();
  const { isTrialExpired, loading } = usePlanLimits();
  const [isChecking, setIsChecking] = useState(true);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Se não tem tenant, não verificar trial - permitir acesso
    if (!tenant?.id) {
      setIsChecking(false);
      return;
    }

    // Aguardar carregamento dos dados do plano
    if (loading) {
      return;
    }

    // Se trial expirou e ainda não redirecionou, redirecionar
    if (isTrialExpired && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push('/trial-expirado');
      return;
    }

    // Se chegou até aqui, trial está válido
    setIsChecking(false);
  }, [isTrialExpired, loading, tenant?.id, router]);

  // Mostrar loading enquanto verifica (apenas se tem tenant)
  if (tenant?.id && (isChecking || loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="text-body">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Se trial expirou, não renderizar children (será redirecionado)
  if (isTrialExpired) {
    return null;
  }

  // Se trial está válido, renderizar children
  return <>{children}</>;
}
