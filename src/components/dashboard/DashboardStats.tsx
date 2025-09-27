
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, TrendingUp, Truck, Package, Clock } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: string;
}

function StatsCard({ title, value, description, icon: Icon, trend, color = 'bg-primary' }: StatsCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium truncate">{title}</CardTitle>
        <div className={`p-1.5 sm:p-2 rounded-lg ${color} flex-shrink-0`}>
          <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{value}</div>
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        {trend && (
          <div className={`flex items-center text-xs mt-1 ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  stats: {
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
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      <StatsCard
        title="Faturamento Hoje"
        value={formatCurrency(stats.todaySales.totalAmount)}
        description="Total de vendas do dia"
        icon={DollarSign}
        color="bg-green-500"
        trend={{
          value: "+12% vs ontem",
          isPositive: true,
        }}
      />
      
      <StatsCard
        title="Vendas Realizadas"
        value={stats.todaySales.salesCount.toString()}
        description="Número de vendas hoje"
        icon={ShoppingCart}
        color="bg-blue-500"
        trend={{
          value: "+8% vs ontem",
          isPositive: true,
        }}
      />
      
      <StatsCard
        title="Lucro Bruto"
        value={formatCurrency(stats.todaySales.grossProfit)}
        description="Margem do dia"
        icon={TrendingUp}
        color="bg-purple-500"
        trend={{
          value: "+15% vs ontem",
          isPositive: true,
        }}
      />
      
      <StatsCard
        title="Pedidos Entrega"
        value={stats.todayDeliveries.totalOrders.toString()}
        description="Total de entregas hoje"
        icon={Package}
        color="bg-orange-500"
      />
      
      <StatsCard
        title="Em Rota"
        value={stats.todayDeliveries.inRoute.toString()}
        description="Entregas na rua"
        icon={Clock}
        color="bg-yellow-500"
      />
      
      <StatsCard
        title="Entregues"
        value={stats.todayDeliveries.completed.toString()}
        description="Entregas concluídas"
        icon={Truck}
        color="bg-green-600"
      />
    </div>
  );
}
