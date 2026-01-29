'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  X,
  Calendar,
  Receipt,
  TrendingUp,
  Clock,
  FileText,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { JugaKPICard } from '@/components/dashboard/JugaComponents';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { useBranch } from '@/contexts/BranchContext';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';

interface Sale {
  id: string;
  numero: string;
  cliente: string;
  customer_id?: number | null;
  delivery_address?: string | null;
  vendedor?: string;
  itens: Array<{
    produto: string;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
    product_id?: number | null;
  }>;
  subtotal: number;
  desconto: number;
  total: number;
  forma_pagamento: 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'boleto';
  status: 'pendente' | 'paga' | 'cancelada';
  data_venda: string;
  observacoes?: string;
  sale_source?: string | null;
}

type QuickCustomer = { id: number; name: string; document?: string | null; phone?: string | null };
type QuickProduct = { id: number; name: string; sku?: string | null; sale_price?: number | null };

function AutocompleteInput({
  value,
  onChange,
  onPick,
  placeholder,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (opt: { value: string; label: string }) => void;
  placeholder: string;
  options: Array<{ value: string; label: string; keywords?: string }>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Função para normalizar texto removendo acentos
  const normalizeText = (text: string): string => {
    return String(text || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  };

  const normalizedQuery = normalizeText(value || '');
  const filtered = useMemo(() => {
    if (!normalizedQuery) return options.slice(0, 30);
    const out = options.filter((o) => {
      const hay = `${o.label} ${o.keywords || ''}`;
      return normalizeText(hay).includes(normalizedQuery);
    });
    return out.slice(0, 30);
  }, [options, normalizedQuery]);

  return (
    <Popover open={open && filtered.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          className="bg-white dark:bg-slate-900"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[--radix-popover-trigger-width] p-0 bg-white dark:bg-slate-900 border border-border shadow-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-[260px] overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground bg-muted/30">Nenhum resultado encontrado</div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                className="w-full text-left px-3 py-2.5 rounded-none hover:bg-accent hover:text-accent-foreground text-sm border-b border-border/40 last:border-b-0 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick({ value: o.value, label: o.label });
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate block font-medium">{o.label}</span>
                </div>
                {o.keywords && (
                  <div className="text-xs text-muted-foreground mt-0.5 ml-6 truncate">
                    {o.keywords.trim()}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
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
  const { enabled: branchesEnabled, loading: branchLoading, branches, branchId, scope, currentBranch, isMatrixAdmin } = useBranch();
  const [vendas, setVendas] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState<Sale | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Sale>>({});
  const [loadingEditDetails, setLoadingEditDetails] = useState(false);
  const [customersForEdit, setCustomersForEdit] = useState<QuickCustomer[]>([]);
  const [productsForEdit, setProductsForEdit] = useState<QuickProduct[]>([]);
  const [selectedVendas, setSelectedVendas] = useState<Set<string>>(new Set());
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  
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
    cliente: '',
    data_inicio: '',
    data_fim: '',
    valor_min: '',
    valor_max: ''
  });

  // Lista de clientes para autocomplete
  const [customersList, setCustomersList] = useState<QuickCustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Função para normalizar texto removendo acentos
  const normalizeText = (text: string): string => {
    return String(text || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  };

  // Carregar lista de clientes
  const loadCustomers = useCallback(async () => {
    if (!tenant?.id) {
      setCustomersList([]);
      return;
    }
    try {
      setLoadingCustomers(true);
      const params = new URLSearchParams({
        tenant_id: tenant.id,
        limit: '1000',
      });
      // Respeitar contexto Matriz/Filial para garantir que a lista venha sempre
      if (scope === 'all') params.set('branch_scope', 'all');
      if (scope === 'branch' && branchId) params.set('branch_id', String(branchId));

      const res = await fetch(`/next_api/customers?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
        const list = Array.isArray(rows) ? rows : [];
        const customers = list
          .filter((c: any) => c.id && c.name)
          .map((c: any) => ({
            id: Number(c.id),
            name: String(c.name || ''),
            document: c.document || null,
            phone: c.phone || null,
          }));
        setCustomersList(customers);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setCustomersList([]);
    } finally {
      setLoadingCustomers(false);
    }
  }, [tenant?.id, scope, branchId]);

  useEffect(() => {
    if (showAdvancedSearch) {
      loadCustomers();
    }
  }, [showAdvancedSearch, loadCustomers]);

  const loadVendas = useCallback(async () => {
    try {
      setLoading(true);
      if (!tenant?.id) {
        setVendas([]);
        setLoading(false);
        return;
      }

      // Evitar "piscar" dados: aguardar BranchContext resolver a branch atual
      // (principalmente quando admin matriz usa branchId da HQ, mas currentBranch ainda não carregou)
      if (branchesEnabled && scope === 'branch' && branchId && !currentBranch) {
        if (branchLoading) {
          console.log('⏳ Aguardando carregar filiais para determinar HQ antes de buscar vendas...', { branchId });
          setLoading(false);
          return;
        }
        if (Array.isArray(branches) && branches.length > 0) {
          const resolved = branches.find((b) => b.id === branchId) || null;
          if (!resolved) {
            console.log('⏳ Branch selecionada ainda não resolvida, aguardando...', { branchId });
            setLoading(false);
            return;
          }
        } else {
          console.log('⏳ Filiais ainda não carregadas, aguardando...', { branchId });
          setLoading(false);
          return;
        }
      }

      console.log('📦 Carregando vendas de balcão para o tenant:', tenant.id);
      console.log('📦 Branch scope:', scope, 'branchId:', branchId);
      
      // Construir parâmetros da query
      const params = new URLSearchParams({ tenant_id: tenant.id });
      
      // Matriz x Filial:
      // - Se estiver em "all" OU sem branchId, buscar vendas da matriz (branch_id IS NULL)
      // - Se a filial atual for a HQ (Matriz), também buscar vendas da matriz
      const isHeadquarters = Boolean(currentBranch?.is_headquarters);
      const shouldUseMatrix = scope === 'all' || !branchId || isHeadquarters || !branchesEnabled;

      // Se está na matriz (scope === 'all' ou sem branchId ou HQ), buscar todas as vendas da matriz
      if (shouldUseMatrix) {
        params.set('branch_scope', 'all');
        console.log(`🔄 [Matriz] Buscando todas as vendas da matriz`, {
          scope,
          branchId,
          isHeadquarters,
          branchesEnabled,
          isMatrixAdmin,
        });
      } else if (branchId) {
        // Se está em uma filial, buscar vendas da filial
        params.set('branch_id', String(branchId));
        console.log(`🔄 [Filial ${branchId}] Buscando vendas da filial`);
      }
      
      const url = `/next_api/sales?${params.toString()}`;
      console.log(`📡 URL da requisição: ${url}`);
      
      // Buscar todas as vendas do tenant (sem filtrar por sale_source na API)
      // O filtro será feito no frontend para incluir vendas antigas sem sale_source
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Erro na resposta da API:', res.status, errorText);
        throw new Error(`Erro ao carregar vendas: ${res.status}`);
      }
      
      // Verificar content-type antes de fazer parse
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
      console.log('📥 Resposta da API:', json);
      
      // A API pode retornar data, rows ou um array direto
      const allData = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
      
      // Filtrar apenas vendas de PDV/balcão
      // Incluir: sale_source = 'pdv', sale_type = 'balcao' ou 'entrega', ou vendas sem sale_source e sem sale_type='produtos'
      // NOTA: Vendas canceladas são carregadas mas filtradas na visualização padrão (filteredVendas)
      const data = allData.filter((s: any) => {
        // Vendas do PDV (marcadas explicitamente)
        if (s.sale_source === 'pdv') return true;
        // Vendas de balcão ou entrega (tipo antigo)
        if (s.sale_type === 'balcao' || s.sale_type === 'entrega') return true;
        // Vendas sem sale_source e sem sale_type='produtos' (vendas antigas de balcão)
        if (!s.sale_source && s.sale_type !== 'produtos') return true;
        // Excluir vendas de produtos
        if (s.sale_source === 'produtos' || s.sale_type === 'produtos') return false;
        // Por padrão, incluir se não tiver sale_source definido (vendas antigas)
        return !s.sale_source;
      });
      
      console.log(`📊 Total de vendas de balcão encontradas: ${data.length}`);
      
      // Debug: verificar se os itens estão vindo
      if (data.length > 0) {
        console.log('🔍 Primeira venda (exemplo):', data[0]);
        console.log('🔍 Itens da primeira venda:', data[0]?.items);
        console.log('🔍 Tipo de items:', typeof data[0]?.items, Array.isArray(data[0]?.items));
      }
      
      // Mapear vendas para o formato esperado
      const mapped: Sale[] = (data || []).map((s: any, i: number) => {
        // Garantir que items seja um array válido
        let items = Array.isArray(s.items) ? s.items : [];
        
        // Se não tem items mas tem sale_id, tentar buscar (para vendas da API que podem não ter vindo com items)
        if (items.length === 0 && s.id) {
          // Os items já deveriam vir da API, mas se não vieram, deixar vazio
          // A API já busca os items e adiciona ao objeto da venda
          items = [];
        }
        
        console.log(`📦 Venda ${i + 1} (${s.sale_number}): ${items.length} itens`, items);
        
        return {
          id: String(s.id ?? i + 1),
          numero: s.sale_number ?? s.numero ?? `VND-${String(i + 1).padStart(6, '0')}`,
          cliente: s.customer?.name ?? s.customer_name ?? s.cliente ?? 'Cliente Avulso',
          customer_id: s.customer_id ?? s.customer?.id ?? null,
          vendedor: s.seller_name ?? s.vendedor ?? '',
          // Mapear itens corretamente - garantir que product_name seja usado
          itens: items.map((it: any) => ({
            produto: it.product?.name ?? it.product_name ?? it.produto ?? 'Produto',
            quantidade: Number(it.quantity ?? it.quantidade ?? 1),
            preco_unitario: Number(it.unit_price ?? it.price ?? it.preco_unitario ?? 0),
            subtotal: Number(it.total_price ?? it.subtotal ?? (Number(it.quantity ?? it.quantidade ?? 1) * Number(it.unit_price ?? it.price ?? it.preco_unitario ?? 0))),
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
          sale_source: s.sale_source ?? null,
        };
      });
      
      console.log(`✅ ${mapped.length} vendas carregadas com sucesso`);
      setVendas(mapped);
    } catch (error) {
      console.error('❌ Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar vendas. Verifique o console para mais detalhes.');
      setVendas([]);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, branchesEnabled, branchLoading, branches, branchId, scope, currentBranch, isMatrixAdmin]);

  useEffect(() => {
    loadVendas();
  }, [loadVendas]);

  // Filtrar vendas (otimizado com useMemo)
  // Se não houver filtro de status ou filtro de status diferente de 'cancelada', excluir canceladas da visualização padrão
  const filteredVendas = React.useMemo(() => {
    return vendas.filter(venda => {
      // Busca flexível (ignora acentos)
      const normalizedSearch = normalizeText(searchTerm);
      const matchesSearch = !normalizedSearch || 
                           normalizeText(venda.numero).includes(normalizedSearch) ||
                           normalizeText(venda.cliente).includes(normalizedSearch) ||
                           (venda.vendedor && normalizeText(venda.vendedor).includes(normalizedSearch));

      const matchesAdvanced = (!advancedFilters.status || venda.status === advancedFilters.status) &&
                             (!advancedFilters.forma_pagamento || venda.forma_pagamento === advancedFilters.forma_pagamento) &&
                             (!advancedFilters.vendedor || normalizeText(venda.vendedor || '').includes(normalizeText(advancedFilters.vendedor))) &&
                             (!advancedFilters.cliente || normalizeText(venda.cliente).includes(normalizeText(advancedFilters.cliente))) &&
                             (!advancedFilters.valor_min || venda.total >= parseFloat(advancedFilters.valor_min)) &&
                             (!advancedFilters.valor_max || venda.total <= parseFloat(advancedFilters.valor_max));

      // Filtro de período
      if (advancedFilters.data_inicio || advancedFilters.data_fim) {
        const vendaDate = new Date(venda.data_venda);
        vendaDate.setHours(0, 0, 0, 0);
        
        if (advancedFilters.data_inicio) {
          const inicioDate = new Date(advancedFilters.data_inicio);
          inicioDate.setHours(0, 0, 0, 0);
          if (vendaDate < inicioDate) return false;
        }
        
        if (advancedFilters.data_fim) {
          const fimDate = new Date(advancedFilters.data_fim);
          fimDate.setHours(23, 59, 59, 999);
          if (vendaDate > fimDate) return false;
        }
      }

      // Se não há filtro de status específico, excluir canceladas
      // Se há filtro de status 'cancelada', incluir apenas canceladas
      // Se há filtro de outro status, excluir canceladas
      if (!advancedFilters.status) {
        // Sem filtro: excluir canceladas da visualização padrão
        if (venda.status === 'cancelada') return false;
      }

      return matchesSearch && matchesAdvanced;
    });
  }, [vendas, searchTerm, advancedFilters]);

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
    
    // Fallback para valores não mapeados ou undefined
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
    
    // Fallback para valores não mapeados ou undefined
    const formaData = forma && formaMap[forma] 
      ? formaMap[forma] 
      : { label: forma || 'Não informado', variant: 'secondary' as const };
    
    return (
      <Badge variant={formaData.variant}>
        {formaData.label}
      </Badge>
    );
  };

  // Calcular estatísticas (otimizado com useMemo)
  const stats = React.useMemo(() => {
    const vendasPagas = vendas.filter(v => v.status === 'paga');
    const faturamentoTotal = vendasPagas.reduce((acc, v) => acc + v.total, 0);
    return {
      totalVendas: vendas.length,
      vendasPagas: vendasPagas.length,
      vendasPendentes: vendas.filter(v => v.status === 'pendente').length,
      faturamento: faturamentoTotal,
      ticketMedio: vendasPagas.length > 0 ? faturamentoTotal / vendasPagas.length : 0
    };
  }, [vendas]);

  // Funções de ação
  const handleVerDetalhes = (venda: Sale) => {
    setSelectedVenda(venda);
    setShowDetailsDialog(true);
  };

  const handleImprimirCupom = (venda: Sale) => {
    // Abrir página de cupom em nova aba
    window.open(`/cupom/${venda.id}`, '_blank');
  };

  const handleImprimirA4 = (venda: Sale) => {
    // Abrir página de impressão A4 em nova aba
    window.open(`/vendas/${venda.id}/a4`, '_blank');
  };

  const handleEditar = (venda: Sale) => {
    setSelectedVenda(venda);
    setShowEditDialog(true);
    // Inicial rápido (fallback) enquanto carrega detalhes/itens
    setEditFormData({
      cliente: venda.cliente,
      customer_id: venda.customer_id ?? null,
      forma_pagamento: venda.forma_pagamento,
      status: venda.status,
      observacoes: venda.observacoes || '',
      total: venda.total,
      itens: venda.itens || [],
    });
  };

  // Carregar detalhes completos (inclui itens) e listas de clientes/produtos ao abrir o modal de edição
  useEffect(() => {
    const loadEditResources = async () => {
      if (!showEditDialog || !selectedVenda || !tenant?.id) return;

      try {
        setLoadingEditDetails(true);

        // 1) Detalhe da venda (itens + customer_id)
        const saleRes = await fetch(`/next_api/sales/${selectedVenda.id}`);
        if (saleRes.ok) {
          const saleJson = await saleRes.json().catch(() => ({}));
          const data = saleJson?.data;
          if (data) {
            const items = Array.isArray(data.items) ? data.items : [];
            const mappedItems = items.map((it: any) => ({
              produto: String(it?.product_name || it?.produto || '').trim(),
              quantidade: Number(it?.quantity) || 1,
              preco_unitario: Number(it?.unit_price) || 0,
              subtotal: Number(it?.subtotal) || (Number(it?.unit_price) || 0) * (Number(it?.quantity) || 1),
              product_id: null as any, // detalhe atual não retorna product_id; usuário pode escolher no combo
            }));

            setEditFormData((prev) => ({
              ...prev,
              cliente: String(data.customer_name || prev.cliente || ''),
              customer_id: data.customer_id ?? null,
              delivery_address: String(data.delivery_address || ''),
              total: Number(data.total_amount ?? prev.total ?? 0),
              itens: mappedItems,
            }));
          }
        }

        // 2) Clientes (para selecionar/pesquisar)
        try {
          const cParams = new URLSearchParams({ tenant_id: tenant.id });
          if (scope === 'all') cParams.set('branch_scope', 'all');
          if (scope === 'branch' && branchId) cParams.set('branch_id', String(branchId));
          const cRes = await fetch(`/next_api/customers?${cParams.toString()}`);
          if (cRes.ok) {
            const cJson = await cRes.json().catch(() => ({}));
            const rows = Array.isArray(cJson?.data) ? cJson.data : [];
            setCustomersForEdit(
              rows
                .filter((c: any) => c?.id && c?.name)
                .map((c: any) => ({
                  id: Number(c.id),
                  name: String(c.name),
                  document: c.document || null,
                  phone: c.phone || null,
                }))
            );
          }
        } catch {}

        // 3) Produtos (para selecionar/pesquisar nos itens)
        try {
          const pParams = new URLSearchParams({ tenant_id: tenant.id });
          // Mantemos o comportamento atual: matriz vê todos
          pParams.set('branch_scope', 'all');
          const pRes = await fetch(`/next_api/products?${pParams.toString()}`);
          if (pRes.ok) {
            const pJson = await pRes.json().catch(() => ({}));
            const rows = Array.isArray(pJson?.data) ? pJson.data : [];
            setProductsForEdit(
              rows
                .filter((p: any) => p?.id && p?.name)
                .map((p: any) => ({
                  id: Number(p.id),
                  name: String(p.name),
                  sku: p.sku || null,
                  sale_price: typeof p.sale_price === 'number' ? p.sale_price : Number(p.sale_price) || null,
                }))
            );
          }
        } catch {}
      } finally {
        setLoadingEditDetails(false);
      }
    };

    loadEditResources();
  }, [showEditDialog, selectedVenda?.id, tenant?.id, scope, branchId]);

  const handleSalvarEdicao = async () => {
    if (!selectedVenda) return;

    try {
      const updateData: any = {
        customer_name: editFormData.cliente,
        customer_id: editFormData.customer_id ?? null,
        delivery_address: editFormData.delivery_address || '',
        payment_method: editFormData.forma_pagamento,
        status: editFormData.status,
        notes: editFormData.observacoes || '',
      };

      if (editFormData.total !== undefined) {
        updateData.total_amount = editFormData.total;
      }

      // Atualizar itens (produto vendido) se existirem no form
      if (Array.isArray(editFormData.itens)) {
        updateData.products = editFormData.itens
          .map((it: any) => ({
            id: it?.product_id ?? null,
            name: String(it?.produto || '').trim(),
            price: Number(it?.preco_unitario),
            quantity: Number(it?.quantidade),
            discount: 0,
          }))
          .filter((p: any) => p.name && Number.isFinite(p.price) && Number.isFinite(p.quantity) && p.quantity > 0);
      }

      const response = await fetch(`/next_api/sales/${selectedVenda.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar venda');
      }

      toast.success('Venda atualizada com sucesso');
      setShowEditDialog(false);
      setEditFormData({});
      loadVendas(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao atualizar venda:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar venda');
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
            notes: 'Entrega desmarcada na página de vendas',
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

    // ✅ Entregador NÃO é obrigatório para marcar como entrega (pode ser definido depois)

    try {
      setSavingDelivery(true);
      
      // Garantir que driver_id seja null se não houver entregador selecionado
      const driverIdValue = selectedDriverId && selectedDriverId.trim() !== '' && selectedDriverId !== '__none__'
        ? Number(selectedDriverId)
        : null;
      
      const res = await fetch('/next_api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          sale_id: selectedVenda.id,
          customer_id: selectedVenda.customer_id || null,
          driver_id: driverIdValue, // Pode ser null se não houver entregador
          status: 'aguardando',
          notes: driverIdValue
            ? `Vinculada na página de vendas para entregador: ${deliveryDrivers.find(d => d.id === driverIdValue)?.name || selectedDriverId}`
            : 'Vinculada na página de vendas (sem entregador definido)',
        }),
      });
      
      if (!res.ok) {
        let errorMessage = 'Erro ao salvar entrega';
        try {
          const errorData = await res.json();
          errorMessage = errorData.errorMessage || errorMessage;
          
          if (errorMessage.includes('Endereço de entrega é obrigatório') || 
              errorMessage.includes('endereço cadastrado')) {
            errorMessage = 'O cliente desta venda não possui endereço cadastrado. Por favor, cadastre o endereço do cliente antes de marcar como entrega.';
          } else if (errorMessage.includes('customer_id')) {
            errorMessage = 'Cliente inválido. Verifique se o cliente está cadastrado corretamente.';
          } else if (errorMessage.includes('driver_id')) {
            errorMessage = 'Entregador inválido. Verifique se o entregador está ativo.';
          }
        } catch {
          const text = await res.text().catch(() => '');
          errorMessage = text || `Erro ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      const driverName = driverIdValue
        ? (deliveryDrivers.find(d => d.id === driverIdValue)?.name || null)
        : null;
      toast.success('Venda marcada para entrega com sucesso!', {
        description: driverName ? `Entregador: ${driverName}` : 'Entregador: não definido (pode ser atribuído depois)',
        duration: 4000,
      });
      setShowDeliveryDialog(false);
      loadVendas(); // Recarregar lista
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Erro ao salvar entrega';
      console.error('Erro ao salvar entrega:', e);
      toast.error(errorMessage, {
        description: 'Verifique se o cliente possui endereço cadastrado e tente novamente.',
        duration: 6000,
      });
    } finally {
      setSavingDelivery(false);
    }
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
      loadVendas(); // Recarregar lista
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
      loadVendas(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir venda. Tente novamente.');
    }
  };

  // Exportar lista de vendas para CSV
  const handleExportarLista = () => {
    try {
      const rows: string[] = [];
      
      // Cabeçalho
      rows.push([
        'Número',
        'Cliente',
        'Vendedor',
        'Data',
        'Total',
        'Forma de Pagamento',
        'Status',
        'Observações'
      ].join(','));
      
      // Dados
      filteredVendas.forEach(venda => {
        const date = formatDate(venda.data_venda).split(' ')[0]; // Apenas data
        const totalValue = formatCurrency(venda.total).replace(/R\$\s*/g, '').trim();
        rows.push([
          `"${venda.numero}"`,
          `"${venda.cliente}"`,
          `"${venda.vendedor || ''}"`,
          `"${date}"`,
          totalValue,
          `"${venda.forma_pagamento}"`,
          `"${venda.status}"`,
          `"${(venda.observacoes || '').replace(/"/g, '""')}"`
        ].join(','));
      });

      const csv = rows.join('\n');
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `vendas_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${filteredVendas.length} venda(s) exportada(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao exportar vendas:', error);
      toast.error('Erro ao exportar vendas');
    }
  };

  // Importar vendas
  const handleImportarVendas = () => {
    fileInputRef.current?.click();
  };

  // Processar arquivo CSV de importação
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      if (ext !== 'csv') {
        toast.error('Por favor, envie um arquivo CSV');
        setImporting(false);
        return;
      }

      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      
      if (lines.length < 2) {
        toast.error('CSV inválido. Deve conter cabeçalho e pelo menos uma linha de dados');
        setImporting(false);
        return;
      }

      // Detectar delimitador
      const delimiter = (lines[0].split(';').length - 1) > (lines[0].split(',').length - 1) ? ';' : ',';
      
      // Parsear CSV manualmente
      const parseCSVLine = (line: string): string[] => {
        const values: string[] = [];
        let current = '';
        let quoted = false;
        
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (quoted && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              quoted = !quoted;
            }
          } else if (ch === delimiter && !quoted) {
            values.push(current.trim());
            current = '';
          } else {
            current += ch;
          }
        }
        values.push(current.trim());
        return values;
      };

      const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());
      const rows = lines.slice(1).map(line => parseCSVLine(line));

      console.log('📋 Headers:', headers);
      console.log('📊 Rows:', rows.length);

      // Normalizar nomes de colunas
      const normalizeHeader = (h: string): string => {
        return h.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, '')
          .trim();
      };

      // Mapear colunas esperadas
      const columnMap: Record<string, string> = {
        'numero': 'numero',
        'numero da venda': 'numero',
        'numero venda': 'numero',
        'cliente': 'cliente',
        'nome cliente': 'cliente',
        'customer': 'cliente',
        'data': 'data',
        'data venda': 'data',
        'date': 'data',
        'total': 'total',
        'valor': 'total',
        'amount': 'total',
        'forma pagamento': 'forma_pagamento',
        'payment method': 'forma_pagamento',
        'metodo pagamento': 'forma_pagamento',
        'status': 'status',
        'observacoes': 'observacoes',
        'notes': 'observacoes',
        'vendedor': 'vendedor',
        'seller': 'vendedor'
      };

      // Processar e validar dados
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || row.every(cell => !cell || cell.trim() === '')) {
          continue; // Linha vazia
        }

        try {
          // Criar objeto de dados da venda
          const rowData: Record<string, string> = {};
          headers.forEach((header, idx) => {
            const normalized = normalizeHeader(header);
            const mappedKey = columnMap[normalized] || normalized;
            rowData[mappedKey] = row[idx] || '';
          });

          // Validar dados obrigatórios
          if (!rowData.cliente || !rowData.total) {
            errors.push(`Linha ${i + 2}: Cliente e Total são obrigatórios`);
            errorCount++;
            continue;
          }

          // Parsear total (remover R$ e formatação)
          const totalStr = rowData.total.toString().replace(/R\$|\s|\./g, '').replace(',', '.');
          const total = parseFloat(totalStr);
          
          if (isNaN(total) || total <= 0) {
            errors.push(`Linha ${i + 2}: Total inválido (${rowData.total})`);
            errorCount++;
            continue;
          }

          // Preparar dados para a API
          // A API exige produtos, então vamos criar um item genérico
          const saleData: any = {
            tenant_id: tenant?.id,
            user_id: '00000000-0000-0000-0000-000000000000', // Usuário padrão para importação
            customer_name: rowData.cliente.trim(),
            total_amount: total,
            payment_method: rowData.forma_pagamento?.toLowerCase() || 'dinheiro',
            status: rowData.status?.toLowerCase() === 'cancelada' ? 'canceled' : (rowData.status?.toLowerCase() === 'paga' ? 'completed' : null),
            notes: rowData.observacoes || null,
            products: [
              {
                id: null, // Sem produto específico para vendas importadas
                name: 'Venda Importada',
                code: 'IMP',
                price: total,
                quantity: 1,
                discount: 0,
                subtotal: total
              }
            ]
          };

          // Parsear data se fornecida
          if (rowData.data) {
            try {
              const dateStr = rowData.data.trim();
              // Tentar diferentes formatos de data
              let saleDate: Date;
              if (dateStr.includes('/')) {
                // Formato DD/MM/YYYY ou DD/MM/YYYY HH:MM
                const parts = dateStr.split(' ');
                const datePart = parts[0].split('/');
                if (datePart.length === 3) {
                  saleDate = new Date(parseInt(datePart[2]), parseInt(datePart[1]) - 1, parseInt(datePart[0]));
                  if (parts[1]) {
                    const timePart = parts[1].split(':');
                    if (timePart.length >= 2) {
                      saleDate.setHours(parseInt(timePart[0]), parseInt(timePart[1]));
                    }
                  }
                } else {
                  saleDate = new Date(dateStr);
                }
              } else {
                saleDate = new Date(dateStr);
              }
              
              if (!isNaN(saleDate.getTime())) {
                saleData.created_at = saleDate.toISOString();
              }
            } catch (e) {
              console.warn(`Linha ${i + 2}: Data inválida, usando data atual`);
            }
          }

          // Criar venda via API
          const response = await fetch('/next_api/sales', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(saleData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            errors.push(`Linha ${i + 2}: ${errorData.error || 'Erro ao criar venda'}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Erro ao processar linha ${i + 2}:`, error);
          errors.push(`Linha ${i + 2}: Erro ao processar - ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          errorCount++;
        }
      }

      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Mostrar resultados
      if (successCount > 0) {
        toast.success(`${successCount} venda(s) importada(s) com sucesso!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} venda(s) não puderam ser importadas. Verifique o console.`);
        console.error('Erros de importação:', errors);
      }

      // Recarregar lista
      loadVendas();
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      toast.error('Erro ao importar arquivo. Verifique o formato do CSV.');
    } finally {
      setImporting(false);
    }
  };

  // Cancelar vendas selecionadas
  const handleCancelarSelecionadas = async () => {
    if (selectedVendas.size === 0) {
      toast.warning('Selecione pelo menos uma venda para cancelar');
      return;
    }

    if (!confirm(`Tem certeza que deseja cancelar ${selectedVendas.size} venda(s) selecionada(s)?`)) {
      return;
    }

    try {
      const promises = Array.from(selectedVendas).map(vendaId => 
        fetch(`/next_api/sales/${vendaId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      const results = await Promise.allSettled(promises);
      const success = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failed = results.length - success;

      if (success > 0) {
        toast.success(`${success} venda(s) cancelada(s) com sucesso`);
      }
      if (failed > 0) {
        toast.error(`${failed} venda(s) não puderam ser canceladas`);
      }

      setSelectedVendas(new Set());
      loadVendas(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao cancelar vendas selecionadas:', error);
      toast.error('Erro ao cancelar vendas selecionadas');
    }
  };

  // Toggle seleção de venda
  const toggleVendaSelection = (vendaId: string) => {
    setSelectedVendas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendaId)) {
        newSet.delete(vendaId);
      } else {
        newSet.add(vendaId);
      }
      return newSet;
    });
  };

  // Selecionar todas as vendas
  const toggleSelectAll = () => {
    if (selectedVendas.size === filteredVendas.length) {
      setSelectedVendas(new Set());
    } else {
      setSelectedVendas(new Set(filteredVendas.map(v => v.id)));
    }
  };

  // Renderizar componente
  return (
    <TenantPageWrapper>
      <div className="space-y-6 p-4 sm:p-6 bg-juga-surface-elevated min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Vendas de Balcão</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Visualize todas as vendas realizadas no PDV/Balcão
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

      {/* Quick Stats - JUGA */}
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
            {/* Lado esquerdo - Botões de ação */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/pdv'}
                className="border-border bg-background hover:bg-accent hover:text-accent-foreground"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Ir para PDV
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-border bg-background hover:bg-accent hover:text-accent-foreground">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Mais Ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleImportarVendas}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Vendas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportarLista}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Lista
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 dark:text-red-400"
                    onClick={handleCancelarSelecionadas}
                    disabled={selectedVendas.size === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancelar Selecionadas ({selectedVendas.size})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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

            {/* Lado direito - Busca */}
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
            <Card className="mt-4 juga-card">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="filter-status" className="text-sm font-medium">Status</Label>
                    <Select 
                      value={advancedFilters.status}
                      onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger id="filter-status" className="bg-white dark:bg-slate-900">
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="paga">Paga</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-pagamento" className="text-sm font-medium">Forma de Pagamento</Label>
                    <Select 
                      value={advancedFilters.forma_pagamento}
                      onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, forma_pagamento: value }))}
                    >
                      <SelectTrigger id="filter-pagamento" className="bg-white dark:bg-slate-900">
                        <SelectValue placeholder="Todas as formas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as formas</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                        <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-cliente" className="text-sm font-medium">Cliente</Label>
                    <AutocompleteInput
                      value={advancedFilters.cliente}
                      onChange={(v) => setAdvancedFilters(prev => ({ ...prev, cliente: v }))}
                      onPick={(opt) => setAdvancedFilters(prev => ({ ...prev, cliente: opt.label }))}
                      placeholder="Digite o nome do cliente..."
                      disabled={loadingCustomers}
                      options={customersList.map(c => ({
                        value: String(c.id),
                        label: c.name,
                        keywords: [c.document, c.phone].filter(Boolean).join(' ')
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-vendedor" className="text-sm font-medium">Vendedor</Label>
                    <Input
                      id="filter-vendedor"
                      placeholder="Digite o nome do vendedor..."
                      value={advancedFilters.vendedor}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, vendedor: e.target.value }))}
                      className="bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-data-inicio" className="text-sm font-medium">Data Início</Label>
                    <Input
                      id="filter-data-inicio"
                      type="date"
                      value={advancedFilters.data_inicio}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, data_inicio: e.target.value }))}
                      className="bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-data-fim" className="text-sm font-medium">Data Fim</Label>
                    <Input
                      id="filter-data-fim"
                      type="date"
                      value={advancedFilters.data_fim}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, data_fim: e.target.value }))}
                      className="bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-valor-min" className="text-sm font-medium">Valor Mínimo</Label>
                    <Input
                      id="filter-valor-min"
                      type="number"
                      step="0.01"
                      placeholder="R$ 0,00"
                      value={advancedFilters.valor_min}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, valor_min: e.target.value }))}
                      className="bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-valor-max" className="text-sm font-medium">Valor Máximo</Label>
                    <Input
                      id="filter-valor-max"
                      type="number"
                      step="0.01"
                      placeholder="R$ 0,00"
                      value={advancedFilters.valor_max}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, valor_max: e.target.value }))}
                      className="bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-2 flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => setAdvancedFilters({
                        status: '',
                        forma_pagamento: '',
                        vendedor: '',
                        cliente: '',
                        data_inicio: '',
                        data_fim: '',
                        valor_min: '',
                        valor_max: ''
                      })}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="juga-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            Lista de Vendas ({filteredVendas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando vendas...</div>
          ) : filteredVendas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma venda encontrada</div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedVendas.size === filteredVendas.length && filteredVendas.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
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
                  <TableRow 
                    key={venda.id}
                    className="hover:bg-muted/30"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedVendas.has(venda.id)}
                        onCheckedChange={() => toggleVendaSelection(venda.id)}
                      />
                    </TableCell>
                    {columnVisibility.numero && (
                      <TableCell className="font-mono text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {venda.numero}
                          {venda.sale_source === 'api' && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              API
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
                          <DropdownMenuItem onClick={() => handleImprimirA4(venda)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Imprimir A4
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleImprimirCupom(venda)}>
                            <Receipt className="h-4 w-4 mr-2" />
                            Imprimir Cupom
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditar(venda)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleMarcarEntrega(venda)}>
                            <Truck className="h-4 w-4 mr-2" />
                            Marcar como Entrega
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

          {filteredVendas.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma venda encontrada
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

      {/* Dialog de Edição da Venda */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Venda</DialogTitle>
            <DialogDescription>
              Edite as informações da venda {selectedVenda?.numero}
            </DialogDescription>
          </DialogHeader>
          {selectedVenda && (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Cliente</Label>
                <div className="space-y-2">
                  <AutocompleteInput
                    value={editFormData.cliente || ''}
                    onChange={(text) => {
                      // Ao digitar, vira cliente avulso automaticamente
                      setEditFormData((prev) => ({ ...prev, cliente: text, customer_id: null }));
                    }}
                    onPick={(opt) => {
                      if (opt.value === '__walkin__') {
                        setEditFormData((prev) => ({ ...prev, customer_id: null }));
                        return;
                      }
                      const id = Number(opt.value);
                      const c = customersForEdit.find((x) => x.id === id);
                      setEditFormData((prev) => ({
                        ...prev,
                        customer_id: Number.isFinite(id) ? id : null,
                        cliente: c?.name || opt.label || prev.cliente,
                      }));
                    }}
                    placeholder={loadingEditDetails ? 'Carregando...' : 'Pesquisar cliente (ou digitar avulso)...'}
                    disabled={loadingEditDetails}
                    options={[
                      { value: '__walkin__', label: 'Cliente avulso (não vincular)', keywords: 'avulso' },
                      ...customersForEdit.map((c) => ({
                        value: String(c.id),
                        label: `${c.name}${c.document ? ` — ${c.document}` : ''}${c.phone ? ` — ${c.phone}` : ''}`,
                        keywords: `${c.name} ${c.document || ''} ${c.phone || ''}`,
                      })),
                    ]}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="delivery_address">Endereço do Cliente / Entrega</Label>
                <Input
                  id="delivery_address"
                  type="text"
                  value={editFormData.delivery_address || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                  placeholder="Rua, número, bairro, cidade..."
                  className="col-span-full"
                />
                <p className="text-xs text-muted-foreground">
                  Se preenchido, aparece no cupom. Caso contrário, usa o endereço cadastrado do cliente.
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Produtos vendidos</Label>
                <div className="space-y-2 rounded-md border p-3">
                  {Array.isArray(editFormData.itens) && editFormData.itens.length > 0 ? (
                    (editFormData.itens as any[]).map((it, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                          <AutocompleteInput
                            value={it.produto || ''}
                            onChange={(text) => {
                              // Ao digitar, vira produto manual automaticamente
                              setEditFormData((prev) => {
                                const itens = Array.isArray(prev.itens) ? [...prev.itens] : [];
                                const qty = Number((itens[idx] as any)?.quantidade) || 1;
                                const price = Number((itens[idx] as any)?.preco_unitario) || 0;
                                (itens[idx] as any) = {
                                  ...(itens[idx] as any),
                                  product_id: null,
                                  produto: text,
                                  subtotal: qty * price,
                                };
                                return { ...prev, itens };
                              });
                            }}
                            onPick={(opt) => {
                              if (opt.value === '__custom__') {
                                setEditFormData((prev) => {
                                  const itens = Array.isArray(prev.itens) ? [...prev.itens] : [];
                                  (itens[idx] as any) = { ...(itens[idx] as any), product_id: null };
                                  return { ...prev, itens };
                                });
                                return;
                              }
                              const id = Number(opt.value);
                              const p = productsForEdit.find((x) => x.id === id);
                              setEditFormData((prev) => {
                                const itens = Array.isArray(prev.itens) ? [...prev.itens] : [];
                                const qty = Number((itens[idx] as any)?.quantidade) || 1;
                                const price = Number(p?.sale_price) || Number((itens[idx] as any)?.preco_unitario) || 0;
                                (itens[idx] as any) = {
                                  ...(itens[idx] as any),
                                  product_id: Number.isFinite(id) ? id : null,
                                  produto: p?.name || opt.label || (itens[idx] as any)?.produto || '',
                                  preco_unitario: price,
                                  subtotal: qty * price,
                                };
                                return { ...prev, itens };
                              });
                            }}
                            placeholder={loadingEditDetails ? 'Carregando...' : 'Pesquisar produto (ou digitar manual)...'}
                            disabled={loadingEditDetails}
                            options={[
                              { value: '__custom__', label: 'Produto manual (não vincular)', keywords: 'manual' },
                              ...productsForEdit.map((p) => ({
                                value: String(p.id),
                                label: `${p.name}${p.sku ? ` — ${p.sku}` : ''}${p.sale_price ? ` — R$ ${Number(p.sale_price).toFixed(2)}` : ''}`,
                                keywords: `${p.name} ${p.sku || ''}`,
                              })),
                            ]}
                          />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs text-muted-foreground">Qtd</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.quantidade ?? 1}
                            onChange={(e) => {
                              const q = Number(e.target.value) || 0;
                              setEditFormData((prev) => {
                                const itens = Array.isArray(prev.itens) ? [...prev.itens] : [];
                                const price = Number((itens[idx] as any)?.preco_unitario) || 0;
                                (itens[idx] as any) = { ...(itens[idx] as any), quantidade: q, subtotal: q * price };
                                return { ...prev, itens };
                              });
                            }}
                          />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs text-muted-foreground">R$ Unit.</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.preco_unitario ?? 0}
                            onChange={(e) => {
                              const pr = Number(e.target.value) || 0;
                              setEditFormData((prev) => {
                                const itens = Array.isArray(prev.itens) ? [...prev.itens] : [];
                                const qty = Number((itens[idx] as any)?.quantidade) || 0;
                                (itens[idx] as any) = { ...(itens[idx] as any), preco_unitario: pr, subtotal: qty * pr };
                                return { ...prev, itens };
                              });
                            }}
                          />
                        </div>
                        <div className="col-span-12 flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            Subtotal: R$ {Number(it.subtotal ?? (Number(it.quantidade) || 0) * (Number(it.preco_unitario) || 0)).toFixed(2)}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEditFormData((prev) => {
                                const itens = Array.isArray(prev.itens) ? [...prev.itens] : [];
                                itens.splice(idx, 1);
                                return { ...prev, itens };
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {idx < (editFormData.itens as any[]).length - 1 ? <div className="col-span-12 border-t my-2" /> : null}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Nenhum item encontrado nesta venda.</div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setEditFormData((prev) => ({
                          ...prev,
                          itens: [
                            ...(Array.isArray(prev.itens) ? prev.itens : []),
                            { produto: '', quantidade: 1, preco_unitario: 0, subtotal: 0, product_id: null },
                          ],
                        }))
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar item
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const itens = Array.isArray(editFormData.itens) ? (editFormData.itens as any[]) : [];
                        const total = itens.reduce((acc, it) => acc + (Number(it.subtotal) || (Number(it.quantidade) || 0) * (Number(it.preco_unitario) || 0)), 0);
                        setEditFormData((prev) => ({ ...prev, total }));
                      }}
                    >
                      Recalcular total
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <select
                  id="forma_pagamento"
                  className="px-3 py-2 border rounded-md bg-background text-foreground border-input"
                  value={editFormData.forma_pagamento || 'dinheiro'}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, forma_pagamento: e.target.value as Sale['forma_pagamento'] }))}
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_debito">Cartão Débito</option>
                  <option value="cartao_credito">Cartão Crédito</option>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="px-3 py-2 border rounded-md bg-background text-foreground border-input"
                  value={editFormData.status || 'pendente'}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as Sale['status'] }))}
                >
                  <option value="pendente">Pendente</option>
                  <option value="paga">Paga</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="total">Total (R$)</Label>
                <Input
                  id="total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.total || 0}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, total: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="observacoes">Observações</Label>
                <textarea
                  id="observacoes"
                  className="px-3 py-2 border rounded-md min-h-[80px] bg-background text-foreground border-input"
                  value={editFormData.observacoes || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setEditFormData({});
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarEdicao} className="bg-emerald-600 hover:bg-emerald-700">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Dialog de Importação de Vendas */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Importar Vendas</DialogTitle>
            <DialogDescription>
              Importe vendas através de um arquivo CSV
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Formato do CSV esperado:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Cliente</strong> (obrigatório) - Nome do cliente</li>
                <li><strong>Total</strong> (obrigatório) - Valor da venda (ex: 100.50 ou R$ 100,50)</li>
                <li><strong>Data</strong> (opcional) - Data da venda (ex: 01/11/2025 ou 01/11/2025 14:30)</li>
                <li><strong>Forma de Pagamento</strong> (opcional) - dinheiro, pix, cartao_debito, cartao_credito, boleto</li>
                <li><strong>Status</strong> (opcional) - pendente, paga, cancelada</li>
                <li><strong>Observações</strong> (opcional) - Observações adicionais</li>
              </ul>
              <p className="mt-4 font-medium">Exemplo de cabeçalho:</p>
              <code className="block mt-2 p-2 bg-muted rounded text-xs">
                Cliente,Total,Data,Forma de Pagamento,Status,Observações
              </code>
            </div>
            {importing && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Importando vendas...</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowImportDialog(false);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Fechar
            </Button>
            <Button 
              onClick={() => {
                setShowImportDialog(false);
                fileInputRef.current?.click();
              }}
              disabled={importing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Arquivo CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Configurar Entrega */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Configurar Entrega
            </DialogTitle>
            <DialogDescription>
              Configure a entrega para a venda {selectedVenda?.numero}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm">Entrega</h3>
                  <p className="text-xs text-gray-500">
                    Marque se essa venda deve entrar no romaneio do entregador.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={isDelivery}
                    onChange={(e) => setIsDelivery(e.target.checked)}
                    className="w-4 h-4"
                  />
                  É entrega
                </label>
              </div>

              {isDelivery && (
                <div className="mt-3 space-y-3">
                  <div className="text-xs text-gray-600">
                    <strong>Cliente:</strong> {selectedVenda?.cliente || 'Não informado'}
                    {!selectedVenda?.cliente && (
                      <span className="ml-2 text-red-600">
                        (cliente não informado)
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700">Entregador</Label>
                    <Select
                      value={selectedDriverId}
                      onValueChange={(v) => setSelectedDriverId(v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder={loadingDrivers ? 'Carregando...' : deliveryDrivers.length === 0 ? 'Nenhum entregador cadastrado' : 'Selecione um entregador (opcional)'} />
                      </SelectTrigger>
                      <SelectContent className="z-[10000] max-h-[200px] overflow-y-auto">
                        {deliveryDrivers.length === 0 && !loadingDrivers ? (
                          <div className="px-2 py-1.5 text-xs text-gray-400 text-center">
                            Nenhum entregador cadastrado
                          </div>
                        ) : loadingDrivers ? (
                          <div className="px-2 py-1.5 text-xs text-gray-400 text-center">
                            Carregando...
                          </div>
                        ) : (
                          <>
                            <SelectItem value="__none__" className="text-xs">
                              Sem entregador
                            </SelectItem>
                            {deliveryDrivers.map((d) => (
                              <SelectItem key={d.id} value={String(d.id)} className="text-xs">
                                {d.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliveryDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={saveDeliveryConfig}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={savingDelivery}
            >
              {savingDelivery ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </TenantPageWrapper>
  );
}