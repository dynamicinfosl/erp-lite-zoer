
'use client';

import React, { useState, useEffect } from 'react';
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
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, Calendar, CreditCard } from 'lucide-react';
import { FinancialTransaction } from '@/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { ENABLE_AUTH } from '@/constants/auth';
import { mockFinancialTransactions } from '@/lib/mock-data';

export default function FinanceiroPage() {
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

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      if (ENABLE_AUTH) {
        const data = await api.get<FinancialTransaction[]>('/financial-transactions');
        setTransactions(data);
      } else {
        setTransactions(mockFinancialTransactions);
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      if (ENABLE_AUTH) {
        toast.error('Erro ao carregar transações');
      }
    } finally {
      setLoading(false);
    }
  };

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
      };

      if (editingTransaction) {
        await api.put(`/financial-transactions?id=${editingTransaction.id}`, transactionData);
        toast.success('Transação atualizada com sucesso');
      } else {
        await api.post('/financial-transactions', transactionData);
        toast.success('Transação criada com sucesso');
      }

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
      await api.delete(`/financial-transactions?id=${id}`);
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

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
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
  };

  // Cálculos financeiros
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthlyTransactions = transactions.filter(t => 
    t.created_at.startsWith(currentMonth)
  );

  const monthlyStats = {
    totalReceitas: monthlyTransactions
      .filter(t => t.transaction_type === 'receita' && t.status === 'pago')
      .reduce((sum, t) => sum + t.amount, 0),
    totalDespesas: monthlyTransactions
      .filter(t => t.transaction_type === 'despesa' && t.status === 'pago')
      .reduce((sum, t) => sum + t.amount, 0),
    receitasPendentes: monthlyTransactions
      .filter(t => t.transaction_type === 'receita' && t.status === 'pendente')
      .reduce((sum, t) => sum + t.amount, 0),
    despesasPendentes: monthlyTransactions
      .filter(t => t.transaction_type === 'despesa' && t.status === 'pendente')
      .reduce((sum, t) => sum + t.amount, 0),
  };

  const saldoMensal = monthlyStats.totalReceitas - monthlyStats.totalDespesas;

  const receitas = filteredTransactions.filter(t => t.transaction_type === 'receita');
  const despesas = filteredTransactions.filter(t => t.transaction_type === 'despesa');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Controle Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie receitas, despesas e fluxo de caixa
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingTransaction(null); }}>
              <Plus className="h-4 w-4 mr-2" />
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlyStats.totalReceitas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pendente: {formatCurrency(monthlyStats.receitasPendentes)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(monthlyStats.totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pendente: {formatCurrency(monthlyStats.despesasPendentes)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoMensal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldoMensal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {saldoMensal >= 0 ? 'Lucro' : 'Prejuízo'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transações</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              Este mês: {monthlyTransactions.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="todas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todas">Todas Transações</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
        </TabsList>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={fetchTransactions}>
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="todas">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Transações ({filteredTransactions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable 
                transactions={filteredTransactions}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                formatCurrency={formatCurrency}
                getStatusBadge={getStatusBadge}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receitas">
          <Card>
            <CardHeader>
              <CardTitle>Receitas ({receitas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable 
                transactions={receitas}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                formatCurrency={formatCurrency}
                getStatusBadge={getStatusBadge}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas">
          <Card>
            <CardHeader>
              <CardTitle>Despesas ({despesas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable 
                transactions={despesas}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                formatCurrency={formatCurrency}
                getStatusBadge={getStatusBadge}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
          <TableRow key={transaction.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm">
                    {transaction.due_date ? 
                      new Date(transaction.due_date).toLocaleDateString('pt-BR') :
                      new Date(transaction.created_at).toLocaleDateString('pt-BR')
                    }
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{transaction.description}</div>
                {transaction.payment_method && (
                  <div className="text-sm text-muted-foreground capitalize">
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
              <div className={`font-semibold ${
                transaction.transaction_type === 'receita' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.transaction_type === 'receita' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </div>
            </TableCell>
            <TableCell>
              {getStatusBadge(transaction.status)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(transaction)}
                >
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(transaction.id)}
                >
                  Excluir
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
