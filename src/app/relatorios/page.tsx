'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
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
  FileText,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { Label } from '@/components/ui/label';

const COLORS = ['#2563eb', '#22c55e', '#f97316', '#a855f7', '#0ea5e9'];

export default function RelatoriosPage() {
  const { tenant } = useSimpleAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    };
  });

  const loadData = async () => {
    try {
      setLoading(true);
      if (!tenant?.id) {
        setSales([]);
        setProducts([]);
        setTransactions([]);
        setDeliveries([]);
        return;
      }

      const [salesRes, productsRes, transactionsRes, deliveriesRes] = await Promise.allSettled([
        fetch(`/next_api/sales?tenant_id=${encodeURIComponent(tenant.id)}`),
        fetch(`/next_api/products?tenant_id=${encodeURIComponent(tenant.id)}`),
        fetch(`/next_api/financial-transactions?tenant_id=${encodeURIComponent(tenant.id)}`),
        fetch(`/next_api/deliveries?tenant_id=${encodeURIComponent(tenant.id)}`),
      ]);

      const salesData = salesRes.status === 'fulfilled' ? await salesRes.value.json() : { data: [] };
      const productsData = productsRes.status === 'fulfilled' ? await productsRes.value.json() : { data: [] };
      const transactionsData = transactionsRes.status === 'fulfilled' ? await transactionsRes.value.json() : { data: [] };
      const deliveriesData = deliveriesRes.status === 'fulfilled' ? await deliveriesRes.value.json() : { data: [] };

      setSales(Array.isArray(salesData?.data) ? salesData.data : (salesData?.rows || []));
      setProducts(Array.isArray(productsData?.data) ? productsData.data : (productsData?.rows || []));
      setTransactions(Array.isArray(transactionsData?.data) ? transactionsData.data : (transactionsData?.rows || []));
      setDeliveries(Array.isArray(deliveriesData?.data) ? deliveriesData.data : (deliveriesData?.rows || []));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tenant?.id) {
      setLoading(false);
      return;
    }
    loadData();
  }, [tenant?.id]);

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
      sales.filter((sale) => {
        const saleDate = (sale.sold_at || sale.created_at || '').split('T')[0];
        return saleDate >= dateRange.start && saleDate <= dateRange.end;
      }),
    [sales, dateRange],
  );

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const transactionDate = (transaction.created_at || '').split('T')[0];
        return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
      }),
    [transactions, dateRange],
  );

  const filteredDeliveries = useMemo(
    () =>
      deliveries.filter((delivery) => {
        const deliveryDate = (delivery.created_at || '').split('T')[0];
        return deliveryDate >= dateRange.start && deliveryDate <= dateRange.end;
      }),
    [deliveries, dateRange],
  );

  const salesStats = useMemo(() => {
    const totalAmount = filteredSales.reduce((sum, sale) => sum + (sale.final_amount || sale.total_amount || sale.total || 0), 0);
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
      const method = sale.payment_method || 'dinheiro';
      const amount = sale.final_amount || sale.total_amount || sale.total || 0;
      acc[method] = (acc[method] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats).map(([method, amount]) => ({
      name: method.replace('_', ' ').toUpperCase(),
      value: amount,
      color: COLORS[Object.keys(stats).indexOf(method) % COLORS.length],
    }));
  }, [filteredSales]);

  const dailySalesChart = useMemo(() => {
    const dailyData = filteredSales.reduce((acc, sale) => {
      const date = (sale.sold_at || sale.created_at || '').split('T')[0];
      const amount = sale.final_amount || sale.total_amount || sale.total || 0;
      acc[date] = (acc[date] || 0) + amount;
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
      const date = (transaction.created_at || '').split('T')[0];
      if (!acc[date]) acc[date] = { income: 0, expense: 0 };

      const amount = transaction.amount || 0;
      const type = transaction.transaction_type || 'receita';
      const status = transaction.status || 'pago';

      if (type === 'receita' && status === 'pago') {
        acc[date].income += amount;
      } else if (type === 'despesa' && status === 'pago') {
        acc[date].expense += amount;
      }

      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    return Object.entries(flowData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        receitas: (data as { income: number; expense: number }).income,
        despesas: (data as { income: number; expense: number }).expense,
        saldo: (data as { income: number; expense: number }).income - (data as { income: number; expense: number }).expense,
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
        value: `${products.filter((p) => p.is_active !== false).length}`,
        description: `${products.length} no catálogo`,
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
    [filteredDeliveries, formatCurrency, salesStats, products],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header - Responsivo */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Relatórios</h1>
          <p className="text-sm sm:text-base text-body">Análise avançada de resultados do seu negócio</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex items-center gap-3 rounded-xl border border-border bg-background/70 dark:bg-gray-900/60 px-4 py-2.5 shadow-sm hover:bg-background/80 transition-colors">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">De</Label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="h-10 border-none bg-transparent focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 text-heading font-medium"
            />
            <Calendar className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative flex items-center gap-3 rounded-xl border border-border bg-background/70 dark:bg-gray-900/60 px-4 py-2.5 shadow-sm hover:bg-background/80 transition-colors">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Até</Label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="h-10 border-none bg-transparent focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 text-heading font-medium"
            />
            <Calendar className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <Button className="juga-gradient text-white w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Exportar</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards - Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
            className="min-h-[120px] sm:min-h-[140px]"
          />
        ))}
      </div>

      {/* Main Content - Responsivo */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          <Tabs defaultValue="vendas" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="vendas" className="text-xs sm:text-sm">Vendas</TabsTrigger>
              <TabsTrigger value="financeiro" className="text-xs sm:text-sm">Financeiro</TabsTrigger>
              <TabsTrigger value="produtos" className="text-xs sm:text-sm">Produtos</TabsTrigger>
              <TabsTrigger value="entregas" className="text-xs sm:text-sm">Entregas</TabsTrigger>
            </TabsList>

            <TabsContent value="vendas">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="juga-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl text-heading">Volume diário de vendas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{ amount: { label: 'Valor', color: 'hsl(var(--chart-1))' } }} className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailySalesChart}>
                          <XAxis dataKey="date" />
                          <YAxis />
                          {dailySalesChart.length > 0 && (
                            <ChartTooltip content={<ChartTooltipContent />} />
                          )}
                          <Bar dataKey="amount" fill="hsl(var(--chart-1))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="juga-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl text-heading">Vendas por forma de pagamento</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentMethodData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {paymentMethodData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          {paymentMethodData.length > 0 && (
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
                          )}
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="juga-card mt-4 sm:mt-6">
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-heading">Detalhamento de vendas</CardTitle>
                    <p className="text-sm text-muted-foreground">Principais vendas no período filtrado</p>
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
                          <TableHead>Data</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSales.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              <p className="text-muted-foreground">Nenhuma venda encontrada no período</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredSales.slice(0, 10).map((sale) => (
                            <TableRow key={sale.id}>
                              <TableCell className="font-medium">
                                {sale.customer_name || sale.customer?.name || 'Cliente não informado'}
                              </TableCell>
                              <TableCell>
                                {new Date(sale.sold_at || sale.created_at || '').toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(sale.final_amount || sale.total_amount || sale.total || 0)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-green-600">
                                  Concluída
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financeiro">
              <Card className="juga-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl text-heading">Fluxo de caixa consolidado</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      receitas: { label: 'Receitas', color: 'hsl(var(--chart-1))' },
                      despesas: { label: 'Despesas', color: 'hsl(var(--chart-2))' },
                      saldo: { label: 'Saldo', color: 'hsl(var(--chart-3))' },
                    }}
                    className="h-[260px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cashFlowChart}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        {cashFlowChart.length > 0 && (
                          <ChartTooltip content={<ChartTooltipContent />} />
                        )}
                        <Line type="monotone" dataKey="receitas" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                        <Line type="monotone" dataKey="despesas" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                        <Line type="monotone" dataKey="saldo" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-3 mt-4 sm:mt-6">
                <Card className="juga-card">
                  <CardHeader>
                    <CardTitle className="text-heading text-green-600">Receitas recebidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        filteredTransactions
                          .filter((t) => t.transaction_type === 'receita' && t.status === 'pago')
                          .reduce((sum, t) => sum + (t.amount || 0), 0)
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
                          .reduce((sum, t) => sum + (t.amount || 0), 0)
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
                          .reduce((sum, t) => sum + (t.amount || 0), 0) -
                          filteredTransactions
                            .filter((t) => t.transaction_type === 'despesa' && t.status === 'pago')
                            .reduce((sum, t) => sum + (t.amount || 0), 0) >=
                        0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(
                        filteredTransactions
                          .filter((t) => t.transaction_type === 'receita' && t.status === 'pago')
                          .reduce((sum, t) => sum + (t.amount || 0), 0) -
                          filteredTransactions
                            .filter((t) => t.transaction_type === 'despesa' && t.status === 'pago')
                            .reduce((sum, t) => sum + (t.amount || 0), 0)
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Receitas menos despesas</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="produtos">
              <Card className="juga-card">
                <CardHeader className="flex flex-wrap items-center justify-between gap-3 pb-4">
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-heading">Desempenho por produto</CardTitle>
                    <p className="text-sm">Produtos com maior valor em estoque</p>
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
                          <TableHead>Valor Unit.</TableHead>
                          <TableHead>Valor Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              {loading ? (
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  <p className="text-muted-foreground">Carregando produtos...</p>
                                </div>
                              ) : (
                                <p className="text-muted-foreground">Nenhum produto encontrado</p>
                              )}
                            </TableCell>
                          </TableRow>
                        ) : (
                          products
                            .filter((p) => p.is_active !== false)
                            .sort((a, b) => (b.stock_quantity || 0) * (b.cost_price || 0) - (a.stock_quantity || 0) * (a.cost_price || 0))
                            .slice(0, 10)
                            .map((product) => (
                              <TableRow key={product.id}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span>{product.name}</span>
                                    <span className="text-xs text-muted-foreground">{product.category || 'Sem categoria'}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{product.stock_quantity || 0}</TableCell>
                                <TableCell>{formatCurrency(product.cost_price || 0)}</TableCell>
                                <TableCell>{formatCurrency((product.stock_quantity || 0) * (product.cost_price || 0))}</TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="entregas">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
                <JugaKPICard
                  title="Entregas realizadas"
                  value={`${filteredDeliveries.filter((d) => d.status === 'entregue').length}`}
                  description="Força de logística"
                  color="success"
                  icon={<Truck className="h-5 w-5" />}
                  trend="up"
                  trendValue="+3 entregas"
                  className="h-full min-h-[140px]"
                />
                <JugaKPICard
                  title="Em trânsito"
                  value={`${filteredDeliveries.filter((d) => d.status === 'em_rota').length}`}
                  description="A caminho do destino"
                  color="warning"
                  icon={<Truck className="h-5 w-5" />}
                  trend="neutral"
                  trendValue="Estável"
                  className="h-full min-h-[140px]"
                />
                <JugaKPICard
                  title="Aguardando"
                  value={`${filteredDeliveries.filter((d) => d.status === 'aguardando').length}`}
                  description="Pendentes de coleta"
                  color="warning"
                  icon={<Truck className="h-5 w-5" />}
                  trend="down"
                  trendValue="-2 ocorrências"
                  className="h-full min-h-[140px]"
                />
              </div>

              <Card className="juga-card mt-4 sm:mt-6">
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-heading">Detalhes das entregas</CardTitle>
                    <p className="text-sm text-muted-foreground">Status das entregas dentro do período selecionado</p>
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
                        {filteredDeliveries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              {loading ? (
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  <p className="text-muted-foreground">Carregando entregas...</p>
                                </div>
                              ) : (
                                <p className="text-muted-foreground">Nenhuma entrega encontrada no período</p>
                              )}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredDeliveries.slice(0, 10).map((delivery) => (
                            <TableRow key={delivery.id}>
                              <TableCell className="font-medium">
                                {delivery.customer_name || delivery.customer?.name || 'Cliente não informado'}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-sm">{delivery.address || delivery.delivery_address || 'Endereço não informado'}</span>
                                  <span className="text-xs text-muted-foreground">{delivery.city || ''}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    delivery.status === 'entregue'
                                      ? 'text-green-600'
                                      : delivery.status === 'em_rota'
                                      ? 'text-blue-600'
                                      : 'text-orange-600'
                                  }
                                >
                                  {delivery.status === 'entregue'
                                    ? 'Entregue'
                                    : delivery.status === 'em_rota'
                                    ? 'Em rota'
                                    : 'Aguardando'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(delivery.created_at || '').toLocaleDateString('pt-BR')}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Responsivo */}
        <div className="space-y-4 sm:space-y-6">
          {/* Filtros Rápidos - Responsivo */}
          <Card className="juga-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg text-heading">Filtros Rápidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <Button className="w-full justify-start juga-gradient text-white text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Últimos 30 dias</span>
                <span className="sm:hidden">30 dias</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Este mês</span>
                <span className="sm:hidden">Mês</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                <DollarSign className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Vendas</span>
                <span className="sm:hidden">Vendas</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                <Package className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Produtos</span>
                <span className="sm:hidden">Produtos</span>
              </Button>
            </CardContent>
          </Card>

          {/* Exportações - Responsivo */}
          <Card className="juga-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg text-heading">Exportações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <Button className="w-full justify-start juga-gradient text-white text-sm">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Exportar Todos</span>
                <span className="sm:hidden">Todos</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Relatório Financeiro</span>
                <span className="sm:hidden">Financeiro</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                <LineIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Vendas Detalhadas</span>
                <span className="sm:hidden">Vendas</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                <Truck className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logística</span>
                <span className="sm:hidden">Logística</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}