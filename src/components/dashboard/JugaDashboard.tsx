'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  Activity,
  BarChart3,
  Plus,
  ArrowRight,
  FileText,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';

interface DashboardStats {
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  monthlyGrowth: number;
  customerGrowth: number;
  productGrowth: number;
  orderGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'customer' | 'product' | 'order';
  title: string;
  description: string;
  time: string;
  amount?: number;
  status: 'success' | 'pending' | 'error' | 'warning';
}

interface MonthlyData {
  month: string;
  sales: number;
  customers: number;
  products: number;
  orders: number;
}


export default function JugaDashboard() {
  const { tenant } = useSimpleAuth();
  const router = useRouter();

  // Funções de navegação
  const handleNavigateToPDV = () => {
    router.push('/pdv');
  };

  const handleNavigateToCustomers = () => {
    router.push('/clientes');
  };

  const handleNavigateToReports = () => {
    router.push('/relatorios');
  };

  const handleNavigateToProducts = () => {
    router.push('/produtos');
  };

  const handleNavigateToSales = () => {
    router.push('/vendas');
  };

  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    monthlyGrowth: 0,
    customerGrowth: 0,
    productGrowth: 0,
    orderGrowth: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Cores para gráficos
  const COLORS = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    purple: '#8b5cf6',
    pink: '#ec4899',
    indigo: '#6366f1',
    teal: '#14b8a6',
    orange: '#f97316',
    red: '#ef4444',
    green: '#22c55e',
    blue: '#3b82f6',
    yellow: '#eab308',
    gray: '#6b7280',
    slate: '#64748b',
    zinc: '#71717a',
    neutral: '#737373',
    stone: '#78716c',
    amber: '#f59e0b',
    lime: '#84cc16',
    emerald: '#10b981',
    cyan: '#06b6d4',
    sky: '#0ea5e9',
    violet: '#8b5cf6',
    fuchsia: '#d946ef',
    rose: '#f43f5e'
  };

  // Gerar atividades recentes
  const generateRecentActivity = useCallback((sales: any[], customers: any[], products: any[]) => {
    const activities: RecentActivity[] = [];
    
    // Adicionar vendas recentes
    sales.slice(0, 3).forEach(sale => {
      activities.push({
        id: `sale-${sale.id}`,
        type: 'sale',
        title: 'Nova venda realizada',
        description: `Pedido #${sale.sale_number || 'N/A'} - R$ ${parseFloat(sale.total_amount || 0).toFixed(2)}`,
        time: formatTimeAgo(sale.created_at),
        amount: parseFloat(sale.total_amount || 0),
        status: 'success'
      });
    });

    // Adicionar clientes recentes
    customers.slice(0, 2).forEach(customer => {
      activities.push({
        id: `customer-${customer.id}`,
        type: 'customer',
        title: 'Novo cliente cadastrado',
        description: `${customer.name} - ${customer.email}`,
        time: formatTimeAgo(customer.created_at),
        status: 'success'
      });
    });

    return activities.slice(0, 5);
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        if (!tenant?.id) {
          console.warn('⚠️ Tenant não disponível');
          setLoading(false);
          return;
        }

        console.log('🔄 Carregando dashboard para tenant:', tenant.id);

        // Cache de 30 segundos para evitar requisições desnecessárias
        const now = Date.now();
        const cacheTime = 30 * 1000; // 30 segundos
        
        if (now - lastFetchTime < cacheTime && !initialLoad) {
          console.log('📦 Usando cache, dados ainda válidos');
          setLoading(false);
          return;
        }

        // Mostrar dados de exemplo primeiro para melhor UX
        if (initialLoad) {
          setStats({
            totalSales: 0,
            totalCustomers: 0,
            totalProducts: 0,
            totalOrders: 0,
            monthlyGrowth: 0,
            customerGrowth: 0,
            productGrowth: 0,
            orderGrowth: 0
          });
          setRecentActivity([]);
          setMonthlyData(generateMonthlyData([]));
          setInitialLoad(false);
        }

        // Timeout de 5 segundos para evitar loading infinito
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⏰ Timeout atingido, usando dados de exemplo');
          controller.abort();
        }, 5000);

        try {
          // Carregar dados em paralelo com cache
          const tz = -new Date().getTimezoneOffset();
          const fetchOptions = { 
            signal: controller.signal,
            headers: {
              'Cache-Control': 'max-age=60', // Cache por 1 minuto
            }
          };
          
          const [salesRes, productsRes, customersRes] = await Promise.allSettled([
            fetch(`/next_api/sales?tenant_id=${encodeURIComponent(tenant.id)}&tz=${tz}`, fetchOptions),
            fetch(`/next_api/products?tenant_id=${encodeURIComponent(tenant.id)}`, fetchOptions),
            fetch(`/next_api/customers?tenant_id=${encodeURIComponent(tenant.id)}`, fetchOptions)
          ]);

          clearTimeout(timeoutId);

          const salesData = salesRes.status === 'fulfilled' ? await salesRes.value.json() : { data: [] };
          const productsData = productsRes.status === 'fulfilled' ? await productsRes.value.json() : { data: [] };
          const customersData = customersRes.status === 'fulfilled' ? await customersRes.value.json() : { data: [] };

          const sales = Array.isArray(salesData?.data) ? salesData.data : [];
          const products = Array.isArray(productsData?.data) ? productsData.data : [];
          const customers = Array.isArray(customersData?.data) ? customersData.data : [];

          // Calcular estatísticas
          const totalSales = sales.reduce((sum: number, sale: any) => 
            sum + parseFloat(sale.total_amount || sale.final_amount || 0), 0
          );

          // Gerar dados mensais
          const monthlyData = generateMonthlyData(sales);
          
          // Gerar atividades recentes
          const recentActivity = generateRecentActivity(sales, customers, products);
          

          setStats({
            totalSales,
            totalCustomers: customers.length,
            totalProducts: products.length,
            totalOrders: sales.length,
            monthlyGrowth: 12.5,
            customerGrowth: 8.2,
            productGrowth: 3.1,
            orderGrowth: 15.3
          });

          setRecentActivity(recentActivity);
          setMonthlyData(monthlyData);

          console.log('✅ Dashboard carregado com sucesso');
          setLastFetchTime(Date.now());
          setLoading(false);

        } catch (fetchError) {
          console.log('⚠️ Erro ao carregar dados, usando dados de exemplo');
          // Usar dados de exemplo para manter o design
          setStats({
            totalSales: 0,
            totalCustomers: 0,
            totalProducts: 0,
            totalOrders: 0,
            monthlyGrowth: 0,
            customerGrowth: 0,
            productGrowth: 0,
            orderGrowth: 0
          });
          setRecentActivity([]);
          setMonthlyData(generateMonthlyData([]));
          setLoading(false);
        }

      } catch (error) {
        console.error('❌ Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [tenant?.id, generateRecentActivity, initialLoad, lastFetchTime]);

  // Gerar dados mensais (semestre atual)
  const generateMonthlyData = (sales: any[]) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    // Determinar se estamos no 1º semestre (Jan-Jun) ou 2º semestre (Jul-Dez)
    const isFirstHalf = currentMonth < 6; // Jan (0) a Jun (5)
    
    let monthsData;
    if (isFirstHalf) {
      // 1º semestre: Janeiro a Junho
      monthsData = [
        { month: 'Jan', monthIndex: 0, year: currentYear },
        { month: 'Fev', monthIndex: 1, year: currentYear },
        { month: 'Mar', monthIndex: 2, year: currentYear },
        { month: 'Abr', monthIndex: 3, year: currentYear },
        { month: 'Mai', monthIndex: 4, year: currentYear },
        { month: 'Jun', monthIndex: 5, year: currentYear }
      ];
    } else {
      // 2º semestre: Julho a Dezembro
      monthsData = [
        { month: 'Jul', monthIndex: 6, year: currentYear },
        { month: 'Ago', monthIndex: 7, year: currentYear },
        { month: 'Set', monthIndex: 8, year: currentYear },
        { month: 'Out', monthIndex: 9, year: currentYear },
        { month: 'Nov', monthIndex: 10, year: currentYear },
        { month: 'Dez', monthIndex: 11, year: currentYear }
      ];
    }
    
    console.log(`📅 JugaDashboard - ${isFirstHalf ? '1º' : '2º'} Semestre:`, monthsData.map(m => `${m.month}/${m.year}`));
    
    return monthsData.map(({ month, monthIndex, year }) => {
      const monthSales = sales.filter(sale => {
        if (!sale?.created_at) return false;
        const saleDate = new Date(sale.created_at);
        if (isNaN(saleDate.getTime())) return false;
        
        // Comparar mês e ano
        return saleDate.getMonth() === monthIndex && saleDate.getFullYear() === year;
      });
      
      const total = monthSales.reduce((sum, sale) => {
        const amount = parseFloat(sale.total_amount || sale.final_amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      return {
        month,
        sales: total,
        customers: Math.floor(Math.random() * 20) + 5,
        products: Math.floor(Math.random() * 10) + 2,
        orders: monthSales.length
      };
    });
  };



  // Formatar tempo relativo
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Data não disponível';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
  };

  // Loading otimizado - só mostra na primeira carga
  if (loading && initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Carregando dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-lg">
        {loading && !initialLoad && (
          <div className="absolute top-4 right-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-white">
            Dashboard
          </h1>
          <p className="text-blue-100 mt-1 font-medium">
            Visão geral do seu negócio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
            onClick={handleNavigateToReports}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            size="sm" 
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
            onClick={handleNavigateToPDV}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-100">
                Vendas Totais
              </CardTitle>
              <div className="p-2 bg-blue-500/20 rounded-lg backdrop-blur-sm">
                <DollarSign className="h-5 w-5 text-blue-100" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              R$ {stats.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-300 mr-1" />
              <span className="text-sm text-green-200">
                +{stats.monthlyGrowth}% este mês
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-100">
                Clientes
              </CardTitle>
              <div className="p-2 bg-slate-500/20 rounded-lg backdrop-blur-sm">
                <Users className="h-5 w-5 text-slate-100" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalCustomers}
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-300 mr-1" />
              <span className="text-sm text-green-200">
                +{stats.customerGrowth}% este mês
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-indigo-100">
                Produtos
              </CardTitle>
              <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-sm">
                <Package className="h-5 w-5 text-indigo-100" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalProducts}
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-300 mr-1" />
              <span className="text-sm text-green-200">
                +{stats.productGrowth}% este mês
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-cyan-100">
                Pedidos
              </CardTitle>
              <div className="p-2 bg-cyan-500/20 rounded-lg backdrop-blur-sm">
                <ShoppingCart className="h-5 w-5 text-cyan-100" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalOrders}
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-300 mr-1" />
              <span className="text-sm text-green-200">
                +{stats.orderGrowth}% este mês
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vendas Mensais */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white dark:from-slate-800 to-blue-50/30 dark:to-slate-900/50 hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5" />
              Vendas dos Últimos 6 Meses
            </CardTitle>
            <CardDescription className="text-blue-100">
              Comparativo de vendas mensais
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis 
                  dataKey="month" 
                  stroke="#475569"
                  className="dark:stroke-slate-400"
                  fontSize={12}
                  fontWeight={500}
                />
                <YAxis 
                  stroke="#475569"
                  className="dark:stroke-slate-400"
                  fontSize={12}
                  fontWeight={500}
                  tickFormatter={(value) => `R$ ${value.toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Vendas']}
                  labelStyle={{ color: '#1e293b', fontWeight: '600' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid #3b82f6',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.2)',
                    fontWeight: '500',
                    color: 'hsl(var(--foreground))'
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar 
                  dataKey="sales" 
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white dark:from-slate-800 to-slate-50/30 dark:to-slate-900/50 hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5" />
              Atividades Recentes
            </CardTitle>
            <CardDescription className="text-slate-100">
              Últimas atividades do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-slate-50 dark:from-slate-700/50 to-slate-100 dark:to-slate-800/50 hover:from-slate-100 dark:hover:from-slate-700 hover:to-slate-200 dark:hover:to-slate-800 transition-all duration-200 border border-slate-200 dark:border-slate-700">
                    <div className={`p-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500 text-white' :
                      activity.status === 'warning' ? 'bg-yellow-500 text-white' :
                      activity.status === 'error' ? 'bg-red-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {activity.type === 'sale' ? <ShoppingCart className="h-4 w-4" /> :
                       activity.type === 'customer' ? <Users className="h-4 w-4" /> :
                       activity.type === 'product' ? <Package className="h-4 w-4" /> :
                       <Activity className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                        {activity.title}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                        {activity.description}
                      </p>
                      <p className="text-slate-500 dark:text-slate-500 text-xs mt-1 font-medium">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <p className="font-medium">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Ação Rápida */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card 
          className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-white dark:from-slate-800 to-blue-50/30 dark:to-slate-900/50 hover:from-blue-50 dark:hover:from-slate-700 hover:to-blue-100 dark:hover:to-slate-800"
          onClick={handleNavigateToPDV}
        >
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-white">
              <Plus className="h-5 w-5" />
              Nova Venda
            </CardTitle>
            <CardDescription className="text-blue-100">
              Iniciar uma nova venda no PDV
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              onClick={handleNavigateToPDV}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Abrir PDV
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-white dark:from-slate-800 to-slate-50/30 dark:to-slate-900/50 hover:from-slate-50 dark:hover:from-slate-700 hover:to-slate-100 dark:hover:to-slate-800"
          onClick={handleNavigateToCustomers}
        >
          <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />
              Gerenciar Clientes
            </CardTitle>
            <CardDescription className="text-slate-100">
              Visualizar e gerenciar clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Button 
              variant="outline" 
              className="w-full border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold py-3 rounded-lg transition-all duration-200"
              onClick={handleNavigateToCustomers}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Ver Clientes
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-white dark:from-slate-800 to-indigo-50/30 dark:to-slate-900/50 hover:from-indigo-50 dark:hover:from-slate-700 hover:to-indigo-100 dark:hover:to-slate-800"
          onClick={handleNavigateToReports}
        >
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5" />
              Relatórios
            </CardTitle>
            <CardDescription className="text-indigo-100">
              Acessar relatórios e análises
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Button 
              variant="outline" 
              className="w-full border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-200 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-800 dark:hover:text-indigo-100 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-semibold py-3 rounded-lg transition-all duration-200"
              onClick={handleNavigateToReports}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Ver Relatórios
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
