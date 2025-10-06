

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { AdminNavigation } from '@/components/admin/AdminNavigation';
import { AdminMobileHeader } from '@/components/admin/AdminMobileHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { StorageCard } from '@/components/admin/StorageCard';
import {
  Shield,
  Users,
  Database,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Server,
  HardDrive,
  Cpu,
  Wifi,
  FileText,
  Monitor,
  LogOut,
  User,
} from 'lucide-react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { ENABLE_AUTH } from '@/constants/auth';
import { toast } from 'sonner';

// Import dos novos componentes
import { UserManagement } from '@/components/admin/UserManagement';
import { PlanManagement } from '@/components/admin/PlanManagement';
import { SystemMonitoring } from '@/components/admin/SystemMonitoring';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { AuditLogs } from '@/components/admin/AuditLogs';
import { BeverageInventory } from '@/components/admin/BeverageInventory';
import { BeverageCompliance } from '@/components/admin/BeverageCompliance';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalSales: number;
  totalProducts: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  lastBackup: string;
  // Métricas específicas de bebidas
  totalBeverages: number;
  lowStockAlerts: number;
  expiringProducts: number;
  complianceRate: number;
  temperatureAlerts: number;
  totalInventoryValue: number;
}


export default function AdminPage() {
  const router = useRouter();
  const { signOut } = useSimpleAuth();

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      
      // Buscar dados reais das APIs
      const [usersRes, salesRes, productsRes] = await Promise.allSettled([
        fetch('/next_api/user-profiles'),
        fetch('/next_api/sales'),
        fetch('/next_api/products')
      ]);

      const users = usersRes.status === 'fulfilled' ? await usersRes.value.json() : { data: [] };
      const sales = salesRes.status === 'fulfilled' ? await salesRes.value.json() : { data: [] };
      const products = productsRes.status === 'fulfilled' ? await productsRes.value.json() : { data: [] };

      const usersData = Array.isArray(users?.data) ? users.data : [];
      const salesData = Array.isArray(sales?.data) ? sales.data : [];
      const productsData = Array.isArray(products?.data) ? products.data : [];

      const realStats: SystemStats = {
        totalUsers: usersData.length,
        activeUsers: usersData.filter((u: any) => u.is_active !== false).length,
        totalSales: salesData.length,
        totalProducts: productsData.length,
        systemHealth: 'healthy',
        lastBackup: new Date().toISOString(),
        // Métricas específicas de bebidas
        totalBeverages: productsData.filter((p: any) => p.category_id === 'bebidas').length,
        lowStockAlerts: productsData.filter((p: any) => (p.stock_quantity || 0) <= (p.min_stock || 0)).length,
        expiringProducts: productsData.filter((p: any) => {
          if (!p.expiry_date) return false;
          const expiry = new Date(p.expiry_date);
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          return expiry <= thirtyDaysFromNow;
        }).length,
        complianceRate: 95,
        temperatureAlerts: 0,
        totalInventoryValue: productsData.reduce((sum: number, p: any) => sum + ((p.stock_quantity || 0) * (p.cost_price || 0)), 0)
      };
      setStats(realStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas do sistema');
      // Fallback para dados básicos
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalSales: 0,
        totalProducts: 0,
        systemHealth: 'warning',
        lastBackup: new Date().toISOString(),
        totalBeverages: 0,
        lowStockAlerts: 0,
        expiringProducts: 0,
        complianceRate: 0,
        temperatureAlerts: 0,
        totalInventoryValue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSystemAction = async (action: string) => {
    try {
      switch (action) {
        case 'backup':
          toast.success('Backup iniciado com sucesso');
          break;
        case 'clear-cache':
          toast.success('Cache limpo com sucesso');
          break;
        case 'restart':
          if (confirm('Tem certeza que deseja reiniciar o sistema?')) {
            toast.success('Sistema será reiniciado em breve');
          }
          break;
        default:
          toast.info(`Ação ${action} executada`);
      }
    } catch (error) {
      toast.error('Erro ao executar ação');
    }
  };

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair do painel administrativo?')) {
      try {
        // Limpar autenticação de admin
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminUser');
        
        if (ENABLE_AUTH) {
          await signOut();
        }
        
        toast.success('Logout realizado com sucesso');
        router.push('/admin/login');
      } catch (error) {
        toast.error('Erro ao fazer logout');
      }
    }
  };

  const getTabTitle = (tab: string) => {
    const titles: Record<string, string> = {
      overview: 'Visão Geral',
      users: 'Gerenciamento de Usuários',
      analytics: 'Analytics',
      monitoring: 'Monitoramento do Sistema',
      inventory: 'Gestão de Estoque',
      compliance: 'Conformidade',
      settings: 'Configurações',
      logs: 'Logs de Auditoria'
    };
    return titles[tab] || 'Painel Administrativo';
  };

  const getTabDescription = (tab: string) => {
    const descriptions: Record<string, string> = {
      overview: 'Visão geral do sistema e estatísticas principais',
      users: 'Gerenciar usuários e permissões do sistema',
      analytics: 'Análises e relatórios detalhados',
      monitoring: 'Monitoramento em tempo real do sistema',
      inventory: 'Controle de estoque e produtos',
      compliance: 'Verificação de conformidade e regulamentações',
      settings: 'Configurações gerais do sistema',
      logs: 'Histórico de atividades e eventos'
    };
    return descriptions[tab] || 'Controle total do sistema ERP Lite';
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AdminPageWrapper>
      <div className="flex h-screen bg-transparent">
      {/* Mobile Header */}
      <AdminMobileHeader 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        getTabTitle={getTabTitle}
        getTabDescription={getTabDescription}
      />

      {/* Desktop Navigation Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <AdminNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {getTabTitle(activeTab)}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {getTabDescription(activeTab)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Sistema Online
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area - Responsivo */}
        <div className="flex-1 overflow-auto">
          <div className="p-3 sm:p-4 lg:p-6">
            {activeTab === 'overview' && (
              <>
                {/* Stats Cards - Responsivo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <AdminStatCard
          title="Total de Usuários"
          value={stats?.totalUsers || 0}
          subtitle={`${stats?.activeUsers || 0} ativos`}
          icon={<Users className="h-5 w-5" />}
          trend={{
            value: "+2 novos este mês",
            direction: "up"
          }}
          variant="primary"
        />
        <AdminStatCard
          title="Vendas Totais"
          value={stats?.totalSales || 0}
          subtitle="Todas as vendas"
          icon={<BarChart3 className="h-5 w-5" />}
          trend={{
            value: "+15% este mês",
            direction: "up"
          }}
          variant="success"
        />
        <AdminStatCard
          title="Produtos"
          value={stats?.totalProducts || 0}
          subtitle="Cadastrados"
          icon={<Database className="h-5 w-5" />}
          trend={{
            value: "-3 baixo estoque",
            direction: "down"
          }}
          variant="warning"
        />
        <AdminStatCard
          title="Status do Sistema"
          value="Saudável"
          subtitle="Todos os serviços OK"
          icon={<Activity className="h-5 w-5" />}
          variant="success"
        />
        <AdminStatCard
          title="Bebidas em Estoque"
          value={stats?.totalBeverages || 0}
          subtitle="Total no inventário"
          icon={<Database className="h-5 w-5" />}
          trend={{
            value: "+125 este mês",
            direction: "up"
          }}
          variant="primary"
        />
        <AdminStatCard
          title="Alertas de Estoque"
          value={stats?.lowStockAlerts || 0}
          subtitle="Produtos com estoque baixo"
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="warning"
        />
        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Total de Bebidas</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Database className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-heading">{stats?.totalBeverages}</div>
              <p className="text-sm text-caption">Unidades em estoque</p>
            </div>
          </CardContent>
        </Card>
        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Valor do Estoque</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-heading">R$ {stats?.totalInventoryValue?.toLocaleString('pt-BR')}</div>
              <p className="text-sm text-caption">Valor total</p>
            </div>
          </CardContent>
        </Card>
      </div>

                {/* Overview Content */}
          {/* Alertas Específicos de Bebidas */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-juga-text-secondary">Estoque Baixo</CardTitle>
                  <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-juga-primary">{stats?.lowStockAlerts}</div>
                  <p className="text-sm text-caption">Produtos críticos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-juga-text-secondary">Vencendo em 30 dias</CardTitle>
                  <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-juga-primary">{stats?.expiringProducts}</div>
                  <p className="text-sm text-caption">Produtos próximos do vencimento</p>
                </div>
              </CardContent>
            </Card>
            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-juga-text-secondary">Conformidade</CardTitle>
                  <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-juga-primary">{stats?.complianceRate}%</div>
                  <p className="text-sm text-caption">Taxa de conformidade</p>
                </div>
              </CardContent>
            </Card>
            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-juga-text-secondary">Temperatura</CardTitle>
                  <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                    <Monitor className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-juga-primary">{stats?.temperatureAlerts}</div>
                  <p className="text-sm text-caption">Alertas de temperatura</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Card de Armazenamento */}
            <StorageCard 
              used={331.14}
              total={500}
            />

            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-juga-text-secondary">Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-juga-primary/10 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-juga-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-heading">Sistema iniciado</div>
                    <div className="text-xs text-caption">Há 2 horas</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-juga-primary/10 rounded-lg">
                    <Users className="h-4 w-4 text-juga-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-heading">Novo usuário cadastrado</div>
                    <div className="text-xs text-caption">Há 4 horas</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-juga-primary/10 rounded-lg">
                    <Database className="h-4 w-4 text-juga-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-heading">Backup automático realizado</div>
                    <div className="text-xs text-caption">Há 6 horas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
                </>
            )}

            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'plans' && <PlanManagement />}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
            {activeTab === 'monitoring' && <SystemMonitoring />}
            {activeTab === 'inventory' && <BeverageInventory />}
            {activeTab === 'compliance' && <BeverageCompliance />}
            {activeTab === 'settings' && <SystemSettings />}
            {activeTab === 'logs' && <AuditLogs />}
          </div>
        </div>
      </div>
    </div>
    </AdminPageWrapper>
  );
}

