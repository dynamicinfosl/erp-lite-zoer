
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { FileText, Download, Calendar, TrendingUp, Package, DollarSign, Users, Truck } from 'lucide-react';
import { Sale, Product, FinancialTransaction, Delivery } from '@/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export default function RelatoriosPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [salesData, productsData, transactionsData, deliveriesData] = await Promise.all([
        api.get<Sale[]>('/sales'),
        api.get<Product[]>('/products'),
        api.get<FinancialTransaction[]>('/financial-transactions'),
        api.get<Delivery[]>('/deliveries'),
      ]);
      
      setSales(salesData);
      setProducts(productsData);
      setTransactions(transactionsData);
      setDeliveries(deliveriesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados dos relatórios');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Filtrar dados por período
  const filteredSales = sales.filter(sale => {
    const saleDate = sale.sold_at.split('T')[0];
    return saleDate >= dateRange.start && saleDate <= dateRange.end;
  });

  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = transaction.created_at.split('T')[0];
    return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
  });

  const filteredDeliveries = deliveries.filter(delivery => {
    const deliveryDate = delivery.created_at.split('T')[0];
    return deliveryDate >= dateRange.start && deliveryDate <= dateRange.end;
  });

  // Cálculos de vendas
  const salesStats = {
    totalSales: filteredSales.length,
    totalAmount: filteredSales.reduce((sum, sale) => sum + sale.final_amount, 0),
    averageTicket: filteredSales.length > 0 ? 
      filteredSales.reduce((sum, sale) => sum + sale.final_amount, 0) / filteredSales.length : 0,
  };

  // Vendas por forma de pagamento
  const paymentMethodStats = filteredSales.reduce((acc, sale) => {
    acc[sale.payment_method] = (acc[sale.payment_method] || 0) + sale.final_amount;
    return acc;
  }, {} as Record<string, number>);

  const paymentMethodData = Object.entries(paymentMethodStats).map(([method, amount]) => ({
    name: method.replace('_', ' ').toUpperCase(),
    value: amount,
  }));

  // Vendas por dia
  const dailySalesData = filteredSales.reduce((acc, sale) => {
    const date = sale.sold_at.split('T')[0];
    acc[date] = (acc[date] || 0) + sale.final_amount;
    return acc;
  }, {} as Record<string, number>);

  const dailySalesChart = Object.entries(dailySalesData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      amount,
    }));

  // Produtos mais vendidos
  const productSales = filteredSales.reduce((acc, sale) => {
    // Em um cenário real, você teria os itens da venda
    // Por agora, vamos simular com dados dos produtos
    return acc;
  }, {} as Record<number, { name: string; quantity: number; amount: number }>);

  // Fluxo de caixa
  const cashFlowData = filteredTransactions.reduce((acc, transaction) => {
    const date = transaction.created_at.split('T')[0];
    if (!acc[date]) {
      acc[date] = { income: 0, expense: 0 };
    }
    
    if (transaction.transaction_type === 'receita' && transaction.status === 'pago') {
      acc[date].income += transaction.amount;
    } else if (transaction.transaction_type === 'despesa' && transaction.status === 'pago') {
      acc[date].expense += transaction.amount;
    }
    
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  const cashFlowChart = Object.entries(cashFlowData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      receitas: data.income,
      despesas: data.expense,
      saldo: data.income - data.expense,
    }));

  // Stats de entregas
  const deliveryStats = {
    total: filteredDeliveries.length,
    completed: filteredDeliveries.filter(d => d.status === 'entregue').length,
    pending: filteredDeliveries.filter(d => d.status === 'aguardando').length,
    inRoute: filteredDeliveries.filter(d => d.status === 'em_rota').length,
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartConfig = {
    amount: { label: "Valor", color: "hsl(var(--chart-1))" },
    receitas: { label: "Receitas", color: "hsl(var(--chart-1))" },
    despesas: { label: "Despesas", color: "hsl(var(--chart-2))" },
    saldo: { label: "Saldo", color: "hsl(var(--chart-3))" },
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise detalhada do desempenho do negócio
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="start-date">De:</Label>
            <Input
              id="start-date"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="end-date">Até:</Label>
            <Input
              id="end-date"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
          <Button onClick={fetchAllData}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salesStats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {salesStats.totalSales} vendas realizadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salesStats.averageTicket)}</div>
            <p className="text-xs text-muted-foreground">
              Por venda
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter(p => p.is_active).length}</div>
            <p className="text-xs text-muted-foreground">
              Total: {products.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryStats.completed}</div>
            <p className="text-xs text-muted-foreground">
              De {deliveryStats.total} total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vendas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="entregas">Entregas</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Gráfico de Vendas Diárias */}
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailySalesChart}>
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <ChartTooltip
                        content={<ChartTooltipContent 
                          formatter={(value) => formatCurrency(value as number)}
                        />}
                      />
                      <Bar dataKey="amount" fill="var(--color-amount)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Formas de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
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
                              <div className="bg-background border rounded-lg p-2 shadow-md">
                                <p className="font-medium">{payload[0].name}</p>
                                <p className="text-sm">{formatCurrency(payload[0].value as number)}</p>
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

          {/* Tabela de Vendas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Detalhes das Vendas</CardTitle>
              <Button
                variant="outline"
                onClick={() => exportToCSV(
                  filteredSales.map(sale => ({
                    'Número': sale.sale_number,
                    'Data': new Date(sale.sold_at).toLocaleDateString('pt-BR'),
                    'Valor Total': sale.final_amount,
                    'Desconto': sale.discount_amount,
                    'Valor Final': sale.final_amount,
                    'Pagamento': sale.payment_method,
                    'Tipo': sale.sale_type,
                    'Status': sale.status,
                  })),
                  'vendas'
                )}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
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
                  {filteredSales.slice(0, 10).map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.sale_number}</TableCell>
                      <TableCell>
                        {new Date(sale.sold_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{formatCurrency(sale.final_amount)}</TableCell>
                      <TableCell className="capitalize">
                        {sale.payment_method.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="capitalize">{sale.sale_type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4">
          {/* Gráfico de Fluxo de Caixa */}
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cashFlowChart}>
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <ChartTooltip
                      content={<ChartTooltipContent 
                        formatter={(value) => formatCurrency(value as number)}
                      />}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="receitas" 
                      stroke="var(--color-receitas)" 
                      strokeWidth={2}
                      name="Receitas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="despesas" 
                      stroke="var(--color-despesas)" 
                      strokeWidth={2}
                      name="Despesas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="saldo" 
                      stroke="var(--color-saldo)" 
                      strokeWidth={2}
                      name="Saldo"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Resumo Financeiro */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Total de Receitas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    filteredTransactions
                      .filter(t => t.transaction_type === 'receita' && t.status === 'pago')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Total de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(
                    filteredTransactions
                      .filter(t => t.transaction_type === 'despesa' && t.status === 'pago')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Saldo Líquido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  (filteredTransactions
                    .filter(t => t.transaction_type === 'receita' && t.status === 'pago')
                    .reduce((sum, t) => sum + t.amount, 0) -
                  filteredTransactions
                    .filter(t => t.transaction_type === 'despesa' && t.status === 'pago')
                    .reduce((sum, t) => sum + t.amount, 0)) >= 0 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(
                    filteredTransactions
                      .filter(t => t.transaction_type === 'receita' && t.status === 'pago')
                      .reduce((sum, t) => sum + t.amount, 0) -
                    filteredTransactions
                      .filter(t => t.transaction_type === 'despesa' && t.status === 'pago')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="produtos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Relatório de Produtos</CardTitle>
              <Button
                variant="outline"
                onClick={() => exportToCSV(
                  products.map(product => ({
                    'Nome': product.name,
                    'SKU': product.sku || '',
                    'Preço Custo': product.cost_price,
                    'Preço Venda': product.sale_price,
                    'Estoque': product.stock_quantity,
                    'Estoque Mínimo': product.min_stock,
                    'Status': product.is_active ? 'Ativo' : 'Inativo',
                  })),
                  'produtos'
                )}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Preço Venda</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Valor em Estoque</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.slice(0, 10).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.sku && (
                            <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(product.sale_price)}</TableCell>
                      <TableCell>
                        <span className={product.stock_quantity <= product.min_stock ? 'text-red-600 font-medium' : ''}>
                          {product.stock_quantity} {product.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(product.stock_quantity * product.cost_price)}
                      </TableCell>
                      <TableCell>
                        <span className={product.is_active ? 'text-green-600' : 'text-gray-500'}>
                          {product.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entregas" className="space-y-4">
          {/* Stats de Entregas */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total de Entregas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deliveryStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Entregues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{deliveryStats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Em Rota</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{deliveryStats.inRoute}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Aguardando</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{deliveryStats.pending}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Detalhes das Entregas</CardTitle>
              <Button
                variant="outline"
                onClick={() => exportToCSV(
                  filteredDeliveries.map(delivery => ({
                    'Cliente': delivery.customer_name,
                    'Endereço': delivery.delivery_address,
                    'Telefone': delivery.phone || '',
                    'Status': delivery.status,
                    'Data': new Date(delivery.created_at).toLocaleDateString('pt-BR'),
                    'Entregue em': delivery.delivered_at ? 
                      new Date(delivery.delivered_at).toLocaleDateString('pt-BR') : '',
                  })),
                  'entregas'
                )}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
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
                  {filteredDeliveries.slice(0, 10).map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{delivery.customer_name}</div>
                          {delivery.phone && (
                            <div className="text-sm text-muted-foreground">{delivery.phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {delivery.delivery_address}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          delivery.status === 'entregue' ? 'bg-green-100 text-green-800' :
                          delivery.status === 'em_rota' ? 'bg-blue-100 text-blue-800' :
                          delivery.status === 'aguardando' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {delivery.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(delivery.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
