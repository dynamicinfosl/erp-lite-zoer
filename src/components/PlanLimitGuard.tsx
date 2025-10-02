'use client';

import React from 'react';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Crown, Users, Package, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

interface PlanLimitGuardProps {
  children: React.ReactNode;
  operation: 'create_customer' | 'create_product' | 'create_user' | 'create_sale';
  fallback?: React.ReactNode;
}

export function PlanLimitGuard({ children, operation, fallback }: PlanLimitGuardProps) {
  const { canCreate, isTrialExpired, subscription, loading } = usePlanLimits();

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 rounded" />;
  }

  // Se trial expirou, mostrar aviso
  if (isTrialExpired) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <span>Seu período de teste expirou. Faça upgrade do seu plano para continuar.</span>
            <Link href="/assinatura">
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                <Crown className="h-4 w-4 mr-2" />
                Fazer Upgrade
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Se não pode criar o item, mostrar aviso
  if (!canCreate(operation)) {
    const getOperationInfo = () => {
      switch (operation) {
        case 'create_customer':
          return { icon: Users, label: 'clientes', limit: subscription?.plan?.limits?.max_customers };
        case 'create_product':
          return { icon: Package, label: 'produtos', limit: subscription?.plan?.limits?.max_products };
        case 'create_user':
          return { icon: Users, label: 'usuários', limit: subscription?.plan?.limits?.max_users };
        case 'create_sale':
          return { icon: ShoppingCart, label: 'vendas', limit: subscription?.plan?.limits?.max_sales_per_month };
        default:
          return { icon: AlertCircle, label: 'itens', limit: 0 };
      }
    };

    const { icon: Icon, label, limit } = getOperationInfo();

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert className="border-orange-200 bg-orange-50">
        <Icon className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="flex items-center justify-between">
            <span>
              Limite de {limit === -1 ? 'ilimitado' : limit} {label} atingido. 
              Faça upgrade do seu plano para continuar.
            </span>
            <Link href="/assinatura">
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                <Crown className="h-4 w-4 mr-2" />
                Fazer Upgrade
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Se pode criar, mostrar o conteúdo
  return <>{children}</>;
}

interface PlanFeatureGuardProps {
  children: React.ReactNode;
  feature: string;
  fallback?: React.ReactNode;
}

export function PlanFeatureGuard({ children, feature, fallback }: PlanFeatureGuardProps) {
  const { subscription, loading } = usePlanLimits();

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 rounded" />;
  }

  // Verificar se a feature está disponível no plano
  const hasFeature = subscription?.plan?.features?.[feature] === true;

  if (!hasFeature) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Crown className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="flex items-center justify-between">
            <span>Esta funcionalidade não está disponível no seu plano atual.</span>
            <Link href="/assinatura">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Crown className="h-4 w-4 mr-2" />
                Fazer Upgrade
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

