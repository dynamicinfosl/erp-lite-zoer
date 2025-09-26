'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Monitor,
  Globe,
  Zap,
  Shield
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';

interface SystemMetrics {
  cpu: {
    usage: number;
    temperature: number;
    cores: number;
    processes: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    readSpeed: number;
    writeSpeed: number;
  };
  network: {
    downloadSpeed: number;
    uploadSpeed: number;
    latency: number;
    packetsLost: number;
  };
  services: ServiceStatus[];
  uptime: number;
  lastUpdate: string;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'warning';
  responseTime: number;
  uptime: number;
  description: string;
}

interface PerformanceData {
  time: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

const generateMockData = (): SystemMetrics => ({
  cpu: {
    usage: Math.floor(Math.random() * 80) + 10,
    temperature: Math.floor(Math.random() * 30) + 45,
    cores: 8,
    processes: Math.floor(Math.random() * 50) + 150
  },
  memory: {
    total: 16384,
    used: Math.floor(Math.random() * 8192) + 4096,
    free: 0,
    cached: Math.floor(Math.random() * 2048) + 1024
  },
  disk: {
    total: 512000,
    used: Math.floor(Math.random() * 200000) + 200000,
    free: 0,
    readSpeed: Math.floor(Math.random() * 500) + 100,
    writeSpeed: Math.floor(Math.random() * 400) + 80
  },
  network: {
    downloadSpeed: Math.floor(Math.random() * 900) + 100,
    uploadSpeed: Math.floor(Math.random() * 500) + 50,
    latency: Math.floor(Math.random() * 50) + 10,
    packetsLost: Math.random() * 2
  },
  services: [
    {
      name: 'Next.js Server',
      status: 'online',
      responseTime: Math.floor(Math.random() * 100) + 50,
      uptime: 99.9,
      description: 'Servidor principal da aplicação'
    },
    {
      name: 'Supabase Database',
      status: 'online',
      responseTime: Math.floor(Math.random() * 200) + 100,
      uptime: 99.8,
      description: 'Banco de dados PostgreSQL'
    },
    {
      name: 'API Gateway',
      status: 'online',
      responseTime: Math.floor(Math.random() * 80) + 30,
      uptime: 99.7,
      description: 'Gateway de APIs'
    },
    {
      name: 'Cache Redis',
      status: Math.random() > 0.1 ? 'online' : 'warning',
      responseTime: Math.floor(Math.random() * 50) + 10,
      uptime: 99.5,
      description: 'Sistema de cache em memória'
    },
    {
      name: 'File Storage',
      status: 'online',
      responseTime: Math.floor(Math.random() * 150) + 80,
      uptime: 99.6,
      description: 'Armazenamento de arquivos'
    }
  ],
  uptime: 99.8,
  lastUpdate: new Date().toISOString()
});

export function SystemMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const updatePerformanceHistory = useCallback(() => {
    if (!metrics) return;
    
    setPerformanceData(prev => {
      const newData = [...prev.slice(1)]; // Remove o primeiro item
      const now = new Date();
      
      newData.push({
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        cpu: metrics.cpu.usage,
        memory: (metrics.memory.used / metrics.memory.total) * 100,
        disk: (metrics.disk.used / metrics.disk.total) * 100,
        network: Math.min((metrics.network.downloadSpeed / 1000) * 100, 100)
      });
      
      return newData;
    });
  }, [metrics]);

  useEffect(() => {
    fetchSystemMetrics();
    generatePerformanceHistory();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchSystemMetrics();
        updatePerformanceHistory();
      }, 5000); // Atualiza a cada 5 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, updatePerformanceHistory]);

  const fetchSystemMetrics = async () => {
    try {
      setLoading(true);
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newMetrics = generateMockData();
      newMetrics.memory.free = newMetrics.memory.total - newMetrics.memory.used - newMetrics.memory.cached;
      newMetrics.disk.free = newMetrics.disk.total - newMetrics.disk.used;
      
      setMetrics(newMetrics);
    } catch (error) {
      toast.error('Erro ao carregar métricas do sistema');
    } finally {
      setLoading(false);
    }
  };

  const generatePerformanceHistory = () => {
    const data: PerformanceData[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * 2 * 60 * 1000)); // Cada ponto representa 2 minutos
      data.push({
        time: time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        cpu: Math.floor(Math.random() * 80) + 10,
        memory: Math.floor(Math.random() * 70) + 20,
        disk: Math.floor(Math.random() * 50) + 30,
        network: Math.floor(Math.random() * 100) + 10
      });
    }
    
    setPerformanceData(data);
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-juga-primary bg-juga-primary/10';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'offline': return XCircle;
      default: return AlertTriangle;
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (uptime: number): string => {
    const days = Math.floor(uptime);
    const hours = Math.floor((uptime - days) * 24);
    return `${days}d ${hours}h`;
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            Monitoramento do Sistema
          </h2>
          <p className="text-muted-foreground">
            Última atualização: {new Date(metrics.lastUpdate).toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={fetchSystemMetrics} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* System Health Alert */}
      {metrics.cpu.usage > 80 || (metrics.memory.used / metrics.memory.total) > 0.9 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Alerta de Performance:</strong> Sistema com alta utilização de recursos.
            {metrics.cpu.usage > 80 && ` CPU: ${metrics.cpu.usage}%`}
            {(metrics.memory.used / metrics.memory.total) > 0.9 && ` Memória: ${Math.round((metrics.memory.used / metrics.memory.total) * 100)}%`}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">CPU</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Cpu className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-heading">{metrics.cpu.usage}%</div>
              <div className="text-sm text-caption mb-2">
                {metrics.cpu.cores} cores, {metrics.cpu.temperature}°C
              </div>
              <Progress value={metrics.cpu.usage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Memória</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Database className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-heading">
                {Math.round((metrics.memory.used / metrics.memory.total) * 100)}%
              </div>
              <div className="text-sm text-caption mb-2">
                {formatBytes(metrics.memory.used * 1024 * 1024)} / {formatBytes(metrics.memory.total * 1024 * 1024)}
              </div>
              <Progress value={(metrics.memory.used / metrics.memory.total) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Armazenamento</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <HardDrive className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-heading">
                {Math.round((metrics.disk.used / metrics.disk.total) * 100)}%
              </div>
              <div className="text-sm text-caption mb-2">
                {formatBytes(metrics.disk.used * 1024 * 1024)} / {formatBytes(metrics.disk.total * 1024 * 1024)}
              </div>
              <Progress value={(metrics.disk.used / metrics.disk.total) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Uptime</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-juga-primary">{metrics.uptime}%</div>
              <div className="text-sm text-caption mb-2">
                {formatUptime(7.5)} de operação
              </div>
              <Progress value={metrics.uptime} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="network">Rede</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-juga-text-secondary">Histórico de Performance (Última Hora)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${Math.round(value)}%`,
                        name === 'cpu' ? 'CPU' : 
                        name === 'memory' ? 'Memória' : 
                        name === 'disk' ? 'Disco' : 'Rede'
                      ]}
                    />
                    <Area type="monotone" dataKey="cpu" stackId="1" stroke="var(--juga-primary)" fill="var(--juga-primary)" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="memory" stackId="1" stroke="var(--juga-primary-light)" fill="var(--juga-primary-light)" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="disk" stackId="1" stroke="var(--juga-primary)" fill="var(--juga-primary)" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="network" stackId="1" stroke="var(--juga-primary-light)" fill="var(--juga-primary-light)" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-juga-text-secondary">Status dos Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.services.map((service, index) => {
                  const StatusIcon = getStatusIcon(service.status);
                  return (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <StatusIcon className={`h-5 w-5 ${service.status === 'online' ? 'text-juga-primary' : service.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`} />
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-muted-foreground">{service.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{service.responseTime}ms</div>
                          <div className="text-xs text-muted-foreground">Resposta</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{service.uptime}%</div>
                          <div className="text-xs text-muted-foreground">Uptime</div>
                        </div>
                        <Badge className={getStatusColor(service.status)}>
                          {service.status === 'online' ? 'Online' : 
                           service.status === 'warning' ? 'Alerta' : 'Offline'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                  <Wifi className="h-5 w-5 text-juga-primary" />
                  Tráfego de Rede
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Download:</span>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-juga-primary" />
                    <span className="font-medium">{metrics.network.downloadSpeed} Mbps</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Upload:</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-juga-primary" />
                    <span className="font-medium">{metrics.network.uploadSpeed} Mbps</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Latência:</span>
                  <span className="font-medium">{metrics.network.latency}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pacotes perdidos:</span>
                  <span className="font-medium">{metrics.network.packetsLost.toFixed(2)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                  <HardDrive className="h-5 w-5 text-juga-primary" />
                  I/O do Disco
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Velocidade de Leitura:</span>
                  <span className="font-medium">{metrics.disk.readSpeed} MB/s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Velocidade de Escrita:</span>
                  <span className="font-medium">{metrics.disk.writeSpeed} MB/s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Espaço Livre:</span>
                  <span className="font-medium">{formatBytes(metrics.disk.free * 1024 * 1024)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Espaço Usado:</span>
                  <span className="font-medium">{formatBytes(metrics.disk.used * 1024 * 1024)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                  <Cpu className="h-5 w-5 text-juga-primary" />
                  Detalhes do CPU
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Uso atual:</span>
                  <span className="font-medium">{metrics.cpu.usage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Temperatura:</span>
                  <span className="font-medium">{metrics.cpu.temperature}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Núcleos:</span>
                  <span className="font-medium">{metrics.cpu.cores}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Processos:</span>
                  <span className="font-medium">{metrics.cpu.processes}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                  <Database className="h-5 w-5 text-juga-primary" />
                  Detalhes da Memória
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total:</span>
                  <span className="font-medium">{formatBytes(metrics.memory.total * 1024 * 1024)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Usado:</span>
                  <span className="font-medium">{formatBytes(metrics.memory.used * 1024 * 1024)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Livre:</span>
                  <span className="font-medium">{formatBytes(metrics.memory.free * 1024 * 1024)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cache:</span>
                  <span className="font-medium">{formatBytes(metrics.memory.cached * 1024 * 1024)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                  <Shield className="h-5 w-5 text-juga-primary" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">SSL/TLS:</span>
                  <Badge className="bg-juga-primary/10 text-juga-primary">Ativo</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Firewall:</span>
                  <Badge className="bg-juga-primary/10 text-juga-primary">Ativo</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Antivírus:</span>
                  <Badge className="bg-juga-primary/10 text-juga-primary">Ativo</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Backup:</span>
                  <Badge className="bg-juga-primary/10 text-juga-primary">Ativo</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
