'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
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
  Clock,
  Printer,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { JugaKPICard } from '@/components/dashboard/JugaComponents';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';
import { NewSaleForm } from '@/components/vendas-produtos/NewSaleForm';

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

export default function VendasProdutosPage() {
  const { tenant } = useSimpleAuth();
  const [vendas, setVendas] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState<Sale | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showNewSaleDialog, setShowNewSaleDialog] = useState(false);
  const [selectedVendas, setSelectedVendas] = useState<Set<string>>(new Set());
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

  const loadVendas = useCallback(async () => {
    try {
      setLoading(true);
      if (!tenant?.id) {
        setVendas([]);
        setLoading(false);
        return;
      }

      console.log('📦 Carregando vendas de produtos para o tenant:', tenant.id);
      
      const res = await fetch(`/next_api/sales?tenant_id=${encodeURIComponent(tenant.id)}&sale_source=produtos`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Erro na resposta da API:', res.status, errorText);
        throw new Error(`Erro ao carregar vendas: ${res.status}`);
      }
      
      const contentType = res.headers.get('content-type') || '';
      let json: any;
      if (contentType.includes('application/json')) {
        try {
          json = await res.json();
        } catch (parseError) {
          console.error('❌ Erro ao parsear JSON:', parseError);
          throw new Error('Resposta inválida do servidor (não é JSON)');
        }
      } else {
        const text = await res.text();
        console.error('❌ Resposta não é JSON:', text.substring(0, 100));
        throw new Error('Resposta inválida do servidor');
      }
      
      const data = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
      
      // Filtrar apenas vendas de produtos
      // EXCLUIR: vendas canceladas da visualização padrão (só aparecem quando filtradas por status)
      const produtosData = data.filter((s: any) => {
        // Excluir vendas canceladas da visualização padrão
        if (s.status === 'canceled' || s.status === 'cancelada') {
          return false;
        }
        return s.sale_source === 'produtos';
      });
      
      const mapped: Sale[] = produtosData.map((s: any, i: number) => {
        const items = Array.isArray(s.items) ? s.items : [];
        
        return {
          id: String(s.id ?? i + 1),
          numero: s.sale_number ?? s.numero ?? `VND-${String(i + 1).padStart(6, '0')}`,
          cliente: s.customer?.name ?? s.customer_name ?? s.cliente ?? 'Cliente Avulso',
          vendedor: s.seller_name ?? s.vendedor ?? '',
          itens: items.map((it: any) => ({
            produto: it.product?.name ?? it.product_name ?? it.produto ?? 'Produto',
            quantidade: Number(it.quantity ?? it.quantidade ?? 1),
            preco_unitario: Number(it.unit_price ?? it.price ?? it.preco_unitario ?? 0),
            subtotal: Number(it.total_price ?? it.subtotal ?? (Number(it.quantity ?? 1) * Number(it.unit_price ?? it.price ?? 0))),
          })),
          subtotal: Number(s.subtotal ?? s.total_amount ?? s.total ?? 0),
          desconto: Number(s.discount_amount ?? s.desconto ?? 0),
          total: Number(s.total_amount ?? s.final_amount ?? s.total ?? 0),
          forma_pagamento: (s.payment_method ?? 'dinheiro') as Sale['forma_pagamento'],
          status: (() => {
            if (s.status === null || s.status === 'completed' || s.status === 'paga') {
              return 'paga' as Sale['status'];
            }
            if (s.status === 'canceled' || s.status === 'cancelada') {
              return 'cancelada' as Sale['status'];
            }
            return 'pendente' as Sale['status'];
          })(),
          data_venda: s.created_at ?? s.sold_at ?? s.data_venda ?? new Date().toISOString(),
          observacoes: s.notes ?? s.observacoes ?? '',
        };
      });
      
      console.log(`✅ ${mapped.length} vendas de produtos carregadas com sucesso`);
      setVendas(mapped);
    } catch (error) {
      console.error('❌ Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar vendas. Verifique o console para mais detalhes.');
      setVendas([]);
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
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      'pendente': { label: 'Pendente', variant: 'outline' },
      'paga': { label: 'Paga', variant: 'default' },
      'cancelada': { label: 'Cancelada', variant: 'destructive' }
    };
    
    const statusData = status && statusMap[status] 
      ? statusMap[status] 
      : { label: status || 'Desconhecido', variant: 'secondary' as const };
    
    return (
      <Badge variant={statusData.variant}>
        {statusData.label}
      </Badge>
    );
  };

  const getFormaPagamentoBadge = (forma: Sale['forma_pagamento']) => {
    const formaMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      'dinheiro': { label: 'Dinheiro', variant: 'secondary' },
      'cartao_debito': { label: 'Cartão Débito', variant: 'outline' },
      'cartao_credito': { label: 'Cartão Crédito', variant: 'outline' },
      'pix': { label: 'PIX', variant: 'default' },
      'boleto': { label: 'Boleto', variant: 'secondary' }
    };
    
    const formaData = forma && formaMap[forma] 
      ? formaMap[forma] 
      : { label: forma || 'Não informado', variant: 'secondary' as const };
    
    return (
      <Badge variant={formaData.variant}>
        {formaData.label}
      </Badge>
    );
  };

  // Calcular estatísticas
  const vendasPagas = vendas.filter(v => v.status === 'paga');
  const faturamentoTotal = vendasPagas.reduce((acc, v) => acc + v.total, 0);
  const stats = {
    totalVendas: vendas.length,
    vendasPagas: vendasPagas.length,
    vendasPendentes: vendas.filter(v => v.status === 'pendente').length,
    faturamento: faturamentoTotal,
    ticketMedio: vendasPagas.length > 0 ? faturamentoTotal / vendasPagas.length : 0
  };

  // Funções de ação
  const handleVerDetalhes = (venda: Sale) => {
    setSelectedVenda(venda);
    setShowDetailsDialog(true);
  };

  const handleImprimirA4 = (venda: Sale) => {
    window.open(`/vendas-produtos/${venda.id}/a4`, '_blank');
  };

  const handleImprimirCupom = (venda: Sale) => {
    window.open(`/cupom/${venda.id}`, '_blank');
  };

  const handleCancelarVenda = async (venda: Sale) => {
    if (!confirm(`Tem certeza que deseja cancelar a venda ${venda.numero}?`)) {
      return;
    }

    try {
      const response = await fetch(`/next_api/sales/${venda.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar venda');
      }

      toast.success('Venda cancelada com sucesso');
      loadVendas();
    } catch (error) {
      console.error('Erro ao cancelar venda:', error);
      toast.error('Erro ao cancelar venda. Tente novamente.');
    }
  };

  const handleSaleCreated = () => {
    setShowNewSaleDialog(false);
    loadVendas();
  };

  return (
    <TenantPageWrapper>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Vendas de Produtos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie vendas diretas de produtos para clientes específicos
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setShowNewSaleDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Venda
          </Button>
          <Badge variant="secondary" className="px-3 py-1 text-xs sm:text-sm">
            <ShoppingCart className="h-3 w-3 mr-1" />
            {vendas.length} vendas
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-xs sm:text-sm">
            <DollarSign className="h-3 w-3 mr-1" />
            {formatCurrency(stats.faturamento)}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
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
      <Card className="juga-card">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-border bg-background hover:bg-accent hover:text-accent-foreground">
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

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
                className="border-border bg-background hover:bg-accent hover:text-accent-foreground"
              >
                <Filter className="h-4 w-4 mr-2" />
                Busca Avançada
              </Button>
            </div>
          </div>

          {/* Busca Avançada */}
          {showAdvancedSearch && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <select 
                  className="px-3 py-2 border rounded-md bg-background text-foreground border-input"
                  value={advancedFilters.status}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">Todos os status</option>
                  <option value="pendente">Pendente</option>
                  <option value="paga">Paga</option>
                  <option value="cancelada">Cancelada</option>
                </select>
                <select 
                  className="px-3 py-2 border rounded-md bg-background text-foreground border-input"
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
      <Card className="juga-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Lista de Vendas de Produtos ({filteredVendas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando vendas...</div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
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
                          <User className="h-3 w-3 text-muted-foreground" />
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
                          <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
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
                          <Calendar className="h-3 w-3 text-muted-foreground" />
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
                          <DropdownMenuItem onClick={() => handleVerDetalhes(venda)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleImprimirA4(venda)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Imprimir A4
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleImprimirCupom(venda)}>
                            <Receipt className="h-4 w-4 mr-2" />
                            Imprimir Cupom
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 dark:text-red-400"
                            onClick={() => handleCancelarVenda(venda)}
                          >
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
            </div>
          )}

          {filteredVendas.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma venda encontrada. Clique em "Adicionar Venda" para criar uma nova venda de produtos.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes da Venda */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
            <DialogDescription>
              Informações completas da venda {selectedVenda?.numero}
            </DialogDescription>
          </DialogHeader>
          {selectedVenda && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Número</Label>
                  <div className="font-mono text-sm mt-1">{selectedVenda.numero}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedVenda.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Cliente</Label>
                  <div className="mt-1">{selectedVenda.cliente}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Vendedor</Label>
                  <div className="mt-1">{selectedVenda.vendedor || '-'}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Data</Label>
                  <div className="mt-1">{formatDate(selectedVenda.data_venda)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Forma de Pagamento</Label>
                  <div className="mt-1">{getFormaPagamentoBadge(selectedVenda.forma_pagamento)}</div>
                </div>
              </div>
              
              {selectedVenda.itens && selectedVenda.itens.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Itens</Label>
                  <div className="mt-2 border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Preço Unit.</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedVenda.itens.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.produto}</TableCell>
                            <TableCell>{item.quantidade}</TableCell>
                            <TableCell>{formatCurrency(item.preco_unitario)}</TableCell>
                            <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Subtotal</Label>
                  <div className="text-lg font-semibold mt-1">{formatCurrency(selectedVenda.subtotal)}</div>
                </div>
                {selectedVenda.desconto > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Desconto</Label>
                    <div className="text-lg text-red-600 mt-1">-{formatCurrency(selectedVenda.desconto)}</div>
                  </div>
                )}
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">Total</Label>
                  <div className="text-2xl font-bold text-primary mt-1">{formatCurrency(selectedVenda.total)}</div>
                </div>
              </div>
              
              {selectedVenda.observacoes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
                  <div className="text-sm mt-1">{selectedVenda.observacoes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Fechar
            </Button>
            {selectedVenda && (
              <>
                <Button onClick={() => handleImprimirA4(selectedVenda)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Imprimir A4
                </Button>
                <Button onClick={() => handleImprimirCupom(selectedVenda)}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Imprimir Cupom
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Nova Venda */}
      <Dialog open={showNewSaleDialog} onOpenChange={setShowNewSaleDialog}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
            <DialogTitle className="text-xl font-bold">Nova Venda de Produtos</DialogTitle>
            <DialogDescription>
              Preencha os dados da venda de produtos para um cliente específico
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(95vh-120px)] px-6 py-4">
            <NewSaleForm onSuccess={handleSaleCreated} onCancel={() => setShowNewSaleDialog(false)} />
          </div>
        </DialogContent>
      </Dialog>

      </div>
    </TenantPageWrapper>
  );
}
