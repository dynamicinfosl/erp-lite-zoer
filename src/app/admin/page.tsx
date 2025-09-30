

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { useAuth } from '@/contexts/AuthContext';
import { ENABLE_AUTH } from '@/constants/auth';
import { toast } from 'sonner';

// Import dos novos componentes
import { UserManagement } from '@/components/admin/UserManagement';
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

function checkIsAdmin(user: unknown): boolean {
  if (!user) return false;
  if (typeof user === 'object' && user !== null) {
    const userObj = user as { 
      user_metadata?: { role?: string }; 
      isAdmin?: boolean;
      email?: string;
    };
    
    // Verificar se o usuário é "julga" - acesso restrito apenas para este usuário
    const userEmail = userObj.email || userObj.user_metadata?.email;
    const isJulgaUser = userEmail === 'julga@julga.com' || userEmail === 'julga';
    
    // Se for o usuário julga, permitir acesso independente do role
    if (isJulgaUser) {
      return true;
    }
    
    // Para outros usuários, verificar se tem role 'admin' nos metadados ou se tem isAdmin
    const hasAdminRole = userObj.user_metadata?.role === 'admin' || Boolean(userObj.isAdmin);
    
    return hasAdminRole;
  }
  return false;
}

function AdminAccessDenied() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-md mx-auto">
        <Card className="shadow-xl border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-600 rounded-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-red-800 dark:text-red-200">
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta página é restrita a administradores do sistema.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Para acessar o painel administrativo, você precisa:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 text-left">
                <li>• Fazer login com uma conta de administrador</li>
                <li>• Ter o código de acesso administrativo</li>
                <li>• Possuir privilégios adequados no sistema</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => window.location.href = '/admin/login'}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Shield className="mr-2 h-4 w-4" />
                Login Admin
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1"
              >
                Ir para Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, signOut } = useAuth();
  const isAdmin = useMemo(() => {
    if (!ENABLE_AUTH) return true;
    return checkIsAdmin(user);
  }, [user]);

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      const mockStats: SystemStats = {
        totalUsers: 5,
        activeUsers: 3,
        totalSales: 150,
        totalProducts: 45,
        systemHealth: 'healthy',
        lastBackup: new Date().toISOString(),
        // Métricas específicas de bebidas
        totalBeverages: 1250,
        lowStockAlerts: 3,
        expiringProducts: 8,
        complianceRate: 95,
        temperatureAlerts: 0,
        totalInventoryValue: 125000
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas do sistema');
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
        await signOut();
        toast.success('Logout realizado com sucesso');
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

  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
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
  );
}

