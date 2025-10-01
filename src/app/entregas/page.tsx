'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

export default function EntregasPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/next_api/deliveries');
        const data = await res.json();
        const rows = Array.isArray(data?.data) ? data.data : (data?.rows || data || []);
        setDeliveries(rows);
      } catch (e) {
        console.error('Falha ao carregar entregas', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'em_rota' | 'entregue'>('todos');

  const filtered = deliveries.filter((d) => {
    const matchesSearch = `${d.id} ${d.customer} ${d.address}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'todos' ? true : d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = useMemo(() => {
    const emRota = deliveries.filter(d => d.status?.includes('rota')).length;
    const pendentes = deliveries.filter(d => d.status?.includes('pend')).length;
    const entregues = deliveries.filter(d => d.status?.includes('entreg')).length;
    const total = deliveries.length;
    
    return { emRota, pendentes, entregues, total };
  }, [deliveries]);

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
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="em_rota">Em rota</SelectItem>
              <SelectItem value="entregue">Entregues</SelectItem>
            </SelectContent>
          </Select>
          <Button className="juga-gradient text-white w-full sm:w-auto gap-2">
            <RefreshCw className="h-4 w-4" />
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
          title="Pendentes"
          value={`${stats.pendentes}`}
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
                {(!loading ? filtered : []).map((d: any) => (
                  <TableRow key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell className="font-mono text-sm text-body">{d.id}</TableCell>
                    <TableCell className="font-medium text-heading">
                      {d.customer_name || d.customer || d.receiver_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.address || d.delivery_address}
                    </TableCell>
                    <TableCell>
                      {(d.status || '').includes('pend') && <Badge variant="outline">Pendente</Badge>}
                      {(d.status || '').includes('rota') && <Badge variant="default">Em rota</Badge>}
                      {(d.status || '').includes('entreg') && (
                        <Badge className="bg-green-600 hover:bg-green-700">Entregue</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-body">{d.created_at}</TableCell>
                    <TableCell className="text-sm text-body">{d.eta || d.expected_at || '—'}</TableCell>
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