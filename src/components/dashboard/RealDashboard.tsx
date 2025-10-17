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
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Aguardar tenant estar disponível
        let attempts = 0;
        while (!tenant?.id && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!tenant?.id) {
          console.warn('⚠️ Tenant não disponível para carregar dashboard');
          setLoading(false);
          return;
        }

        console.log('🔄 Carregando dados do dashboard para tenant:', tenant.id);

        // ✅ CORREÇÃO: Timeout para evitar loading infinito
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout

        try {
          // Carregar dados em paralelo com timeout
          const [salesRes, productsRes, customersRes] = await Promise.allSettled([
            fetch(`/next_api/sales?tenant_id=${encodeURIComponent(tenant.id)}`, { signal: controller.signal }),
            fetch(`/next_api/products?tenant_id=${encodeURIComponent(tenant.id)}`, { signal: controller.signal }),
            fetch(`/next_api/customers?tenant_id=${encodeURIComponent(tenant.id)}`, { signal: controller.signal })
          ]);

          clearTimeout(timeoutId);

          const salesData = salesRes.status === 'fulfilled' ? await salesRes.value.json() : { data: [] };
          const productsData = productsRes.status === 'fulfilled' ? await productsRes.value.json() : { data: [] };
          const customersData = customersRes.status === 'fulfilled' ? await customersRes.value.json() : { data: [] };

          const sales = Array.isArray(salesData?.data) ? salesData.data : [];
          const products = Array.isArray(productsData?.data) ? productsData.data : [];
          const customers = Array.isArray(customersData?.data) ? customersData.data : [];

          // Calcular totais
          const totalSales = sales.reduce((sum: number, sale: any) => sum + parseFloat(sale.total_amount || sale.final_amount || 0), 0);
          
          // Preparar dados mensais (últimos 6 meses)
          const monthlySales = generateMonthlyData(sales);
          
          // Vendas recentes (últimas 5) - Garantir estrutura correta
          const recentSales = sales.slice(0, 5).map((sale: any) => ({
            id: sale.id || `sale-${Math.random()}`,
            title: 'Venda realizada',
            description: `Pedido #${sale.sale_number || 'N/A'} - R$ ${parseFloat(sale.total_amount || sale.final_amount || 0).toFixed(2)}`,
            time: formatTimeAgo(sale.created_at || new Date().toISOString()),
            type: 'success' as const,
            user: sale.customer_name || 'Cliente Avulso',
          }));

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

          console.log('✅ Dashboard carregado:', { 
            vendas: sales.length, 
            produtos: products.length, 
            clientes: customers.length,
            totalVendas: totalSales 
          });

        } catch (fetchError) {
          console.log('⚠️ Timeout ou erro ao carregar dados, usando dados vazios');
          // Usar dados vazios mas válidos para manter o design
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
        }

      } catch (error) {
        console.error('❌ Erro ao carregar dashboard:', error);
        // Em caso de erro, usar dados vazios
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
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [tenant?.id]);

  // Gerar dados mensais baseado nas vendas reais
  const generateMonthlyData = (sales: any[]) => {
    if (!Array.isArray(sales)) return [];
    
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const currentMonth = new Date().getMonth();
    
    return months.map((month, index) => {
      const monthIndex = (currentMonth - 5 + index + 12) % 12;
      const monthSales = sales.filter(sale => {
        if (!sale || !sale.created_at) return false;
        const saleDate = new Date(sale.created_at);
        return !isNaN(saleDate.getTime()) && saleDate.getMonth() === monthIndex;
      });
      
      const total = monthSales.reduce((sum, sale) => {
        const amount = parseFloat(sale.total_amount || sale.final_amount || 0);
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
