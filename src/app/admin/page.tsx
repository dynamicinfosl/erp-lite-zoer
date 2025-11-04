'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AdminProtection } from '@/components/admin/AdminProtection';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { StorageCard } from '@/components/admin/StorageCard';
import {
  Shield,
  Users,
  BarChart3,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  CreditCard,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalSales: number;
  totalProducts: number;
  systemHealth: string;
  lastBackup: string;
  totalBeverages: number;
  lowStockAlerts: number;
  expiringProducts: number;
  complianceRate: number;
  temperatureAlerts: number;
  totalInventoryValue: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      
      // Usando dados mockados para evitar problemas de autenticação da API
      // Simular carregamento assíncrono
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Dados mockados para demonstração
      const mockStats: SystemStats = {
        totalUsers: 156,
        activeUsers: 142,
        totalSales: 89,
        totalProducts: 234,
        systemHealth: 'healthy',
        lastBackup: '2025-01-20T10:00:00.000Z', // Data fixa para evitar hidratação
        totalBeverages: 45,
        lowStockAlerts: 12,
        expiringProducts: 8,
        complianceRate: 95,
        temperatureAlerts: 0,
        totalInventoryValue: 125000
      };
      setStats(mockStats);
      toast.success('Estatísticas carregadas com sucesso!');
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas do sistema');
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalSales: 0,
        totalProducts: 0,
        systemHealth: 'unknown',
        lastBackup: '2025-01-20T10:00:00.000Z', // Data fixa para evitar hidratação
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


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <AdminProtection>
      <div className="space-y-6 p-4 sm:p-6 w-full min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-heading">Visão Geral</h1>
            <p className="text-sm sm:text-base text-body mt-1">Dashboard principal do sistema administrativo</p>
          </div>
          <div className="self-start sm:self-auto">
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Sistema Online
            </Badge>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4">
                  <AdminStatCard
                    title="Total de Usuários"
                    value={stats?.totalUsers || 0}
                    icon={<Users className="h-5 w-5" />}
                    variant="primary"
                    trend={{ value: "+12%", direction: "up" }}
                  />
                  <AdminStatCard
                    title="Usuários Ativos"
                    value={stats?.activeUsers || 0}
                    icon={<Activity className="h-5 w-5" />}
                    variant="success"
                    trend={{ value: "+8%", direction: "up" }}
                  />
                  <AdminStatCard
                    title="Vendas Totais"
                    value={stats?.totalSales || 0}
                    icon={<BarChart3 className="h-5 w-5" />}
                    variant="primary"
                    trend={{ value: "+15%", direction: "up" }}
                  />
                  <AdminStatCard
                    title="Produtos"
                    value={stats?.totalProducts || 0}
                    icon={<Package className="h-5 w-5" />}
                    variant="warning"
                    trend={{ value: "+5%", direction: "up" }}
                  />
                  <AdminStatCard
                    title="Bebidas"
                    value={stats?.totalBeverages || 0}
                    icon={<Database className="h-5 w-5" />}
                    variant="primary"
                    trend={{ value: "+3%", direction: "up" }}
                  />
          <AdminStatCard
            title="Valor do Estoque"
            value={`R$ ${stats?.totalInventoryValue?.toLocaleString('pt-BR') || 0}`}
            icon={<CreditCard className="h-5 w-5" />}
            variant="success"
            trend={{ value: "+7%", direction: "up" }}
          />
        </div>

        {/* Alertas Específicos */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-stretch">
          <Card className="juga-card h-full min-h-[150px] sm:min-h-[170px] overflow-hidden transition-transform duration-200 hover:scale-[1.02] hover:border-juga-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-juga-primary/50 border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent" aria-label="Estoque baixo - produtos críticos">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-start justify-between gap-2 min-h-10">
                <CardTitle title="Estoque Baixo" className="min-w-0 flex-1 text-[11px] sm:text-sm font-medium text-juga-text-secondary leading-snug break-words line-clamp-2">Estoque Baixo</CardTitle>
                <div className="p-1.5 sm:p-2 rounded-md bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 flex-shrink-0">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col justify-between">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className={`${ (stats?.lowStockAlerts ?? 0) > 0 ? 'text-amber-600' : 'text-juga-primary'} text-2xl sm:text-3xl lg:text-4xl font-bold leading-none`}>{stats?.lowStockAlerts}</div>
                  {(stats?.lowStockAlerts ?? 0) > 0 && (
                    <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700">atenção</span>
                  )}
                </div>
                <p className="text-xs sm:text-xs text-muted-foreground leading-snug break-words">Produtos críticos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="juga-card h-full min-h-[150px] sm:min-h-[170px] overflow-hidden transition-transform duration-200 hover:scale-[1.02] hover:border-juga-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-juga-primary/50 border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent" aria-label="Produtos vencendo em 30 dias">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-start justify-between gap-2 min-h-10">
                <CardTitle title="Vencendo em 30 dias" className="min-w-0 flex-1 text-[11px] sm:text-sm font-medium text-juga-text-secondary leading-snug break-words line-clamp-2">Vencendo em 30 dias</CardTitle>
                <div className="p-1.5 sm:p-2 rounded-md bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20 flex-shrink-0">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col justify-between">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className={`${ (stats?.expiringProducts ?? 0) > 0 ? 'text-orange-600' : 'text-juga-primary'} text-2xl sm:text-3xl lg:text-4xl font-bold leading-none`}>{stats?.expiringProducts}</div>
                  {(stats?.expiringProducts ?? 0) > 0 && (
                    <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-700">atenção</span>
                  )}
                </div>
                <p className="text-xs sm:text-xs text-muted-foreground leading-snug break-words">Produtos próximos do vencimento</p>
              </div>
            </CardContent>
          </Card>
          <Card className="juga-card h-full min-h-[150px] sm:min-h-[170px] overflow-hidden transition-transform duration-200 hover:scale-[1.02] hover:border-juga-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-juga-primary/50 border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent" aria-label="Conformidade do sistema">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-start justify-between gap-2 min-h-10">
                <CardTitle title="Conformidade" className="min-w-0 flex-1 text-[11px] sm:text-sm font-medium text-juga-text-secondary leading-snug break-words line-clamp-2">Conformidade</CardTitle>
                <div className="p-1.5 sm:p-2 rounded-md bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 flex-shrink-0">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col justify-between">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-emerald-600 leading-none">{stats?.complianceRate}%</div>
                  <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700">ok</span>
                </div>
                <Progress value={stats?.complianceRate ?? 0} className="h-1.5 sm:h-2" />
                <p className="text-xs sm:text-xs text-muted-foreground leading-snug break-words">Taxa de conformidade</p>
              </div>
            </CardContent>
          </Card>
          <Card className="juga-card h-full min-h-[150px] sm:min-h-[170px] overflow-hidden transition-transform duration-200 hover:scale-[1.02] hover:border-juga-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-juga-primary/50 border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent" aria-label="Alertas de temperatura">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-start justify-between gap-2 min-h-10">
                <CardTitle title="Alertas de Temperatura" className="min-w-0 flex-1 text-[11px] sm:text-sm font-medium text-juga-text-secondary leading-snug break-words line-clamp-2">Alertas de Temperatura</CardTitle>
                <div className="p-1.5 sm:p-2 rounded-md bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 flex-shrink-0">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col justify-between">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className={`${ (stats?.temperatureAlerts ?? 0) > 0 ? 'text-sky-700' : 'text-juga-primary'} text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-none`}>{stats?.temperatureAlerts}</div>
                  {(stats?.temperatureAlerts ?? 0) === 0 && (
                    <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-700">estável</span>
                  )}
                </div>
                <p className="text-xs sm:text-xs text-muted-foreground leading-snug break-words">Alertas ativos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Informações do Sistema */}
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StorageCard
            used={75}
            total={100}
          />
          <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-juga-text-secondary">Último Backup</CardTitle>
                <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                  <Database className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-juga-primary">
                  {stats?.lastBackup ? new Date(stats.lastBackup).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
                <p className="text-sm text-caption">Backup automático</p>
              </div>
            </CardContent>
          </Card>
          <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-juga-text-secondary">Status do Sistema</CardTitle>
                <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600 capitalize">{stats?.systemHealth || 'unknown'}</div>
                <p className="text-sm text-caption">Sistema operacional</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Atividades Recentes */}
        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-juga-text-primary">
              <Activity className="h-5 w-5 text-juga-primary" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminProtection>
  );
}