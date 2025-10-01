import React from 'react';
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

const salesData = [
  { month: 'Jan', vendas: 45000, meta: 50000 },
  { month: 'Fev', vendas: 52000, meta: 50000 },
  { month: 'Mar', vendas: 48000, meta: 50000 },
  { month: 'Abr', vendas: 61000, meta: 55000 },
  { month: 'Mai', vendas: 55000, meta: 55000 },
  { month: 'Jun', vendas: 67000, meta: 60000 },
];

const cashFlowData = [
  { day: '1', entrada: 12000, saida: 8000 },
  { day: '2', entrada: 15000, saida: 10000 },
  { day: '3', entrada: 8000, saida: 12000 },
  { day: '4', entrada: 18000, saida: 9000 },
  { day: '5', entrada: 22000, saida: 11000 },
  { day: '6', entrada: 16000, saida: 13000 },
  { day: '7', entrada: 20000, saida: 15000 },
];

const categoryData = [
  { name: 'Eletrônicos', value: 35, color: '#1e40af' },
  { name: 'Roupas', value: 25, color: '#3b82f6' },
  { name: 'Casa', value: 20, color: '#06b6d4' },
  { name: 'Livros', value: 20, color: '#10b981' },
];

const timelineData = [
  {
    id: '1',
    title: 'Nova venda realizada',
    description: 'Pedido #1234 - R$ 2.450,00',
    time: '2 min atrás',
    type: 'success' as const,
    user: 'João Silva',
  },
  {
    id: '2',
    title: 'Estoque baixo',
    description: 'Produto "Notebook Dell" com apenas 3 unidades',
    time: '15 min atrás',
    type: 'warning' as const,
    user: 'Sistema',
  },
  {
    id: '3',
    title: 'Cliente cadastrado',
    description: 'Maria Santos - empresa@email.com',
    time: '1h atrás',
    type: 'info' as const,
    user: 'Ana Costa',
  },
  {
    id: '4',
    title: 'Pagamento recebido',
    description: 'Fatura #891 - R$ 1.200,00',
    time: '2h atrás',
    type: 'success' as const,
    user: 'Sistema',
  },
];

const alerts = [
  { id: 1, type: 'warning', message: '5 produtos com estoque baixo', urgent: true },
  { id: 2, type: 'info', message: '3 novos pedidos aguardando aprovação', urgent: false },
  { id: 3, type: 'error', message: '2 faturas vencidas não pagas', urgent: true },
];

const MainDashboard: React.FC = () => {
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
          <Button className="juga-gradient text-white w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nova Venda</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards - Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <JugaKPICard
          title="Faturamento Hoje"
          value="R$ 12.450"
          description="Últimas 24h"
          trend="up"
          trendValue="+12.5%"
          icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="primary"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Vendas Realizadas"
          value="28"
          description="Este mês"
          trend="up"
          trendValue="+8.2%"
          icon={<ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="success"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Novos Clientes"
          value="156"
          description="Este mês"
          trend="up"
          trendValue="+3.1%"
          icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="accent"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Produtos Ativos"
          value="1.248"
          description="Em estoque"
          trend="down"
          trendValue="-2.4%"
          icon={<Package className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="warning"
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
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                    <BarChart data={salesData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                      <Bar dataKey="vendas" fill="var(--juga-primary)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="meta" fill="var(--juga-border)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                    <LineChart data={cashFlowData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--juga-border)" />
                      <XAxis 
                        dataKey="day" 
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
                      <Line type="monotone" dataKey="entrada" stroke="var(--juga-success)" strokeWidth={2} className="sm:stroke-[3]" />
                      <Line type="monotone" dataKey="saida" stroke="var(--juga-error)" strokeWidth={2} className="sm:stroke-[3]" />
                    </LineChart>
                  </ResponsiveContainer>
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
              <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6">
                <div className="w-full lg:w-1/2 flex justify-center">
                  <ResponsiveContainer width="100%" height={180} className="sm:h-[200px]">
                    <PieChart>
                      <Pie 
                        data={categoryData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={40} 
                        outerRadius={60} 
                        className="sm:innerRadius-[60px] sm:outerRadius-[80px]"
                        paddingAngle={5} 
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'var(--juga-surface-card)',
                          border: '1px solid var(--juga-border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full lg:w-1/2 space-y-3">
                  {categoryData.map((category) => (
                    <div key={category.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                        <span className="text-body text-sm">{category.name}</span>
                      </div>
                      <span className="font-medium text-heading text-sm sm:text-base">{category.value}%</span>
                    </div>
                  ))}
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
              <Button className="w-full justify-start juga-gradient text-white text-sm">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nova Venda</span>
                <span className="sm:hidden">Nova</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Cadastrar Cliente</span>
                <span className="sm:hidden">Cliente</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                <Package className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Adicionar Produto</span>
                <span className="sm:hidden">Produto</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
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
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-2 sm:p-3 rounded-lg border flex items-start gap-2 sm:gap-3 ${
                    alert.type === 'warning'
                      ? 'bg-juga-warning/5 border-juga-warning/20'
                      : alert.type === 'error'
                      ? 'bg-juga-error/5 border-juga-error/20'
                      : 'bg-juga-primary/5 border-juga-primary/20'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 sm:mt-2 flex-shrink-0 ${
                      alert.type === 'warning'
                        ? 'bg-juga-warning'
                        : alert.type === 'error'
                        ? 'bg-juga-error'
                        : 'bg-juga-primary'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-body leading-tight">{alert.message}</p>
                    {alert.urgent && (
                      <Badge variant="destructive" className="mt-1 text-xs">
                        Urgente
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="flex-shrink-0 p-1 sm:p-2">
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Cards de Progresso - Responsivo */}
          <div className="space-y-3 sm:space-y-4">
            <JugaProgressCard 
              title="Meta Mensal" 
              description="Vendas do mês" 
              progress={68} 
              total={100000} 
              current={68000} 
              color="primary" 
              className="text-sm"
            />
            <JugaProgressCard 
              title="Satisfação" 
              description="NPS clientes" 
              progress={85} 
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
              <JugaTimeline items={timelineData} className="space-y-2 sm:space-y-3" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
