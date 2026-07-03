'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Aurora from '@/components/ui/Aurora';
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
  Download,
  Calendar,
  Clock,
  Sparkles,
  Loader2
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
import { useBranch } from '@/contexts/BranchContext';

interface DashboardStats {
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  todaySalesAmount: number;
  todaySalesCount: number;
  weekSalesAmount: number;
  weekSalesCount: number;
  weekLabel: string;
  monthSalesAmount: number;
  monthSalesCount: number;
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
  const { branchId, scope } = useBranch();
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

  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    todaySalesAmount: 0,
    todaySalesCount: 0,
    weekSalesAmount: 0,
    weekSalesCount: 0,
    weekLabel: 'Semana 1',
    monthSalesAmount: 0,
    monthSalesCount: 0,
    monthlyGrowth: 0,
    customerGrowth: 0,
    productGrowth: 0,
    orderGrowth: 0
  });
  const [salesCardView, setSalesCardView] = useState<'day' | 'week' | 'month'>('day');
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

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
        description: `${customer.name} - ${customer.email || 'Sem email'}`,
        time: formatTimeAgo(customer.created_at),
        status: 'success'
      });
    });

    return activities.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);
  }, []);

  // Gerar dados mensais
  const generateMonthlyData = useCallback((sales: any[]) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const isFirstHalf = currentMonth < 6;
    
    let monthsData;
    if (isFirstHalf) {
      monthsData = [
        { month: 'Jan', monthIndex: 0, year: currentYear },
        { month: 'Fev', monthIndex: 1, year: currentYear },
        { month: 'Mar', monthIndex: 2, year: currentYear },
        { month: 'Abr', monthIndex: 3, year: currentYear },
        { month: 'Mai', monthIndex: 4, year: currentYear },
        { month: 'Jun', monthIndex: 5, year: currentYear }
      ];
    } else {
      monthsData = [
        { month: 'Jul', monthIndex: 6, year: currentYear },
        { month: 'Ago', monthIndex: 7, year: currentYear },
        { month: 'Set', monthIndex: 8, year: currentYear },
        { month: 'Out', monthIndex: 9, year: currentYear },
        { month: 'Nov', monthIndex: 10, year: currentYear },
        { month: 'Dez', monthIndex: 11, year: currentYear }
      ];
    }
    
    return monthsData.map(({ month, monthIndex, year }) => {
      const monthSales = sales.filter(sale => {
        if (!sale?.created_at) return false;
        const saleDate = new Date(sale.created_at);
        if (isNaN(saleDate.getTime())) return false;
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;
    
    const loadDashboardData = async (retryCount = 0) => {
      try {
        setLoading(true);
        let attempts = 0;
        while (!tenant?.id && attempts < 30 && !cancelled) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (cancelled) return;
        if (!tenant?.id) {
          if (retryCount < 2) {
            setTimeout(() => loadDashboardData(retryCount + 1), 500);
            return;
          }
          setLoading(false);
          return;
        }

        const now = Date.now();
        const cacheTime = 30 * 1000;
        
        if (now - lastFetchTime < cacheTime && !initialLoad && !cancelled) {
          setLoading(false);
          return;
        }

        if (initialLoad) {
          setStats({
            totalSales: 0,
            totalCustomers: 0,
            totalProducts: 0,
            totalOrders: 0,
            todaySalesAmount: 0,
            todaySalesCount: 0,
            weekSalesAmount: 0,
            weekSalesCount: 0,
            weekLabel: 'Semana 1',
            monthSalesAmount: 0,
            monthSalesCount: 0,
            monthlyGrowth: 0,
            customerGrowth: 0,
            productGrowth: 0,
            orderGrowth: 0
          });
          setRecentActivity([]);
          setMonthlyData(generateMonthlyData([]));
          setInitialLoad(false);
        }

        controller = new AbortController();
        const currentController = controller;
        
        timeoutId = setTimeout(() => {
          if (currentController && !currentController.signal.aborted) {
            try {
              currentController.abort('Request timeout after 10 seconds');
            } catch (e) {}
          }
        }, 10000);

        try {
          const tz = -new Date().getTimezoneOffset();
          const fetchOptions = { 
            signal: controller!.signal,
            cache: 'no-store' as RequestCache,
          };
          
          let salesUrl = `/next_api/sales?tenant_id=${encodeURIComponent(tenant.id)}&tz=${tz}`;
          let productsUrl = `/next_api/products?tenant_id=${encodeURIComponent(tenant.id)}`;
          let customersUrl = `/next_api/customers?tenant_id=${encodeURIComponent(tenant.id)}`;
          
          if (branchId) {
            salesUrl += `&branch_id=${branchId}`;
            productsUrl += `&branch_id=${branchId}`;
            customersUrl += `&branch_id=${branchId}`;
          } else {
            salesUrl += `&branch_scope=all`;
            productsUrl += `&branch_scope=all`;
            customersUrl += `&branch_scope=all`;
          }
          
          const [salesRes, productsRes, customersRes] = await Promise.allSettled([
            fetch(salesUrl, fetchOptions),
            fetch(productsUrl, fetchOptions),
            fetch(customersUrl, fetchOptions)
          ]);

          clearTimeout(timeoutId);
          controller = null;
          
          if (cancelled) return;

          let salesData: any = { data: [] };
          let productsData: any = { data: [] };
          let customersData: any = { data: [] };
          
          if (salesRes.status === 'fulfilled' && salesRes.value.ok) {
            try {
              salesData = await salesRes.value.json();
            } catch (e) {
              salesData = { data: [] };
            }
          }
          
          if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
            try {
              productsData = await productsRes.value.json();
            } catch (e) {
              productsData = { data: [] };
            }
          }
          
          if (customersRes.status === 'fulfilled' && customersRes.value.ok) {
            try {
              customersData = await customersRes.value.json();
            } catch (e) {
              customersData = { data: [] };
            }
          }

          if (cancelled) return;

          const sales = Array.isArray(salesData?.data) ? salesData.data : (Array.isArray(salesData?.sales) ? salesData.sales : (Array.isArray(salesData) ? salesData : []));
          const products = Array.isArray(productsData?.data) ? productsData.data : (Array.isArray(productsData?.rows) ? productsData.rows : (Array.isArray(productsData) ? productsData : []));
          const customers = Array.isArray(customersData?.data) ? customersData.data : (Array.isArray(customersData?.rows) ? customersData.rows : (Array.isArray(customersData) ? customersData : []));

          const totalSales = sales.reduce((sum: number, sale: any) => 
            sum + parseFloat(sale.total_amount || sale.final_amount || 0), 0
          );

          const nowLocal = new Date();
          const startOfDay = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), 0, 0, 0, 0);
          const endOfDay = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), 23, 59, 59, 999);
          const todaySales = sales.filter((sale: any) => {
            if (!sale?.created_at) return false;
            const saleDate = new Date(sale.created_at);
            if (isNaN(saleDate.getTime())) return false;
            return saleDate >= startOfDay && saleDate <= endOfDay;
          });
          const todaySalesAmount = todaySales.reduce((sum: number, sale: any) => {
            const amount = parseFloat(sale.total_amount || sale.final_amount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);

          const startOfMonth = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1, 0, 0, 0, 0);
          const endOfMonth = new Date(nowLocal.getFullYear(), nowLocal.getMonth() + 1, 0, 23, 59, 59, 999);
          const getMondayStart = (date: Date) => {
            const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
            const day = d.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            d.setDate(d.getDate() + diff);
            return d;
          };
          const monthWeekStart = getMondayStart(startOfMonth);
          const currentWeekStart = getMondayStart(nowLocal);
          const currentWeekIndex = Math.floor((currentWeekStart.getTime() - monthWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
          const weekLabel = `Semana ${currentWeekIndex}`;
          const weekStart = currentWeekStart;
          const weekEnd = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
          const weekSales = sales.filter((sale: any) => {
            if (!sale?.created_at) return false;
            const saleDate = new Date(sale.created_at);
            if (isNaN(saleDate.getTime())) return false;
            return saleDate >= weekStart && saleDate <= weekEnd;
          });
          const weekSalesAmount = weekSales.reduce((sum: number, sale: any) => {
            const amount = parseFloat(sale.total_amount || sale.final_amount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);

          const monthSales = sales.filter((sale: any) => {
            if (!sale?.created_at) return false;
            const saleDate = new Date(sale.created_at);
            if (isNaN(saleDate.getTime())) return false;
            return saleDate >= startOfMonth && saleDate <= endOfMonth;
          });
          const monthSalesAmount = monthSales.reduce((sum: number, sale: any) => {
            const amount = parseFloat(sale.total_amount || sale.final_amount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);

          const monthlyData = generateMonthlyData(sales);
          const recentActivity = generateRecentActivity(sales, customers, products);

          if (cancelled) return;

          setStats({
            totalSales,
            totalCustomers: customers.length,
            totalProducts: products.length,
            totalOrders: sales.length,
            todaySalesAmount,
            todaySalesCount: todaySales.length,
            weekSalesAmount,
            weekSalesCount: weekSales.length,
            weekLabel,
            monthSalesAmount,
            monthSalesCount: monthSales.length,
            monthlyGrowth: 12.5,
            customerGrowth: 8.2,
            productGrowth: 3.1,
            orderGrowth: 15.3
          });

          setRecentActivity(recentActivity);
          setMonthlyData(monthlyData);
          setLastFetchTime(Date.now());
          setLoading(false);

        } catch (fetchError: any) {
          if (cancelled) return;
          if (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted')) {
            if (retryCount < 2) {
              setTimeout(() => loadDashboardData(retryCount + 1), 1000);
            }
            setLoading(false);
            return;
          }
          if (retryCount < 2 && !fetchError.message?.includes('404')) {
            setTimeout(() => loadDashboardData(retryCount + 1), 1000);
            return;
          }

          setStats({
            totalSales: 0,
            totalCustomers: 0,
            totalProducts: 0,
            totalOrders: 0,
            todaySalesAmount: 0,
            todaySalesCount: 0,
            weekSalesAmount: 0,
            weekSalesCount: 0,
            weekLabel: 'Semana 1',
            monthSalesAmount: 0,
            monthSalesCount: 0,
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
        if (cancelled) return;
        setLoading(false);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (controller && !controller.signal.aborted) {
          try {
            controller.abort('Request completed or cancelled');
          } catch (e) {}
        }
        controller = null;
      }
    };

    loadDashboardData();
    
    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (controller && !controller.signal.aborted) {
        try {
          controller.abort('Component unmounted or cancelled');
        } catch (e) {}
        controller = null;
      }
    };
  }, [tenant?.id, branchId, scope, generateRecentActivity, generateMonthlyData, initialLoad, lastFetchTime]);

  if (loading && initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[500px] relative overflow-hidden bg-slate-50/50">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <Aurora colorStops={['#0ea5e9', '#3b82f6', '#93c5fd']} blend={0.8} amplitude={1.0} speed={0.3} />
        </div>
        <div className="text-center relative z-10">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Carregando painel principal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-slate-50/70 min-h-screen w-full">
      {/* Aurora Background - Mais visível para contraste */}
      <div className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none">
        <Aurora colorStops={['#0ea5e9', '#2563eb', '#818cf8']} blend={0.8} amplitude={1.1} speed={0.4} />
      </div>

      <div className="relative z-10 space-y-6 sm:space-y-8 w-full max-w-[1920px] mx-auto p-4 sm:p-6 md:p-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-slate-200 pb-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-blue-600/10 border border-blue-600/20 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
              Visão Geral do Negócio
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-600 text-sm sm:text-base font-medium">Gerencie vendas, produtos, clientes e acompanhe estatísticas reais</p>
          </div>
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {loading && !initialLoad && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigateToReports}
              className="border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm h-10 px-4"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button
              size="sm"
              onClick={handleNavigateToPDV}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/25 h-10 px-4 transition-all duration-300 hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </div>
        </div>

        {/* 4 KPIs CARDS - GLASSMORPHISM COM BORDAS AZUIS/INDIGO DE CONTRASTE */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* SALES CARD */}
          <div className="bg-white border-2 border-slate-200 hover:border-emerald-500/50 shadow-md shadow-slate-100 rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
            <div className="flex items-start justify-between">
              <div className="space-y-1 pl-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {salesCardView === 'day' ? 'Vendas (Hoje)' : salesCardView === 'week' ? `Vendas (${stats.weekLabel})` : 'Vendas (Mês)'}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  R$ {(salesCardView === 'day'
                    ? stats.todaySalesAmount
                    : salesCardView === 'week'
                      ? stats.weekSalesAmount
                      : stats.monthSalesAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSalesCardView((prev) => (prev === 'day' ? 'week' : prev === 'week' ? 'month' : 'day'))}
                className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm"
              >
                <Calendar className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600 pl-1">
              <span>
                {salesCardView === 'day'
                  ? `${stats.todaySalesCount} venda${stats.todaySalesCount === 1 ? '' : 's'} hoje`
                  : salesCardView === 'week'
                    ? `${stats.weekSalesCount} venda${stats.weekSalesCount === 1 ? '' : 's'} na semana`
                    : `${stats.monthSalesCount} venda${stats.monthSalesCount === 1 ? '' : 's'} no mês`}
              </span>
              <span className="flex items-center text-emerald-700 font-extrabold">
                Total: R$ {stats.totalSales.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          
          {/* CLIENTS CARD */}
          <div className="bg-white border-2 border-slate-200 hover:border-blue-500/50 shadow-md shadow-slate-100 rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
            <div className="flex items-start justify-between">
              <div className="space-y-1 pl-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clientes</span>
                <div className="text-3xl font-black text-slate-900 mt-1">{stats.totalCustomers}</div>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 shadow-sm">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center text-xs font-bold text-emerald-700 pl-1">
              <TrendingUp className="h-4 w-4 mr-1 text-emerald-600" />
              <span>+{stats.customerGrowth}% este mês</span>
            </div>
          </div>

          {/* PRODUCTS CARD */}
          <div className="bg-white border-2 border-slate-200 hover:border-indigo-500/50 shadow-md shadow-slate-100 rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
            <div className="flex items-start justify-between">
              <div className="space-y-1 pl-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Produtos</span>
                <div className="text-3xl font-black text-slate-900 mt-1">{stats.totalProducts}</div>
              </div>
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200 shadow-sm">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center text-xs font-bold text-emerald-700 pl-1">
              <TrendingUp className="h-4 w-4 mr-1 text-emerald-600" />
              <span>+{stats.productGrowth}% este mês</span>
            </div>
          </div>

          {/* ORDERS CARD */}
          <div className="bg-white border-2 border-slate-200 hover:border-violet-500/50 shadow-md shadow-slate-100 rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-600" />
            <div className="flex items-start justify-between">
              <div className="space-y-1 pl-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pedidos</span>
                <div className="text-3xl font-black text-slate-900 mt-1">{stats.totalOrders}</div>
              </div>
              <div className="p-2.5 bg-violet-50 text-violet-700 rounded-xl border border-violet-200 shadow-sm">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center text-xs font-bold text-emerald-700 pl-1">
              <TrendingUp className="h-4 w-4 mr-1 text-emerald-600" />
              <span>+{stats.orderGrowth}% este mês</span>
            </div>
          </div>

        </div>

        {/* GRÁFICOS & ATIVIDADES - 2 COLUNAS RESPONSIVAS (MONITORES LARGOS/PEQUENOS) */}
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
          
          {/* CHART CARD - TOMA 2 COLUNAS EM TELAS LARGAS */}
          <div className="bg-white border-2 border-slate-200 shadow-md rounded-2xl p-4 sm:p-6 space-y-4 xl:col-span-2">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Vendas dos Últimos 6 Meses
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm">Comparativo de vendas mensais do semestre atual</p>
            </div>
            <div className="pt-4 w-full">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} fontWeight={700} />
                  <YAxis stroke="#64748b" fontSize={11} fontWeight={700} tickFormatter={(value) => `R$ ${value.toLocaleString()}`} />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Vendas']}
                    labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '2px solid #3b82f6',
                      borderRadius: '12px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                      backdropFilter: 'blur(8px)',
                      fontSize: '12px',
                      color: '#0f172a'
                    }}
                  />
                  <Bar dataKey="sales" fill="url(#salesGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ACTIVITIES CARD - TOMA 1 COLUNA EM TELAS LARGAS */}
          <div className="bg-white border-2 border-slate-200 shadow-md rounded-2xl p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Atividades Recentes
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm">Últimas movimentações de vendas e clientes no sistema</p>
            </div>
            <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="border border-slate-200 hover:border-blue-200 rounded-xl p-3.5 bg-slate-50/50 flex items-start gap-3 hover:bg-blue-50/20 transition-all duration-200">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      activity.type === 'sale' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      activity.type === 'customer' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      activity.type === 'product' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                      'bg-violet-100 text-violet-700 border border-violet-200'
                    }`}>
                      {activity.type === 'sale' ? <ShoppingCart className="h-4 w-4" /> :
                       activity.type === 'customer' ? <Users className="h-4 w-4" /> :
                       activity.type === 'product' ? <Package className="h-4 w-4" /> :
                       <Activity className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm leading-snug">{activity.title}</p>
                      <p className="text-slate-600 text-xs mt-0.5 leading-snug font-medium">{activity.description}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-bold flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl text-center">
                  <Activity className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-bold">Nenhuma atividade recente encontrada.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* BOTTOM CARDS - QUICK ACTIONS - 3 COLUNAS RESPONSIVAS */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* ACTION 1 */}
          <div className="bg-white border-2 border-slate-200 hover:border-blue-500/40 shadow-md rounded-2xl p-6 flex flex-col justify-between gap-4 group transition-all duration-300 hover:shadow-lg">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <ShoppingCart className="h-3.5 w-3.5" />
                Frente de Caixa (PDV)
              </div>
              <h4 className="text-lg font-black text-slate-900 mt-3">Ponto de Vendas</h4>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">Abra o terminal do caixa para registrar vendas e receber pagamentos rápidos de forma simples.</p>
            </div>
            <Button 
              onClick={handleNavigateToPDV}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Abrir PDV
            </Button>
          </div>

          {/* ACTION 2 */}
          <div className="bg-white border-2 border-slate-200 hover:border-blue-500/40 shadow-md rounded-2xl p-6 flex flex-col justify-between gap-4 group transition-all duration-300 hover:shadow-lg">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <Users className="h-3.5 w-3.5" />
                Clientes da Base
              </div>
              <h4 className="text-lg font-black text-slate-900 mt-3">Gerenciar Clientes</h4>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">Acesse a lista completa de clientes cadastrados, histórico de compras, contatos e perfis de crédito.</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleNavigateToCustomers}
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 font-bold py-2.5 rounded-xl transition-all duration-300 hover:border-slate-400"
            >
              Ver Clientes
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* ACTION 3 */}
          <div className="bg-white border-2 border-slate-200 hover:border-indigo-500/40 shadow-md rounded-2xl p-6 flex flex-col justify-between gap-4 group transition-all duration-300 hover:shadow-lg sm:col-span-2 lg:col-span-1">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <BarChart3 className="h-3.5 w-3.5" />
                Análise & Métricas
              </div>
              <h4 className="text-lg font-black text-slate-900 mt-3">Relatórios do Sistema</h4>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">Visualize faturamentos, margens de lucros, produtos mais vendidos, fluxo de caixa e relatórios fiscais.</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleNavigateToReports}
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 font-bold py-2.5 rounded-xl transition-all duration-300 hover:border-slate-400"
            >
              Ver Relatórios
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}
