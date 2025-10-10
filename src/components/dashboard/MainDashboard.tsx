import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { JugaKPICard, JugaTimeline, JugaProgressCard } from '@/components/dashboard/JugaComponents';
import {
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Calendar,
  FileText,
  Plus,
  ArrowRight,
  Shield,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Interfaces para os dados da API
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

const MainDashboard: React.FC = () => {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar dados do dashboard
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/next_api/dashboard');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados do dashboard');
      }
      
      const data = await response.json();
      setDashboardData(data.data);
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados do dashboard
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCadastrarCliente = () => {
    router.push('/clientes');
  };

  const handleAdicionarProduto = () => {
    router.push('/produtos');
  };

  const handleGerarRelatorio = () => {
    router.push('/relatorios');
  };

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Se estiver carregando, mostrar loading
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando dados do dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Se houver erro, mostrar mensagem
  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-2">Erro ao carregar dashboard</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header - Responsivo */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Dashboard</h1>
          <p className="text-sm sm:text-base text-body">Visão geral do seu negócio</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Últimos 30 dias</span>
            <span className="sm:hidden">30 dias</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full sm:w-auto"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards - Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <JugaKPICard
          title="Faturamento Hoje"
          value={dashboardData ? formatCurrency(dashboardData.todaySales.totalAmount) : "R$ 0,00"}
          description="Últimas 24h"
          trend={dashboardData?.todaySales.totalAmount > 0 ? "up" : "neutral"}
          trendValue={dashboardData?.todaySales.totalAmount > 0 ? "+0%" : "0%"}
          icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="primary"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Vendas Realizadas"
          value={dashboardData?.todaySales.salesCount.toString() || "0"}
          description="Hoje"
          trend={dashboardData?.todaySales.salesCount > 0 ? "up" : "neutral"}
          trendValue={dashboardData?.todaySales.salesCount > 0 ? "+0%" : "0%"}
          icon={<ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="success"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Entregas Hoje"
          value={dashboardData?.todayDeliveries.totalOrders.toString() || "0"}
          description="Total de pedidos"
          trend={dashboardData?.todayDeliveries.totalOrders > 0 ? "up" : "neutral"}
          trendValue={dashboardData?.todayDeliveries.totalOrders > 0 ? "+0%" : "0%"}
          icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="accent"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Estoque Baixo"
          value={dashboardData?.lowStockProducts.toString() || "0"}
          description="Produtos com alerta"
          trend={dashboardData?.lowStockProducts > 0 ? "down" : "neutral"}
          trendValue={dashboardData?.lowStockProducts > 0 ? "Atenção" : "OK"}
          icon={<Package className="h-4 w-4 sm:h-5 sm:w-5" />}
          color={dashboardData?.lowStockProducts > 0 ? "warning" : "success"}
          className="min-h-[120px] sm:min-h-[140px]"
        />
      </div>

      {/* Main Content - Responsivo */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          <Tabs defaultValue="sales" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sales" className="text-xs sm:text-sm">Vendas</TabsTrigger>
              <TabsTrigger value="cashflow" className="text-xs sm:text-sm">Fluxo de Caixa</TabsTrigger>
            </TabsList>
            <TabsContent value="sales">
              <Card className="juga-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl text-heading">Gráfico de Vendas</CardTitle>
                  <CardDescription className="text-sm">Vendas mensais vs meta estabelecida</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData?.monthlyData && dashboardData.monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                      <BarChart data={dashboardData.monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--juga-border)" />
                        <XAxis 
                          dataKey="month" 
                          stroke="var(--juga-text-muted)" 
                          fontSize={12}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          stroke="var(--juga-text-muted)" 
                          fontSize={12}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--juga-surface-card)',
                            border: '1px solid var(--juga-border)',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="amount" fill="var(--juga-primary)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="income" fill="var(--juga-success)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-center">
                      <div>
                        <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-sm">Nenhum dado de vendas disponível</p>
                        <p className="text-gray-400 text-xs mt-1">Os gráficos aparecerão aqui quando houver vendas registradas</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="cashflow">
              <Card className="juga-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl text-heading">Fluxo de Caixa</CardTitle>
                  <CardDescription className="text-sm">Entradas e saídas dos últimos 7 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData?.monthlyData && dashboardData.monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                      <LineChart data={dashboardData.monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--juga-border)" />
                        <XAxis 
                          dataKey="month" 
                          stroke="var(--juga-text-muted)" 
                          fontSize={12}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          stroke="var(--juga-text-muted)" 
                          fontSize={12}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--juga-surface-card)',
                            border: '1px solid var(--juga-border)',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Line type="monotone" dataKey="income" stroke="var(--juga-success)" strokeWidth={2} className="sm:stroke-[3]" />
                        <Line type="monotone" dataKey="expense" stroke="var(--juga-error)" strokeWidth={2} className="sm:stroke-[3]" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-center">
                      <div>
                        <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-sm">Nenhum dado de fluxo de caixa disponível</p>
                        <p className="text-gray-400 text-xs mt-1">Os dados aparecerão aqui quando houver transações registradas</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="juga-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl text-heading">Vendas por Categoria</CardTitle>
              <CardDescription className="text-sm">Distribuição de vendas por categoria de produto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[200px] text-center">
                <div>
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 text-sm">Nenhum dado de vendas disponível</p>
                  <p className="text-gray-400 text-xs mt-1">Os dados aparecerão aqui quando houver vendas registradas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Responsivo */}
        <div className="space-y-4 sm:space-y-6">
          {/* Ações Rápidas - Responsivo */}
          <Card className="juga-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg text-heading">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm"
                onClick={handleCadastrarCliente}
              >
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Cadastrar Cliente</span>
                <span className="sm:hidden">Cliente</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm"
                onClick={handleAdicionarProduto}
              >
                <Package className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Adicionar Produto</span>
                <span className="sm:hidden">Produto</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm"
                onClick={handleGerarRelatorio}
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Gerar Relatório</span>
                <span className="sm:hidden">Relatório</span>
              </Button>
            </CardContent>
          </Card>

          {/* Alertas - Responsivo */}
          <Card className="juga-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg text-heading flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {dashboardData?.alerts.lowStock && (
                <div className="p-2 sm:p-3 rounded-lg border bg-juga-warning/5 border-juga-warning/20 flex items-start gap-2 sm:gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 sm:mt-2 flex-shrink-0 bg-juga-warning" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-body leading-tight">
                      {dashboardData.lowStockProducts} produtos com estoque baixo
                    </p>
                    <Badge variant="destructive" className="mt-1 text-xs">
                      Atenção
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="flex-shrink-0 p-1 sm:p-2">
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {dashboardData?.alerts.pendingDeliveries && (
                <div className="p-2 sm:p-3 rounded-lg border bg-juga-primary/5 border-juga-primary/20 flex items-start gap-2 sm:gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 sm:mt-2 flex-shrink-0 bg-juga-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-body leading-tight">
                      {dashboardData.todayDeliveries.inRoute} entregas em rota
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="flex-shrink-0 p-1 sm:p-2">
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {(!dashboardData?.alerts.lowStock && !dashboardData?.alerts.pendingDeliveries) && (
                <div className="flex items-center justify-center h-[120px] text-center">
                  <div>
                    <AlertTriangle className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500 text-sm">Nenhum alerta no momento</p>
                    <p className="text-gray-400 text-xs mt-1">Os alertas aparecerão aqui quando necessário</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cards de Progresso - Responsivo */}
          <div className="space-y-3 sm:space-y-4">
            <JugaProgressCard 
              title="Meta Mensal" 
              description="Vendas do mês" 
              progress={dashboardData ? Math.min((dashboardData.todaySales.totalAmount / 100000) * 100, 100) : 0} 
              total={100000} 
              current={dashboardData?.todaySales.totalAmount || 0} 
              color="primary" 
              className="text-sm"
            />
            <JugaProgressCard 
              title="Entregas Hoje" 
              description="Pedidos processados" 
              progress={dashboardData ? Math.min((dashboardData.todayDeliveries.completed / Math.max(dashboardData.todayDeliveries.totalOrders, 1)) * 100, 100) : 0} 
              color="success" 
              className="text-sm"
            />
          </div>

          {/* Timeline - Responsivo */}
          <Card className="juga-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg text-heading">Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[150px] text-center">
                <div>
                  <TrendingUp className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 text-sm">Nenhuma atividade recente</p>
                  <p className="text-gray-400 text-xs mt-1">As atividades aparecerão aqui quando houver movimentação</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
