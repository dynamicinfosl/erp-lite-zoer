'use client';

import { useState, useEffect } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { usePathname } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';

interface AdminProtectionProps {
  children: React.ReactNode;
}

function checkIsAdmin(user: unknown): boolean {
  if (!user) return false;
  if (typeof user === 'object' && user !== null) {
    const userObj = user as { 
      user_metadata?: { role?: string; email?: string }; 
      isAdmin?: boolean;
      email?: string;
    };
    
    // Verificar se o usuário é "julga" - acesso restrito apenas para este usuário
    const userEmail = userObj.email || userObj.user_metadata?.email;
    const isJulgaUser = userEmail === 'julga@julga.com' || userEmail === 'julga';
    
    // Se for o usuário julga, permitir acesso independente do role
    if (isJulgaUser) {
      return true;
    }
    
    // Para outros usuários, verificar se tem role 'admin' nos metadados ou se tem isAdmin
    const hasAdminRole = userObj.user_metadata?.role === 'admin' || Boolean(userObj.isAdmin);
    
    return hasAdminRole;
  }
  return false;
}

export function AdminProtection({ children }: AdminProtectionProps) {
  const { user } = useSimpleAuth();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Se está na página de login do admin, não verificar autenticação
    if (pathname === '/admin/login') {
      setIsAdmin(true);
      setIsCheckingAuth(false);
      return;
    }

    // Para páginas do admin, verificar autenticação
    // Verificar autenticação de admin de forma segura para SSR
    const checkAdminAuth = () => {
      try {
        // Verificar autenticação via sessionStorage (apenas no cliente)
        if (typeof window !== 'undefined') {
          const adminAuth = sessionStorage.getItem('adminAuthenticated');
          const adminUser = sessionStorage.getItem('adminUser');
          
          // Log para debug
          console.log('🔍 Verificando autenticação admin:');
          console.log('  - adminAuthenticated:', adminAuth);
          console.log('  - adminUser:', adminUser);
          console.log('  - pathname:', pathname);
          console.log('  - Tipo de adminAuth:', typeof adminAuth);
          console.log('  - adminAuth === "true":', adminAuth === 'true');
          
          // Verificar se adminAuth é exatamente 'true' (string)
          if (adminAuth === 'true') {
            console.log('✅ Autenticação admin confirmada via sessionStorage');
            setIsAdmin(true);
            setIsCheckingAuth(false);
            return;
          } else {
            console.log('⚠️ SessionStorage não contém adminAuthenticated=true');
            console.log('  - Valor atual:', JSON.stringify(adminAuth));
          }
        }
        
        // Verificar via user object
        const adminStatus = checkIsAdmin(user);
        console.log('🔍 Verificando via user object:', adminStatus);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('❌ Erro ao verificar autenticação admin:', error);
        setIsAdmin(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    // Verificar imediatamente
    checkAdminAuth();
    
    // Verificar novamente após um pequeno delay (para casos onde o sessionStorage foi salvo logo após a navegação)
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const adminAuth = sessionStorage.getItem('adminAuthenticated');
        if (adminAuth === 'true' && !isAdmin) {
          console.log('✅ Autenticação admin confirmada após delay');
          setIsAdmin(true);
          setIsCheckingAuth(false);
        }
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [user, pathname, isAdmin]);

  // Mostrar loading enquanto verifica autenticação
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <div className="flex items-center justify-between">
              <div>
                <strong>Acesso Negado</strong>
                <p className="mt-1 text-sm">
                  Você não tem permissão para acessar esta área administrativa.
                </p>
              </div>
              <Button
                onClick={() => window.location.href = '/admin/login'}
                className="bg-red-600 hover:bg-red-700"
              >
                <Shield className="h-4 w-4 mr-2" />
                Fazer Login Admin
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
