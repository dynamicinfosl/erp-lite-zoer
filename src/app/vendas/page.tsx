'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  MoreHorizontal, 
  Search, 
  Settings2, 
  Upload, 
  Download, 
  Filter,
  ShoppingCart,
  Trash2,
  Edit,
  Eye,
  DollarSign,
  User,
  Calendar,
  Receipt,
  TrendingUp,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { JugaKPICard } from '@/components/dashboard/JugaComponents';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';

interface Sale {
  id: string;
  numero: string;
  cliente: string;
  vendedor?: string;
  itens: Array<{
    produto: string;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
  }>;
  subtotal: number;
  desconto: number;
  total: number;
  forma_pagamento: 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'boleto';
  status: 'pendente' | 'paga' | 'cancelada';
  data_venda: string;
  observacoes?: string;
}

interface ColumnVisibility {
  numero: boolean;
  cliente: boolean;
  vendedor: boolean;
  total: boolean;
  forma_pagamento: boolean;
  status: boolean;
  data_venda: boolean;
}

export default function VendasPage() {
  const { tenant } = useSimpleAuth();
  const [vendas, setVendas] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    numero: true,
    cliente: true,
    vendedor: true,
    total: true,
    forma_pagamento: true,
    status: true,
    data_venda: true,
  });

  // Filtros avançados
  const [advancedFilters, setAdvancedFilters] = useState({
    status: '',
    forma_pagamento: '',
    vendedor: '',
    data_inicio: '',
    data_fim: '',
    valor_min: '',
    valor_max: ''
  });

  // Estados para formulário
  const [newVenda, setNewVenda] = useState({
    cliente: '',
    vendedor: '',
    forma_pagamento: 'dinheiro' as 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'boleto',
    observacoes: ''
  });

  const loadVendas = useCallback(async () => {
    try {
      setLoading(true);
      if (!tenant?.id) { setVendas([]); return; }

      const res = await fetch(`/next_api/sales?tenant_id=${encodeURIComponent(tenant.id)}`);
      if (!res.ok) throw new Error('Erro ao carregar vendas');
      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
      const mapped: Sale[] = (data || []).map((s: any, i: number) => ({
        id: String(s.id ?? i + 1),
        numero: s.sale_number ?? s.numero ?? `V-${new Date().getFullYear()}-${String(i + 1).padStart(3,'0')}`,
        cliente: s.customer?.name ?? s.customer_name ?? s.cliente ?? 'Cliente',
        vendedor: s.seller_name ?? s.vendedor ?? '',
        itens: Array.isArray(s.items) ? s.items.map((it: any) => ({
          produto: it.product?.name ?? it.produto ?? 'Item',
          quantidade: Number(it.quantity ?? it.quantidade ?? 1),
          preco_unitario: Number(it.unit_price ?? it.preco_unitario ?? 0),
          subtotal: Number(it.total_price ?? it.subtotal ?? 0),
        })) : [],
        subtotal: Number(s.subtotal ?? 0),
        desconto: Number(s.discount_amount ?? s.desconto ?? 0),
        total: Number(s.total_amount ?? s.total ?? 0),
        forma_pagamento: (s.payment_method ?? 'dinheiro') as Sale['forma_pagamento'],
        status: (s.status ?? 'pendente') as Sale['status'],
        data_venda: s.created_at ?? s.data_venda ?? new Date().toISOString(),
        observacoes: s.notes ?? s.observacoes ?? '',
      }));
      setVendas(mapped);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    loadVendas();
  }, [loadVendas]);

  // Filtrar vendas
  const filteredVendas = vendas.filter(venda => {
    const matchesSearch = venda.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venda.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (venda.vendedor && venda.vendedor.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAdvanced = (!advancedFilters.status || venda.status === advancedFilters.status) &&
                           (!advancedFilters.forma_pagamento || venda.forma_pagamento === advancedFilters.forma_pagamento) &&
                           (!advancedFilters.vendedor || venda.vendedor?.toLowerCase().includes(advancedFilters.vendedor.toLowerCase())) &&
                           (!advancedFilters.valor_min || venda.total >= parseFloat(advancedFilters.valor_min)) &&
                           (!advancedFilters.valor_max || venda.total <= parseFloat(advancedFilters.valor_max));

    return matchesSearch && matchesAdvanced;
  });

  // Adicionar venda
  const handleAddVenda = async () => {
    try {
      // Criação de venda completa ocorre no PDV. Aqui apenas informamos.
      setShowAddDialog(false);
      setNewVenda({
        cliente: '',
        vendedor: '',
        forma_pagamento: 'dinheiro',
        observacoes: ''
      });
      toast.info('Criação de venda disponível no PDV. Lista carregada da API.');
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      toast.error('Erro ao criar venda');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: Sale['status']) => {
    const statusMap = {
      'pendente': { label: 'Pendente', variant: 'outline' as const },
      'paga': { label: 'Paga', variant: 'default' as const },
      'cancelada': { label: 'Cancelada', variant: 'destructive' as const }
    };
    
    return (
      <Badge variant={statusMap[status].variant}>
        {statusMap[status].label}
      </Badge>
    );
  };

  const getFormaPagamentoBadge = (forma: Sale['forma_pagamento']) => {
    const formaMap = {
      'dinheiro': { label: 'Dinheiro', variant: 'secondary' as const },
      'cartao_debito': { label: 'Cartão Débito', variant: 'outline' as const },
      'cartao_credito': { label: 'Cartão Crédito', variant: 'outline' as const },
      'pix': { label: 'PIX', variant: 'default' as const },
      'boleto': { label: 'Boleto', variant: 'secondary' as const }
    };
    
    return (
      <Badge variant={formaMap[forma].variant}>
        {formaMap[forma].label}
      </Badge>
    );
  };

  // Calcular estatísticas
  const stats = {
    totalVendas: vendas.length,
    vendasPagas: vendas.filter(v => v.status === 'paga').length,
    vendasPendentes: vendas.filter(v => v.status === 'pendente').length,
    faturamento: vendas.filter(v => v.status === 'paga').reduce((acc, v) => acc + v.total, 0),
    ticketMedio: vendas.filter(v => v.status === 'paga').length > 0 
      ? vendas.filter(v => v.status === 'paga').reduce((acc, v) => acc + v.total, 0) / vendas.filter(v => v.status === 'paga').length 
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
          <p className="text-muted-foreground">
            Gerencie suas vendas e acompanhe o faturamento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            <ShoppingCart className="h-3 w-3 mr-1" />
            {vendas.length} vendas
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <DollarSign className="h-3 w-3 mr-1" />
            {formatCurrency(stats.faturamento)}
          </Badge>
        </div>
      </div>

      {/* Quick Stats - JUGA */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <JugaKPICard
          title="Total de Vendas"
          value={`${stats.totalVendas}`}
          description="Vendas registradas"
          color="accent"
          icon={<ShoppingCart className="h-5 w-5" />}
          trend="neutral"
          trendValue="Atualizado agora"
        />
        <JugaKPICard
          title="Vendas Pagas"
          value={`${stats.vendasPagas}`}
          description="Confirmadas"
          color="success"
          icon={<Receipt className="h-5 w-5" />}
          trend="up"
          trendValue="Hoje"
        />
        <JugaKPICard
          title="Pendentes"
          value={`${stats.vendasPendentes}`}
          description="Aguardando pagamento"
          color="warning"
          icon={<Clock className="h-5 w-5" />}
          trend="neutral"
          trendValue="Em aberto"
        />
        <JugaKPICard
          title="Faturamento"
          value={`${formatCurrency(stats.faturamento)}`}
          description="Vendas pagas"
          color="primary"
          icon={<DollarSign className="h-5 w-5" />}
          trend="up"
          trendValue="Semana"
        />
        <JugaKPICard
          title="Ticket Médio"
          value={`${formatCurrency(stats.ticketMedio)}`}
          description="Por venda paga"
          color="primary"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="neutral"
          trendValue="30 dias"
        />
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Lado esquerdo - Botões de ação */}
            <div className="flex items-center gap-2">
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Venda
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Mais Ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Vendas
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Lista
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancelar Selecionadas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Colunas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Mostrar Colunas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(columnVisibility).map(([key, value]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={value}
                      onCheckedChange={(checked) => 
                        setColumnVisibility(prev => ({ ...prev, [key]: checked || false }))
                      }
                    >
                      {key === 'numero' ? 'Número' :
                       key === 'cliente' ? 'Cliente' :
                       key === 'vendedor' ? 'Vendedor' :
                       key === 'total' ? 'Total' :
                       key === 'forma_pagamento' ? 'Forma Pagamento' :
                       key === 'status' ? 'Status' :
                       key === 'data_venda' ? 'Data Venda' : key}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Lado direito - Busca */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar vendas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Busca Avançada
              </Button>
            </div>
          </div>

          {/* Busca Avançada */}
          {showAdvancedSearch && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <select 
                  className="px-3 py-2 border rounded-md"
                  value={advancedFilters.status}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">Todos os status</option>
                  <option value="pendente">Pendente</option>
                  <option value="paga">Paga</option>
                  <option value="cancelada">Cancelada</option>
                </select>
                <select 
                  className="px-3 py-2 border rounded-md"
                  value={advancedFilters.forma_pagamento}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, forma_pagamento: e.target.value }))}
                >
                  <option value="">Todas as formas</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_debito">Cartão Débito</option>
                  <option value="cartao_credito">Cartão Crédito</option>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                </select>
                <Input
                  placeholder="Vendedor..."
                  value={advancedFilters.vendedor}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, vendedor: e.target.value }))}
                />
                <Input
                  type="date"
                  placeholder="Data início..."
                  value={advancedFilters.data_inicio}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, data_inicio: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor mínimo..."
                  value={advancedFilters.valor_min}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, valor_min: e.target.value }))}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor máximo..."
                  value={advancedFilters.valor_max}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, valor_max: e.target.value }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Lista de Vendas ({filteredVendas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando vendas...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                <TableRow>
                  {columnVisibility.numero && <TableHead>Número</TableHead>}
                  {columnVisibility.cliente && <TableHead>Cliente</TableHead>}
                  {columnVisibility.vendedor && <TableHead>Vendedor</TableHead>}
                  <TableHead>Itens</TableHead>
                  {columnVisibility.total && <TableHead>Total</TableHead>}
                  {columnVisibility.forma_pagamento && <TableHead>Pagamento</TableHead>}
                  {columnVisibility.status && <TableHead>Status</TableHead>}
                  {columnVisibility.data_venda && <TableHead>Data</TableHead>}
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendas.map((venda) => (
                  <TableRow key={venda.id}>
                    {columnVisibility.numero && (
                      <TableCell className="font-mono text-sm font-medium">
                        {venda.numero}
                      </TableCell>
                    )}
                    {columnVisibility.cliente && (
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-gray-400" />
                          {venda.cliente}
                        </div>
                      </TableCell>
                    )}
                    {columnVisibility.vendedor && <TableCell>{venda.vendedor || '-'}</TableCell>}
                    <TableCell>
                      <div className="text-sm">
                        {venda.itens.length} {venda.itens.length === 1 ? 'item' : 'itens'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {venda.itens.slice(0, 2).map(item => item.produto).join(', ')}
                        {venda.itens.length > 2 && '...'}
                      </div>
                    </TableCell>
                    {columnVisibility.total && (
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          {formatCurrency(venda.total)}
                        </div>
                        {venda.desconto > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Desc: {formatCurrency(venda.desconto)}
                          </div>
                        )}
                      </TableCell>
                    )}
                    {columnVisibility.forma_pagamento && (
                      <TableCell>{getFormaPagamentoBadge(venda.forma_pagamento)}</TableCell>
                    )}
                    {columnVisibility.status && <TableCell>{getStatusBadge(venda.status)}</TableCell>}
                    {columnVisibility.data_venda && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <div className="text-sm">
                            {formatDate(venda.data_venda)}
                          </div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Receipt className="h-4 w-4 mr-2" />
                            Imprimir Cupom
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Cancelar Venda
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          )}

          {filteredVendas.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma venda encontrada
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Adicionar Venda */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
            <DialogDescription>
              Para vendas completas, utilize o PDV. Este formulário é para registros simples.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="cliente">Cliente *</label>
              <Input
                id="cliente"
                value={newVenda.cliente}
                onChange={(e) => setNewVenda(prev => ({ ...prev, cliente: e.target.value }))}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="vendedor">Vendedor</label>
              <Input
                id="vendedor"
                value={newVenda.vendedor}
                onChange={(e) => setNewVenda(prev => ({ ...prev, vendedor: e.target.value }))}
                placeholder="Nome do vendedor"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="forma_pagamento">Forma de Pagamento</label>
              <select 
                id="forma_pagamento"
                className="px-3 py-2 border rounded-md"
                value={newVenda.forma_pagamento}
                onChange={(e) => setNewVenda(prev => ({ ...prev, forma_pagamento: e.target.value as any }))}
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_debito">Cartão Débito</option>
                <option value="cartao_credito">Cartão Crédito</option>
                <option value="pix">PIX</option>
                <option value="boleto">Boleto</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="observacoes">Observações</label>
              <textarea
                id="observacoes"
                className="px-3 py-2 border rounded-md min-h-[80px]"
                value={newVenda.observacoes}
                onChange={(e) => setNewVenda(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais..."
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>💡 Para uma venda completa com produtos e valores, utilize o PDV.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddVenda} className="bg-emerald-600 hover:bg-emerald-700">
              Criar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}