'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wifi, WifiOff } from 'lucide-react';

export function OfflineNotifier() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Verificar status inicial
    setIsOnline(navigator.onLine);

    // Escutar eventos de conexão
    const handleOnline = () => {
      setIsOnline(true);
      console.log('✅ Conexão restaurada');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📡 Conexão perdida');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="bg-yellow-50 border-yellow-300 shadow-lg">
        <WifiOff className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-900 font-semibold">
          Sem Conexão com a Internet
        </AlertTitle>
        <AlertDescription className="text-yellow-800 text-sm">
          Verifique sua conexão. Algumas funcionalidades podem não estar disponíveis.
        </AlertDescription>
      </Alert>
    </div>
  );
}

