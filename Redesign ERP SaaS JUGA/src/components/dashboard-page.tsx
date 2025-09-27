import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { JugaKPICard, JugaTimeline, JugaProgressCard } from './juga-components';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
  ArrowRight
} from 'lucide-react';

// Mock data
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

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-heading">Dashboard</h1>
          <p className="text-body">Visão geral do seu negócio</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Últimos 30 dias
          </Button>
          <Button className="juga-gradient text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <JugaKPICard
          title="Faturamento Hoje"
          value="R$ 12.450"
          description="Últimas 24h"
          trend="up"
          trendValue="+12.5%"
          icon={<DollarSign className="h-5 w-5" />}
          color="primary"
        />
        <JugaKPICard
          title="Vendas Realizadas"
          value="28"
          description="Este mês"
          trend="up"
          trendValue="+8.2%"
          icon={<ShoppingCart className="h-5 w-5" />}
          color="success"
        />
        <JugaKPICard
          title="Novos Clientes"
          value="156"
          description="Este mês"
          trend="up"
          trendValue="+3.1%"
          icon={<Users className="h-5 w-5" />}
          color="accent"
        />
        <JugaKPICard
          title="Produtos Ativos"
          value="1,248"
          description="Em estoque"
          trend="down"
          trendValue="-2.4%"
          icon={<Package className="h-5 w-5" />}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="xl:col-span-2 space-y-6">
          <Tabs defaultValue="sales" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sales">Vendas</TabsTrigger>
              <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sales">
              <Card className="juga-card">
                <CardHeader>
                  <CardTitle className="text-heading">Gráfico de Vendas</CardTitle>
                  <CardDescription>Vendas mensais vs meta estabelecida</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--juga-border)" />
                      <XAxis dataKey="month" stroke="var(--juga-text-muted)" />
                      <YAxis stroke="var(--juga-text-muted)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--juga-surface-card)',
                          border: '1px solid var(--juga-border)',
                          borderRadius: '8px'
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
                <CardHeader>
                  <CardTitle className="text-heading">Fluxo de Caixa</CardTitle>
                  <CardDescription>Entradas e saídas dos últimos 7 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--juga-border)" />
                      <XAxis dataKey="day" stroke="var(--juga-text-muted)" />
                      <YAxis stroke="var(--juga-text-muted)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--juga-surface-card)',
                          border: '1px solid var(--juga-border)',
                          borderRadius: '8px'
                        }}
                      />
                      <Line type="monotone" dataKey="entrada" stroke="var(--juga-success)" strokeWidth={3} />
                      <Line type="monotone" dataKey="saida" stroke="var(--juga-error)" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Categories Chart */}
          <Card className="juga-card">
            <CardHeader>
              <CardTitle className="text-heading">Vendas por Categoria</CardTitle>
              <CardDescription>Distribuição de vendas por categoria de produto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="w-full lg:w-1/2">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full lg:w-1/2 space-y-3">
                  {categoryData.map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-body text-sm">{category.name}</span>
                      </div>
                      <span className="font-medium text-heading">{category.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="juga-card">
            <CardHeader>
              <CardTitle className="text-heading">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start juga-gradient text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nova Venda
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Cadastrar Cliente
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="juga-card">
            <CardHeader>
              <CardTitle className="text-heading flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-3 rounded-lg border flex items-start gap-3 ${
                    alert.type === 'warning' ? 'bg-juga-warning/5 border-juga-warning/20' :
                    alert.type === 'error' ? 'bg-juga-error/5 border-juga-error/20' :
                    'bg-juga-primary/5 border-juga-primary/20'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.type === 'warning' ? 'bg-juga-warning' :
                    alert.type === 'error' ? 'bg-juga-error' :
                    'bg-juga-primary'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-body">{alert.message}</p>
                    {alert.urgent && (
                      <Badge variant="destructive" className="mt-1">Urgente</Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Progress Cards */}
          <div className="space-y-4">
            <JugaProgressCard
              title="Meta Mensal"
              description="Vendas do mês"
              progress={68}
              total={100000}
              current={68000}
              color="primary"
            />
            <JugaProgressCard
              title="Satisfação"
              description="NPS clientes"
              progress={85}
              color="success"
            />
          </div>

          {/* Timeline */}
          <Card className="juga-card">
            <CardHeader>
              <CardTitle className="text-heading">Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <JugaTimeline items={timelineData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}