'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function ClearAuthCache() {
  const router = useRouter();

  const clearAllCache = () => {
    try {
      console.log('🧹 Limpando todo o cache de autenticação...');
      
      // Limpar localStorage
      localStorage.clear();
      
      // Limpar sessionStorage
      sessionStorage.clear();
      
      // Limpar cookies relacionados ao Supabase
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        if (name.includes('supabase') || name.includes('sb-')) {
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
      });
      
      console.log('✅ Cache limpo com sucesso');
      
      // Recarregar a página
      window.location.href = '/login';
      
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
    }
  };

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        onClick={clearAllCache}
        variant="destructive"
        size="sm"
      >
        🧹 Limpar Cache
      </Button>
    </div>
  );
}
