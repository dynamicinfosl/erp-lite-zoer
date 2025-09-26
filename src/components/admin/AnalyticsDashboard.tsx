'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Activity,
  Eye,
  MousePointer,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Target,
  Globe,
  Smartphone,
  Monitor,
  MapPin,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalSales: number;
    revenue: number;
    conversionRate: number;
    bounceRate: number;
    avgSessionDuration: number;
    pageViews: number;
  };
  salesData: Array<{
    month: string;
    sales: number;
    revenue: number;
    customers: number;
  }>;
  userActivity: Array<{
    hour: string;
    users: number;
    sessions: number;
  }>;
  topPages: Array<{
    page: string;
    views: number;
    uniqueViews: number;
    avgTime: string;
  }>;
  deviceStats: Array<{
    device: string;
    users: number;
    percentage: number;
    color: string;
  }>;
  geographicData: Array<{
    country: string;
    users: number;
    sessions: number;
    revenue: number;
  }>;
  realtimeData: {
    activeUsers: number;
    pageViews: number;
    currentlyViewing: Array<{
      page: string;
      users: number;
    }>;
  };
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

const mockAnalyticsData: AnalyticsData = {
  overview: {
    totalUsers: 12548,
    activeUsers: 1847,
    totalSales: 3642,
    revenue: 89650.75,
    conversionRate: 3.8,
    bounceRate: 42.3,
    avgSessionDuration: 186,
    pageViews: 28947,
  },
  salesData: [
    { month: 'Jan', sales: 245, revenue: 15820, customers: 89 },
    { month: 'Fev', sales: 312, revenue: 19840, customers: 124 },
    { month: 'Mar', sales: 298, revenue: 18920, customers: 108 },
    { month: 'Abr', sales: 387, revenue: 24670, customers: 165 },
    { month: 'Mai', sales: 456, revenue: 29180, customers: 201 },
    { month: 'Jun', sales: 534, revenue: 34210, customers: 248 },
    { month: 'Jul', sales: 612, revenue: 39180, customers: 289 },
    { month: 'Ago', sales: 589, revenue: 37650, customers: 275 },
    { month: 'Set', sales: 648, revenue: 41420, customers: 312 },
    { month: 'Out', sales: 701, revenue: 44890, customers: 348 },
    { month: 'Nov', sales: 768, revenue: 49120, customers: 389 },
    { month: 'Dez', sales: 834, revenue: 53340, customers: 421 },
  ],
  userActivity: Array.from({length: 24}, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    users: Math.floor(Math.random() * 200) + 50,
    sessions: Math.floor(Math.random() * 150) + 30,
  })),
  topPages: [
    { page: '/dashboard', views: 8947, uniqueViews: 6234, avgTime: '3m 24s' },
    { page: '/produtos', views: 6521, uniqueViews: 4876, avgTime: '2m 18s' },
    { page: '/vendas', views: 5234, uniqueViews: 3912, avgTime: '4m 12s' },
    { page: '/clientes', views: 4156, uniqueViews: 3287, avgTime: '2m 56s' },
    { page: '/relatorios', views: 3847, uniqueViews: 2901, avgTime: '5m 43s' },
  ],
  deviceStats: [
    { device: 'Desktop', users: 7528, percentage: 60, color: '#3b82f6' },
    { device: 'Mobile', users: 3762, percentage: 30, color: '#ef4444' },
    { device: 'Tablet', users: 1258, percentage: 10, color: '#10b981' },
  ],
  geographicData: [
    { country: 'Brasil', users: 8947, sessions: 12456, revenue: 45780 },
    { country: 'Argentina', users: 1234, sessions: 1876, revenue: 8920 },
    { country: 'Chile', users: 987, sessions: 1456, revenue: 6540 },
    { country: 'Uruguai', users: 456, sessions: 678, revenue: 2890 },
    { country: 'Paraguai', users: 234, sessions: 345, revenue: 1240 },
  ],
  realtimeData: {
    activeUsers: 147,
    pageViews: 2847,
    currentlyViewing: [
      { page: '/dashboard', users: 45 },
      { page: '/produtos', users: 32 },
      { page: '/vendas', users: 28 },
      { page: '/clientes', users: 21 },
      { page: '/relatorios', users: 21 },
    ],
  },
};

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setData(mockAnalyticsData);
    } catch (error) {
      toast.error('Erro ao carregar dados de analytics');
    } finally {
      setLoading(false);
    }
  };

  const updateRealtimeData = useCallback(async () => {
    if (!data) return;
    
    // Simular atualização de dados em tempo real
    const newRealtimeData = {
      activeUsers: Math.floor(Math.random() * 50) + 120,
      pageViews: Math.floor(Math.random() * 200) + 2700,
      currentlyViewing: data.realtimeData.currentlyViewing.map(item => ({
        ...item,
        users: Math.floor(Math.random() * 20) + 10
      }))
    };

    setData(prev => prev ? {
      ...prev,
      realtimeData: newRealtimeData
    } : null);
  }, [data]);

  useEffect(() => {
    loadAnalyticsData();
    
    // Auto refresh para dados em tempo real
    const interval = setInterval(() => {
      updateRealtimeData();
    }, 30000); // Atualiza a cada 30 segundos

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [updateRealtimeData]);

  const exportData = (format: 'csv' | 'pdf') => {
    if (!data) return;
    
    if (format === 'csv') {
      const csvData = data.salesData.map(item => 
        `${item.month},${item.sales},${item.revenue},${item.customers}`
      ).join('\n');
      
      const header = 'Mês,Vendas,Receita,Clientes\n';
      const blob = new Blob([header + csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'analytics-data.csv';
      link.click();
      toast.success('Dados exportados em CSV!');
    } else {
      toast.success('Exportação em PDF será implementada em breve!');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">Análise detalhada de performance e uso do sistema</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportData('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={loadAnalyticsData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Total de Usuários</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-heading">{formatNumber(data.overview.totalUsers)}</div>
              <p className="text-sm text-caption flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-juga-primary" />
                +12% desde o último mês
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Receita Total</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-heading">{formatCurrency(data.overview.revenue)}</div>
              <p className="text-sm text-caption flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-juga-primary" />
                +18% desde o último mês
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Taxa de Conversão</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Target className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-heading">{data.overview.conversionRate}%</div>
              <p className="text-sm text-caption flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-juga-primary" />
                +0.5% desde o último mês
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Usuários Ativos</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-juga-primary">{formatNumber(data.overview.activeUsers)}</div>
              <p className="text-sm text-caption">
                Online agora: {data.realtimeData.activeUsers}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="realtime">Tempo Real</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="geographic">Geografia</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vendas e Receita (Últimos 12 Meses)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                          name === 'sales' ? 'Vendas' : 
                          name === 'revenue' ? 'Receita' : 'Clientes'
                        ]}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="sales" fill="var(--juga-primary)" name="Vendas" />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="var(--juga-primary)" strokeWidth={3} name="Receita" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Dispositivo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.deviceStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="var(--juga-primary)"
                        dataKey="users"
                        label={({device, percentage}) => `${device} (${percentage}%)`}
                      >
                        {data.deviceStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatNumber(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Atividade de Usuários por Hora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.userActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                    <Area type="monotone" dataKey="users" stackId="1" stroke="var(--juga-primary)" fill="var(--juga-primary)" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="sessions" stackId="1" stroke="var(--juga-primary-light)" fill="var(--juga-primary-light)" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Online</CardTitle>
                <Activity className="h-4 w-4 text-juga-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-juga-primary">{data.realtimeData.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Atualizado há poucos segundos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(data.realtimeData.pageViews)}</div>
                <p className="text-xs text-muted-foreground">Nas últimas 24 horas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Páginas Ativas</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.realtimeData.currentlyViewing.length}</div>
                <p className="text-xs text-muted-foreground">Sendo visualizadas agora</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Páginas Sendo Visualizadas Agora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.realtimeData.currentlyViewing.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-juga-primary rounded-full animate-pulse"></div>
                      <span className="font-mono text-sm">{item.page}</span>
                    </div>
                    <Badge variant="secondary">
                      {item.users} usuários
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Rejeição</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.bounceRate}%</div>
                <Progress value={data.overview.bounceRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(data.overview.avgSessionDuration)}</div>
                <p className="text-xs text-muted-foreground">Por sessão</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.overview.pageViews)}</div>
                <p className="text-xs text-muted-foreground">Total de páginas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.conversionRate}%</div>
                <Progress value={data.overview.conversionRate * 10} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Dispositivos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.deviceStats.map((device, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {device.device === 'Desktop' && <Monitor className="h-4 w-4" />}
                        {device.device === 'Mobile' && <Smartphone className="h-4 w-4" />}
                        {device.device === 'Tablet' && <Smartphone className="h-4 w-4" />}
                        <span>{device.device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatNumber(device.users)}</span>
                        <Badge variant="secondary">{device.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Novos vs Retornando</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Novos Usuários', value: 7528, color: '#3b82f6' },
                          { name: 'Usuários Retornando', value: 5020, color: '#10b981' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="var(--juga-primary)"
                        dataKey="value"
                        label={({name, value}) => `${name}: ${formatNumber(value)}`}
                      >
                        <Cell fill="var(--juga-primary)" />
                        <Cell fill="var(--juga-primary-light)" />
                      </Pie>
                      <Tooltip formatter={(value: number) => formatNumber(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                        name === 'sales' ? 'Vendas' : 'Receita'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="sales" fill="var(--juga-primary)" name="Vendas" />
                    <Bar dataKey="revenue" fill="var(--juga-primary-light)" name="Receita" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Páginas Mais Visitadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{page.page}</div>
                        <div className="text-sm text-muted-foreground">
                          Tempo médio: {page.avgTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{formatNumber(page.views)}</div>
                        <div className="text-muted-foreground">Visualizações</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{formatNumber(page.uniqueViews)}</div>
                        <div className="text-muted-foreground">Únicas</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Distribuição Geográfica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.geographicData.map((country, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-juga-primary/10 rounded-full text-juga-primary text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{country.country}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatNumber(country.sessions)} sessões
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{formatNumber(country.users)}</div>
                        <div className="text-muted-foreground">Usuários</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{formatCurrency(country.revenue)}</div>
                        <div className="text-muted-foreground">Receita</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
