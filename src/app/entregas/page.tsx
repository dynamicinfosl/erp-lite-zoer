'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Truck, Clock, CheckCircle, Filter, RefreshCw, MapPin } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

  return (
    <div className="space-y-6">
      <Card className="border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-white">
        <CardContent className="pt-6 pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Badge className="w-fit bg-blue-600">Entregas</Badge>
              <h1 className="text-3xl font-bold text-blue-900">Visão geral das entregas</h1>
              <p className="text-blue-900/70">Gerencie e acompanhe todas as entregas</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input placeholder="Buscar por ID, cliente ou endereço" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
              <Button variant="outline" className="gap-2 border-blue-200 hover:bg-blue-50">
                <Filter className="h-4 w-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent focus:outline-none"
                >
                  <option value="todos">Todos status</option>
                  <option value="pendente">Pendentes</option>
                  <option value="em_rota">Em rota</option>
                  <option value="entregue">Entregues</option>
                </select>
              </Button>
              <Button className="juga-gradient text-white gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-gradient-to-br from-white via-blue-50/40 to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Rota</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">12</div>
            <p className="text-xs text-muted-foreground">Saíram para entrega</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-white via-blue-50/40 to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">8</div>
            <p className="text-xs text-muted-foreground">Aguardando saída</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-white via-blue-50/40 to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">156</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle>Lista de Entregas ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-blue-100">
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
                <TableRow key={d.id} className="border-b border-blue-50 hover:bg-blue-50/40">
                  <TableCell className="font-mono text-sm">{d.id}</TableCell>
                  <TableCell>{d.customer_name || d.customer || d.receiver_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.address || d.delivery_address}</TableCell>
                  <TableCell>
                    {(d.status || '').includes('pend') && <Badge variant="outline">Pendente</Badge>}
                    {(d.status || '').includes('rota') && <Badge className="bg-blue-600">Em rota</Badge>}
                    {(d.status || '').includes('entreg') && <Badge className="bg-green-600">Entregue</Badge>}
                  </TableCell>
                  <TableCell className="text-sm">{d.created_at}</TableCell>
                  <TableCell className="text-sm">{d.eta || d.expected_at || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto mb-3 opacity-50" />
              Nenhuma entrega encontrada
            </div>
          )}
          {loading && (
            <div className="text-center py-8 text-muted-foreground">Carregando entregas...</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}