'use client';

import { useState, useEffect } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

interface AdminPageWrapperProps {
  children: React.ReactNode;
}

function checkIsAdmin(user: unknown): boolean {
  if (!user) return false;
  if (typeof user === 'object' && user !== null) {
    const userObj = user as { 
      user_metadata?: { role?: string }; 
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

export function AdminPageWrapper({ children }: AdminPageWrapperProps) {
  const { user } = useSimpleAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Verificar autenticação de admin de forma segura para SSR
    const checkAdminAuth = () => {
      try {
        // Verificar autenticação via sessionStorage (apenas no cliente)
        if (typeof window !== 'undefined') {
          const adminAuth = sessionStorage.getItem('adminAuthenticated');
          if (adminAuth === 'true') {
            setIsAdmin(true);
            setIsCheckingAuth(false);
            return;
          }
        }
        
        // Verificar via user object
        const adminStatus = checkIsAdmin(user);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Erro ao verificar autenticação admin:', error);
        setIsAdmin(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAdminAuth();
  }, [user]);

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto text-center">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Você não tem permissão para acessar esta área administrativa.
            </p>
            <button
              onClick={() => window.location.href = '/admin/login'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Fazer Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
