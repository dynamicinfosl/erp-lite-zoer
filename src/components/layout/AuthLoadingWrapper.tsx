import React from 'react';
import { useAuthLoading } from '@/hooks/useAuthLoading';
import { LoadingState } from '@/components/ui/loading-state';
import { TenantPageWrapper } from './PageWrapper';

interface AuthLoadingWrapperProps {
  children: React.ReactNode;
  loadingMessage?: string;
  loadingSubMessage?: string;
}

export function AuthLoadingWrapper({ 
  children, 
  loadingMessage = "Carregando informações da conta...",
  loadingSubMessage = "Aguarde enquanto verificamos seus dados"
}: AuthLoadingWrapperProps) {
  const { isLoading, hasUser, hasTenant } = useAuthLoading();

  if (isLoading) {
    return (
      <TenantPageWrapper>
        <LoadingState 
          message={loadingMessage}
          subMessage={loadingSubMessage}
        />
      </TenantPageWrapper>
    );
  }

  // Se não tem usuário, mostrar mensagem específica
  if (!hasUser) {
    return (
      <TenantPageWrapper>
        <LoadingState 
          message="Usuário não encontrado"
          subMessage="Faça login para continuar"
          showSpinner={false}
        />
      </TenantPageWrapper>
    );
  }

  // Se tem usuário mas não tem tenant, mostrar mensagem específica
  if (!hasTenant) {
    return (
      <TenantPageWrapper>
        <LoadingState 
          message="Configurando sua conta..."
          subMessage="Preparando os dados da empresa"
        />
      </TenantPageWrapper>
    );
  }

  return <>{children}</>;
}
