'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Truck, Clock, CheckCircle, Filter, RefreshCw, MapPin, Package2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { JugaKPICard } from '@/components/dashboard/JugaComponents';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import type { Delivery } from '@/types';

export default function EntregasPage() {
  const { user, tenant } = useSimpleAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDeliveries = useCallback(async () => {
    if (!tenant?.id) {
      setDeliveries([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/next_api/deliveries?tenant_id=${tenant.id}`);
      if (!res.ok) {
        console.error('Falha na API /next_api/deliveries:', res.status);
        setDeliveries([]);
      } else {
        const data = await res.json();
        const rows = Array.isArray(data?.data) ? data.data : (data?.rows || data || []);
        setDeliveries(Array.isArray(rows) ? rows : []);
      }
    } catch (e) {
      console.error('Falha ao carregar entregas', e);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    loadDeliveries();
  }, [tenant?.id, loadDeliveries]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'aguardando' | 'em_rota' | 'entregue' | 'cancelada'>('todos');

  const safeDeliveries = useMemo(() => Array.isArray(deliveries) ? deliveries : [], [deliveries]);
  const filtered = safeDeliveries.filter((d) => {
    const matchesSearch = `${d.id} ${d.customer_name} ${d.delivery_address}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'todos' ? true : d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = useMemo(() => {
    const emRota = safeDeliveries.filter(d => d.status === 'em_rota').length;
    const aguardando = safeDeliveries.filter(d => d.status === 'aguardando').length;
    const entregues = safeDeliveries.filter(d => d.status === 'entregue').length;
    const total = safeDeliveries.length;
    
    return { emRota, aguardando, entregues, total };
  }, [safeDeliveries]);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header - Responsivo */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Entregas</h1>
          <p className="text-sm sm:text-base text-body">
            Gerencie e acompanhe todas as entregas em tempo real
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Input 
            placeholder="Buscar por ID, cliente..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full sm:w-64" 
          />
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px] bg-transparent border border-white dark:border-white text-foreground shadow-none hover:bg-transparent focus:outline-none focus:ring-0">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-lg">
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="aguardando">Aguardando</SelectItem>
              <SelectItem value="em_rota">Em rota</SelectItem>
              <SelectItem value="entregue">Entregues</SelectItem>
              <SelectItem value="cancelada">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={loadDeliveries} 
            disabled={loading}
            className="juga-gradient text-white w-full sm:w-auto gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
            <span className="sm:hidden">Atualizar</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards - Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <JugaKPICard
          title="Total de Entregas"
          value={`${stats.total}`}
          description="Entregas registradas"
          trend="up"
          trendValue="+8.2%"
          icon={<Package2 className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="primary"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Em Rota"
          value={`${stats.emRota}`}
          description="Saíram para entrega"
          trend="up"
          trendValue="Ativas"
          icon={<Truck className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="accent"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Aguardando"
          value={`${stats.aguardando}`}
          description="Aguardando saída"
          trend="down"
          trendValue="Requer atenção"
          icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="warning"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Entregues"
          value={`${stats.entregues}`}
          description="Finalizadas"
          trend="up"
          trendValue="+12.5%"
          icon={<CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="success"
          className="min-h-[120px] sm:min-h-[140px]"
        />
      </div>

      {/* Lista de Entregas */}
      <Card className="juga-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl text-heading">Lista de Entregas</CardTitle>
          <CardDescription className="text-sm">
            {filtered.length} {filtered.length === 1 ? 'entrega encontrada' : 'entregas encontradas'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aberta em</TableHead>
                  <TableHead>Previsão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!loading ? filtered : []).map((d) => (
                  <TableRow key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell className="font-mono text-sm text-body">{d.id}</TableCell>
                    <TableCell className="font-medium text-heading">
                      {d.customer_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.delivery_address}
                    </TableCell>
                    <TableCell>
                      {d.status === 'aguardando' && <Badge variant="outline">Aguardando</Badge>}
                      {d.status === 'em_rota' && <Badge variant="default">Em rota</Badge>}
                      {d.status === 'entregue' && (
                        <Badge className="bg-green-600 hover:bg-green-700">Entregue</Badge>
                      )}
                      {d.status === 'cancelada' && (
                        <Badge variant="destructive">Cancelada</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-body">
                      {new Date(d.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-sm text-body">
                      {d.delivered_at ? new Date(d.delivered_at).toLocaleDateString('pt-BR') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Nenhuma entrega encontrada</p>
            </div>
          )}
          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-3"></div>
              <p>Carregando entregas...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}