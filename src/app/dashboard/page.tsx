
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Package, Truck } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { ENABLE_AUTH } from '@/constants/auth';
import { mockDashboardData } from '@/lib/mock-data';

interface DashboardData {
  todaySales: {
    totalAmount: number;
    salesCount: number;
    grossProfit: number;
  };
  todayDeliveries: {
    totalOrders: number;
    inRoute: number;
    completed: number;
  };
  monthlyData: Array<{
    month: string;
    amount: number;
    income: number;
    expense: number;
  }>;
  lowStockProducts: number;
  alerts: {
    lowStock: boolean;
    pendingDeliveries: boolean;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (ENABLE_AUTH) {
        // Se autenticação estiver habilitada, buscar dados da API
        const dashboardData = await api.get<DashboardData>('/dashboard');
        setData(dashboardData);
      } else {
        // Se autenticação estiver desabilitada, usar dados mockados
        setData(mockDashboardData);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      if (ENABLE_AUTH) {
        toast.error('Erro ao carregar dados do dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados do dashboard. Tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumo das operações do dia e métricas importantes
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Atualizado em: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>

      {/* Alertas */}
      {(data.alerts.lowStock || data.alerts.pendingDeliveries) && (
        <div className="space-y-2">
          {data.alerts.lowStock && (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                {data.lowStockProducts} produto(s) com estoque baixo. 
                Verifique a seção de estoque.
              </AlertDescription>
            </Alert>
          )}
          
          {data.alerts.pendingDeliveries && (
            <Alert>
              <Truck className="h-4 w-4" />
              <AlertDescription>
                {data.todayDeliveries.inRoute} entrega(s) em rota aguardando finalização.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Cards de Estatísticas */}
      <DashboardStats stats={data} />

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <SalesChart data={data.monthlyData} />
        <CashFlowChart data={data.monthlyData} />
      </div>

      {/* Resumo Rápido */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendas Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total de Vendas:</span>
                <span className="font-semibold">{data.todaySales.salesCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Faturamento:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(data.todaySales.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ticket Médio:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(
                    data.todaySales.salesCount > 0 
                      ? data.todaySales.totalAmount / data.todaySales.salesCount 
                      : 0
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Entregas Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total de Pedidos:</span>
                <span className="font-semibold">{data.todayDeliveries.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span>Em Rota:</span>
                <span className="font-semibold text-yellow-600">
                  {data.todayDeliveries.inRoute}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Entregues:</span>
                <span className="font-semibold text-green-600">
                  {data.todayDeliveries.completed}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Produtos Ativos:</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between">
                <span>Estoque Baixo:</span>
                <span className={`font-semibold ${
                  data.lowStockProducts > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {data.lowStockProducts}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sistema:</span>
                <span className="font-semibold text-green-600">Online</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
