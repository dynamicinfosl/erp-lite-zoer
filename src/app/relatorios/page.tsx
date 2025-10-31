'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
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
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell, LabelList, CartesianGrid, Tooltip } from 'recharts';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
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
  const [report, setReport] = useState<any | null>(null);
  const [activeFilter, setActiveFilter] = useState<'30days' | 'thismonth' | 'sales' | 'products'>('30days');
  const [activeExport, setActiveExport] = useState<'all' | 'financial' | 'sales' | 'logistics'>('all');
  
  // Log do estado inicial
  console.log('🎯 Estado inicial - activeFilter:', activeFilter);
  console.log('🎯 Estado inicial - activeExport:', activeExport);
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    };
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (!tenant?.id) {
        setSales([]);
        setProducts([]);
        setTransactions([]);
        setDeliveries([]);
        return;
      }

      const tz = -new Date().getTimezoneOffset();
      const [salesRes, productsRes, transactionsRes, deliveriesRes, reportRes] = await Promise.allSettled([
        fetch(`/next_api/sales?tenant_id=${encodeURIComponent(tenant.id)}&tz=${tz}`),
        fetch(`/next_api/products?tenant_id=${encodeURIComponent(tenant.id)}`),
        fetch(`/next_api/financial-transactions?tenant_id=${encodeURIComponent(tenant.id)}`),
        fetch(`/next_api/deliveries?tenant_id=${encodeURIComponent(tenant.id)}`),
        fetch(`/next_api/reports/sales?tenant_id=${encodeURIComponent(tenant.id)}&start=${dateRange.start}&end=${dateRange.end}`),
      ]);

      const salesData = salesRes.status === 'fulfilled' ? await salesRes.value.json() : { data: [] };
      const productsData = productsRes.status === 'fulfilled' ? await productsRes.value.json() : { data: [] };
      const transactionsData = transactionsRes.status === 'fulfilled' ? await transactionsRes.value.json() : { data: [] };
      const deliveriesData = deliveriesRes.status === 'fulfilled' ? await deliveriesRes.value.json() : { data: [] };
      const reportData = reportRes.status === 'fulfilled' ? await reportRes.value.json() : null;

      setSales(Array.isArray(salesData?.data) ? salesData.data : (salesData?.rows || []));
      setProducts(Array.isArray(productsData?.data) ? productsData.data : (productsData?.rows || []));
      setTransactions(Array.isArray(transactionsData?.data) ? transactionsData.data : (transactionsData?.rows || []));
      setDeliveries(Array.isArray(deliveriesData?.data) ? deliveriesData.data : (deliveriesData?.rows || []));
      setReport(reportData);
      
      // Debug dos valores do report
      if (reportData) {
        console.log('💰 Valores do relatório:', {
          totalRevenue: reportData.totalRevenue,
          totalCost: reportData.totalCost,
          totalProfit: reportData.totalProfit,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, dateRange]);

  useEffect(() => {
    console.log('🔄 useEffect disparado - tenant:', tenant?.id, 'dateRange:', dateRange);
    if (!tenant?.id) {
      setLoading(false);
      return;
    }
    console.log('📊 Carregando dados...');
    loadData();
  }, [tenant?.id, dateRange, loadData]);

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value),
    [],
  );

  const exportReportCSV = useCallback(() => {
    try {
      const rows: string[] = [];
      rows.push(['Data','Receita','Custo','Lucro'].join(','));
      const items = report?.items || [];
      for (const it of items) {
        const date = new Date(it.date).toLocaleDateString('pt-BR');
        rows.push([
          date,
          (it.revenue ?? 0).toFixed(2).replace('.', ','),
          (it.cost ?? 0).toFixed(2).replace('.', ','),
          (it.profit ?? 0).toFixed(2).replace('.', ',')
        ].join(','));
      }
      rows.push('');
      rows.push(['Totais',
        (report?.totalRevenue ?? 0).toFixed(2).replace('.', ','),
        (report?.totalCost ?? 0).toFixed(2).replace('.', ','),
        (report?.totalProfit ?? 0).toFixed(2).replace('.', ','),
      ].join(','));

      const csv = rows.join('\n');
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-custo-lucro-${dateRange.start}_a_${dateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Falha ao exportar CSV', e);
    }
  }, [report, dateRange]);

  const handleFilterChange = useCallback((filter: '30days' | 'thismonth' | 'sales' | 'products') => {
    console.log('🔄 Filtro clicado:', filter);
    console.log('🔄 Estado atual activeFilter:', activeFilter);
    setActiveFilter(filter);
    console.log('🔄 Novo estado será:', filter);
    
    const now = new Date();
    let newDateRange = { ...dateRange };
    
    switch (filter) {
      case '30days':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        newDateRange = {
          start: thirtyDaysAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        };
        console.log('📅 Últimos 30 dias:', newDateRange);
        break;
      case 'thismonth':
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        newDateRange = {
          start: firstDay.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        };
        console.log('📅 Este mês:', newDateRange);
        break;
      case 'sales':
      case 'products':
        console.log('📊 Filtro de categoria:', filter);
        // Para filtros de categoria, mantém o período atual
        break;
    }
    
    console.log('✅ Atualizando dateRange para:', newDateRange);
    setDateRange(newDateRange);
  }, [dateRange, activeFilter]);


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

  const exportAllData = useCallback(() => {
    try {
      const rows: string[] = [];
      rows.push(['Tipo','Data','Descrição','Valor','Status'].join(','));
      
      // Vendas
      filteredSales.forEach(sale => {
        const date = new Date(sale.sold_at || sale.created_at || '').toLocaleDateString('pt-BR');
        rows.push([
          'Venda',
          date,
          `Venda #${sale.id}`,
          (sale.total_amount || 0).toFixed(2).replace('.', ','),
          sale.status || 'Concluída'
        ].join(','));
      });
      
      // Transações
      filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.created_at || '').toLocaleDateString('pt-BR');
        rows.push([
          'Transação',
          date,
          transaction.description || 'Transação financeira',
          (transaction.amount || 0).toFixed(2).replace('.', ','),
          transaction.status || 'Processada'
        ].join(','));
      });
      
      // Entregas
      filteredDeliveries.forEach(delivery => {
        const date = new Date(delivery.created_at || '').toLocaleDateString('pt-BR');
        rows.push([
          'Entrega',
          date,
          `Entrega #${delivery.id}`,
          (delivery.delivery_cost || 0).toFixed(2).replace('.', ','),
          delivery.status || 'Pendente'
        ].join(','));
      });

      const csv = rows.join('\n');
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-completo-${dateRange.start}_a_${dateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Falha ao exportar dados completos', e);
    }
  }, [filteredSales, filteredTransactions, filteredDeliveries, dateRange]);

  const exportFinancialReport = useCallback(() => {
    try {
      const rows: string[] = [];
      rows.push(['Data','Tipo','Descrição','Valor','Status'].join(','));
      
      filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.created_at || '').toLocaleDateString('pt-BR');
        rows.push([
          date,
          transaction.type || 'Transação',
          transaction.description || 'Transação financeira',
          (transaction.amount || 0).toFixed(2).replace('.', ','),
          transaction.status || 'Processada'
        ].join(','));
      });

      const csv = rows.join('\n');
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-financeiro-${dateRange.start}_a_${dateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Falha ao exportar relatório financeiro', e);
    }
  }, [filteredTransactions, dateRange]);

  const exportSalesReport = useCallback(() => {
    try {
      const rows: string[] = [];
      rows.push(['Data','ID Venda','Cliente','Produtos','Valor Total','Status'].join(','));
      
      filteredSales.forEach(sale => {
        const date = new Date(sale.sold_at || sale.created_at || '').toLocaleDateString('pt-BR');
        rows.push([
          date,
          sale.id || '',
          sale.customer_name || 'Cliente não informado',
          sale.items?.length || 0,
          (sale.total_amount || 0).toFixed(2).replace('.', ','),
          sale.status || 'Concluída'
        ].join(','));
      });

      const csv = rows.join('\n');
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-vendas-${dateRange.start}_a_${dateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Falha ao exportar relatório de vendas', e);
    }
  }, [filteredSales, dateRange]);

  const exportLogisticsReport = useCallback(() => {
    try {
      const rows: string[] = [];
      rows.push(['Data','ID Entrega','Cliente','Endereço','Status','Custo'].join(','));
      
      filteredDeliveries.forEach(delivery => {
        const date = new Date(delivery.created_at || '').toLocaleDateString('pt-BR');
        rows.push([
          date,
          delivery.id || '',
          delivery.customer_name || 'Cliente não informado',
          delivery.delivery_address || 'Endereço não informado',
          delivery.status || 'Pendente',
          (delivery.delivery_cost || 0).toFixed(2).replace('.', ',')
        ].join(','));
      });

      const csv = rows.join('\n');
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-logistica-${dateRange.start}_a_${dateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Falha ao exportar relatório de logística', e);
    }
  }, [filteredDeliveries, dateRange]);

  const handleExportChange = useCallback((exportType: 'all' | 'financial' | 'sales' | 'logistics') => {
    console.log('📤 Exportação clicada:', exportType);
    setActiveExport(exportType);
    
    switch (exportType) {
      case 'all':
        console.log('📊 Exportando todos os dados...');
        exportAllData();
        break;
      case 'financial':
        console.log('💰 Exportando relatório financeiro...');
        exportFinancialReport();
        break;
      case 'sales':
        console.log('🛒 Exportando vendas detalhadas...');
        exportSalesReport();
        break;
      case 'logistics':
        console.log('🚚 Exportando dados de logística...');
        exportLogisticsReport();
        break;
    }
  }, [exportAllData, exportFinancialReport, exportSalesReport, exportLogisticsReport]);

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

  // Gráfico estático solicitado: meses Jan–Jun com valores zerados
  const monthlyStaticChart = useMemo(() => (
    [
      { month: 'Jan', vendas: 0 },
      { month: 'Fev', vendas: 0 },
      { month: 'Mar', vendas: 0 },
      { month: 'Abr', vendas: 0 },
      { month: 'Mai', vendas: 0 },
      { month: 'Jun', vendas: 0 },
    ]
  ), []);

  // Agregação real: total de vendas por mês (últimos 6 meses)
  const monthlySalesChart = useMemo(() => {
    const now = new Date();
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const months: { key: string; label: string; year: number; monthIdx: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = monthNames[d.getMonth()];
      months.push({ key, label, year: d.getFullYear(), monthIdx: d.getMonth() });
    }

    const totalsByKey: Record<string, number> = {};
    for (const sale of filteredSales) {
      const dateStr = (sale.sold_at || sale.created_at || '').split('T')[0];
      if (!dateStr) continue;
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!totalsByKey[key]) totalsByKey[key] = 0;
      const amount = sale.final_amount || sale.total_amount || sale.total || 0;
      totalsByKey[key] += amount;
    }

    return months.map(m => ({ month: m.label, total: totalsByKey[m.key] || 0 }));
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

  const cashFlowTotals = useMemo(() => {
    const receitas = filteredTransactions
      .filter((t) => (t.transaction_type || 'receita') === 'receita' && (t.status || 'pago') === 'pago')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const despesas = filteredTransactions
      .filter((t) => (t.transaction_type || 'receita') === 'despesa' && (t.status || 'pago') === 'pago')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return { receitas, despesas, saldo: receitas - despesas };
  }, [filteredTransactions]);

  const summaryCards = useMemo(
    () => [
      {
        title: 'Faturamento no período',
        value: formatCurrency(report?.totalRevenue ?? salesStats.totalAmount),
        description: `${salesStats.totalSales} vendas concluídas`,
        trend: 'up' as const,
        trendValue: '+8,2%',
        icon: <DollarSign className="h-5 w-5" />,
        color: 'primary' as const,
      },
      {
        title: 'Lucro no período',
        value: formatCurrency(report?.totalProfit ?? 0),
        description: `Margem ${report ? report.profitMargin + '%' : '-'}`,
        trend: 'neutral' as const,
        trendValue: '—',
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'accent' as const,
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
    [filteredDeliveries, formatCurrency, salesStats, products, report],
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
              <div className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2">
                {/* Card com gráfico de barras por mês (últimos 6 meses) - Layout igual ao dashboard */}
                <Card className="juga-card w-full border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30 hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg pb-3 pt-4 px-4">
                    <CardTitle className="flex items-center gap-2 text-white text-base font-semibold">
                      Vendas dos Últimos 6 Meses
                    </CardTitle>
                    <p className="text-blue-100 text-sm mt-1">
                      Comparativo de vendas mensais
                    </p>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <ResponsiveContainer width="100%" height={180} className="sm:h-[200px]">
                      <BarChart data={monthlySalesChart} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#475569"
                          fontSize={12}
                          fontWeight={500}
                          tick={{ fontSize: 12, fill: '#475569' }}
                          axisLine={{ stroke: '#475569' }}
                          tickLine={{ stroke: '#475569' }}
                        />
                        <YAxis 
                          stroke="#475569"
                          fontSize={12}
                          fontWeight={500}
                          tick={{ fontSize: 12, fill: '#475569' }}
                          axisLine={{ stroke: '#475569' }}
                          tickLine={{ stroke: '#475569' }}
                          tickFormatter={(value) => `R$ ${value.toLocaleString()}`}
                        />
                        <Tooltip 
                          cursor={{ fill: '#6b7280', fillOpacity: 0.45 }}
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #3b82f6',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.2)',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}
                          labelStyle={{ color: '#1e293b', fontWeight: '600' }}
                          formatter={(value: number) => [`Vendas : ${formatCurrency(value || 0)}`, '']}
                        />
                        <Bar 
                          dataKey="total" 
                          fill="#3b82f6"
                          radius={[6, 6, 0, 0]}
                        >
                          {monthlySalesChart.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.total > 0 ? '#3b82f6' : '#9ca3af'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="juga-card w-full">
                  <CardHeader className="pb-1 pt-3 px-3 sm:px-4">
                    <CardTitle className="text-xs sm:text-sm text-heading">Custo x Receita x Lucro</CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-3 pb-3">
                    {/* Resumo de métricas */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="flex flex-col items-center gap-1 py-2 px-2 rounded-md bg-juga-surface-elevated/30 border border-juga-border/30">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#10b981' }} />
                          <span className="text-[10px] sm:text-[11px] text-juga-text-muted font-medium">Receita</span>
                        </div>
                        <span className="text-sm sm:text-base font-semibold text-juga-text-primary">
                          {formatCurrency((report?.totalRevenue ?? 0) as number)}
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1 py-2 px-2 rounded-md bg-juga-surface-elevated/30 border border-juga-border/30">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
                          <span className="text-[10px] sm:text-[11px] text-juga-text-muted font-medium">Custo</span>
                        </div>
                        <span className="text-sm sm:text-base font-semibold text-juga-text-primary">
                          {formatCurrency((report?.totalCost ?? 0) as number)}
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1 py-2 px-2 rounded-md bg-juga-surface-elevated/30 border border-juga-border/30">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#3b82f6' }} />
                          <span className="text-[10px] sm:text-[11px] text-juga-text-muted font-medium">Lucro</span>
                        </div>
                        <span className="text-sm sm:text-base font-semibold text-juga-text-primary">
                          {formatCurrency((report?.totalProfit ?? 0) as number)}
                        </span>
                      </div>
                    </div>

                    {/* Gráfico */}
                    <ChartContainer
                      config={{
                        receita: { label: 'Receita', color: '#10b981' },
                        custo: { label: 'Custo', color: '#ef4444' },
                        lucro: { label: 'Lucro', color: '#3b82f6' },
                      }}
                      className="h-[140px] sm:h-[160px] min-w-0 [&_.recharts-surface]:fill-transparent [&_svg]:bg-transparent"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[{
                            date: 'Período',
                            receita: report?.totalRevenue ?? 0,
                            custo: report?.totalCost ?? 0,
                            lucro: report?.totalProfit ?? 0,
                          }]}
                          margin={{ left: 0, right: 5, top: 3, bottom: 3 }}
                          barCategoryGap="20%"
                        >
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: 'var(--juga-text-muted)', fontSize: 10 }}
                            stroke="var(--juga-border)"
                            height={25}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            tickFormatter={(value) => {
                              if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
                              return formatCurrency(value);
                            }}
                            tick={{ fill: 'var(--juga-text-muted)', fontSize: 10 }}
                            stroke="var(--juga-border)"
                            width={45}
                            axisLine={false}
                            tickLine={false}
                          />
                          <ChartTooltip 
                            content={
                              <ChartTooltipContent 
                                formatter={(value) => 
                                  formatCurrency(value as number)
                                }
                              />
                            } 
                          />
                          <Bar dataKey="receita" fill="var(--color-receita)" radius={[4, 4, 0, 0]} name="Receita" isAnimationActive={true}>
                            <LabelList 
                              dataKey="receita" 
                              position="top" 
                              formatter={(value: number) => formatCurrency(value)}
                              fill="var(--juga-text-primary)"
                              fontSize={10}
                              offset={5}
                            />
                          </Bar>
                          <Bar dataKey="custo" fill="var(--color-custo)" radius={[4, 4, 0, 0]} name="Custo" isAnimationActive={true}>
                            <LabelList 
                              dataKey="custo" 
                              position="top" 
                              formatter={(value: number) => formatCurrency(value)}
                              fill="var(--juga-text-primary)"
                              fontSize={10}
                              offset={5}
                            />
                          </Bar>
                          <Bar dataKey="lucro" fill="var(--color-lucro)" radius={[4, 4, 0, 0]} name="Lucro" isAnimationActive={true}>
                            <LabelList 
                              dataKey="lucro" 
                              position="top" 
                              formatter={(value: number) => formatCurrency(value)}
                              fill="var(--juga-text-primary)"
                              fontSize={10}
                              offset={5}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    {/* Estado vazio */}
                    {((report?.totalRevenue ?? 0) === 0 && (report?.totalCost ?? 0) === 0 && (report?.totalProfit ?? 0) === 0) && (
                      <div className="text-center text-juga-text-muted text-xs mt-2">Sem dados no período</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="juga-card mt-4 sm:mt-6">
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-heading">Detalhamento de vendas</CardTitle>
                    <p className="text-sm text-muted-foreground">Principais vendas no período filtrado</p>
                  </div>
                  <Button variant="outline" className="gap-2" onClick={exportReportCSV} disabled={!report?.items?.length}>
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[360px]">
                    <div className="overflow-x-auto">
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
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financeiro">
              <Card className="juga-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg sm:text-xl text-heading">Fluxo de caixa consolidado</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Totais resumidos */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div className="rounded-md bg-juga-surface-elevated/30 py-2">
                      <div className="text-[11px] text-juga-text-muted">Receitas</div>
                      <div className="text-sm font-semibold text-green-500">{formatCurrency(cashFlowTotals.receitas)}</div>
                    </div>
                    <div className="rounded-md bg-juga-surface-elevated/30 py-2">
                      <div className="text-[11px] text-juga-text-muted">Despesas</div>
                      <div className="text-sm font-semibold text-red-500">{formatCurrency(cashFlowTotals.despesas)}</div>
                    </div>
                    <div className="rounded-md bg-juga-surface-elevated/30 py-2">
                      <div className="text-[11px] text-juga-text-muted">Saldo</div>
                      <div className={`text-sm font-semibold ${cashFlowTotals.saldo >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(cashFlowTotals.saldo)}</div>
                    </div>
                  </div>
                  <ChartContainer
                    config={{
                      receitas: { label: 'Receitas', color: 'hsl(var(--chart-1))' },
                      despesas: { label: 'Despesas', color: 'hsl(var(--chart-2))' },
                      saldo: { label: 'Saldo', color: 'hsl(var(--chart-3))' },
                    }}
                    className="h-[260px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cashFlowChart} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                        <XAxis dataKey="date" stroke="var(--juga-text-muted)" fontSize={12} />
                        <YAxis stroke="var(--juga-text-muted)" fontSize={12} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                        {cashFlowChart.length > 0 && (
                          <ChartTooltip content={<ChartTooltipContent />} />
                        )}
                        <Line type="monotone" dataKey="receitas" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                        <Line type="monotone" dataKey="despesas" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                        <Line type="monotone" dataKey="saldo" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  {cashFlowChart.length === 0 && (
                    <div className="text-center text-xs text-juga-text-muted mt-2">Sem movimentações financeiras no período</div>
                  )}
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
                    <div className="overflow-x-auto">
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
                    </div>
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
                    <div className="overflow-x-auto">
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
                    </div>
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
              <Button 
                className="w-full justify-start text-sm"
                variant={activeFilter === '30days' ? 'default' : 'outline'}
                onClick={() => {
                  console.log('🖱️ Botão 30 dias clicado!');
                  handleFilterChange('30days');
                }}
                style={{
                  backgroundColor: activeFilter === '30days' ? '#1e40af' : 'transparent',
                  color: activeFilter === '30days' ? 'white' : 'inherit'
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Últimos 30 dias</span>
                <span className="sm:hidden">30 dias</span>
              </Button>
              <Button 
                className="w-full justify-start text-sm"
                variant={activeFilter === 'thismonth' ? 'default' : 'outline'}
                onClick={() => {
                  console.log('🖱️ Botão este mês clicado!');
                  handleFilterChange('thismonth');
                }}
                style={{
                  backgroundColor: activeFilter === 'thismonth' ? '#1e40af' : 'transparent',
                  color: activeFilter === 'thismonth' ? 'white' : 'inherit'
                }}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Este mês</span>
                <span className="sm:hidden">Mês</span>
              </Button>
              <Button 
                className="w-full justify-start text-sm"
                variant={activeFilter === 'sales' ? 'default' : 'outline'}
                onClick={() => {
                  console.log('🖱️ Botão vendas clicado!');
                  handleFilterChange('sales');
                }}
                style={{
                  backgroundColor: activeFilter === 'sales' ? '#1e40af' : 'transparent',
                  color: activeFilter === 'sales' ? 'white' : 'inherit'
                }}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Vendas</span>
                <span className="sm:hidden">Vendas</span>
              </Button>
              <Button 
                className="w-full justify-start text-sm"
                variant={activeFilter === 'products' ? 'default' : 'outline'}
                onClick={() => {
                  console.log('🖱️ Botão produtos clicado!');
                  handleFilterChange('products');
                }}
                style={{
                  backgroundColor: activeFilter === 'products' ? '#1e40af' : 'transparent',
                  color: activeFilter === 'products' ? 'white' : 'inherit'
                }}
              >
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
              <Button 
                className="w-full justify-start text-sm"
                variant={activeExport === 'all' ? 'default' : 'outline'}
                onClick={() => {
                  console.log('🖱️ Botão exportar todos clicado!');
                  handleExportChange('all');
                }}
                style={{
                  backgroundColor: activeExport === 'all' ? '#1e40af' : 'transparent',
                  color: activeExport === 'all' ? 'white' : 'inherit'
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Exportar Todos</span>
                <span className="sm:hidden">Todos</span>
              </Button>
              <Button 
                className="w-full justify-start text-sm"
                variant={activeExport === 'financial' ? 'default' : 'outline'}
                onClick={() => {
                  console.log('🖱️ Botão relatório financeiro clicado!');
                  handleExportChange('financial');
                }}
                style={{
                  backgroundColor: activeExport === 'financial' ? '#1e40af' : 'transparent',
                  color: activeExport === 'financial' ? 'white' : 'inherit'
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Relatório Financeiro</span>
                <span className="sm:hidden">Financeiro</span>
              </Button>
              <Button 
                className="w-full justify-start text-sm"
                variant={activeExport === 'sales' ? 'default' : 'outline'}
                onClick={() => {
                  console.log('🖱️ Botão vendas detalhadas clicado!');
                  handleExportChange('sales');
                }}
                style={{
                  backgroundColor: activeExport === 'sales' ? '#1e40af' : 'transparent',
                  color: activeExport === 'sales' ? 'white' : 'inherit'
                }}
              >
                <LineIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Vendas Detalhadas</span>
                <span className="sm:hidden">Vendas</span>
              </Button>
              <Button 
                className="w-full justify-start text-sm"
                variant={activeExport === 'logistics' ? 'default' : 'outline'}
                onClick={() => {
                  console.log('🖱️ Botão logística clicado!');
                  handleExportChange('logistics');
                }}
                style={{
                  backgroundColor: activeExport === 'logistics' ? '#1e40af' : 'transparent',
                  color: activeExport === 'logistics' ? 'white' : 'inherit'
                }}
              >
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