

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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ENABLE_AUTH } from '@/constants/auth';
import { toast } from 'sonner';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalSales: number;
  totalProducts: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  lastBackup: string;
}

function checkIsAdmin(user: unknown): boolean {
  if (!user) return false;
  if (typeof user === 'object' && user !== null) {
    return Boolean((user as { isAdmin?: boolean }).isAdmin);
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
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Sistema Online
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeUsers} ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSales}</div>
            <p className="text-xs text-muted-foreground">Todas as vendas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Saudável</div>
            <p className="text-xs text-muted-foreground">Todos os serviços OK</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status dos Serviços</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    <span>Servidor Web</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span>Banco de Dados</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    <span>API</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span>Armazenamento</span>
                  </div>
                  <Badge variant="secondary">75% usado</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Sistema iniciado</div>
                    <div className="text-xs text-muted-foreground">Há 2 horas</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Novo usuário cadastrado</div>
                    <div className="text-xs text-muted-foreground">Há 4 horas</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Database className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Backup automático realizado</div>
                    <div className="text-xs text-muted-foreground">Há 6 horas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">CPU:</span>
                  <span className="text-sm font-medium">25%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Memória:</span>
                  <span className="text-sm font-medium">60%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Disco:</span>
                  <span className="text-sm font-medium">75%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Rede:</span>
                  <span className="text-sm font-medium">Normal</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Versão:</span>
                  <span className="text-sm font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Ambiente:</span>
                  <span className="text-sm font-medium">Produção</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Debug:</span>
                  <span className="text-sm font-medium">Desabilitado</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">SSL:</span>
                  <span className="text-sm font-medium text-green-600">Ativo</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Último backup:</span>
                  <span className="text-sm font-medium">
                    {stats?.lastBackup ? new Date(stats.lastBackup).toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Frequência:</span>
                  <span className="text-sm font-medium">Diário</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Status:</span>
                  <Badge variant="default" className="bg-green-600">
                    Ativo
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ações de Manutenção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-semibold">Backup e Restauração</h3>
                  <div className="space-y-2">
                    <Button onClick={() => handleSystemAction('backup')} className="w-full justify-start">
                      Fazer Backup Manual
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Restaurar Backup
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Sistema</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => handleSystemAction('clear-cache')}
                      className="w-full justify-start"
                    >
                      Limpar Cache
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleSystemAction('restart')}
                      className="w-full justify-start"
                    >
                      Reiniciar Sistema
                    </Button>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Atenção:</strong> Algumas ações podem afetar o funcionamento do sistema. Execute apenas se necessário e
                  durante horários de baixo movimento.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                <div className="text-green-600">[INFO] {new Date().toISOString()} - Sistema iniciado com sucesso</div>
                <div className="text-blue-600">[INFO] {new Date().toISOString()} - Usuário admin@erplite.com fez login</div>
                <div className="text-green-600">[INFO] {new Date().toISOString()} - Backup automático concluído</div>
                <div className="text-yellow-600">[WARN] {new Date().toISOString()} - Produto com estoque baixo detectado</div>
                <div className="text-green-600">[INFO] {new Date().toISOString()} - Nova venda registrada: V{Date.now()}</div>
                <div className="text-blue-600">[INFO] {new Date().toISOString()} - Cache limpo automaticamente</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

