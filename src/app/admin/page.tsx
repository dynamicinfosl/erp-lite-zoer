

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    const userObj = user as { user_metadata?: { role?: string }; isAdmin?: boolean };
    // Verifica se tem role 'admin' nos metadados ou se tem isAdmin
    return userObj.user_metadata?.role === 'admin' || Boolean(userObj.isAdmin);
  }
  return false;
}

export default function AdminPage() {
  const { user } = useAuth();
  const isAdmin = useMemo(() => {
    if (!ENABLE_AUTH) return true;
    return checkIsAdmin(user);
  }, [user]);

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Esta página é restrita a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">Controle total do sistema ERP Lite</p>
        </div>
        <Badge variant="default" className="bg-juga-primary">
          <CheckCircle className="h-3 w-3 mr-1" />
          Sistema Online
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Total de Usuários</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-heading">{stats?.totalUsers}</div>
              <p className="text-sm text-caption">{stats?.activeUsers} ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Vendas Totais</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-heading">{stats?.totalSales}</div>
              <p className="text-sm text-caption">Todas as vendas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Produtos</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Database className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-heading">{stats?.totalProducts}</div>
              <p className="text-sm text-caption">Cadastrados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Status do Sistema</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-juga-primary">Saudável</div>
              <p className="text-sm text-caption">Todos os serviços OK</p>
            </div>
          </CardContent>
        </Card>
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          <TabsTrigger value="inventory">Estoque</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-juga-text-secondary">Status dos Serviços</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded text-juga-primary bg-juga-primary/10">
                      <Server className="h-4 w-4" />
                    </div>
                    <span className="text-heading">Servidor Web</span>
                  </div>
                  <Badge variant="default" className="bg-juga-primary">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded text-juga-primary bg-juga-primary/10">
                      <Database className="h-4 w-4" />
                    </div>
                    <span className="text-heading">Banco de Dados</span>
                  </div>
                  <Badge variant="default" className="bg-juga-primary">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded text-juga-primary bg-juga-primary/10">
                      <Wifi className="h-4 w-4" />
                    </div>
                    <span className="text-heading">API</span>
                  </div>
                  <Badge variant="default" className="bg-juga-primary">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded text-juga-primary bg-juga-primary/10">
                      <HardDrive className="h-4 w-4" />
                    </div>
                    <span className="text-heading">Armazenamento</span>
                  </div>
                  <Badge variant="secondary">75% usado</Badge>
                </div>
              </CardContent>
            </Card>

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
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="monitoring">
          <SystemMonitoring />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="inventory">
          <BeverageInventory />
        </TabsContent>

        <TabsContent value="compliance">
          <BeverageCompliance />
        </TabsContent>

        <TabsContent value="logs">
          <AuditLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}

