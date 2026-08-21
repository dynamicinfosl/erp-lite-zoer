'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Search, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Calendar, 
  Percent, 
  Clock, 
  FileText, 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  RefreshCw,
  Building,
  Info
} from 'lucide-react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { toast } from 'sonner';
import Link from 'next/link';

export interface PaymentMethodItem {
  id: number;
  tenant_id: string;
  name: string;
  code: string;
  is_active: boolean;
  allow_installments: boolean;
  days_to_due: number;
  fee_percentage: number;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export default function FormasPagamentoPage() {
  const { tenant } = useSimpleAuth();
  const tenantId = tenant?.id;

  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog State
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is_active: true,
    allow_installments: false,
    days_to_due: '0',
    fee_percentage: '0',
    order_index: '1',
  });

  const fetchMethods = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const res = await fetch(`/next_api/payment-methods?tenant_id=${encodeURIComponent(tenantId)}`);
      if (!res.ok) throw new Error('Falha ao carregar formas de pagamento');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMethods(json.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao carregar formas de pagamento');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const handleOpenCreate = () => {
    setEditingMethod(null);
    setFormData({
      name: '',
      code: '',
      is_active: true,
      allow_installments: false,
      days_to_due: '0',
      fee_percentage: '0',
      order_index: String((methods.length || 0) + 1),
    });
    setShowModal(true);
  };

  const handleOpenEdit = (method: PaymentMethodItem) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      code: method.code,
      is_active: method.is_active,
      allow_installments: method.allow_installments,
      days_to_due: String(method.days_to_due || 0),
      fee_percentage: String(method.fee_percentage || 0),
      order_index: String(method.order_index || 1),
    });
    setShowModal(true);
  };

  const handleToggleActive = async (method: PaymentMethodItem) => {
    if (!tenantId) return;
    const newStatus = !method.is_active;

    // Atualização otimista
    setMethods(prev => prev.map(m => m.id === method.id ? { ...m, is_active: newStatus } : m));

    try {
      const res = await fetch('/next_api/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: method.id,
          tenant_id: tenantId,
          is_active: newStatus,
        }),
      });

      if (!res.ok) throw new Error('Falha ao atualizar status');
      toast.success(`Forma de pagamento "${method.name}" ${newStatus ? 'ativada' : 'desativada'}`);
    } catch (err: any) {
      // Reverter se falhar
      setMethods(prev => prev.map(m => m.id === method.id ? { ...m, is_active: !newStatus } : m));
      toast.error('Erro ao alterar status da forma de pagamento');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      toast.error('Tenant não identificado');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Informe o nome da forma de pagamento');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        tenant_id: tenantId,
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        is_active: formData.is_active,
        allow_installments: formData.allow_installments,
        days_to_due: parseInt(formData.days_to_due) || 0,
        fee_percentage: parseFloat(formData.fee_percentage) || 0,
        order_index: parseInt(formData.order_index) || 1,
      };

      let res;
      if (editingMethod) {
        res = await fetch('/next_api/payment-methods', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingMethod.id,
            ...payload,
          }),
        });
      } else {
        res = await fetch('/next_api/payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao salvar forma de pagamento');
      }

      toast.success(editingMethod ? 'Forma de pagamento atualizada!' : 'Forma de pagamento criada com sucesso!');
      setShowModal(false);
      fetchMethods();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao salvar forma de pagamento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (method: PaymentMethodItem) => {
    if (!tenantId) return;
    if (!confirm(`Deseja realmente excluir permanentemente a forma de pagamento "${method.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/next_api/payment-methods?id=${method.id}&tenant_id=${encodeURIComponent(tenantId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao excluir forma de pagamento');
      }

      toast.success('Forma de pagamento excluída');
      fetchMethods();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao excluir forma de pagamento');
    }
  };

  const getMethodIcon = (code: string) => {
    const c = code?.toLowerCase() || '';
    if (c.includes('dinheiro') || c.includes('cash')) return <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
    if (c.includes('pix')) return <Smartphone className="h-5 w-5 text-teal-600 dark:text-teal-400" />;
    if (c.includes('debito')) return <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
    if (c.includes('credito') || c.includes('card')) return <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    if (c.includes('prazo') || c.includes('fiado')) return <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    if (c.includes('boleto')) return <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
    if (c.includes('transferencia') || c.includes('ted') || c.includes('doc')) return <Building className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
    return <CreditCard className="h-5 w-5 text-slate-600 dark:text-slate-400" />;
  };

  const filteredMethods = useMemo(() => {
    if (!searchTerm.trim()) return methods;
    const term = searchTerm.toLowerCase().trim();
    return methods.filter(
      m => m.name.toLowerCase().includes(term) || m.code.toLowerCase().includes(term)
    );
  }, [methods, searchTerm]);

  const stats = useMemo(() => {
    const total = methods.length;
    const active = methods.filter(m => m.is_active).length;
    const installments = methods.filter(m => m.allow_installments).length;
    const avgDays = methods.length > 0
      ? Math.round(methods.reduce((acc, m) => acc + (m.days_to_due || 0), 0) / methods.length)
      : 0;

    return { total, active, installments, avgDays };
  }, [methods]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/financeiro" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voltar ao Financeiro
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Formas de Pagamento
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as formas de pagamento disponíveis globalmente para Vendas, PDV e Financeiro do seu negócio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMethods} 
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            onClick={handleOpenCreate} 
            className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nova Forma de Pagamento
          </Button>
        </div>
      </div>

      {/* Banner Informativo */}
      <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4 flex items-start gap-3 text-sm text-blue-900 dark:text-blue-200">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-0.5">Configuração Global Unificada</p>
          <p className="text-blue-800/90 dark:text-blue-300 text-xs sm:text-sm">
            As formas de pagamento ativas aqui ficam disponíveis em todas as telas de venda (Venda de Balcão, PDV Caixa, Vendas de Produtos), Ordem de Serviços e no Contas a Receber/Pagar.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="juga-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Cadastrado</p>
              <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Formas Ativas</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{stats.active}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aceita Parcelamento</p>
              <p className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">{stats.installments}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prazo Médio</p>
              <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{stats.avgDays} dias</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card / Table */}
      <Card className="juga-card shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
          <div>
            <CardTitle className="text-lg font-bold">Listagem de Formas de Pagamento</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Ative, desative ou personalize as regras financeiras de cada método.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-background"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-muted-foreground">Carregando formas de pagamento...</p>
            </div>
          ) : filteredMethods.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Nenhuma forma de pagamento encontrada</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchTerm ? 'Nenhum resultado corresponde à busca.' : 'Clique em "Nova Forma de Pagamento" para cadastrar.'}
              </p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-[70px] text-center">Ordem</TableHead>
                    <TableHead>Forma de Pagamento</TableHead>
                    <TableHead>Código Interno</TableHead>
                    <TableHead className="text-center">Parcelamento</TableHead>
                    <TableHead className="text-center">Vencimento Padrão</TableHead>
                    <TableHead className="text-center">Taxa (%)</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right pr-6">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMethods.map((method) => (
                    <TableRow 
                      key={method.id} 
                      className={`hover:bg-muted/30 transition-colors ${!method.is_active ? 'opacity-60 bg-muted/10' : ''}`}
                    >
                      <TableCell className="text-center font-mono text-xs font-semibold text-muted-foreground">
                        {method.order_index}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center shrink-0">
                            {getMethodIcon(method.code)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{method.name}</p>
                            {method.code === 'a_prazo' && (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Substitui o antigo "Fiado"</p>
                            )}
                            {method.code === 'boleto_bancario' && (
                              <p className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">Boleto com vencimento</p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[11px] bg-background">
                          {method.code}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        {method.allow_installments ? (
                          <Badge variant="default" className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-[11px]">
                            Permitido
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">À vista</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center text-sm">
                        {method.days_to_due > 0 ? (
                          <span className="font-medium text-slate-700 dark:text-slate-300">{method.days_to_due} dias</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Mesmo dia (0)</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center text-sm">
                        {method.fee_percentage > 0 ? (
                          <span className="font-semibold text-rose-600 dark:text-rose-400">{method.fee_percentage}%</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">0%</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={method.is_active}
                            onCheckedChange={() => handleToggleActive(method)}
                          />
                          <span className="text-xs font-medium w-12 text-left">
                            {method.is_active ? (
                              <span className="text-emerald-600 dark:text-emerald-400">Ativo</span>
                            ) : (
                              <span className="text-slate-400">Inativo</span>
                            )}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                            onClick={() => handleOpenEdit(method)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            onClick={() => handleDelete(method)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Modal Criar / Editar */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              {editingMethod ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
            </DialogTitle>
            <DialogDescription>
              Configure o nome exibido, prazo e regras desta forma de pagamento para o seu negócio.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nome da Forma de Pagamento *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: A Prazo, Boleto Bancário, PIX Empresa..."
                required
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="days_to_due" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Dias para Vencimento
                </Label>
                <Input
                  id="days_to_due"
                  type="number"
                  min="0"
                  max="365"
                  value={formData.days_to_due}
                  onChange={(e) => setFormData(prev => ({ ...prev, days_to_due: e.target.value }))}
                  placeholder="0 = À vista"
                  className="h-10"
                />
                <p className="text-[10px] text-muted-foreground">0 para mesmo dia</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fee_percentage" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                  Taxa / Custo (%)
                </Label>
                <Input
                  id="fee_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.fee_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, fee_percentage: e.target.value }))}
                  placeholder="0.00"
                  className="h-10"
                />
                <p className="text-[10px] text-muted-foreground">Ex: 2.5 para cartão</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="order_index" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ordem de Exibição
                </Label>
                <Input
                  id="order_index"
                  type="number"
                  min="1"
                  value={formData.order_index}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_index: e.target.value }))}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Código do Sistema (Opcional)
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Gerado automaticamente"
                  disabled={!!editingMethod}
                  className="h-10 font-mono text-xs"
                />
              </div>
            </div>

            <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow_installments" className="text-sm font-medium cursor-pointer">
                    Permite Parcelamento
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Habilita divisão em parcelas na tela de vendas.
                  </p>
                </div>
                <Switch
                  id="allow_installments"
                  checked={formData.allow_installments}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_installments: checked }))}
                />
              </div>

              <div className="border-t pt-3 flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                    Método Ativo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Exibe esta opção nas telas de venda e financeiro.
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? 'Salvando...' : (editingMethod ? 'Salvar Alterações' : 'Criar Forma de Pagamento')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
