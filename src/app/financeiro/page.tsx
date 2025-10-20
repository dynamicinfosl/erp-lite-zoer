
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, Calendar, CreditCard, Receipt, ArrowRight } from 'lucide-react';
import { FinancialTransaction } from '@/types';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { JugaKPICard } from '@/components/dashboard/JugaComponents';

interface FinancialRecord {
  id: string
  type: 'receita' | 'despesa'
  description: string
  amount: number
  userId: string
  category: string
  date: string
  status: 'pendente' | 'pago'
}


export default function FinanceiroPage() {
  const { tenant } = useSimpleAuth();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [formData, setFormData] = useState({
    transaction_type: 'receita' as 'receita' | 'despesa',
    category: '',
    description: '',
    amount: '',
    payment_method: '',
    due_date: '',
    status: 'pendente' as 'pendente' | 'pago' | 'cancelado',
    notes: '',
  });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);

      if (!tenant?.id) { 
        setTransactions([]); 
        return; 
      }

      const res = await fetch(`/next_api/financial-transactions?tenant_id=${encodeURIComponent(tenant.id)}`);
      if (!res.ok) throw new Error('Erro ao carregar transações');
      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast.error('Erro ao carregar transações');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category) {
      toast.error('Descrição, valor e categoria são obrigatórios');
      return;
    }

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date || new Date().toISOString().split('T')[0],
        paid_date: formData.status === 'pago' ? new Date().toISOString().split('T')[0] : null,
        tenant_id: tenant?.id
      };

      const res = await fetch(`/next_api/financial-transactions`, {
        method: editingTransaction ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });

      if (!res.ok) throw new Error('Erro ao salvar transação');

      toast.success(editingTransaction ? 'Transação atualizada com sucesso' : 'Transação criada com sucesso');
      setShowDialog(false);
      setEditingTransaction(null);
      resetForm();
      fetchTransactions();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast.error('Erro ao salvar transação');
    }
  };

  const handleEdit = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      transaction_type: transaction.transaction_type,
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount.toString(),
      payment_method: transaction.payment_method || '',
      due_date: transaction.due_date || '',
      status: transaction.status,
      notes: transaction.notes || '',
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const res = await fetch(`/next_api/financial-transactions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tenant_id: tenant?.id })
      });

      if (!res.ok) throw new Error('Erro ao excluir transação');

      toast.success('Transação excluída com sucesso');
      fetchTransactions();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
    }
  };

  const resetForm = () => {
    setFormData({
      transaction_type: 'receita',
      category: '',
      description: '',
      amount: '',
      payment_method: '',
      due_date: '',
      status: 'pendente',
      notes: '',
    });
  };

  const filteredTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.category.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [transactions, searchTerm],
  );

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'pago':
        return <Badge variant="default" className="bg-green-600">Pago</Badge>;
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const monthlyTransactions = useMemo(
    () =>
      transactions.filter((t) =>
        t.created_at ? t.created_at.startsWith(currentMonth) : false,
      ),
    [transactions, currentMonth],
  );

  const monthlyStats = useMemo(() => {
    const totalReceitas = monthlyTransactions
      .filter((t) => t.transaction_type === 'receita' && t.status === 'pago')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDespesas = monthlyTransactions
      .filter((t) => t.transaction_type === 'despesa' && t.status === 'pago')
      .reduce((sum, t) => sum + t.amount, 0);

    const receitasPendentes = monthlyTransactions
      .filter((t) => t.transaction_type === 'receita' && t.status === 'pendente')
      .reduce((sum, t) => sum + t.amount, 0);

    const despesasPendentes = monthlyTransactions
      .filter((t) => t.transaction_type === 'despesa' && t.status === 'pendente')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalReceitas,
      totalDespesas,
      receitasPendentes,
      despesasPendentes,
      saldoMensal: totalReceitas - totalDespesas,
    };
  }, [monthlyTransactions]);

  const receitas = useMemo(
    () => filteredTransactions.filter((t) => t.transaction_type === 'receita'),
    [filteredTransactions],
  );

  const despesas = useMemo(
    () => filteredTransactions.filter((t) => t.transaction_type === 'despesa'),
    [filteredTransactions],
  );

  const upcomingPayments = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.due_date && new Date(t.due_date) >= new Date())
        .sort((a, b) => new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime())
        .slice(0, 5),
    [filteredTransactions],
  );

  const overduePayments = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.status === 'pendente' && t.due_date && new Date(t.due_date) < new Date())
        .slice(0, 5),
    [filteredTransactions],
  );

  const summaryCards = useMemo(
    () => [
      {
        title: 'Receitas do Mês',
        value: formatCurrency(monthlyStats.totalReceitas),
        description: `${formatCurrency(monthlyStats.receitasPendentes)} pendentes`,
        color: 'success' as const,
        trend: monthlyStats.receitasPendentes > 0 ? 'neutral' as const : 'up' as const,
        trendValue:
          monthlyStats.receitasPendentes > 0
            ? `${formatCurrency(monthlyStats.receitasPendentes)}`
            : '+100%',
        icon: <TrendingUp className="h-5 w-5" />,
      },
      {
        title: 'Despesas do Mês',
        value: formatCurrency(monthlyStats.totalDespesas),
        description: `${formatCurrency(monthlyStats.despesasPendentes)} pendentes`,
        color: 'warning' as const,
        trend: 'neutral' as const,
        trendValue: formatCurrency(monthlyStats.despesasPendentes),
        icon: <TrendingDown className="h-5 w-5" />,
      },
      {
        title: 'Saldo Mensal',
        value: formatCurrency(monthlyStats.saldoMensal),
        description: monthlyStats.saldoMensal >= 0 ? 'Situação saudável' : 'Despesas acima das receitas',
        color: monthlyStats.saldoMensal >= 0 ? 'accent' as const : 'error' as const,
        trend: monthlyStats.saldoMensal >= 0 ? 'up' as const : 'down' as const,
        trendValue: monthlyStats.saldoMensal >= 0 ? '+8.4%' : '-4.2%',
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        title: 'Transações Registradas',
        value: `${transactions.length}`,
        description: `${monthlyTransactions.length} neste mês`,
        color: 'primary' as const,
        trend: 'neutral' as const,
        trendValue: `${receitas.length} receitas / ${despesas.length} despesas`,
        icon: <CreditCard className="h-5 w-5" />,
      },
    ],
    [despesas.length, formatCurrency, monthlyStats, monthlyTransactions.length, receitas.length, transactions.length],
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Badge className="w-fit bg-blue-600">Financeiro</Badge>
          <h1 className="text-3xl font-bold text-heading">Visão Financeira Consolidada</h1>
          <p className="text-muted-foreground max-w-2xl">
            Acompanhe receitas, despesas, fluxo de caixa e vencimentos críticos do seu negócio em um painel moderno.
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2 juga-gradient text-white" onClick={() => { resetForm(); setEditingTransaction(null); }}>
              <Plus className="h-4 w-4" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction_type">Tipo *</Label>
                  <Select
                    value={formData.transaction_type}
                    onValueChange={(value: 'receita' | 'despesa') => 
                      setFormData(prev => ({ ...prev, transaction_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.transaction_type === 'receita' ? (
                        <>
                          <SelectItem value="Vendas">Vendas</SelectItem>
                          <SelectItem value="Serviços">Serviços</SelectItem>
                          <SelectItem value="Outras Receitas">Outras Receitas</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Fornecedores">Fornecedores</SelectItem>
                          <SelectItem value="Aluguel">Aluguel</SelectItem>
                          <SelectItem value="Energia">Energia</SelectItem>
                          <SelectItem value="Água">Água</SelectItem>
                          <SelectItem value="Internet">Internet</SelectItem>
                          <SelectItem value="Telefone">Telefone</SelectItem>
                          <SelectItem value="Combustível">Combustível</SelectItem>
                          <SelectItem value="Manutenção">Manutenção</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Outras Despesas">Outras Despesas</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Forma de Pagamento</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                      <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Data de Vencimento</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'pendente' | 'pago' | 'cancelado') => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTransaction ? 'Atualizar' : 'Criar'} Transação
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <JugaKPICard
            key={card.title}
            title={card.title}
            value={card.value}
            description={card.description}
            trend={card.trend}
            trendValue={card.trendValue}
            icon={card.icon}
            color={card.color}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 juga-card">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-heading">Fluxo de Caixa</CardTitle>
              <p className="text-caption text-sm">Monitoramento diário das entradas e saídas financeiras</p>
            </div>
            <Button variant="outline" className="gap-2" onClick={fetchTransactions}>
              <Receipt className="h-4 w-4" />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="todas" className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="receitas">Receitas</TabsTrigger>
                <TabsTrigger value="despesas">Despesas</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descrição ou categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <TabsContent value="todas" className="space-y-3">
                <TransactionTable
                  transactions={filteredTransactions}
                  loading={loading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  formatCurrency={formatCurrency}
                  getStatusBadge={getStatusBadge}
                />
              </TabsContent>

              <TabsContent value="receitas">
                <TransactionTable
                  transactions={receitas}
                  loading={loading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  formatCurrency={formatCurrency}
                  getStatusBadge={getStatusBadge}
                />
              </TabsContent>

              <TabsContent value="despesas">
                <TransactionTable
                  transactions={despesas}
                  loading={loading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  formatCurrency={formatCurrency}
                  getStatusBadge={getStatusBadge}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="juga-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-heading">Próximos Vencimentos</CardTitle>
              <p className="text-caption text-sm">Pagamentos e recebimentos previstos</p>
            </CardHeader>
            <CardContent>
              {upcomingPayments.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum vencimento futuro.</div>
              ) : (
                <div className="space-y-3">
                  {upcomingPayments.map((transaction) => (
                    <div key={transaction.id} className="rounded-lg border p-3 juga-gradient-surface">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-heading">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {transaction.category} • {transaction.payment_method?.replace('_', ' ') || 'Sem método'}
                          </p>
                        </div>
                        <Badge variant={transaction.transaction_type === 'receita' ? 'default' : 'destructive'}>
                          {transaction.transaction_type === 'receita' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-caption text-xs text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {transaction.due_date
                            ? new Date(transaction.due_date).toLocaleDateString('pt-BR')
                            : new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-sm font-semibold text-heading">
                          {transaction.transaction_type === 'receita' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="juga-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-heading">Alertas de Atraso</CardTitle>
              <p className="text-caption text-sm">Transações pendentes com vencimento expirado</p>
            </CardHeader>
            <CardContent>
              {overduePayments.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhuma transação em atraso.</div>
              ) : (
                <div className="space-y-3">
                  {overduePayments.map((transaction) => (
                    <div key={transaction.id} className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-heading">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">{transaction.category}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-2 text-xs"
                          onClick={() => handleEdit(transaction)}
                        >
                          Resolver
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Atrasado desde {transaction.due_date ? new Date(transaction.due_date).toLocaleDateString('pt-BR') : '--'}</span>
                        <span className="font-semibold text-red-600">{formatCurrency(transaction.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Componente da tabela de transações
function TransactionTable({ 
  transactions, 
  loading, 
  onEdit, 
  onDelete, 
  formatCurrency, 
  getStatusBadge 
}: {
  transactions: FinancialTransaction[];
  loading: boolean;
  onEdit: (transaction: FinancialTransaction) => void;
  onDelete: (id: number) => void;
  formatCurrency: (value: number) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[420px]">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm">
                      {transaction.due_date
                        ? new Date(transaction.due_date).toLocaleDateString('pt-BR')
                        : new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium text-heading">{transaction.description}</div>
                  {transaction.payment_method && (
                    <div className="text-xs text-muted-foreground capitalize">
                      {transaction.payment_method.replace('_', ' ')}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{transaction.category}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {transaction.transaction_type === 'receita' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <Badge variant={transaction.transaction_type === 'receita' ? 'default' : 'destructive'}>
                    {transaction.transaction_type === 'receita' ? 'Receita' : 'Despesa'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div
                  className={`font-semibold ${
                    transaction.transaction_type === 'receita' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.transaction_type === 'receita' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(transaction)}>
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(transaction.id)}>
                    Excluir
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
