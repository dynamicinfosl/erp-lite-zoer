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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wallet, RefreshCw, Search, User, Calendar, DollarSign, Lock, Eye, Printer, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';

export interface CashSession {
  id: string;
  tenant_id?: string;
  user_id?: string;
  register_id?: string;
  opened_at: string;
  opened_by?: string;
  closed_at?: string | null;
  closed_by?: string | null;
  initial_amount?: number;
  opening_amount?: number;
  closing_amount?: number | null;
  closing_amount_cash?: number | null;
  closing_amount_card_debit?: number | null;
  closing_amount_card_credit?: number | null;
  closing_amount_pix?: number | null;
  closing_amount_other?: number | null;
  expected_cash?: number | null;
  expected_card_debit?: number | null;
  expected_card_credit?: number | null;
  expected_pix?: number | null;
  expected_other?: number | null;
  difference_amount?: number | null;
  difference_cash?: number | null;
  difference_card_debit?: number | null;
  difference_card_credit?: number | null;
  difference_pix?: number | null;
  difference_other?: number | null;
  difference_reason?: string | null;
  total_sales?: number | null;
  total_sales_amount?: number | null;
  status?: string;
  notes?: string | null;
}

export default function CaixasPage() {
  const { tenant, user } = useSimpleAuth();
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'open' | 'closed'>('todos');
  const [userFilter, setUserFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [closingId, setClosingId] = useState<string | null>(null);
  const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);
  const [detailsSession, setDetailsSession] = useState<CashSession | null>(null);

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

      const res = await fetch(`/next_api/cash-sessions?${params.toString()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) throw new Error('Erro ao carregar caixas');
      const json = await res.json();
      const rows =
        (Array.isArray(json?.data) ? json.data : null) ??
        (Array.isArray(json?.data?.data) ? json.data.data : null) ??
        (Array.isArray(json?.rows) ? json.rows : null) ??
        [];
      setSessions(rows);
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

  const handleCloseSession = useCallback(
    async (sessionId: string) => {
      if (closingId) return;
      setClosingId(sessionId);
      setConfirmCloseId(null);
      try {
        const res = await fetch(`/next_api/cash-sessions?id=${encodeURIComponent(sessionId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'closed',
            closed_at: new Date().toISOString(),
            closed_by: user?.email || (user?.id ? String(user.id) : null) || 'Sistema',
          }),
          cache: 'no-store',
        });
        const responseText = await res.text();
        if (!res.ok) {
          let msg = responseText;
          try {
            const j = JSON.parse(responseText);
            if (j?.errorMessage) msg = j.errorMessage;
          } catch (_) {}
          throw new Error(msg || 'Erro ao fechar caixa');
        }
        toast.success('Caixa fechado com sucesso.');
        if (statusFilter === 'open') setStatusFilter('todos');
        await loadSessions();
      } catch (e: any) {
        console.error(e);
        const msg = e?.message ?? (typeof e === 'string' ? e : 'Erro ao fechar caixa');
        toast.error(msg);
      } finally {
        setClosingId(null);
      }
    },
    [closingId, loadSessions, statusFilter, user?.email, user?.id]
  );

  const handlePrintSession = useCallback((session: CashSession) => {
    window.print();
  }, []);

  const calculateClosingTotal = (session: CashSession): number => {
    return (
      Number(session.closing_amount_cash || 0) +
      Number(session.closing_amount_card_debit || 0) +
      Number(session.closing_amount_card_credit || 0) +
      Number(session.closing_amount_pix || 0) +
      Number(session.closing_amount_other || 0)
    );
  };

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
                      <TableHead className="text-right w-[120px]">Ações</TableHead>
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
                            {formatCurrency(Number((s as any).opening_amount ?? s.initial_amount) || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {s.closed_at ? formatDate(s.closed_at) : '—'}
                        </TableCell>
                        <TableCell>
                          {s.status === 'closed' ? (
                            <span className="flex items-center gap-1 font-medium text-blue-600">
                              <DollarSign className="h-3.5 w-3.5" />
                              {formatCurrency(calculateClosingTotal(s))}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {s.notes || s.difference_reason || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.status === 'open' ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmCloseId(String(s.id))}
                              disabled={closingId !== null}
                              className="text-amber-700 border-amber-300 hover:bg-amber-50"
                            >
                              <Lock className="h-3.5 w-3.5 mr-1" />
                              Fechar
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setDetailsSession(s)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintSession(s)}
                                className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de confirmação para fechar caixa */}
        <Dialog open={confirmCloseId !== null} onOpenChange={(open) => !open && setConfirmCloseId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Confirmar fechamento de caixa
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja fechar este caixa? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmCloseId(null)} disabled={closingId !== null}>
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={() => confirmCloseId && handleCloseSession(confirmCloseId)}
                disabled={closingId !== null}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {closingId === confirmCloseId ? 'Fechando...' : 'Confirmar fechamento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de detalhes do fechamento */}
        <Dialog open={detailsSession !== null} onOpenChange={(open) => !open && setDetailsSession(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Fechamento de Caixa</DialogTitle>
              <DialogDescription>
                Informações completas da sessão de caixa
              </DialogDescription>
            </DialogHeader>
            {detailsSession && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Badge variant={detailsSession.status === 'open' ? 'default' : 'secondary'} className="mt-1">
                      {detailsSession.status === 'open' ? 'Aberto' : 'Fechado'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">ID da Sessão</Label>
                    <p className="text-sm font-mono">{detailsSession.id}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Informações de Abertura</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Aberto por</Label>
                      <p className="text-sm">{detailsSession.opened_by || '—'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Data/Hora</Label>
                      <p className="text-sm">{formatDate(detailsSession.opened_at)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Valor Inicial</Label>
                      <p className="text-sm font-medium">{formatCurrency(Number((detailsSession as any).opening_amount ?? detailsSession.initial_amount) || 0)}</p>
                    </div>
                  </div>
                </div>

                {detailsSession.status === 'closed' && (
                  <>
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Informações de Fechamento</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Fechado por</Label>
                          <p className="text-sm">{detailsSession.closed_by || '—'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Data/Hora</Label>
                          <p className="text-sm">{formatDate(detailsSession.closed_at)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Valores Contados (Fechamento)</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Dinheiro:</span>
                          <span className="text-sm font-medium">{formatCurrency(Number(detailsSession.closing_amount_cash || 0))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Cartão Débito:</span>
                          <span className="text-sm font-medium">{formatCurrency(Number(detailsSession.closing_amount_card_debit || 0))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Cartão Crédito:</span>
                          <span className="text-sm font-medium">{formatCurrency(Number(detailsSession.closing_amount_card_credit || 0))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">PIX:</span>
                          <span className="text-sm font-medium">{formatCurrency(Number(detailsSession.closing_amount_pix || 0))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Outros:</span>
                          <span className="text-sm font-medium">{formatCurrency(Number(detailsSession.closing_amount_other || 0))}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t font-bold">
                          <span className="text-sm">Total Fechamento:</span>
                          <span className="text-sm text-blue-600">{formatCurrency(calculateClosingTotal(detailsSession))}</span>
                        </div>
                      </div>
                    </div>

                    {(detailsSession.expected_cash || detailsSession.expected_card_debit || detailsSession.expected_card_credit || detailsSession.expected_pix || detailsSession.expected_other) && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Valores Esperados (Sistema)</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Dinheiro:</span>
                            <span className="text-sm">{formatCurrency(Number(detailsSession.expected_cash || 0))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Cartão Débito:</span>
                            <span className="text-sm">{formatCurrency(Number(detailsSession.expected_card_debit || 0))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Cartão Crédito:</span>
                            <span className="text-sm">{formatCurrency(Number(detailsSession.expected_card_credit || 0))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">PIX:</span>
                            <span className="text-sm">{formatCurrency(Number(detailsSession.expected_pix || 0))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Outros:</span>
                            <span className="text-sm">{formatCurrency(Number(detailsSession.expected_other || 0))}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {detailsSession.difference_amount !== null && detailsSession.difference_amount !== undefined && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Diferenças (Sobra/Falta)</h4>
                        <div className="space-y-2">
                          {detailsSession.difference_cash !== null && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Dinheiro:</span>
                              <span className={`text-sm font-medium ${Number(detailsSession.difference_cash) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(Number(detailsSession.difference_cash || 0))}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t font-bold">
                            <span className="text-sm">Diferença Total:</span>
                            <span className={`text-sm ${Number(detailsSession.difference_amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(Number(detailsSession.difference_amount || 0))}
                            </span>
                          </div>
                          {detailsSession.difference_reason && (
                            <div className="mt-2">
                              <Label className="text-xs text-muted-foreground">Justificativa:</Label>
                              <p className="text-sm mt-1">{detailsSession.difference_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(detailsSession.total_sales || detailsSession.total_sales_amount) && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Estatísticas</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total de Vendas:</span>
                            <span className="text-sm font-medium">{detailsSession.total_sales || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Valor Total Vendido:</span>
                            <span className="text-sm font-medium">{formatCurrency(Number(detailsSession.total_sales_amount || 0))}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {detailsSession.notes && (
                      <div className="border-t pt-4">
                        <Label className="text-xs text-muted-foreground">Observações</Label>
                        <p className="text-sm mt-1">{detailsSession.notes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsSession(null)}>
                Fechar
              </Button>
              {detailsSession && (
                <Button onClick={() => handlePrintSession(detailsSession)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TenantPageWrapper>
  );
}
