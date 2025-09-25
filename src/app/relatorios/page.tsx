
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { JugaKPICard } from '@/components/dashboard/JugaComponents';
import {
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  Filter,
  Download,
  Calendar,
  PieChart as PieIcon,
  LineChart as LineIcon,
  ArrowRight,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { mockSales, mockProducts, mockFinancialTransactions, mockDeliveries } from '@/lib/mock-data';
import { Label } from '@/components/ui/label';

const COLORS = ['#2563eb', '#22c55e', '#f97316', '#a855f7', '#0ea5e9'];

export default function RelatoriosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    };
  });

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value),
    [],
  );

  const filteredSales = useMemo(
    () =>
      mockSales.filter((sale) => {
        const saleDate = sale.sold_at.split('T')[0];
        return saleDate >= dateRange.start && saleDate <= dateRange.end;
      }),
    [dateRange],
  );

  const filteredTransactions = useMemo(
    () =>
      mockFinancialTransactions.filter((transaction) => {
        const transactionDate = transaction.created_at.split('T')[0];
        return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
      }),
    [dateRange],
  );

  const filteredDeliveries = useMemo(
    () =>
      mockDeliveries.filter((delivery) => {
        const deliveryDate = delivery.created_at.split('T')[0];
        return deliveryDate >= dateRange.start && deliveryDate <= dateRange.end;
      }),
    [dateRange],
  );

  const salesStats = useMemo(() => {
    const totalAmount = filteredSales.reduce((sum, sale) => sum + sale.final_amount, 0);
    const totalSales = filteredSales.length;
    const averageTicket = totalSales > 0 ? totalAmount / totalSales : 0;

    return {
      totalAmount,
      totalSales,
      averageTicket,
    };
  }, [filteredSales]);

  const paymentMethodData = useMemo(() => {
    const stats = filteredSales.reduce((acc, sale) => {
      acc[sale.payment_method] = (acc[sale.payment_method] || 0) + sale.final_amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats).map(([method, amount]) => ({
      name: method.replace('_', ' ').toUpperCase(),
      value: amount,
    }));
  }, [filteredSales]);

  const dailySalesChart = useMemo(() => {
    const dailyData = filteredSales.reduce((acc, sale) => {
      const date = sale.sold_at.split('T')[0];
      acc[date] = (acc[date] || 0) + sale.final_amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        amount,
      }));
  }, [filteredSales]);

  const cashFlowChart = useMemo(() => {
    const flowData = filteredTransactions.reduce((acc, transaction) => {
      const date = transaction.created_at.split('T')[0];
      if (!acc[date]) acc[date] = { income: 0, expense: 0 };

      if (transaction.transaction_type === 'receita' && transaction.status === 'pago') {
        acc[date].income += transaction.amount;
      } else if (transaction.transaction_type === 'despesa' && transaction.status === 'pago') {
        acc[date].expense += transaction.amount;
      }

      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    return Object.entries(flowData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        receitas: data.income,
        despesas: data.expense,
        saldo: data.income - data.expense,
      }));
  }, [filteredTransactions]);

  const summaryCards = useMemo(
    () => [
      {
        title: 'Faturamento no período',
        value: formatCurrency(salesStats.totalAmount),
        description: `${salesStats.totalSales} vendas concluídas`,
        trend: 'up' as const,
        trendValue: '+8,2%',
        icon: <DollarSign className="h-5 w-5" />,
        color: 'primary' as const,
      },
      {
        title: 'Ticket médio',
        value: formatCurrency(salesStats.averageTicket),
        description: 'Média por transação',
        trend: 'neutral' as const,
        trendValue: 'Estável',
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'accent' as const,
      },
      {
        title: 'Produtos ativos',
        value: `${mockProducts.filter((p) => p.is_active).length}`,
        description: `${mockProducts.length} no catálogo`,
        trend: 'up' as const,
        trendValue: '+12 itens',
        icon: <Package className="h-5 w-5" />,
        color: 'success' as const,
      },
      {
        title: 'Entregas concluídas',
        value: `${filteredDeliveries.filter((d) => d.status === 'entregue').length}`,
        description: `${filteredDeliveries.length} no período`,
        trend: 'up' as const,
        trendValue: '+5%',
        icon: <Truck className="h-5 w-5" />,
        color: 'warning' as const,
      },
    ],
    [filteredDeliveries, formatCurrency, salesStats],
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-3xl border border-border bg-white/90 shadow-sm p-6">
        <div className="space-y-1">
          <Badge className="w-fit bg-sky-600">Relatórios</Badge>
          <h1 className="text-3xl font-bold text-heading">Análise Avançada de Resultados</h1>
          <p className="text-muted-foreground max-w-3xl">
            Explore métricas de vendas, finanças, produtos e entregas para orientar decisões estratégicas do seu negócio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-white/70 px-3 py-2 shadow-sm">
            <Label className="text-xs uppercase text-muted-foreground">De</Label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="border-none bg-transparent focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-white/70 px-3 py-2 shadow-sm">
            <Label className="text-xs uppercase text-muted-foreground">Até</Label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="border-none bg-transparent focus-visible:ring-0"
            />
          </div>
          <Button variant="outline" className="gap-2 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100">
            <Filter className="h-4 w-4" />
            Aplicar Filtro
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 shadow-inner">
        <div className="grid gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <JugaKPICard
            key={card.title}
            title={card.title}
            value={card.value}
            description={card.description}
            trend={card.trend}
            trendValue={card.trendValue}
            icon={card.icon}
            color={card.color}
          />
        ))}
        </div>
      </div>

      <Tabs defaultValue="vendas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-2xl border border-border bg-white/90 p-1 shadow-sm">
          <TabsTrigger value="vendas" className="gap-2 rounded-xl data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <LineIcon className="h-4 w-4" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-2 rounded-xl data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <DollarSign className="h-4 w-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="produtos" className="gap-2 rounded-xl data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <Package className="h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="entregas" className="gap-2 rounded-xl data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <Truck className="h-4 w-4" />
            Entregas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="juga-card border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-heading">Volume diário de vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ amount: { label: 'Valor', color: 'hsl(var(--chart-1))' } }} className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailySalesChart}>
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <ChartTooltip
                        content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
                      />
                      <Bar dataKey="amount" fill="var(--color-amount)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="juga-card border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-heading">Vendas por forma de pagamento</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={110}
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background/95 p-2 shadow">
                                <p className="text-sm font-medium">{payload[0].name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(payload[0].value as number)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="juga-card">
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-heading">Detalhamento de vendas</CardTitle>
                <p className="text-caption text-sm">Principais vendas no período filtrado</p>
              </div>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[360px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.slice(0, 20).map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.sale_number}</TableCell>
                        <TableCell>{new Date(sale.sold_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{formatCurrency(sale.final_amount)}</TableCell>
                        <TableCell className="capitalize">{sale.payment_method.replace('_', ' ')}</TableCell>
                        <TableCell className="capitalize">{sale.sale_type}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-6">
          <Card className="juga-card border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-heading">Fluxo de caixa consolidado</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  receitas: { label: 'Receitas', color: 'hsl(var(--chart-1))' },
                  despesas: { label: 'Despesas', color: 'hsl(var(--chart-2))' },
                  saldo: { label: 'Saldo', color: 'hsl(var(--chart-3))' },
                }}
                className="h-[340px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cashFlowChart}>
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
                    <Line type="monotone" dataKey="receitas" stroke="var(--color-receitas)" strokeWidth={2} />
                    <Line type="monotone" dataKey="despesas" stroke="var(--color-despesas)" strokeWidth={2} />
                    <Line type="monotone" dataKey="saldo" stroke="var(--color-saldo)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="juga-card">
              <CardHeader>
                <CardTitle className="text-heading text-green-600">Receitas recebidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    filteredTransactions
                      .filter((t) => t.transaction_type === 'receita' && t.status === 'pago')
                      .reduce((sum, t) => sum + t.amount, 0),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Considera apenas valores contabilizados</p>
              </CardContent>
            </Card>
            <Card className="juga-card">
              <CardHeader>
                <CardTitle className="text-heading text-red-600">Despesas pagas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(
                    filteredTransactions
                      .filter((t) => t.transaction_type === 'despesa' && t.status === 'pago')
                      .reduce((sum, t) => sum + t.amount, 0),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Inclui custos operacionais e fornecedores</p>
              </CardContent>
            </Card>
            <Card className="juga-card">
              <CardHeader>
                <CardTitle className="text-heading">Saldo líquido</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    filteredTransactions
                      .filter((t) => t.transaction_type === 'receita' && t.status === 'pago')
                      .reduce((sum, t) => sum + t.amount, 0) -
                      filteredTransactions
                        .filter((t) => t.transaction_type === 'despesa' && t.status === 'pago')
                        .reduce((sum, t) => sum + t.amount, 0) >=
                    0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(
                    filteredTransactions
                      .filter((t) => t.transaction_type === 'receita' && t.status === 'pago')
                      .reduce((sum, t) => sum + t.amount, 0) -
                      filteredTransactions
                        .filter((t) => t.transaction_type === 'despesa' && t.status === 'pago')
                        .reduce((sum, t) => sum + t.amount, 0),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="produtos" className="space-y-6">
          <Card className="juga-card">
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-heading">Desempenho por produto</CardTitle>
                <p className="text-caption text-sm">Produtos com maior valor em estoque</p>
              </div>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[360px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Valor em estoque</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockProducts.slice(0, 20).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-heading">{product.name}</span>
                            <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.stock_quantity <= product.min_stock ? 'destructive' : 'default'}>
                            {product.stock_quantity} {product.unit}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(product.stock_quantity * product.cost_price)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? 'default' : 'secondary'}>
                            {product.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entregas" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <JugaKPICard
              title="Entregas realizadas"
              value={`${filteredDeliveries.filter((d) => d.status === 'entregue').length}`}
              description="Força de logística"
              color="success"
              icon={<Truck className="h-5 w-5" />}
              trend="up"
              trendValue="+3 entregas"
            />
            <JugaKPICard
              title="Em rota"
              value={`${filteredDeliveries.filter((d) => d.status === 'em_rota').length}`}
              description="Monitoramento em tempo real"
              color="accent"
              icon={<Truck className="h-5 w-5" />}
              trend="neutral"
              trendValue="Atualizado agora"
            />
            <JugaKPICard
              title="Pendentes"
              value={`${filteredDeliveries.filter((d) => d.status === 'aguardando').length}`}
              description="Aguardando envio"
              color="warning"
              icon={<Truck className="h-5 w-5" />}
              trend="down"
              trendValue="-1 pendência"
            />
            <JugaKPICard
              title="Canceladas"
              value={`${filteredDeliveries.filter((d) => d.status === 'cancelada').length}`}
              description="Ocorrências extraordinárias"
              color="error"
              icon={<Truck className="h-5 w-5" />}
              trend="down"
              trendValue="-2 ocorrências"
            />
          </div>

          <Card className="juga-card">
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-heading">Detalhes das entregas</CardTitle>
                <p className="text-caption text-sm">Status das entregas dentro do período selecionado</p>
              </div>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[360px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeliveries.slice(0, 20).map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-heading">{delivery.customer_name}</span>
                            <span className="text-xs text-muted-foreground">{delivery.phone || 'Sem contato'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">{delivery.delivery_address}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              delivery.status === 'entregue'
                                ? 'default'
                                : delivery.status === 'em_rota'
                                ? 'accent'
                                : delivery.status === 'aguardando'
                                ? 'warning'
                                : 'destructive'
                            }
                            className="capitalize"
                          >
                            {delivery.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(delivery.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="juga-card">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-heading">Exportações inteligentes</CardTitle>
            <p className="text-caption text-sm">Selecione rapidamente o relatório desejado e faça o download dos dados</p>
          </div>
          <Button className="gap-2 juga-gradient text-white">
            <Download className="h-4 w-4" />
            Exportar todos
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                label: 'Relatório financeiro completo',
                description: 'Receitas, despesas e fluxo de caixa consolidado',
              },
              {
                label: 'Vendas detalhadas',
                description: 'Ticket médio, formatos de pagamento e produtos',
              },
              {
                label: 'Logística e entregas',
                description: 'Tempo médio de entrega e status por motorista',
              },
            ].map((item) => (
              <Button key={item.label} variant="outline" className="justify-between gap-3">
                <div className="text-left">
                  <div className="font-medium text-heading">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
