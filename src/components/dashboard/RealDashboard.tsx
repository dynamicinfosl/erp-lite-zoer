import React, { useState, useEffect } from 'react';
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
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';

interface DashboardData {
  sales: any[];
  products: any[];
  customers: any[];
  totalSales: number;
  totalProducts: number;
  totalCustomers: number;
  monthlySales: any[];
  recentSales: any[];
}

export default function RealDashboard() {
  const { tenant } = useSimpleAuth();
  const [data, setData] = useState<DashboardData>({
    sales: [],
    products: [],
    customers: [],
    totalSales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    monthlySales: [],
    recentSales: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    const loadDashboardData = async (retryCount = 0) => {
      try {
        setLoading(true);
        
        // Aguardar tenant estar disponível (máximo 3 segundos)
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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

        try {
          // Carregar dados em paralelo com timeout e cache desabilitado
          const fetchOptions = {
            signal: controller.signal,
            cache: 'no-store' as RequestCache,
          };
          
          const tz = -new Date().getTimezoneOffset();
          
          // Sempre usar branch_scope=all para buscar todos os dados quando não há branch específica
          const salesUrl = `/next_api/sales?tenant_id=${encodeURIComponent(tenant.id)}&tz=${tz}&branch_scope=all`;
          const productsUrl = `/next_api/products?tenant_id=${encodeURIComponent(tenant.id)}&branch_scope=all`;
          const customersUrl = `/next_api/customers?tenant_id=${encodeURIComponent(tenant.id)}&branch_scope=all`;

          const [salesRes, productsRes, customersRes] = await Promise.allSettled([
            fetch(salesUrl, fetchOptions),
            fetch(productsUrl, fetchOptions),
            fetch(customersUrl, fetchOptions)
          ]);

          clearTimeout(timeoutId);
          
          if (cancelled) return;

          // Processar respostas de forma mais robusta
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
          
          // Garantir que todos os clientes sejam carregados (sem limite)
          console.log(`📊 Dashboard - Clientes carregados: ${customers.length}`);

          // Calcular totais
          const totalSales = sales.reduce((sum: number, sale: any) => sum + parseFloat(sale.final_amount || sale.total_amount || 0), 0);
          
          // Preparar dados mensais (últimos 6 meses)
          const monthlySales = generateMonthlyData(sales);
          
          // Vendas recentes (últimas 5) - Garantir estrutura correta
          const recentSales = sales.slice(0, 5).map((sale: any) => ({
            id: sale.id || `sale-${Math.random()}`,
            title: 'Venda realizada',
            description: `Pedido #${sale.sale_number || 'N/A'} - R$ ${parseFloat(sale.final_amount || sale.total_amount || 0).toFixed(2)}`,
            time: formatTimeAgo(sale.created_at || new Date().toISOString()),
            type: 'success' as const,
            user: sale.customer_name || 'Cliente Avulso',
          }));

          if (cancelled) return;

          setData({
            sales: Array.isArray(sales) ? sales : [],
            products: Array.isArray(products) ? products : [],
            customers: Array.isArray(customers) ? customers : [],
            totalSales,
            totalProducts: Array.isArray(products) ? products.length : 0,
            totalCustomers: Array.isArray(customers) ? customers.length : 0,
            monthlySales: Array.isArray(monthlySales) ? monthlySales : [],
            recentSales: Array.isArray(recentSales) ? recentSales : []
          });

          setLoading(false);
        } catch (fetchError: any) {
          if (cancelled) return;
          
          if (fetchError.name === 'AbortError') {
            if (retryCount < 2) {
              setTimeout(() => loadDashboardData(retryCount + 1), 1000);
              return;
            }
          }
          
          if (retryCount < 2 && !fetchError.message?.includes('404')) {
            setTimeout(() => loadDashboardData(retryCount + 1), 1000);
            return;
          }
          
          setData({
            sales: [],
            products: [],
            customers: [],
            totalSales: 0,
            totalProducts: 0,
            totalCustomers: 0,
            monthlySales: generateMonthlyData([]),
            recentSales: []
          });
          setLoading(false);
        }

      } catch (error) {
        if (cancelled) return;
        setData({
          sales: [],
          products: [],
          customers: [],
          totalSales: 0,
          totalProducts: 0,
          totalCustomers: 0,
          monthlySales: generateMonthlyData([]),
          recentSales: []
        });
        setLoading(false);
      }
    };

    loadDashboardData();
    
    return () => {
      cancelled = true;
    };
  }, [tenant?.id]);

  // Gerar dados mensais baseado nas vendas reais (semestre atual)
  const generateMonthlyData = (sales: any[]) => {
    if (!Array.isArray(sales)) return [];
    
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
    
    console.log(`📅 RealDashboard - ${isFirstHalf ? '1º' : '2º'} Semestre:`, monthsData.map(m => `${m.month}/${m.year}`));
    
    return monthsData.map(({ month, monthIndex, year }) => {
      const monthSales = sales.filter(sale => {
        if (!sale || !sale.created_at) return false;
        const saleDate = new Date(sale.created_at);
        if (isNaN(saleDate.getTime())) return false;
        
        // Comparar mês e ano
        return saleDate.getMonth() === monthIndex && saleDate.getFullYear() === year;
      });
      
      const total = monthSales.reduce((sum, sale) => {
        const amount = parseFloat(sale.final_amount || sale.total_amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      return {
        month,
        vendas: total,
        meta: total * 1.2 // Meta 20% maior que o realizado
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Carregando dados do dashboard...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <JugaKPICard
          title="Vendas Hoje"
          value={`R$ ${data.totalSales.toFixed(2)}`}
          trend="up"
          trendValue="+12.5%"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <JugaKPICard
          title="Total de Clientes"
          value={data.totalCustomers.toString()}
          trend="up"
          trendValue="+8.2%"
          icon={<Users className="h-5 w-5" />}
        />
        <JugaKPICard
          title="Produtos Ativos"
          value={data.totalProducts.toString()}
          trend="up"
          trendValue="+3.1%"
          icon={<Package className="h-5 w-5" />}
        />
        <JugaKPICard
          title="Vendas Realizadas"
          value={data.sales.length.toString()}
          trend="up"
          trendValue="+15.3%"
          icon={<ShoppingCart className="h-5 w-5" />}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Vendas Mensais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Vendas dos Últimos 6 Meses
            </CardTitle>
            <CardDescription>
              Comparativo entre vendas realizadas e metas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']} />
                <Bar dataKey="vendas" fill="#3b82f6" name="Vendas" />
                <Bar dataKey="meta" fill="#e5e7eb" name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Timeline de Atividades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>
              Últimas vendas e atividades do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JugaTimeline items={data.recentSales} />
          </CardContent>
        </Card>
      </div>

      {/* Cards de Ação Rápida */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nova Venda
            </CardTitle>
            <CardDescription>
              Iniciar uma nova venda no PDV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = '/pdv'}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Abrir PDV
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Clientes
            </CardTitle>
            <CardDescription>
              Visualizar e gerenciar clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/clientes'}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Ver Clientes
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatórios
            </CardTitle>
            <CardDescription>
              Acessar relatórios e análises
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/relatorios'}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Ver Relatórios
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
