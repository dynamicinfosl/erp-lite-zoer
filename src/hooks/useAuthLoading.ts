import { useEffect, useState } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';

export function useAuthLoading() {
  const { loading: authLoading, tenant, user } = useSimpleAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Aguardar a autenticação terminar E ter dados básicos
    if (!authLoading && (user || !user)) {
      // Se tem usuário mas não tem tenant, aguardar um pouco mais
      if (user && !tenant) {
        const timeoutId = setTimeout(() => {
          setIsReady(true);
        }, 2000); // Aguardar 2 segundos para o tenant carregar

        return () => clearTimeout(timeoutId);
      } else {
        setIsReady(true);
      }
    }
  }, [authLoading, user, tenant]);

  return {
    isLoading: !isReady,
    hasUser: !!user,
    hasTenant: !!tenant,
    isAuthenticated: !!user,
  };
}
