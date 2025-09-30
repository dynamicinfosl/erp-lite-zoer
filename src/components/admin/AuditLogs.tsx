'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Eye,
  Shield,
  Database,
  Settings,
  Users,
  ShoppingCart,
  BarChart3,
  Mail,
  Lock,
  Unlock,
  Trash2,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminStatCard } from './AdminStatCard';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success' | 'debug';
  action: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  resource: string;
  resourceId?: string;
  ip: string;
  userAgent: string;
  description: string;
  metadata?: any;
  duration?: number;
}

interface LogFilter {
  level: string;
  action: string;
  user: string;
  dateFrom: string;
  dateTo: string;
  resource: string;
  search: string;
}

const mockLogEntries: LogEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-15T14:30:00Z',
    level: 'info',
    action: 'LOGIN',
    user: {
      id: '1',
      name: 'João Silva',
      email: 'joao@erplite.com',
      role: 'admin'
    },
    resource: 'AUTH',
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    description: 'Usuário fez login no sistema',
    duration: 250
  },
  {
    id: '2',
    timestamp: '2024-01-15T14:28:00Z',
    level: 'success',
    action: 'CREATE',
    user: {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@erplite.com',
      role: 'manager'
    },
    resource: 'PRODUCT',
    resourceId: 'prod_123',
    ip: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    description: 'Produto "Notebook Dell" foi criado',
    metadata: { productName: 'Notebook Dell', price: 2500.00, category: 'Eletrônicos' },
    duration: 180
  },
  {
    id: '3',
    timestamp: '2024-01-15T14:25:00Z',
    level: 'warning',
    action: 'UPDATE',
    user: {
      id: '3',
      name: 'Carlos Oliveira',
      email: 'carlos@erplite.com',
      role: 'operator'
    },
    resource: 'USER',
    resourceId: 'user_456',
    ip: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    description: 'Tentativa de atualizar usuário sem permissões adequadas',
    metadata: { attemptedFields: ['role', 'permissions'] },
    duration: 120
  },
  {
    id: '4',
    timestamp: '2024-01-15T14:20:00Z',
    level: 'error',
    action: 'DELETE',
    user: null,
    resource: 'SYSTEM',
    ip: '203.0.113.45',
    userAgent: 'curl/7.68.0',
    description: 'Tentativa de acesso não autorizado à API de exclusão',
    metadata: { endpoint: '/api/admin/delete', error: 'Unauthorized' },
    duration: 50
  },
  {
    id: '5',
    timestamp: '2024-01-15T14:15:00Z',
    level: 'info',
    action: 'VIEW',
    user: {
      id: '4',
      name: 'Ana Costa',
      email: 'ana@erplite.com',
      role: 'viewer'
    },
    resource: 'REPORT',
    resourceId: 'report_789',
    ip: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
    description: 'Relatório de vendas foi visualizado',
    metadata: { reportType: 'sales', period: '2024-01' },
    duration: 300
  },
  {
    id: '6',
    timestamp: '2024-01-15T14:10:00Z',
    level: 'success',
    action: 'BACKUP',
    user: null,
    resource: 'SYSTEM',
    ip: '127.0.0.1',
    userAgent: 'System Cron Job',
    description: 'Backup automático realizado com sucesso',
    metadata: { backupSize: '1.2GB', duration: '5m 32s' },
    duration: 332000
  }
];

const actionIcons: Record<string, any> = {
  LOGIN: User,
  LOGOUT: User,
  CREATE: CheckCircle,
  UPDATE: Edit,
  DELETE: Trash2,
  VIEW: Eye,
  BACKUP: Database,
  RESTORE: Database,
  EXPORT: Download,
  IMPORT: RefreshCw,
  SECURITY: Shield,
  SYSTEM: Settings
};

const levelColors: Record<string, string> = {
  info: 'bg-juga-primary/10 text-juga-primary',
  success: 'bg-juga-primary/10 text-juga-primary',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  debug: 'bg-gray-100 text-gray-800'
};

export function AuditLogs() {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogEntries);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(mockLogEntries);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [filters, setFilters] = useState<LogFilter>({
    level: 'all',
    action: 'all',
    user: 'all',
    dateFrom: '',
    dateTo: '',
    resource: 'all',
    search: ''
  });

  const applyFilters = useCallback(() => {
    let filtered = logs;

    // Filtro por nível
    if (filters.level !== 'all') {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    // Filtro por ação
    if (filters.action !== 'all') {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    // Filtro por usuário
    if (filters.user !== 'all') {
      filtered = filtered.filter(log => log.user?.id === filters.user);
    }

    // Filtro por recurso
    if (filters.resource !== 'all') {
      filtered = filtered.filter(log => log.resource === filters.resource);
    }

    // Filtro por data
    if (filters.dateFrom) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.dateTo));
    }

    // Filtro por busca
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(log =>
        log.description.toLowerCase().includes(searchTerm) ||
        log.user?.name.toLowerCase().includes(searchTerm) ||
        log.user?.email.toLowerCase().includes(searchTerm) ||
        log.action.toLowerCase().includes(searchTerm) ||
        log.resource.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredLogs(filtered);
  }, [filters, logs]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 500));
      // Aqui você faria a chamada real para a API
      setLogs(mockLogEntries);
    } catch (error) {
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const csvHeaders = 'Timestamp,Level,Action,User,Resource,IP,Description\n';
      const csvData = filteredLogs.map(log => 
        `${log.timestamp},${log.level},${log.action},${log.user?.name || 'Sistema'},${log.resource},${log.ip},"${log.description}"`
      ).join('\n');
      
      const blob = new Blob([csvHeaders + csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success('Logs exportados em CSV!');
    } else {
      const jsonData = JSON.stringify(filteredLogs, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      toast.success('Logs exportados em JSON!');
    }
  };

  const clearFilters = () => {
    setFilters({
      level: 'all',
      action: 'all',
      user: 'all',
      dateFrom: '',
      dateTo: '',
      resource: 'all',
      search: ''
    });
  };

  const getActionIcon = (action: string) => {
    const IconComponent = actionIcons[action] || Activity;
    return IconComponent;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const uniqueUsers = Array.from(new Set(logs.filter(log => log.user).map(log => log.user!)));
  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));
  const uniqueResources = Array.from(new Set(logs.map(log => log.resource)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-juga-primary" />
            Logs de Auditoria
          </h2>
          <p className="text-muted-foreground">Monitore todas as atividades e alterações do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportLogs('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => exportLogs('json')}>
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <AdminStatCard
          title="Total de Logs"
          value={filteredLogs.length}
          subtitle="Todos os eventos"
          icon={<FileText className="h-5 w-5" />}
          trend={{
            value: "+15% esta semana",
            direction: "up"
          }}
          variant="primary"
        />
        <AdminStatCard
          title="Erros"
          value={filteredLogs.filter(log => log.level === 'error').length}
          subtitle="Eventos críticos"
          icon={<XCircle className="h-5 w-5" />}
          variant="error"
        />

        <AdminStatCard
          title="Avisos"
          value={filteredLogs.filter(log => log.level === 'warning').length}
          subtitle="Eventos de atenção"
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="warning"
        />

        <AdminStatCard
          title="Sucessos"
          value={filteredLogs.filter(log => log.level === 'success').length}
          subtitle="Operações concluídas"
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
        />

        <AdminStatCard
          title="Usuários Ativos"
          value={new Set(filteredLogs.filter(log => log.user).map(log => log.user!.id)).size}
          subtitle="Únicos nos logs"
          icon={<Users className="h-5 w-5" />}
          variant="primary"
        />
      </div>

      {/* Filters */}
      <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
              <Filter className="h-5 w-5 text-juga-primary" />
              Filtros
            </CardTitle>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
            <div className="lg:col-span-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-juga-primary" />
                <Input
                  id="search"
                  placeholder="Descrição, usuário, ação..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Nível</Label>
              <Select value={filters.level} onValueChange={(value) => setFilters(prev => ({ ...prev, level: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ação</Label>
              <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Recurso</Label>
              <Select value={filters.resource} onValueChange={(value) => setFilters(prev => ({ ...prev, resource: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueResources.map(resource => (
                    <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">Data Inicial</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">Data Final</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-juga-text-secondary">Logs de Atividade ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const ActionIcon = getActionIcon(log.action);
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(log.timestamp).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={levelColors[log.level]}>
                          {log.level.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ActionIcon className="h-4 w-4 text-juga-primary" />
                          {log.action}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div>
                            <div className="font-medium">{log.user.name}</div>
                            <div className="text-sm text-muted-foreground">{log.user.role}</div>
                          </div>
                        ) : (
                          <Badge variant="secondary">Sistema</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.resource}</div>
                        {log.resourceId && (
                          <div className="text-xs text-muted-foreground">{log.resourceId}</div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                      <TableCell>{formatDuration(log.duration)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 text-juga-primary" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum log encontrado com os filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
            <DialogDescription>
              Informações completas sobre esta entrada de log
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="font-medium">Timestamp</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedLog.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label className="font-medium">Nível</Label>
                  <div className="mt-1">
                    <Badge className={levelColors[selectedLog.level]}>
                      {selectedLog.level.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="font-medium">Ação</Label>
                  <p className="text-sm mt-1">{selectedLog.action}</p>
                </div>
                <div>
                  <Label className="font-medium">Recurso</Label>
                  <p className="text-sm mt-1">
                    {selectedLog.resource}
                    {selectedLog.resourceId && (
                      <span className="text-muted-foreground"> ({selectedLog.resourceId})</span>
                    )}
                  </p>
                </div>
              </div>

              {/* User Info */}
              {selectedLog.user && (
                <div>
                  <Label className="font-medium">Usuário</Label>
                  <div className="mt-1 p-3 border rounded-lg">
                    <div className="font-medium">{selectedLog.user.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedLog.user.email}</div>
                    <Badge variant="secondary" className="mt-1">
                      {selectedLog.user.role}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Technical Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="font-medium">IP Address</Label>
                  <p className="text-sm mt-1 font-mono">{selectedLog.ip}</p>
                </div>
                {selectedLog.duration && (
                  <div>
                    <Label className="font-medium">Duração</Label>
                    <p className="text-sm mt-1">{formatDuration(selectedLog.duration)}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <Label className="font-medium">Descrição</Label>
                <p className="text-sm mt-1">{selectedLog.description}</p>
              </div>

              {/* User Agent */}
              <div>
                <Label className="font-medium">User Agent</Label>
                <p className="text-sm mt-1 font-mono break-all">{selectedLog.userAgent}</p>
              </div>

              {/* Metadata */}
              {selectedLog.metadata && (
                <div>
                  <Label className="font-medium">Metadados</Label>
                  <Textarea
                    className="mt-1 font-mono text-sm"
                    value={JSON.stringify(selectedLog.metadata, null, 2)}
                    rows={6}
                    readOnly
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
