'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wallet, RefreshCw, Search, User, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';

export interface CashSession {
  id: string;
  tenant_id?: string;
  user_id?: string;
  register_id?: string;
  opened_at: string;
  closed_at?: string | null;
  initial_amount: number;
  closing_amount?: number | null;
  status?: string;
  notes?: string | null;
}

export default function CaixasPage() {
  const { tenant } = useSimpleAuth();
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'open' | 'closed'>('todos');
  const [userFilter, setUserFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const loadSessions = useCallback(async () => {
    if (!tenant?.id) {
      setSessions([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params = new URLSearchParams({
        tenant_id: tenant.id,
      });
      if (statusFilter === 'open') params.set('status', 'open');
      if (statusFilter === 'closed') params.set('status', 'closed');
      if (userFilter) params.set('user_id', userFilter);

      const res = await fetch(`/next_api/cash-sessions?${params.toString()}`);
      if (!res.ok) throw new Error('Erro ao carregar caixas');
      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : [];
      setSessions(data);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar sessões de caixa');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, statusFilter, userFilter]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredSessions = React.useMemo(() => {
    let list = sessions;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          (s.register_id && String(s.register_id).toLowerCase().includes(q)) ||
          (s.user_id && String(s.user_id).toLowerCase().includes(q)) ||
          (s.notes && s.notes.toLowerCase().includes(q)) ||
          (s.id && String(s.id).toLowerCase().includes(q))
      );
    }
    return list;
  }, [sessions, search]);

  const uniqueUserIds = React.useMemo(() => {
    const ids = new Set<string>();
    sessions.forEach((s) => {
      if (s.user_id) ids.add(String(s.user_id));
    });
    return Array.from(ids).sort();
  }, [sessions]);

  const openCount = sessions.filter((s) => s.status === 'open').length;
  const closedCount = sessions.filter((s) => s.status === 'closed').length;

  return (
    <TenantPageWrapper>
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-heading flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            Caixas
          </h1>
          <p className="text-body mt-1">
            Visualize todas as sessões de caixa (abertas e fechadas), por usuário e período.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de sessões</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{sessions.length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Caixas abertos</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-green-600">{openCount}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Caixas fechados</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-muted-foreground">{closedCount}</span>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Lista de Caixas</CardTitle>
              <CardDescription>Sessões de abertura e fechamento de caixa do PDV</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadSessions} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID, usuário, registro..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="open">Abertos</SelectItem>
                  <SelectItem value="closed">Fechados</SelectItem>
                </SelectContent>
              </Select>
              {uniqueUserIds.length > 0 && (
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os usuários</SelectItem>
                    {uniqueUserIds.map((uid) => (
                      <SelectItem key={uid} value={uid}>
                        {uid}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Carregando caixas...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma sessão de caixa encontrada.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Usuário / Registro</TableHead>
                      <TableHead>Abertura</TableHead>
                      <TableHead>Valor inicial</TableHead>
                      <TableHead>Fechamento</TableHead>
                      <TableHead>Valor final</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Badge
                            variant={s.status === 'open' ? 'default' : 'secondary'}
                            className={
                              s.status === 'open'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-500'
                            }
                          >
                            {s.status === 'open' ? 'Aberto' : 'Fechado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            {s.user_id ? (
                              <>
                                <User className="h-3.5 w-3.5" />
                                {String(s.user_id)}
                              </>
                            ) : (
                              s.register_id || '—'
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(s.opened_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 font-medium">
                            <DollarSign className="h-3.5 w-3.5" />
                            {formatCurrency(Number(s.initial_amount) || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {s.closed_at ? formatDate(s.closed_at) : '—'}
                        </TableCell>
                        <TableCell>
                          {s.closing_amount != null
                            ? formatCurrency(Number(s.closing_amount))
                            : '—'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {s.notes || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TenantPageWrapper>
  );
}
