
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, Calendar, CreditCard, Receipt, ArrowRight } from 'lucide-react';
import { FinancialTransaction } from '@/types';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
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
  const { tenant, user, loading: authLoading } = useSimpleAuth();
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

  // Debug: verificar se tenant e formData estão carregados
  console.log('🏢 Tenant carregado:', tenant);
  console.log('👤 Usuário logado:', user);
  console.log('⏳ Auth loading:', authLoading);
  console.log('📋 FormData atual:', formData);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);

      // Usar tenant padrão se não estiver carregado (mesmo que usado na criação)
      const tenantId = tenant?.id || '11111111-1111-1111-1111-111111111111';
      console.log('🔍 Buscando transações para tenant:', tenantId);
      console.log('🏢 Tenant original:', tenant);

      const res = await fetch(`/next_api/financial-transactions?tenant_id=${encodeURIComponent(tenantId)}`);
      console.log('📡 Resposta da busca:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Erro na busca:', errorData);
        throw new Error('Erro ao carregar transações');
      }
      
      const json = await res.json();
      console.log('📋 Dados recebidos da API:', json);
      
      const data = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
      console.log('📊 Transações processadas:', data.length, data);
      
      setTransactions(data);
    } catch (error) {
      console.error('❌ Erro ao carregar transações:', error);
      toast.error('Erro ao carregar transações');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    console.log('🔄 useEffect financeiro - fetchTransactions chamado');
    console.log('🔄 Tenant disponível:', tenant?.id);
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSubmit = async (e?: React.FormEvent) => {
    console.log('🎯 handleSubmit chamado!', e);
    if (e) {
      e.preventDefault();
    }
    
    console.log('📋 FormData atual:', formData);
    
    // Verificar se a autenticação ainda está carregando
    if (authLoading) {
      console.log('⏳ Aguardando carregamento da autenticação...');
      toast.error('Aguardando carregamento da autenticação...');
      return;
    }
    
    if (!formData.description || !formData.amount || !formData.category) {
      console.log('❌ Campos obrigatórios faltando:', {
        description: !!formData.description,
        amount: !!formData.amount,
        category: !!formData.category
      });
      toast.error('Descrição, valor e categoria são obrigatórios');
      return;
    }

    console.log('✅ Campos obrigatórios preenchidos');

    // Usar tenant padrão se não estiver carregado
    const tenantId = tenant?.id || '00000000-0000-0000-0000-000000000000';
    console.log('✅ Usando tenant ID:', tenantId);
    console.log('🔍 Tenant original:', tenant);
    
    // Se tenant for null, usar um tenant válido dos testes
    const finalTenantId = tenant?.id || '11111111-1111-1111-1111-111111111111';
    console.log('🎯 Tenant ID final:', finalTenantId);

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date || new Date().toISOString().split('T')[0],
        paid_date: formData.status === 'pago' ? new Date().toISOString().split('T')[0] : null,
        tenant_id: finalTenantId
      };

      console.log('📤 Enviando dados da transação:', transactionData);
      console.log('🏢 Tenant ID final:', finalTenantId);

      const res = await fetch(`/next_api/financial-transactions`, {
        method: editingTransaction ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });

      console.log('📡 Resposta da API:', res.status, res.statusText);

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Erro da API:', errorData);
        throw new Error(`Erro ao salvar transação: ${errorData.error || res.statusText}`);
      }

      const responseData = await res.json();
      console.log('✅ Resposta da API:', responseData);

      toast.success(editingTransaction ? 'Transação atualizada com sucesso' : 'Transação criada com sucesso');
      setShowDialog(false);
      setEditingTransaction(null);
      resetForm();
      fetchTransactions();
    } catch (error) {
      console.error('❌ Erro ao salvar transação:', error);
      toast.error(`Erro ao salvar transação: ${error.message}`);
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
      console.log('🗑️ Tentando excluir transação ID:', id);
      
      const res = await fetch(`/next_api/financial-transactions?id=${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('📡 Resposta da API:', res.status, res.statusText);

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Erro da API:', errorData);
        throw new Error(errorData.error || 'Erro ao excluir transação');
      }

      const result = await res.json();
      console.log('✅ Transação excluída com sucesso:', result);

      toast.success('Transação excluída com sucesso');
      fetchTransactions();
    } catch (error) {
      console.error('❌ Erro ao excluir transação:', error);
      toast.error(`Erro ao excluir transação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
    () => {
      const result = transactions.filter(
        (transaction) =>
          transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.category.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      console.log('📋 Transações filtradas:', result.length, 'de', transactions.length, result);
      return result;
    },
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
    () => {
      const result = filteredTransactions.filter((t) => t.transaction_type === 'receita');
      console.log('📊 Receitas filtradas:', result.length, result);
      return result;
    },
    [filteredTransactions],
  );

  const despesas = useMemo(
    () => {
      const result = filteredTransactions.filter((t) => t.transaction_type === 'despesa');
      console.log('📊 Despesas filtradas:', result.length, result);
      return result;
    },
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
        trend: monthlyStats.receitasPendentes > 0 ? 'neutral' : 'up',
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
        color: monthlyStats.saldoMensal >= 0 ? 'accent' : 'error',
        trend: monthlyStats.saldoMensal >= 0 ? 'up' : 'down',
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
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
            <div className="relative">
              {/* Header com gradiente */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-white">
                      {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 mt-1">
                      {editingTransaction ? 'Atualize as informações da transação.' : 'Preencha as informações da transação abaixo. Os campos marcados com * são obrigatórios.'}
                    </DialogDescription>
                  </div>
                </div>
              </div>
              
              {/* Conteúdo principal */}
              <div className="p-6 bg-slate-800/50 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="transaction_type" className="text-sm font-medium text-slate-200">Tipo *</Label>
                      <Select
                        value={formData.transaction_type}
                        onValueChange={(value: 'receita' | 'despesa') => 
                          setFormData(prev => ({ ...prev, transaction_type: value }))
                        }
                      >
                        <SelectTrigger className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600 shadow-xl">
                          <SelectItem value="receita" className="hover:bg-slate-600 text-white">Receita</SelectItem>
                          <SelectItem value="despesa" className="hover:bg-slate-600 text-white">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="category" className="text-sm font-medium text-slate-200">Categoria *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600 shadow-xl">
                          {formData.transaction_type === 'receita' ? (
                            <>
                              <SelectItem value="Vendas" className="hover:bg-slate-600 text-white">Vendas</SelectItem>
                              <SelectItem value="Serviços" className="hover:bg-slate-600 text-white">Serviços</SelectItem>
                              <SelectItem value="Outras Receitas" className="hover:bg-slate-600 text-white">Outras Receitas</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="Fornecedores" className="hover:bg-slate-600 text-white">Fornecedores</SelectItem>
                              <SelectItem value="Aluguel" className="hover:bg-slate-600 text-white">Aluguel</SelectItem>
                              <SelectItem value="Energia" className="hover:bg-slate-600 text-white">Energia</SelectItem>
                              <SelectItem value="Água" className="hover:bg-slate-600 text-white">Água</SelectItem>
                              <SelectItem value="Internet" className="hover:bg-slate-600 text-white">Internet</SelectItem>
                              <SelectItem value="Telefone" className="hover:bg-slate-600 text-white">Telefone</SelectItem>
                              <SelectItem value="Combustível" className="hover:bg-slate-600 text-white">Combustível</SelectItem>
                              <SelectItem value="Manutenção" className="hover:bg-slate-600 text-white">Manutenção</SelectItem>
                              <SelectItem value="Marketing" className="hover:bg-slate-600 text-white">Marketing</SelectItem>
                              <SelectItem value="Outras Despesas" className="hover:bg-slate-600 text-white">Outras Despesas</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="description" className="text-sm font-medium text-slate-200">Descrição *</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Digite a descrição da transação"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="amount" className="text-sm font-medium text-slate-200">Valor *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setFormData(prev => ({ ...prev, amount: value }));
                          }
                        }}
                        placeholder="0.00"
                        className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                        required
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="payment_method" className="text-sm font-medium text-slate-200">Forma de Pagamento</Label>
                      <Select
                        value={formData.payment_method}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                      >
                        <SelectTrigger className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600 shadow-xl">
                          <SelectItem value="dinheiro" className="hover:bg-slate-600 text-white">Dinheiro</SelectItem>
                          <SelectItem value="pix" className="hover:bg-slate-600 text-white">PIX</SelectItem>
                          <SelectItem value="cartao_debito" className="hover:bg-slate-600 text-white">Cartão Débito</SelectItem>
                          <SelectItem value="cartao_credito" className="hover:bg-slate-600 text-white">Cartão Crédito</SelectItem>
                          <SelectItem value="transferencia" className="hover:bg-slate-600 text-white">Transferência</SelectItem>
                          <SelectItem value="boleto" className="hover:bg-slate-600 text-white">Boleto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="due_date" className="text-sm font-medium text-slate-200">Data de Vencimento</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                        className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white"
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="status" className="text-sm font-medium text-slate-200">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'pendente' | 'pago' | 'cancelado') => 
                          setFormData(prev => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600 shadow-xl">
                          <SelectItem value="pendente" className="hover:bg-slate-600 text-white">Pendente</SelectItem>
                          <SelectItem value="pago" className="hover:bg-slate-600 text-white">Pago</SelectItem>
                          <SelectItem value="cancelado" className="hover:bg-slate-600 text-white">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="notes" className="text-sm font-medium text-slate-200">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Observações adicionais sobre a transação..."
                      rows={3}
                      className="bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400 resize-none"
                    />
                  </div>

                  {/* Botões do formulário */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowDialog(false)}
                      className="w-full sm:w-auto border-slate-500 bg-slate-700/50 hover:bg-slate-600 text-slate-200 hover:text-white h-11 font-medium transition-all duration-200 hover:shadow-md"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-11 font-medium transition-all duration-200 hover:shadow-lg"
                    >
                      {editingTransaction ? 'Atualizar' : 'Criar'} Transação
                    </Button>
                  </div>

                </form>
              </div>
            </div>
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
        <Card className="lg:col-span-2 juga-card overflow-hidden">
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
          <CardContent className="space-y-4 p-6">
            <Tabs defaultValue="todas" className="space-y-4">
              <TabsList className="w-full justify-start">
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
                    <div key={transaction.id} className="rounded-lg border border-slate-600 bg-slate-800/50 p-4 hover:bg-slate-800/70 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate" title={transaction.description}>
                            {transaction.description}
                          </p>
                          <p className="text-xs text-slate-300 capitalize mt-1">
                            {transaction.category} • {transaction.payment_method?.replace('_', ' ') || 'Sem método'}
                          </p>
                        </div>
                        <Badge 
                          variant={transaction.transaction_type === 'receita' ? 'default' : 'destructive'}
                          className="shrink-0"
                        >
                          {transaction.transaction_type === 'receita' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {transaction.due_date
                            ? new Date(transaction.due_date).toLocaleDateString('pt-BR')
                            : new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className={`text-sm font-semibold ${
                          transaction.transaction_type === 'receita' ? 'text-green-400' : 'text-red-400'
                        }`}>
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
                    <div key={transaction.id} className="rounded-lg border border-red-500/50 bg-red-900/20 p-4 hover:bg-red-900/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate" title={transaction.description}>
                            {transaction.description}
                          </p>
                          <p className="text-xs text-red-200 mt-1">{transaction.category}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-2 text-xs border-red-400 text-red-200 hover:bg-red-800/50 shrink-0"
                          onClick={() => handleEdit(transaction)}
                        >
                          Resolver
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-red-300">
                        <span>Atrasado desde {transaction.due_date ? new Date(transaction.due_date).toLocaleDateString('pt-BR') : '--'}</span>
                        <span className="font-semibold text-red-400">{formatCurrency(transaction.amount)}</span>
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
    <div className="w-full">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pb-8">
        <Table className="min-w-[1000px] w-full mb-4">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Data</TableHead>
              <TableHead className="min-w-[250px]">Descrição</TableHead>
              <TableHead className="w-[140px]">Categoria</TableHead>
              <TableHead className="w-[140px]">Tipo</TableHead>
              <TableHead className="w-[140px]">Valor</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[200px] text-right">Ações</TableHead>
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
              <TableCell className="max-w-[250px]">
                <div className="truncate">
                  <div className="font-medium text-heading truncate" title={transaction.description}>
                    {transaction.description}
                  </div>
                  {transaction.payment_method && (
                    <div className="text-xs text-muted-foreground capitalize truncate">
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
                <div className="flex items-center justify-end gap-1">
                  <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => onEdit(transaction)}>
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" className="h-8 px-2 text-xs" onClick={() => onDelete(transaction.id)}>
                    Excluir
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </div>
  );
}
