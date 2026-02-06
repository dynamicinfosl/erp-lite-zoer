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
import { Wallet, RefreshCw, Search, User, Calendar, DollarSign, Lock, Eye, Printer, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';
import { CashClosingModal, CashClosingData } from '@/components/pdv/CashClosingModal';

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
  const [detailsOperations, setDetailsOperations] = useState<Array<{
    id: string;
    tipo: 'sangria' | 'reforco' | 'abertura' | 'fechamento';
    valor: number;
    descricao: string;
    data: string;
    usuario: string;
  }>>([]);
  const [userNamesMap, setUserNamesMap] = useState<Map<string, string>>(new Map());
  const [showCashClosingModal, setShowCashClosingModal] = useState(false);
  const [sessionToClose, setSessionToClose] = useState<CashSession | null>(null);
  const [sessionSales, setSessionSales] = useState<any[]>([]);
  const [sessionOperations, setSessionOperations] = useState<Array<{
    id: string;
    tipo: 'sangria' | 'reforco' | 'abertura' | 'fechamento';
    valor: number;
    descricao: string;
    data: string;
    usuario: string;
  }>>([]);

  // Carregar operações de caixa para o modal de detalhes
  const loadDetailsOperations = useCallback(async (session: CashSession) => {
    if (!tenant?.id || !session.id) {
      setDetailsOperations([]);
      return;
    }

    try {
      const sessionIdStr = typeof session.id === 'number' 
        ? String(session.id) 
        : String(session.id).trim();
      
      const opsResponse = await fetch(`/next_api/cash-operations?tenant_id=${encodeURIComponent(tenant.id)}&cash_session_id=${encodeURIComponent(sessionIdStr)}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (opsResponse.ok) {
        const opsData = await opsResponse.json();
        const operations = (opsData.data || []).map((op: any) => ({
          id: op.id,
          tipo: op.operation_type,
          valor: parseFloat(op.amount || 0),
          descricao: op.description || op.notes || '',
          data: op.created_at,
          usuario: op.created_by || 'Sistema',
        }));
        setDetailsOperations(operations);
      } else {
        setDetailsOperations([]);
      }
    } catch (error) {
      console.error('[Caixas] Erro ao buscar operações para detalhes:', error);
      setDetailsOperations([]);
    }
  }, [tenant?.id]);

  // Carregar operações quando o modal de detalhes abrir
  useEffect(() => {
    if (detailsSession) {
      loadDetailsOperations(detailsSession);
    } else {
      setDetailsOperations([]);
    }
  }, [detailsSession, loadDetailsOperations]);

  // Carregar nomes dos usuários
  const loadUserNames = useCallback(async () => {
    if (!tenant?.id || !user?.id) return;
    
    try {
      const timestamp = Date.now();
      const res = await fetch(
        `/next_api/tenant-users?tenant_id=${encodeURIComponent(tenant.id)}&user_id=${encodeURIComponent(user.id)}&_t=${timestamp}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const namesMap = new Map<string, string>();
          data.data.forEach((u: any) => {
            if (u.id && u.name) {
              namesMap.set(u.id, u.name);
            } else if (u.id && u.email) {
              // Se não tem nome, usar email como fallback
              namesMap.set(u.id, u.email.split('@')[0]);
            }
          });
          setUserNamesMap(namesMap);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar nomes de usuários:', error);
    }
  }, [tenant?.id, user?.id]);

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
      // Garantir que os campos de sangrias e reforços estejam presentes
      const enrichedRows = rows.map((session: any) => ({
        ...session,
        total_withdrawals: session.total_withdrawals || 0,
        total_withdrawals_amount: session.total_withdrawals_amount || 0,
        total_supplies: session.total_supplies || 0,
        total_supplies_amount: session.total_supplies_amount || 0,
      }));
      setSessions(enrichedRows);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar sessões de caixa');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, statusFilter, userFilter]);

  useEffect(() => {
    loadUserNames();
  }, [loadUserNames]);

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

  // Função para obter o nome do usuário
  const getUserName = (userId: string | undefined | null): string => {
    if (!userId) return '—';
    const name = userNamesMap.get(String(userId));
    return name || userId; // Se não encontrar nome, retorna o ID como fallback
  };

  const openCount = sessions.filter((s) => s.status === 'open').length;
  const closedCount = sessions.filter((s) => s.status === 'closed').length;

  // Buscar vendas da sessão de caixa
  const loadSessionSales = useCallback(async (session: CashSession) => {
    if (!tenant?.id || !session.opened_at) {
      console.log('[Caixas] Sem tenant ou opened_at:', { tenantId: tenant?.id, openedAt: session.opened_at });
      return [];
    }
    
    try {
      const sessionOpenedAt = new Date(session.opened_at);
      const sessionClosedAt = session.closed_at ? new Date(session.closed_at) : new Date();
      
      console.log('[Caixas] Buscando vendas da sessão:', {
        sessionId: session.id,
        openedAt: sessionOpenedAt.toISOString(),
        closedAt: sessionClosedAt.toISOString(),
        userId: session.user_id
      });
      
      // Buscar vendas da sessão: user_id do operador + apenas sale_source=pdv
      // (mesma base do relatório com "Excluir vendas da API", para totais baterem)
      const params = new URLSearchParams({
        tenant_id: tenant.id,
        branch_scope: 'all',
        sale_source: 'pdv',
      });
      if (session.user_id && String(session.user_id).trim()) {
        params.set('user_id', String(session.user_id).trim());
      }
      
      const res = await fetch(`/next_api/sales?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        const sales = data.sales || data.data || [];
        
        console.log('[Caixas] Vendas recebidas da API:', sales.length);
        
        // Filtrar vendas da sessão (após abertura e antes do fechamento, se fechado)
        // Considerar apenas sale_source='pdv' para bater com o relatório (excluir API e vendas sem origem)
        const filteredSales = sales.filter((sale: any) => {
          if (sale.sale_source === 'api') {
            return false;
          }
          if (sale.sale_source === 'produtos') {
            return false;
          }
          // Apenas vendas do PDV (igual ao relatório com "Excluir vendas da API")
          if (sale.sale_source !== 'pdv') {
            return false;
          }
          
          // Apenas vendas pagas (incluir null como paga, pois vendas do PDV podem ter status null)
          // Vendas do PDV geralmente têm status null ou 'paga', vendas da API podem ter 'completed' ou 'paid'
          const isPaid = sale.status === 'paga' || 
                        sale.status === 'completed' || 
                        sale.status === 'paid' || 
                        sale.status === null || 
                        sale.status === undefined;
          
          if (!isPaid) {
            console.log('[Caixas] Venda excluída (status não pago):', sale.id, sale.status);
            return false;
          }
          
          // Verificar se tem created_at
          if (!sale.created_at) {
            console.log('[Caixas] Venda excluída (sem created_at):', sale.id);
            return false;
          }
          
          const saleDate = new Date(sale.created_at);
          
          // Venda deve ser após abertura (com margem de 1 minuto para evitar problemas de timezone)
          const marginMs = 60 * 1000; // 1 minuto
          if (saleDate.getTime() < (sessionOpenedAt.getTime() - marginMs)) {
            console.log('[Caixas] Venda excluída (antes da abertura):', {
              saleId: sale.id,
              saleDate: saleDate.toISOString(),
              openedAt: sessionOpenedAt.toISOString(),
              diffMinutes: (sessionOpenedAt.getTime() - saleDate.getTime()) / 1000 / 60
            });
            return false;
          }
          
          // Se o caixa foi fechado, venda deve ser antes do fechamento (com margem)
          if (session.closed_at && saleDate.getTime() > (sessionClosedAt.getTime() + marginMs)) {
            console.log('[Caixas] Venda excluída (após fechamento):', {
              saleId: sale.id,
              saleDate: saleDate.toISOString(),
              closedAt: sessionClosedAt.toISOString(),
              diffMinutes: (saleDate.getTime() - sessionClosedAt.getTime()) / 1000 / 60
            });
            return false;
          }
          
          console.log('[Caixas] ✅ Venda incluída:', {
            saleId: sale.id,
            total: sale.total_amount,
            paymentMethod: sale.payment_method,
            saleDate: saleDate.toISOString(),
            saleSource: sale.sale_source || '(sem sale_source)',
            openedAt: sessionOpenedAt.toISOString()
          });
          
          return true;
        });
        
        console.log('[Caixas] Vendas filtradas da sessão:', filteredSales.length);
        if (filteredSales.length > 0) {
          console.log('[Caixas] Primeira venda:', filteredSales[0]);
        }
        
        return filteredSales.map((sale: any) => ({
          id: sale.id,
          total: parseFloat(sale.total_amount || sale.final_amount || sale.total || 0),
          forma_pagamento: sale.payment_method || sale.forma_pagamento || 'dinheiro',
          status: sale.status === 'completed' || sale.status === 'paid' ? 'paga' : (sale.status || 'paga'),
          created_at: sale.created_at, // Incluir created_at para debug
        }));
      } else {
        const errorText = await res.text();
        console.error('[Caixas] Erro na resposta da API:', res.status, errorText);
      }
    } catch (error) {
      console.error('[Caixas] Erro ao buscar vendas da sessão:', error);
    }
    
    return [];
  }, [tenant?.id]);

  // Preparar fechamento de caixa (buscar vendas e mostrar modal)
  const prepareCloseSession = useCallback(async (session: CashSession) => {
    setSessionToClose(session);
    setConfirmCloseId(null);
    
    console.log('[Caixas] Preparando fechamento de sessão:', {
      sessionId: session.id,
      openedAt: session.opened_at,
      closedAt: session.closed_at,
      userId: session.user_id
    });
    
    // Buscar vendas da sessão
    const sales = await loadSessionSales(session);
    console.log('[Caixas] Vendas encontradas para a sessão:', sales.length);
    setSessionSales(sales);
    
    // Buscar operações de caixa reais do banco de dados
    const operations: Array<{
      id: string;
      tipo: 'sangria' | 'reforco' | 'abertura' | 'fechamento';
      valor: number;
      descricao: string;
      data: string;
      usuario: string;
    }> = [];
    
    // Adicionar abertura como operação (não está na tabela cash_operations)
    if (session.opening_amount || session.initial_amount) {
      const openingAmount = session.opening_amount || session.initial_amount || 0;
      operations.push({
        id: `${session.id}-abertura`,
        tipo: 'abertura',
        valor: openingAmount,
        descricao: `Abertura de caixa - Valor inicial: R$ ${openingAmount.toFixed(2)}`,
        data: session.opened_at,
        usuario: session.opened_by || 'Sistema',
      });
    }
    
    // Buscar operações reais do banco de dados
    try {
      if (tenant?.id) {
        const sessionIdStr = typeof session.id === 'number' 
          ? String(session.id) 
          : String(session.id).trim();
        
        const opsResponse = await fetch(`/next_api/cash-operations?tenant_id=${encodeURIComponent(tenant.id)}&cash_session_id=${encodeURIComponent(sessionIdStr)}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (opsResponse.ok) {
          const opsData = await opsResponse.json();
          const dbOperations = (opsData.data || []).map((op: any) => ({
            id: op.id,
            tipo: op.operation_type,
            valor: parseFloat(op.amount || 0),
            descricao: op.description || op.notes || '',
            data: op.created_at,
            usuario: op.created_by || 'Sistema',
          }));
          
          // Adicionar operações do banco (sangrias e reforços)
          operations.push(...dbOperations);
          console.log('[Caixas] Operações de caixa carregadas do banco:', dbOperations.length);
        } else {
          console.warn('[Caixas] Erro ao buscar operações do banco:', opsResponse.status);
        }
      }
    } catch (error) {
      console.error('[Caixas] Erro ao buscar operações de caixa:', error);
    }
    
    console.log('[Caixas] Total de operações de caixa:', operations.length);
    setSessionOperations(operations);
    
    // Mostrar modal de fechamento
    setShowCashClosingModal(true);
  }, [loadSessionSales]);

  // Confirmar fechamento de caixa (chamado pelo modal)
  const handleCashClosing = useCallback(
    async (closingData: CashClosingData) => {
      if (!sessionToClose) return;
      
      if (closingId) return;
      setClosingId(sessionToClose.id);
      
      try {
        // Calcular valores esperados baseados nas vendas
        const vendasDinheiro = sessionSales
          .filter(s => s.forma_pagamento === 'dinheiro')
          .reduce((sum, s) => sum + s.total, 0);
        const expectedCardDebit = sessionSales
          .filter(s => s.forma_pagamento === 'cartao_debito')
          .reduce((sum, s) => sum + s.total, 0);
        const expectedCardCredit = sessionSales
          .filter(s => s.forma_pagamento === 'cartao_credito')
          .reduce((sum, s) => sum + s.total, 0);
        const expectedPix = sessionSales
          .filter(s => s.forma_pagamento === 'pix')
          .reduce((sum, s) => sum + s.total, 0);
        const expectedOther = sessionSales
          .filter(s => !['dinheiro', 'cartao_debito', 'cartao_credito', 'pix'].includes(s.forma_pagamento))
          .reduce((sum, s) => sum + s.total, 0);
        
        // Calcular sangrias e reforços das operações de caixa
        const totalSangrias = sessionOperations
          .filter(op => op.tipo === 'sangria')
          .reduce((sum, op) => sum + op.valor, 0);
        
        const totalReforcos = sessionOperations
          .filter(op => op.tipo === 'reforco')
          .reduce((sum, op) => sum + op.valor, 0);
        
        // Calcular valor esperado em dinheiro considerando reforços e sangrias
        const caixaInicial = Number((sessionToClose as any).opening_amount ?? sessionToClose.initial_amount) || 0;
        const expectedCash = caixaInicial + vendasDinheiro + totalReforcos - totalSangrias;

        const res = await fetch(`/next_api/cash-sessions?id=${encodeURIComponent(sessionToClose.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'closed',
            closed_at: new Date().toISOString(),
            closed_by: user?.email || (user?.id ? String(user.id) : null) || 'Sistema',
            // Valores contados
            closing_amount_cash: closingData.closing_amount_cash,
            closing_amount_card_debit: closingData.closing_amount_card_debit,
            closing_amount_card_credit: closingData.closing_amount_card_credit,
            closing_amount_pix: closingData.closing_amount_pix,
            closing_amount_other: closingData.closing_amount_other,
            // Valores esperados
            expected_cash: expectedCash,
            expected_card_debit: expectedCardDebit,
            expected_card_credit: expectedCardCredit,
            expected_pix: expectedPix,
            expected_other: expectedOther,
            // Diferenças
            difference_cash: closingData.closing_amount_cash - expectedCash,
            difference_card_debit: closingData.closing_amount_card_debit - expectedCardDebit,
            difference_card_credit: closingData.closing_amount_card_credit - expectedCardCredit,
            difference_pix: closingData.closing_amount_pix - expectedPix,
            difference_other: closingData.closing_amount_other - expectedOther,
            difference_amount: 
              (closingData.closing_amount_cash + 
               closingData.closing_amount_card_debit + 
               closingData.closing_amount_card_credit + 
               closingData.closing_amount_pix + 
               closingData.closing_amount_other) - 
              (expectedCash + expectedCardDebit + expectedCardCredit + expectedPix + expectedOther),
            // Estatísticas
            total_sales: sessionSales.length,
            total_sales_amount: sessionSales.reduce((sum, s) => sum + s.total, 0),
            // Sangrias e reforços
            total_withdrawals: sessionOperations.filter(op => op.tipo === 'sangria').length,
            total_withdrawals_amount: totalSangrias,
            total_supplies: sessionOperations.filter(op => op.tipo === 'reforco').length,
            total_supplies_amount: totalReforcos,
            // Observações
            notes: closingData.notes,
            difference_reason: closingData.difference_reason,
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
        setShowCashClosingModal(false);
        setSessionToClose(null);
        setSessionSales([]);
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
    [closingId, loadSessions, statusFilter, user?.email, user?.id, sessionToClose, sessionSales, sessionOperations]
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
                        {getUserName(uid)}
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
                                {getUserName(s.user_id)}
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
                                variant="outline"
                                size="sm"
                                onClick={() => prepareCloseSession(s)}
                                disabled={closingId !== null}
                                className="text-amber-700 border-amber-300 hover:bg-amber-50"
                              >
                                <Lock className="h-3.5 w-3.5 mr-1" />
                                Fechar
                              </Button>
                            </div>
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

        {/* Modal de fechamento de caixa */}
        {sessionToClose && (
          <CashClosingModal
            isOpen={showCashClosingModal}
            onClose={() => {
              setShowCashClosingModal(false);
              setSessionToClose(null);
              setSessionSales([]);
              setSessionOperations([]);
            }}
            onConfirm={handleCashClosing}
            todaySales={sessionSales}
            caixaInicial={Number((sessionToClose as any).opening_amount ?? sessionToClose.initial_amount) || 0}
            caixaOperations={sessionOperations}
            openedAt={sessionToClose.opened_at}
            openedBy={sessionToClose.opened_by}
            tenantId={tenant?.id}
            userId={sessionToClose.user_id}
          />
        )}

        {/* Modal de detalhes do caixa */}
        <Dialog open={detailsSession !== null} onOpenChange={(open) => !open && setDetailsSession(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {detailsSession?.status === 'open' ? 'Visualização do Caixa' : 'Detalhes do Fechamento de Caixa'}
              </DialogTitle>
              <DialogDescription>
                {detailsSession?.status === 'open' 
                  ? 'Visualize as movimentações do caixa em tempo real'
                  : 'Informações completas da sessão de caixa'}
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

                {/* Lista de Operações de Caixa (Sangrias e Reforços) - Disponível para caixas abertos e fechados */}
                {detailsOperations.filter(op => op.tipo === 'sangria' || op.tipo === 'reforco').length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Operações de Caixa (Sangrias e Reforços)</h4>
                    
                    {/* Resumo das operações para caixas abertos */}
                    {detailsSession?.status === 'open' && (
                      <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Total de Sangrias</Label>
                            <p className="text-sm font-semibold text-red-600">
                              {detailsOperations.filter(op => op.tipo === 'sangria').length} operação(ões)
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(
                                detailsOperations
                                  .filter(op => op.tipo === 'sangria')
                                  .reduce((sum, op) => sum + op.valor, 0)
                              )}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Total de Reforços</Label>
                            <p className="text-sm font-semibold text-green-600">
                              {detailsOperations.filter(op => op.tipo === 'reforco').length} operação(ões)
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(
                                detailsOperations
                                  .filter(op => op.tipo === 'reforco')
                                  .reduce((sum, op) => sum + op.valor, 0)
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {detailsOperations
                        .filter(op => op.tipo === 'sangria' || op.tipo === 'reforco')
                        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                        .map((op) => (
                          <div
                            key={op.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              op.tipo === 'reforco'
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={op.tipo === 'reforco' ? 'default' : 'destructive'}
                                  className={
                                    op.tipo === 'reforco'
                                      ? 'bg-green-600 hover:bg-green-700'
                                      : 'bg-red-600 hover:bg-red-700'
                                  }
                                >
                                  {op.tipo === 'reforco' ? 'Reforço' : 'Sangria'}
                                </Badge>
                                <span className="text-sm font-semibold">
                                  {formatCurrency(op.valor)}
                                </span>
                              </div>
                              {op.descricao && (
                                <p className="text-xs text-muted-foreground mt-1">{op.descricao}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(op.data)}</span>
                                {op.usuario && (
                                  <>
                                    <span>•</span>
                                    <span>Por: {op.usuario}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {detailsOperations.filter(op => op.tipo === 'sangria' || op.tipo === 'reforco').length === 0 && detailsSession.status === 'open' && (
                  <div className="border-t pt-4">
                    <div className="text-center py-6 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Nenhuma movimentação registrada ainda</p>
                      <p className="text-xs mt-1">As sangrias e reforços aparecerão aqui quando forem realizadas</p>
                    </div>
                  </div>
                )}

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
