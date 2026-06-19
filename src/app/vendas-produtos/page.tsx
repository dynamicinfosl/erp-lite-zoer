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
  FileText,
  Truck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { JugaKPICard } from '@/components/dashboard/JugaComponents';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { useBranch } from '@/contexts/BranchContext';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';
import { NewSaleForm } from '@/components/vendas-produtos/NewSaleForm';
import { 
  mapSaleToNFePayload, 
  mapSaleToNFCePayload, 
  emitFiscalDocument 
} from '@/lib/fiscal-utils';
import { api } from '@/lib/api-client';

const getFullFileUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return path.startsWith('/arquivos_development')
    ? `https://homologacao.focusnfe.com.br${path}`
    : `https://api.focusnfe.com.br${path}`;
};

interface Sale {
  id: string;
  numero: string;
  customer_id?: string;
  cliente: string;
  vendedor?: string;
  itens: Array<{
    product_id?: string;
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
  fiscal_doc?: {
    id: string;
    status: string;
    numero: string | null;
    chave: string | null;
    pdf_url: string | null;
    xml_url: string | null;
  } | null;
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
  const { enabled: branchesEnabled, scope, branchId, currentBranch, loading: branchLoading } = useBranch();
  const [vendas, setVendas] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalSales, setTotalSales] = useState(0);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState<Sale | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showNewSaleDialog, setShowNewSaleDialog] = useState(false);
  const [showEditSaleDialog, setShowEditSaleDialog] = useState(false);
  const [selectedVendaId, setSelectedVendaId] = useState<string | undefined>(undefined);
  const [selectedVendas, setSelectedVendas] = useState<Set<string>>(new Set());

  // Estados para Auditoria Fiscal
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    venda: Sale;
    type: 'nfe' | 'nfce';
    customer?: any;
    itemsWithProducts: any[];
    errors: Array<{ field: string; message: string; type: 'error' | 'warning' }>;
    warnings: Array<{ field: string; message: string; type: 'error' | 'warning' }>;
  } | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [editCustomerForm, setEditCustomerForm] = useState<{
    name: string;
    document: string;
    zipcode: string;
    address: string;
    address_number: string;
    neighborhood: string;
    city: string;
    state: string;
  } | null>(null);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  // Estados para Acompanhamento da Emissão
  const [showEmissionDialog, setShowEmissionDialog] = useState(false);
  const [emissionState, setEmissionState] = useState<{
    status: 'enviando' | 'processando' | 'autorizado' | 'erro';
    message: string;
    pdfUrl: string | null;
    xmlUrl: string | null;
    errors: string[];
  }>({
    status: 'enviando',
    message: 'Preparando dados e enviando para a Focus NFe...',
    pdfUrl: null,
    xmlUrl: null,
    errors: []
  });

  // Estados para modal de entrega
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [deliveryDrivers, setDeliveryDrivers] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [isDelivery, setIsDelivery] = useState(false);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
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

      if (branchesEnabled && branchId && !currentBranch && branchLoading) {
        return;
      }

      const isHeadquarters = Boolean(currentBranch?.is_headquarters);
      const shouldUseMatrix = scope === 'all' || !branchId || isHeadquarters || !branchesEnabled;
      
      const params = new URLSearchParams({
        tenant_id: tenant.id,
        sale_type: 'produtos',
        branch_scope: shouldUseMatrix ? 'all' : (scope || 'all'),
        limit: '5000'
      });

      if (!shouldUseMatrix && branchId) {
        params.set('branch_id', String(branchId));
      }

      console.log('📦 Carregando vendas de produtos para o tenant:', tenant.id, { scope, branchId, shouldUseMatrix });
      
      const res = await fetch(`/next_api/sales?${params.toString()}`, { cache: 'no-store' });
      
      // Mapear customer_id da resposta bruta
      // ...
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
      
      // Carregar também os documentos fiscais do tenant para correlacionar com as vendas
      let fiscalDocsMap = new Map<string, any>();
      try {
        const docsRes = await fetch(`/next_api/fiscal/documents?tenant_id=${tenant.id}&limit=1000`);
        if (docsRes.ok) {
          const docsJson = await docsRes.json();
          if (docsJson.success && Array.isArray(docsJson.data)) {
            // Ordenar por data de criação crescente para o mais recente sobrescrever anteriores
            const sortedDocs = [...docsJson.data].sort((a: any, b: any) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            sortedDocs.forEach((doc: any) => {
              if (doc.ref && doc.ref.startsWith('sale_')) {
                const parts = doc.ref.split('_');
                const saleId = parts[1];
                if (saleId) {
                  fiscalDocsMap.set(saleId, doc);
                }
              }
            });
          }
        }
      } catch (docsError) {
        console.error('❌ Erro ao buscar documentos fiscais para mapeamento:', docsError);
      }

      // Filtrar apenas vendas de produtos
      // NOTA: Vendas canceladas são carregadas mas filtradas na visualização padrão (filteredVendas)
      // Filtrar apenas vendas de produtos (considera source 'produtos' ou tipo 'produtos' se source for null)
      const produtosData = data.filter((s: any) => {
        if (s.sale_source === 'produtos') return true;
        if (s.sale_type === 'produtos') return true;
        if (!s.sale_source && s.sale_type === 'produtos') return true;
        return false;
      });
      
      const mapped: Sale[] = produtosData.map((s: any, i: number) => {
        const items = Array.isArray(s.items) ? s.items : [];
        const saleId = String(s.id ?? i + 1);
        const doc = fiscalDocsMap.get(saleId);
        
        return {
          id: saleId,
          numero: s.sale_number ?? s.numero ?? `VND-${String(i + 1).padStart(6, '0')}`,
          cliente: s.customer?.name ?? s.customer_name ?? s.cliente ?? 'Cliente Avulso',
          customer_id: s.customer_id,
          vendedor: s.seller_name ?? s.vendedor ?? '',
          itens: items.map((it: any) => ({
            product_id: it.product_id,
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
            if (s.status === null || s.status === 'completed' || s.status === 'paga' || s.status === 'finalizada') {
              return 'paga' as Sale['status'];
            }
            if (s.status === 'canceled' || s.status === 'cancelada') {
              return 'cancelada' as Sale['status'];
            }
            return 'pendente' as Sale['status'];
          })(),
          data_venda: s.created_at ?? s.sold_at ?? s.data_venda ?? new Date().toISOString(),
          observacoes: s.notes ?? s.observacoes ?? '',
          fiscal_doc: doc ? {
            id: doc.id,
            status: doc.status,
            numero: doc.numero,
            chave: doc.chave,
            pdf_url: doc.caminho_pdf || doc.pdf_path,
            xml_url: doc.caminho_xml || doc.xml_path,
          } : null,
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
  }, [tenant?.id, scope, branchId, branchesEnabled, currentBranch, branchLoading]);

  useEffect(() => {
    loadVendas();
  }, [loadVendas]);

  useEffect(() => {
    if (showAuditDialog && auditResult?.customer) {
      const cust = auditResult.customer.data || auditResult.customer;
      setEditCustomerForm({
        name: cust.name || '',
        document: cust.document || '',
        zipcode: cust.zipcode || '',
        address: cust.address || '',
        address_number: cust.address_number || '',
        neighborhood: cust.neighborhood || '',
        city: cust.city || '',
        state: cust.state || '',
      });
    } else {
      setEditCustomerForm(null);
    }
  }, [showAuditDialog, auditResult]);

  // Filtrar vendas
  // Se não houver filtro de status ou filtro de status diferente de 'cancelada', excluir canceladas da visualização padrão
  const filteredVendas = vendas.filter(venda => {
    const matchesSearch = venda.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venda.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (venda.vendedor && venda.vendedor.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAdvanced = (!advancedFilters.status || venda.status === advancedFilters.status) &&
                           (!advancedFilters.forma_pagamento || venda.forma_pagamento === advancedFilters.forma_pagamento) &&
                           (!advancedFilters.vendedor || venda.vendedor?.toLowerCase().includes(advancedFilters.vendedor.toLowerCase())) &&
                           (!advancedFilters.valor_min || venda.total >= parseFloat(advancedFilters.valor_min)) &&
                           (!advancedFilters.valor_max || venda.total <= parseFloat(advancedFilters.valor_max));

    // Se não há filtro de status específico, excluir canceladas
    // Se há filtro de status 'cancelada', incluir apenas canceladas
    // Se há filtro de outro status, excluir canceladas
    if (!advancedFilters.status) {
      // Sem filtro: excluir canceladas da visualização padrão
      if (venda.status === 'cancelada') return false;
    }

    return matchesSearch && matchesAdvanced;
  });

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, advancedFilters]);

  const paginatedVendas = filteredVendas.slice((page - 1) * pageSize, page * pageSize);

  const renderPagination = () => {
    const totalSales = filteredVendas.length;
    const totalPages = Math.max(1, Math.ceil(totalSales / pageSize));
    const startRange = totalSales === 0 ? 0 : (page - 1) * pageSize + 1;
    const endRange = Math.min(page * pageSize, totalSales);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border border-border bg-slate-50/10 dark:bg-slate-900/10 px-4 rounded-lg my-3">
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          Mostrando <span className="font-medium text-foreground">{startRange}</span> a <span className="font-medium text-foreground">{endRange}</span> de <span className="font-medium text-foreground">{totalSales}</span> vendas
        </div>

        <div className="flex items-center gap-2 order-1 sm:order-2">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">Itens por página:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-2" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center px-3 h-8 rounded-md border border-border bg-background text-sm font-medium">
              Página {page} de {totalPages}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
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

  const handleEditar = (venda: Sale) => {
    setSelectedVendaId(venda.id);
    setShowEditSaleDialog(true);
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

  const handleExcluirVenda = async (venda: Sale) => {
    if (!confirm(`Tem certeza que deseja EXCLUIR permanentemente a venda ${venda.numero}?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const response = await fetch(`/next_api/sales/${venda.id}?hard_delete=true`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao excluir venda');
      }

      toast.success('Venda excluída permanentemente');
      loadVendas();
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir venda. Tente novamente.');
    }
  };

  const loadDeliveryDrivers = useCallback(async () => {
    if (!tenant?.id) {
      setDeliveryDrivers([]);
      return;
    }
    try {
      setLoadingDrivers(true);
      const res = await fetch(`/next_api/delivery-drivers?tenant_id=${encodeURIComponent(tenant.id)}`);
      if (!res.ok) {
        setDeliveryDrivers([]);
        return;
      }
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
      const list = Array.isArray(rows) ? rows : [];
      const driversList = list
        .filter((d: any) => d.id && d.name && d.is_active !== false)
        .map((d: any) => ({ id: Number(d.id), name: String(d.name) }));
      setDeliveryDrivers(driversList);
    } catch (error) {
      console.error('Erro ao carregar entregadores:', error);
      setDeliveryDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  }, [tenant?.id]);

  const handleMarcarEntrega = async (venda: Sale) => {
    setSelectedVenda(venda);
    setShowDeliveryDialog(true);
    await loadDeliveryDrivers();

    // Verificar se já existe entrega para esta venda
    try {
      const res = await fetch(
        `/next_api/deliveries?tenant_id=${encodeURIComponent(tenant?.id || '')}&sale_id=${encodeURIComponent(venda.id)}&limit=1`
      );
      if (res.ok) {
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
        const existing = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
        if (existing?.id) {
          setIsDelivery(true);
          setSelectedDriverId(existing.driver_id ? String(existing.driver_id) : '');
        } else {
          setIsDelivery(false);
          setSelectedDriverId('');
        }
      }
    } catch {
      setIsDelivery(false);
      setSelectedDriverId('');
    }
  };

  const saveDeliveryConfig = async () => {
    if (!selectedVenda || !tenant?.id) {
      toast.error('Dados insuficientes para configurar entrega');
      return;
    }

    if (!isDelivery) {
      // Desmarcar entrega
      try {
        setSavingDelivery(true);
        const res = await fetch('/next_api/deliveries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenant.id,
            sale_id: selectedVenda.id,
            customer_id: null,
            status: 'cancelada',
            driver_id: null,
            notes: 'Entrega desmarcada na página de vendas-produtos',
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ errorMessage: 'Erro desconhecido' }));
          throw new Error(errorData.errorMessage || `Erro ${res.status}`);
        }

        toast.success('Entrega desmarcada com sucesso');
        setShowDeliveryDialog(false);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Erro ao desmarcar entrega';
        console.error('Erro ao desmarcar entrega:', e);
        toast.error(errorMessage);
      } finally {
        setSavingDelivery(false);
      }
      return;
    }

    try {
      setSavingDelivery(true);
      const driverIdValue = selectedDriverId && selectedDriverId.trim() !== '' && selectedDriverId !== '__none__'
        ? Number(selectedDriverId)
        : null;

      const res = await fetch('/next_api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          sale_id: selectedVenda.id,
          customer_id: (selectedVenda as any).customer_id || null,
          driver_id: driverIdValue,
          status: 'aguardando',
          notes: driverIdValue
            ? `Vinculada na página de vendas-produtos para entregador: ${deliveryDrivers.find(d => d.id === driverIdValue)?.name || selectedDriverId}`
            : 'Vinculada na página de vendas-produtos (sem entregador definido)',
        }),
      });

      if (!res.ok) {
        let errorMessage = 'Erro ao salvar entrega';
        try {
          const errorData = await res.json();
          errorMessage = errorData.errorMessage || errorMessage;
          if (errorMessage.includes('Endereço de entrega é obrigatório')) {
            errorMessage = 'O cliente desta venda não possui endereço cadastrado. Por favor, cadastre o endereço do cliente antes de marcar como entrega.';
          }
        } catch {
          errorMessage = `Erro ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      toast.success('Venda marcada para entrega com sucesso!');
      setShowDeliveryDialog(false);
      loadVendas();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Erro ao salvar entrega';
      console.error('Erro ao salvar entrega:', e);
      toast.error(errorMessage);
    } finally {
      setSavingDelivery(false);
    }
  };


  const handleSaleCreated = () => {
    setShowNewSaleDialog(false);
    loadVendas();
  };

  const handleEmitirNFe = async (venda: Sale, type: 'nfe' | 'nfce') => {
    if (!tenant?.id) return;
    
    setIsAuditing(true);
    const toastId = toast.loading(`Realizando auditoria fiscal prévia da venda...`);
    
    try {
      // 1. Buscar dados completos do cliente (com fallback por nome se customer_id estiver vazio/nulo)
      let customer = undefined;
      let linkedCustomerId = venda.customer_id;

      if (linkedCustomerId) {
        try {
          customer = await api.get(`/customers/${linkedCustomerId}?tenant_id=${tenant.id}`);
        } catch (e) {
          console.error("Erro ao carregar dados do cliente:", e);
        }
      }

      // Se não encontrou o cliente ou não tem customer_id associado, mas tem nome do cliente válido
      if (!customer && venda.cliente && venda.cliente.toLowerCase() !== 'cliente avulso') {
        try {
          // Obter dados completos da venda, que faz a busca do cliente por nome (fallback no backend)
          const fullSale = await api.get(`/sales/${venda.id}`);
          if (fullSale && fullSale.customer) {
            customer = fullSale.customer;
            linkedCustomerId = String(fullSale.customer.id);
            // Atualizar o objeto venda na memória para passar nas validações do frontend
            venda.customer_id = linkedCustomerId;
          }
        } catch (e) {
          console.error("Erro no fallback de busca de cliente por nome:", e);
        }
      }

      // 2. Buscar detalhes dos produtos para NCM/CFOP
      const itemsWithProducts = await Promise.all(venda.itens.map(async (item) => {
        if (!item.product_id) return item;
        try {
          const product = await api.get(`/products/${item.product_id}?tenant_id=${tenant.id}`);
          return { ...item, product };
        } catch (e) {
          return item;
        }
      }));

      // 3. Executar auditoria
      const errors: Array<{ field: string; message: string; type: 'error' | 'warning' }> = [];
      const warnings: Array<{ field: string; message: string; type: 'error' | 'warning' }> = [];

      // Validação do Cliente
      if (!venda.customer_id) {
        if (type === 'nfe') {
          errors.push({
            field: 'Cliente',
            message: 'Uma NF-e exige que o cliente seja identificado e tenha cadastro completo.',
            type: 'error'
          });
        } else {
          warnings.push({
            field: 'Cliente',
            message: 'Consumidor não identificado (NFC-e permite emissão sem CPF, sujeito a limites estaduais de valor).',
            type: 'warning'
          });
        }
      } else if (customer) {
        if (!customer.name) {
          errors.push({
            field: 'Nome do Cliente',
            message: 'O nome do cliente não está preenchido.',
            type: 'error'
          });
        }
        
        const docClean = String(customer.document || '').replace(/\D/g, '');
        if (!docClean) {
          errors.push({
            field: 'Documento do Cliente',
            message: `Cliente "${customer.name}" não possui CPF/CNPJ cadastrado.`,
            type: 'error'
          });
        } else if (docClean.length !== 11 && docClean.length !== 14) {
          errors.push({
            field: 'Documento do Cliente',
            message: `O CPF/CNPJ do cliente "${customer.name}" é inválido: deve conter 11 ou 14 dígitos (encontrado: ${docClean.length}).`,
            type: 'error'
          });
        }

        // NF-e exige endereço completo. NFC-e exige apenas se identificado.
        if (type === 'nfe' || (type === 'nfce' && customer.document)) {
          if (!customer.zipcode) {
            errors.push({
              field: 'CEP do Cliente',
              message: 'CEP do destinatário é obrigatório.',
              type: 'error'
            });
          }
          if (!customer.address) {
            errors.push({
              field: 'Logradouro do Cliente',
              message: 'Endereço (rua/avenida) do destinatário é obrigatório.',
              type: 'error'
            });
          }
          if (!customer.address_number) {
            warnings.push({
              field: 'Número do Endereço',
              message: 'Número do endereço não cadastrado. O sistema enviará "SN" (Sem Número).',
              type: 'warning'
            });
          }
          if (!customer.neighborhood) {
            errors.push({
              field: 'Bairro do Cliente',
              message: 'Bairro do destinatário é obrigatório.',
              type: 'error'
            });
          }
          if (!customer.city) {
            errors.push({
              field: 'Cidade do Cliente',
              message: 'Cidade do destinatário é obrigatória.',
              type: 'error'
            });
          }
          if (!customer.state) {
            errors.push({
              field: 'UF do Cliente',
              message: 'UF (estado) do destinatário é obrigatório.',
              type: 'error'
            });
          } else if (String(customer.state).trim().length !== 2) {
            errors.push({
              field: 'UF do Cliente',
              message: `A UF do destinatário deve ter exatamente 2 letras (ex: RJ, SP). Encontrado: "${customer.state}".`,
              type: 'error'
            });
          }
        }
      }

      // Validação dos Itens / Produtos
      if (!venda.itens || venda.itens.length === 0) {
        errors.push({
          field: 'Itens da Venda',
          message: 'A venda deve conter pelo menos 1 produto cadastrado.',
          type: 'error'
        });
      } else {
        itemsWithProducts.forEach((item: any, idx) => {
          const itemNum = idx + 1;
          const pName = item.produto || `Item ${itemNum}`;
          const prod = item.product;

          if (!prod) {
            errors.push({
              field: `Item ${itemNum}`,
              message: `Produto "${pName}" não foi encontrado no cadastro de produtos.`,
              type: 'error'
            });
            return;
          }

          const ncmClean = String(prod.ncm || '').replace(/\D/g, '');
          if (!ncmClean) {
            errors.push({
              field: `NCM - ${prod.name}`,
              message: `O produto "${prod.name}" (Item ${itemNum}) está com NCM vazio.`,
              type: 'error'
            });
          } else if (ncmClean === '00000000') {
            errors.push({
              field: `NCM - ${prod.name}`,
              message: `O produto "${prod.name}" (Item ${itemNum}) está com NCM zerado (00000000). Cadastre um NCM de 8 dígitos válido.`,
              type: 'error'
            });
          } else if (ncmClean.length !== 8) {
            errors.push({
              field: `NCM - ${prod.name}`,
              message: `O produto "${prod.name}" (Item ${itemNum}) está com NCM incorreto: "${prod.ncm}". O NCM deve conter exatamente 8 dígitos.`,
              type: 'error'
            });
          }

          if (!prod.cfop_default) {
            warnings.push({
              field: `CFOP - ${prod.name}`,
              message: `O produto "${prod.name}" (Item ${itemNum}) não possui CFOP padrão cadastrado. Será utilizado o CFOP 5102 (venda estadual).`,
              type: 'warning'
            });
          }

          if (!prod.unit) {
            warnings.push({
              field: `Unidade - ${prod.name}`,
              message: `O produto "${prod.name}" (Item ${itemNum}) não possui unidade comercial. Será utilizado "UN".`,
              type: 'warning'
            });
          }
        });
      }

      toast.dismiss(toastId);

      // Se houver erros ou alertas, abrir o modal de auditoria
      if (errors.length > 0 || warnings.length > 0) {
        setAuditResult({
          venda,
          type,
          customer,
          itemsWithProducts,
          errors,
          warnings
        });
        setShowAuditDialog(true);
      } else {
        // Se estiver 100% correto, prosseguir com a emissão direta
        await proceedWithEmission(venda, type, itemsWithProducts, customer);
      }

    } catch (err: any) {
      console.error("Erro na auditoria da nota:", err);
      toast.error(`Falha ao auditar nota: ${err.message}`, { id: toastId });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro && editCustomerForm) {
        setEditCustomerForm((prev: any) => ({
          ...prev,
          address: data.logradouro || prev.address,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
        toast.success('Endereço preenchido automaticamente via CEP!');
      } else if (data.erro) {
        toast.error('CEP não encontrado.');
      }
    } catch (e) {
      console.warn('Erro ao consultar CEP:', e);
    }
  };

  const handleSaveCustomer = async () => {
    if (!auditResult?.customer?.id || !tenant?.id || !editCustomerForm) return;
    setIsSavingCustomer(true);
    const toastId = toast.loading('Atualizando cadastro do cliente...');
    try {
      // 1. Atualizar cadastro do cliente
      const response = await fetch(`/next_api/customers?id=${auditResult.customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenant.id,
          name: editCustomerForm.name,
          document: editCustomerForm.document,
          zipcode: editCustomerForm.zipcode,
          address: editCustomerForm.address,
          address_number: editCustomerForm.address_number,
          neighborhood: editCustomerForm.neighborhood,
          city: editCustomerForm.city,
          state: editCustomerForm.state,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar cliente');
      }

      // 2. Vincular o cliente à venda no banco de dados para consolidar o vínculo
      try {
        await api.put(`/sales/${auditResult.venda.id}`, {
          customer_id: Number(auditResult.customer.id),
          customer_name: editCustomerForm.name
        });
      } catch (saleErr) {
        console.error("Erro ao vincular cliente à venda:", saleErr);
      }

      toast.success('Cadastro do cliente atualizado e vinculado à venda!', { id: toastId });
      
      // Atualizar a listagem de vendas em background
      loadVendas();

      // Fechar modal anterior e re-executar auditoria
      setShowAuditDialog(false);
      
      // Re-auditar a mesma venda
      const currentVenda = auditResult.venda;
      const currentType = auditResult.type;
      currentVenda.customer_id = String(auditResult.customer.id);
      currentVenda.cliente = editCustomerForm.name; // Atualizar nome exibido na memória também

      setTimeout(() => {
        handleEmitirNFe(currentVenda, currentType);
      }, 300);

    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error(`Falha ao atualizar cliente: ${error.message}`, { id: toastId });
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const proceedWithEmission = async (
    venda: Sale, 
    type: 'nfe' | 'nfce', 
    itemsWithProducts: any[], 
    customer: any
  ) => {
    if (!tenant?.id) return;

    // Abrir modal de progresso
    setShowEmissionDialog(true);
    setEmissionState({
      status: 'enviando',
      message: 'Preparando dados e enviando lote para a Focus NFe...',
      pdfUrl: null,
      xmlUrl: null,
      errors: []
    });

    try {
      // 1. Mapear payload
      const payload = type === 'nfe' 
        ? mapSaleToNFePayload(venda as any, itemsWithProducts as any, customer)
        : mapSaleToNFCePayload(venda as any, itemsWithProducts as any, customer);

      // 2. Emitir
      const result = await emitFiscalDocument({
        tenant_id: tenant.id,
        doc_type: type,
        payload,
        ref: `sale_${venda.id}_${Date.now()}`
      });

      const fiscalDocId = result.fiscal_document_id;
      const initialStatus = result.provider_response?.status;

      if (initialStatus === 'autorizado') {
        const body = result.provider_response;
        let pdfUrl = body.pdf_url || body.caminho_danfe || body.caminho_pdf;
        if (pdfUrl && !pdfUrl.startsWith('http')) {
          pdfUrl = `https://homologacao.focusnfe.com.br${pdfUrl}`;
        }
        let xmlUrl = body.caminho_xml_nota_fiscal || body.caminho_xml;
        if (xmlUrl && !xmlUrl.startsWith('http') && pdfUrl) {
          try {
            const urlObj = new URL(pdfUrl);
            xmlUrl = `${urlObj.origin}${xmlUrl}`;
          } catch {
            xmlUrl = `https://homologacao.focusnfe.com.br${xmlUrl}`;
          }
        }

        setEmissionState({
          status: 'autorizado',
          message: 'Nota Fiscal emitida e autorizada com sucesso!',
          pdfUrl,
          xmlUrl,
          errors: []
        });
        toast.success('Documento fiscal emitido com sucesso!');
      } else if (initialStatus === 'erro_autorizacao' || initialStatus === 'rejeitado' || initialStatus === 'erro') {
        const errorsList: string[] = [];
        const body = result.provider_response || {};
        if (body.erros && Array.isArray(body.erros)) {
          body.erros.forEach((e: any) => errorsList.push(`${e.codigo || ''}: ${e.mensagem || ''}`));
        } else if (body.errors && Array.isArray(body.errors)) {
          body.errors.forEach((e: any) => errorsList.push(`${e.message || ''}`));
        } else {
          errorsList.push(body.mensagem || 'Erro retornado pela SEFAZ.');
        }

        setEmissionState({
          status: 'erro',
          message: 'Falha na emissão pela Focus NFe.',
          pdfUrl: null,
          xmlUrl: null,
          errors: errorsList
        });
      } else {
        // Status processando
        setEmissionState({
          status: 'processando',
          message: 'Lote recebido! Aguardando autorização da SEFAZ...',
          pdfUrl: null,
          xmlUrl: null,
          errors: []
        });

        // Iniciar polling de status
        pollEmissionStatus(fiscalDocId);
      }
    } catch (error: any) {
      console.error(`Erro ao emitir ${type.toUpperCase()}:`, error);
      
      let errorMsg = error.message || 'Erro de comunicação desconhecido';
      const errorsList: string[] = [errorMsg];

      if (error.provider_error) {
        const details = error.provider_error.erros || error.provider_error.errors;
        if (Array.isArray(details)) {
          details.forEach((d: any) => errorsList.push(`${d.campo || ''} - ${d.mensagem}`));
        } else if (error.provider_error.mensagem) {
          errorsList.push(error.provider_error.mensagem);
        }
      }

      setEmissionState({
        status: 'erro',
        message: 'Erro ao processar emissão fiscal.',
        pdfUrl: null,
        xmlUrl: null,
        errors: errorsList
      });
    }
  };

  const pollEmissionStatus = async (fiscalDocId: string, iteration = 1) => {
    if (iteration > 20) {
      setEmissionState(prev => ({
        ...prev,
        status: 'erro',
        message: 'Tempo limite atingido ao aguardar autorização da SEFAZ.',
        errors: ['O processamento demorou muito. A nota poderá ser autorizada em instantes. Verifique a lista de notas posteriormente.']
      }));
      return;
    }

    try {
      const res = await api.get(`/fiscal/focusnfe/status?fiscal_document_id=${fiscalDocId}`);
      if (res) {
        const body = res.provider_response || {};
        const currentStatus = res.status || body?.status;

        if (currentStatus === 'autorizado') {
          let pdfUrl = body.pdf_url || body.caminho_danfe || body.caminho_pdf;
          if (pdfUrl && !pdfUrl.startsWith('http')) {
            pdfUrl = `https://homologacao.focusnfe.com.br${pdfUrl}`;
          }
          let xmlUrl = body.caminho_xml_nota_fiscal || body.caminho_xml;
          if (xmlUrl && !xmlUrl.startsWith('http') && pdfUrl) {
            try {
              const urlObj = new URL(pdfUrl);
              xmlUrl = `${urlObj.origin}${xmlUrl}`;
            } catch {
              xmlUrl = `https://homologacao.focusnfe.com.br${xmlUrl}`;
            }
          }

          setEmissionState({
            status: 'autorizado',
            message: 'Nota Fiscal autorizada com sucesso pela SEFAZ!',
            pdfUrl,
            xmlUrl,
            errors: []
          });
          toast.success('Nota Fiscal emitida e autorizada!');
          return;
        } else if (currentStatus === 'erro_autorizacao' || currentStatus === 'rejeitado' || currentStatus === 'erro') {
          const errorsList: string[] = [];
          if (body.erros && Array.isArray(body.erros)) {
            body.erros.forEach((e: any) => errorsList.push(`${e.codigo || ''}: ${e.mensagem || ''}`));
          } else if (body.errors && Array.isArray(body.errors)) {
            body.errors.forEach((e: any) => errorsList.push(`${e.message || ''}`));
          } else if (body.mensagem_sefaz) {
            errorsList.push(body.mensagem_sefaz);
          } else {
            errorsList.push(body.mensagem || 'Rejeição desconhecida pela SEFAZ.');
          }

          setEmissionState({
            status: 'erro',
            message: 'A nota foi rejeitada pela SEFAZ ou apresentou erros.',
            pdfUrl: null,
            xmlUrl: null,
            errors: errorsList
          });
          return;
        }
      }
    } catch (err: any) {
      console.error('Erro na consulta do status:', err);
    }

    // Polling contínuo
    setTimeout(() => {
      pollEmissionStatus(fiscalDocId, iteration + 1);
    }, 2000);
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
          {!loading && filteredVendas.length > 0 && renderPagination()}
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
                {paginatedVendas.map((venda) => (
                  <TableRow key={venda.id}>
                    {columnVisibility.numero && (
                      <TableCell className="font-mono text-sm font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{venda.numero}</span>
                          {venda.fiscal_doc && venda.fiscal_doc.status === 'autorizado' && (
                            <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 text-[10px] font-bold px-1.5 py-0.5 flex items-center gap-1 rounded">
                              <Receipt className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              NF
                            </Badge>
                          )}
                          {venda.fiscal_doc && (venda.fiscal_doc.status === 'processando' || venda.fiscal_doc.status === 'submitt') && (
                            <Badge className="bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 text-[10px] font-bold px-1.5 py-0.5 flex items-center gap-1 rounded">
                              <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                              NF
                            </Badge>
                          )}
                        </div>
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
                           <DropdownMenuItem onClick={() => handleEditar(venda)}>
                             <Edit className="h-4 w-4 mr-2" />
                             Editar
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
                          {venda.fiscal_doc && venda.fiscal_doc.status === 'autorizado' ? (
                            <>
                              <DropdownMenuItem disabled className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                                NF-e já Emitida {venda.fiscal_doc.numero ? `(Nº ${venda.fiscal_doc.numero})` : ''}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const url = getFullFileUrl(venda.fiscal_doc?.pdf_url);
                                if (url) window.open(url, '_blank');
                              }}>
                                <Printer className="h-4 w-4 mr-2 text-emerald-500" />
                                Visualizar DANFE (PDF)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const url = getFullFileUrl(venda.fiscal_doc?.xml_url);
                                if (url) window.open(url, '_blank');
                              }}>
                                <Download className="h-4 w-4 mr-2 text-indigo-500" />
                                Baixar XML da NF-e
                              </DropdownMenuItem>
                            </>
                          ) : venda.fiscal_doc && (venda.fiscal_doc.status === 'processando' || venda.fiscal_doc.status === 'submitt') ? (
                            <DropdownMenuItem disabled className="text-amber-600 dark:text-amber-400 font-semibold">
                              <Loader2 className="h-4 w-4 mr-2 animate-spin text-amber-500" />
                              Processando na SEFAZ...
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleEmitirNFe(venda, 'nfe')}>
                              <FileText className="h-4 w-4 mr-2" />
                              Emitir NF-e
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleMarcarEntrega(venda)}>
                            <Truck className="h-4 w-4 mr-2" />
                            Configurar Entrega
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {venda.status === 'cancelada' ? (
                            <DropdownMenuItem 
                              className="text-red-600 dark:text-red-400"
                              onClick={() => handleExcluirVenda(venda)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir Permanentemente
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="text-red-600 dark:text-red-400"
                              onClick={() => handleCancelarVenda(venda)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Cancelar Venda
                            </DropdownMenuItem>
                          )}
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

          {!loading && filteredVendas.length > 0 && renderPagination()}

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

      {/* Dialog de Editar Venda */}
      <Dialog open={showEditSaleDialog} onOpenChange={setShowEditSaleDialog}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
            <DialogTitle className="text-xl font-bold">Editar Venda de Produtos</DialogTitle>
            <DialogDescription>
              Modifique as informações da venda de produtos
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(95vh-120px)] px-6 py-4">
            {showEditSaleDialog && (
              <NewSaleForm 
                saleId={selectedVendaId} 
                onSuccess={() => {
                  setShowEditSaleDialog(false);
                  loadVendas();
                }} 
                onCancel={() => setShowEditSaleDialog(false)} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Auditoria Fiscal */}
      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Receipt className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              Auditoria Fiscal Prévia da Venda
            </DialogTitle>
            <DialogDescription className="text-sm">
              Análise de dados cadastrais e fiscais da Venda {auditResult?.venda.numero} antes do envio para a Sefaz.
            </DialogDescription>
          </DialogHeader>

          {auditResult && (
            <div className="space-y-6 py-4">
              {/* Resumo */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo de Emissão</p>
                  <Badge className="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1">
                    {auditResult.type.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor Total</p>
                  <p className="text-lg font-bold text-slate-950 dark:text-slate-50 mt-0.5">
                    {formatCurrency(auditResult.venda.total)}
                  </p>
                </div>
              </div>

              {/* Erros Impeditivos */}
              {auditResult.errors.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <XCircle className="h-4.5 w-4.5 text-red-600" />
                    Erros Impeditivos ({auditResult.errors.length})
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Estes erros impedem a emissão da nota fiscal e devem ser corrigidos no cadastro correspondente.
                  </p>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {auditResult.errors.map((err, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                        <div>
                          <strong className="font-semibold">{err.field}:</strong> {err.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alertas / Avisos */}
              {auditResult.warnings.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
                    Alertas e Avisos ({auditResult.warnings.length})
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Avisos que não impedem a emissão diretamente, mas podem gerar reparações ou tributações incorretas.
                  </p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {auditResult.warnings.map((warn, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                        <div>
                          <strong className="font-semibold">{warn.field}:</strong> {warn.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status de Sucesso (Se sem erros nem avisos mas abriu por algum motivo) */}
              {auditResult.errors.length === 0 && auditResult.warnings.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl text-center space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                  <div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Tudo pronto para emissão!</h4>
                    <p className="text-sm text-muted-foreground mt-1">Todos os dados cadastrais e fiscais estão corretos.</p>
                  </div>
                </div>
              )}

              {/* Correção Rápida de Cadastro */}
              {editCustomerForm ? (
                <div className="space-y-4 border-t pt-5 mt-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Correção Rápida do Destinatário
                    </h4>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="cust-name" className="text-xs font-semibold text-muted-foreground">Nome / Razão Social</Label>
                        <Input 
                          id="cust-name" 
                          value={editCustomerForm.name} 
                          onChange={(e) => setEditCustomerForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                          placeholder="Nome do cliente"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cust-doc" className="text-xs font-semibold text-muted-foreground">CPF ou CNPJ</Label>
                        <Input 
                          id="cust-doc" 
                          value={editCustomerForm.document} 
                          onChange={(e) => setEditCustomerForm(prev => prev ? { ...prev, document: e.target.value } : null)}
                          placeholder="Apenas números"
                          className="h-9 text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5 col-span-1">
                        <Label htmlFor="cust-zip" className="text-xs font-semibold text-muted-foreground">CEP</Label>
                        <Input 
                          id="cust-zip" 
                          value={editCustomerForm.zipcode} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditCustomerForm(prev => prev ? { ...prev, zipcode: val } : null);
                            if (val.replace(/\D/g, '').length === 8) {
                              handleCepLookup(val);
                            }
                          }}
                          onBlur={(e) => handleCepLookup(e.target.value)}
                          placeholder="00000-000"
                          className="h-9 text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label htmlFor="cust-addr" className="text-xs font-semibold text-muted-foreground">Endereço (Rua/Av.)</Label>
                        <Input 
                          id="cust-addr" 
                          value={editCustomerForm.address} 
                          onChange={(e) => setEditCustomerForm(prev => prev ? { ...prev, address: e.target.value } : null)}
                          placeholder="Ex: Av. Atlântica"
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1.5 col-span-1">
                        <Label htmlFor="cust-num" className="text-xs font-semibold text-muted-foreground">Número</Label>
                        <Input 
                          id="cust-num" 
                          value={editCustomerForm.address_number} 
                          onChange={(e) => setEditCustomerForm(prev => prev ? { ...prev, address_number: e.target.value } : null)}
                          placeholder="S/N"
                          className="h-9 text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-3">
                        <Label htmlFor="cust-neigh" className="text-xs font-semibold text-muted-foreground">Bairro</Label>
                        <Input 
                          id="cust-neigh" 
                          value={editCustomerForm.neighborhood} 
                          onChange={(e) => setEditCustomerForm(prev => prev ? { ...prev, neighborhood: e.target.value } : null)}
                          placeholder="Ex: Copacabana"
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1.5 col-span-3">
                        <Label htmlFor="cust-city" className="text-xs font-semibold text-muted-foreground">Cidade</Label>
                        <Input 
                          id="cust-city" 
                          value={editCustomerForm.city} 
                          onChange={(e) => setEditCustomerForm(prev => prev ? { ...prev, city: e.target.value } : null)}
                          placeholder="Ex: Rio de Janeiro"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-1">
                        <Label htmlFor="cust-state" className="text-xs font-semibold text-muted-foreground">UF</Label>
                        <Input 
                          id="cust-state" 
                          value={editCustomerForm.state} 
                          onChange={(e) => setEditCustomerForm(prev => prev ? { ...prev, state: e.target.value.toUpperCase() } : null)}
                          maxLength={2}
                          placeholder="UF"
                          className="h-9 text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button 
                        type="button"
                        onClick={handleSaveCustomer}
                        disabled={isSavingCustomer}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all flex items-center gap-2"
                      >
                        {isSavingCustomer ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Salvar e Re-auditar Cadastro
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                !auditResult.venda.customer_id && (
                  <div className="space-y-3 border-t pt-5 mt-4">
                    <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-sm shadow-sm">
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="font-semibold text-amber-900 dark:text-amber-100">Nenhum cliente associado:</strong> Esta venda não possui um cliente associado. Para poder emitir uma NF-e (Modelo 55), é obrigatório identificar o destinatário.
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Por favor, feche este modal, edite a venda e associe um cliente cadastrado antes de prosseguir.</p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <DialogFooter className="pt-4 border-t flex flex-row items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAuditDialog(false)}>
              Fechar e Corrigir
            </Button>
            {auditResult && auditResult.errors.length === 0 && (
              <Button 
                onClick={async () => {
                  setShowAuditDialog(false);
                  await proceedWithEmission(
                    auditResult.venda,
                    auditResult.type,
                    auditResult.itemsWithProducts,
                    auditResult.customer
                  );
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Emitir Mesmo Assim
              </Button>
            )}
            {auditResult && auditResult.errors.length > 0 && (
              <Button 
                disabled
                className="bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold cursor-not-allowed"
              >
                Emissão Bloqueada
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Acompanhamento da Emissão */}
      <Dialog open={showEmissionDialog} onOpenChange={setShowEmissionDialog}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl p-6">
          <DialogHeader className="pb-4 border-b flex flex-col items-center text-center">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Receipt className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              Acompanhamento da Emissão
            </DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Verifique o status da sua nota fiscal em tempo real com a Sefaz.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
            {/* Ícones e Estados */}
            {emissionState.status === 'enviando' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 animate-spin" />
                  <ShoppingCart className="h-6 w-6 text-indigo-600 absolute" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">{emissionState.message}</h4>
                <p className="text-xs text-muted-foreground max-w-xs">Mapeando dados cadastrais e fiscais da venda...</p>
              </div>
            )}

            {emissionState.status === 'processando' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full border-4 border-amber-100 dark:border-amber-950 border-t-amber-500 animate-spin" />
                  <Clock className="h-6 w-6 text-amber-500 absolute" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">{emissionState.message}</h4>
                <p className="text-xs text-muted-foreground max-w-xs">Aguardando processamento e resposta da SEFAZ estadual...</p>
              </div>
            )}

            {emissionState.status === 'autorizado' && (
              <div className="flex flex-col items-center space-y-4 w-full">
                <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center border-2 border-emerald-500 animate-bounce">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">{emissionState.message}</h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 max-w-xs font-semibold">Tudo pronto! Você já pode visualizar ou baixar os documentos abaixo.</p>
                
                <div className="flex flex-col gap-2 w-full pt-4">
                  {emissionState.pdfUrl && (
                    <Button 
                      onClick={() => window.open(emissionState.pdfUrl!, '_blank')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 h-11 rounded-xl shadow-md transition-all hover:scale-[1.02]"
                    >
                      <Printer className="h-5 w-5" />
                      Visualizar DANFE (PDF)
                    </Button>
                  )}
                  {emissionState.xmlUrl && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(emissionState.xmlUrl!, '_blank')}
                      className="border-2 border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 font-bold flex items-center justify-center gap-2 h-11 rounded-xl shadow-sm transition-all hover:scale-[1.02]"
                    >
                      <Download className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Baixar XML da Nota
                    </Button>
                  )}
                </div>
              </div>
            )}

            {emissionState.status === 'erro' && (
              <div className="flex flex-col items-center space-y-4 w-full">
                <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center border-2 border-red-500">
                  <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>
                <h4 className="text-base font-bold text-red-600 dark:text-red-400">{emissionState.message}</h4>
                
                <div className="w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4 rounded-xl text-left max-h-[180px] overflow-y-auto space-y-1.5 shadow-inner">
                  <p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">Erros Identificados:</p>
                  {emissionState.errors.length > 0 ? (
                    emissionState.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-700 dark:text-red-300 leading-relaxed font-mono">
                        • {err}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-red-700 dark:text-red-300">Falha ao processar nota fiscal ou resposta nula do servidor.</p>
                  )}
                </div>

                <Button 
                  onClick={() => setShowEmissionDialog(false)}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-semibold w-full mt-4 h-10 rounded-xl"
                >
                  Fechar e Corrigir Venda
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      </div>
    </TenantPageWrapper>
  );
}
