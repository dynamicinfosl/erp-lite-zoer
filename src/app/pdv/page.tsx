'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JugaKPICard } from '@/components/dashboard/JugaComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { OverlaySelect } from '@/components/ui/overlay-select';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Barcode,
  CreditCard,
  Receipt,
  FileText,
  User,
  Package,
  X,
  Check,
  Home,
  Users,
  DollarSign,
  Settings,
  ArrowLeft,
  MoreVertical,
  MinusCircle,
  RefreshCw,
  RotateCcw,
  Lock,
  History,
  Wallet,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  Smartphone,
  LayoutDashboard,
  Warehouse,
  Truck,
  Wrench,
  BarChart3,
  Building2,
  UserCog,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Product, PDVItem } from '@/types';
import { ENABLE_AUTH } from '@/constants/auth';
import { api } from '@/lib/api-client';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { useBranch } from '@/contexts/BranchContext';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';
import { PaymentSection } from '@/components/pdv/PaymentSection';
import { SaleConfirmationModal } from '@/components/pdv/SaleConfirmationModal';
import { DeliveryQuickModal } from '@/components/pdv/DeliveryQuickModal';
import { CashClosingModal, CashClosingData } from '@/components/pdv/CashClosingModal';
import { CashClosingSuccessModal } from '@/components/pdv/CashClosingSuccessModal';
import { CashOpeningModal, CashOpeningData } from '@/components/pdv/CashOpeningModal';
import { getDeviceInfo, formatDeviceInfo } from '@/lib/cash-session-security';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

interface Sale {
  id: string;
  numero: string;
  cliente: string;
  total: number;
  forma_pagamento: string;
  data_venda: string;
  status: 'pendente' | 'paga' | 'cancelada';
}

interface CaixaOperation {
  id: string;
  tipo: 'sangria' | 'reforco' | 'abertura' | 'fechamento';
  valor: number;
  descricao: string;
  data: string;
  usuario: string;
}

interface PendingSale {
  id: string;
  cart: PDVItem[];
  customerName: string;
  customerId: number | null;
  total: number;
  createdAt: string;
}

export default function PDVPage() {
  const { user, tenant, signOut } = useSimpleAuth();
  const { scope, branchId } = useBranch();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<PDVItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<PDVItem | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerCreateOpen, setCustomerCreateOpen] = useState(false);
  const [customerCreateLoading, setCustomerCreateLoading] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    zipcode: '',
    notes: '',
    type: 'PF',
    status: 'active',
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriceTiers, setSelectedPriceTiers] = useState<Array<{ name: string; price: number; price_type_id?: number }>>([]);
  const [selectedVariants, setSelectedVariants] = useState<Array<{ id: number; label: string; name?: string | null; sale_price?: number | null }>>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [priceInputValue, setPriceInputValue] = useState<string>('');
  
  // Novos estados para funcionalidades avançadas
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showCaixaDialog, setShowCaixaDialog] = useState(false);
  const [showCashOpeningModal, setShowCashOpeningModal] = useState(false);
  const [showCashClosingModal, setShowCashClosingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [closingResult, setClosingResult] = useState<any>(null);
  const [caixaOperationType, setCaixaOperationType] = useState<'sangria' | 'reforco' | 'fechamento'>('sangria');
  const [cashSessionId, setCashSessionId] = useState<number | null>(null);
  const [cashSessionOpenedAt, setCashSessionOpenedAt] = useState<string>('');
  const [cashSessionOpenedBy, setCashSessionOpenedBy] = useState<string>('');
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  // Persistência local do histórico do dia
  const getLocalSalesKey = useCallback(() => {
    const tenantId = tenant?.id || 'no-tenant';
    // Usar data atual (apenas no cliente para evitar problemas de hidratação)
    if (typeof window === 'undefined') {
      return `pdv.todaySales.${tenantId}.temp`;
    }
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `pdv.todaySales.${tenantId}.${y}-${m}-${d}`;
  }, [tenant?.id]);

  const saveTodaySalesLocal = useCallback((sales: Sale[]) => {
    try {
      if (typeof window === 'undefined') return;
      const key = getLocalSalesKey();
      localStorage.setItem(key, JSON.stringify(sales));
      // fallback global (independente do tenant) para garantir visibilidade
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      localStorage.setItem(`pdv.todaySales.global.${y}-${m}-${d}`, JSON.stringify(sales));
    } catch {}
  }, [getLocalSalesKey]);

  const loadTodaySalesLocal = useCallback(() => {
    try {
      let raw = localStorage.getItem(getLocalSalesKey());
      if (!raw) {
        // tentar global fallback
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        raw = localStorage.getItem(`pdv.todaySales.global.${y}-${m}-${d}`) || '';
      }
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setTodaySales(parsed);
      }
    } catch {}
  }, [getLocalSalesKey]);

  const [caixaOperations, setCaixaOperations] = useState<CaixaOperation[]>([]);
  const [caixaInicial, setCaixaInicial] = useState(0);
  const [currentCashSessionId, setCurrentCashSessionId] = useState<string | null>(null);
  const [showOpenCaixaModal, setShowOpenCaixaModal] = useState(false);
  const [openCaixaInitialAmount, setOpenCaixaInitialAmount] = useState('');
  const [loadingCashSession, setLoadingCashSession] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito' | 'boleto'>('dinheiro');
  const [currentSection, setCurrentSection] = useState<'pdv' | 'payment'>('pdv');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const [deliveryQuickOpen, setDeliveryQuickOpen] = useState(false);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [showPendingSalesDialog, setShowPendingSalesDialog] = useState(false);
  const [restoredSaleId, setRestoredSaleId] = useState<string | null>(null);
  
  // Funções para gerenciar vendas em espera no localStorage
  const getPendingSalesKey = useCallback(() => {
    const tenantId = tenant?.id || 'no-tenant';
    return `pdv.pendingSales.${tenantId}`;
  }, [tenant?.id]);

  const loadPendingSales = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      const key = getPendingSalesKey();
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setPendingSales(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar vendas em espera:', error);
    }
  }, [getPendingSalesKey]);

  const savePendingSales = useCallback((sales: PendingSale[]) => {
    try {
      if (typeof window === 'undefined') return;
      const key = getPendingSalesKey();
      localStorage.setItem(key, JSON.stringify(sales));
      setPendingSales(sales);
    } catch (error) {
      console.error('Erro ao salvar vendas em espera:', error);
    }
  }, [getPendingSalesKey]);

  // Carregar vendas em espera ao montar o componente
  useEffect(() => {
    loadPendingSales();
  }, [loadPendingSales]);

  // Obrigatório: verificar sessão de caixa aberta (abertura obrigatória todo dia)
  useEffect(() => {
    if (!tenant?.id) {
      setLoadingCashSession(false);
      return;
    }
    let cancelled = false;
    const checkOpenSession = async () => {
      try {
        setLoadingCashSession(true);
        const params = new URLSearchParams({ tenant_id: tenant.id, status: 'open' });
        const res = await fetch(`/next_api/cash-sessions?${params.toString()}`);
        if (cancelled) return;
        if (!res.ok) {
          setShowOpenCaixaModal(true);
          setLoadingCashSession(false);
          return;
        }
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const sessionToday = data.find((s: any) => {
          const opened = s.opened_at ? new Date(s.opened_at) : null;
          if (!opened) return false;
          const openedStr = `${opened.getFullYear()}-${String(opened.getMonth() + 1).padStart(2, '0')}-${String(opened.getDate()).padStart(2, '0')}`;
          const sameDay = openedStr === todayStr;
          if (user?.id && s.user_id) return sameDay && String(s.user_id) === String(user.id);
          return sameDay;
        });
        if (cancelled) return;
        if (sessionToday) {
          setCurrentCashSessionId(String(sessionToday.id));
          setCaixaInicial(Number(sessionToday.initial_amount) || 0);
          setShowOpenCaixaModal(false);
        } else {
          setShowOpenCaixaModal(true);
        }
      } catch (e) {
        if (!cancelled) setShowOpenCaixaModal(true);
      } finally {
        if (!cancelled) setLoadingCashSession(false);
      }
    };
    checkOpenSession();
    return () => { cancelled = true; };
  }, [tenant?.id, user?.id]);

  const handleOpenCaixaConfirm = useCallback(async () => {
    const initial = parseFloat(openCaixaInitialAmount.replace(',', '.')) || 0;
    if (initial < 0) {
      toast.error('Valor inicial deve ser maior ou igual a zero.');
      return;
    }
    if (!tenant?.id) {
      toast.error('Tenant não disponível.');
      return;
    }
    try {
      const body: Record<string, unknown> = {
        tenant_id: tenant.id,
        opened_at: new Date().toISOString(),
        initial_amount: initial,
        status: 'open',
        register_id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pdv-${Date.now()}`,
      };
      if (user?.id) body.user_id = String(user.id);
      const res = await fetch('/next_api/cash-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Erro ao abrir caixa');
      }
      const json = await res.json();
      const created = json?.data;
      if (created?.id) {
        setCurrentCashSessionId(String(created.id));
        setCaixaInicial(initial);
        setShowOpenCaixaModal(false);
        setOpenCaixaInitialAmount('');
        toast.success('Caixa aberto com sucesso. Bom trabalho!');
      } else {
        throw new Error('Resposta inválida');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erro ao abrir caixa');
    }
  }, [tenant?.id, user?.id, openCaixaInitialAmount]);

  const addSelectedToCart = useCallback(() => {
    if (!selectedProduct) return;

    const variantId = selectedVariantId;
    const variantLabel = selectedVariants.find((v) => v.id === variantId)?.label || null;
    
    // Criar chave única: product_id + variant_id (ou null se não houver variação)
    const cartKey = variantId ? `${selectedProduct.id}-${variantId}` : `${selectedProduct.id}-null`;

    setCart((prevCart) => {
      // Buscar item existente usando a chave única (product_id + variant_id)
      const existingIndex = prevCart.findIndex((item) => {
        const itemKey = item.variant_id ? `${item.id}-${item.variant_id}` : `${item.id}-null`;
        return itemKey === cartKey;
      });

      if (existingIndex >= 0) {
        // Se já existe, apenas incrementa a quantidade
        const updatedCart = [...prevCart];
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: updatedCart[existingIndex].quantity + selectedProduct.quantity,
          discount: selectedProduct.discount,
        };
        return updatedCart;
      }

      // Se não existe, adiciona como novo item
      const itemName = variantLabel ? `${selectedProduct.name} - ${variantLabel}` : selectedProduct.name;
      return [...prevCart, { 
        ...selectedProduct, 
        name: itemName,
        variant_id: variantId || null,
        variant_label: variantLabel || null,
      }];
    });

    const displayName = variantLabel ? `${selectedProduct.name} - ${variantLabel}` : selectedProduct.name;
    toast.success(`${displayName} adicionado ao carrinho`);
    setSelectedProduct(null);
    setSelectedVariantId(null);
    setSearchTerm('');
  }, [selectedProduct, selectedVariantId, selectedVariants]);

  useEffect(() => {
    let cancelled = false;
    
    const loadProducts = async (retryCount = 0) => {
      try {
        setLoading(true);
        
        // Aguardar tenant estar disponível (máximo 3 segundos)
        let attempts = 0;
        while (!tenant?.id && attempts < 30 && !cancelled) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (cancelled) return;
        
        if (!tenant?.id) { 
          if (retryCount < 2) {
            // Retry após 500ms
            setTimeout(() => loadProducts(retryCount + 1), 500);
            return;
          }
          setProducts([]);
          setLoading(false);
          return; 
        }

        const params = new URLSearchParams({ tenant_id: tenant.id });
        // PDV opera em uma filial específica; se estiver em "todas", carregamos sem filtro (fallback)
        if (scope === 'branch' && branchId) params.set('branch_id', String(branchId));
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
        
        const res = await fetch(`/next_api/products?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        
        clearTimeout(timeoutId);
        
        if (cancelled) return;
        
        if (!res.ok) {
          throw new Error(`Erro ao carregar produtos: ${res.status} ${res.statusText}`);
        }
        
        const json = await res.json();
        if (cancelled) return;
        
        const data = Array.isArray(json?.data) ? json.data : (Array.isArray(json?.rows) ? json.rows : (Array.isArray(json) ? json : []));
        
        if (!Array.isArray(data)) {
          throw new Error('Resposta da API não é um array');
        }
        
        setProducts(data);
        setLoading(false);
      } catch (error: any) {
        if (cancelled) return;
        
        if (error.name === 'AbortError') {
          if (retryCount < 2) {
            setTimeout(() => loadProducts(retryCount + 1), 1000);
            return;
          }
        }
        
        if (retryCount < 2 && !error.message?.includes('404')) {
          setTimeout(() => loadProducts(retryCount + 1), 1000);
          return;
        }
        
        setProducts([]);
        setLoading(false);
        if (retryCount >= 2) {
          toast.error('Erro ao carregar produtos. Tente recarregar a página.');
        }
      }
    };

    loadProducts();
    
    return () => {
      cancelled = true;
    };
  }, [tenant?.id, scope, branchId]);

  // Função para recarregar vendas do dia
  const reloadTodaySales = useCallback(async () => {
    try {
      if (!tenant?.id) {
        console.warn('⚠️ Tenant não disponível para carregar vendas');
        setTodaySales([]);
        return;
      }
      
      console.log('🔄 [PDV] Carregando vendas do dia para tenant:', tenant.id);
      console.log('🔍 [PDV] Tipo do tenant.id:', typeof tenant.id);
      console.log('🔍 [PDV] Valor exato do tenant.id:', JSON.stringify(tenant.id));
      
      // Primeiro tenta carregar do localStorage para feedback imediato
      loadTodaySalesLocal();

      try {
        const tz = -new Date().getTimezoneOffset();
        // ✅ IMPORTANTE: Adicionar branch_scope='all' para buscar todas as vendas do tenant
        // A API retorna array vazio se não tiver branch_id ou branch_scope
        const params = new URLSearchParams({
          today: 'true',
          tenant_id: tenant.id,
          tz: tz.toString(),
          branch_scope: 'all', // Buscar todas as vendas do tenant (sem filtrar por filial)
          sale_source: 'pdv' // Filtrar apenas vendas do PDV
        });
        const url = `/next_api/sales?${params.toString()}`;
        console.log('🔍 [PDV] URL completa da requisição:', url);
        console.log('🔍 [PDV] Timezone offset:', tz);
        console.log('🔍 [PDV] Data/hora atual:', new Date().toISOString());
        
        console.log('📤 [PDV] Iniciando requisição fetch...');
        const response = await fetch(url);
        console.log('📥 [PDV] Resposta recebida!');
        
        console.log('📥 [PDV] Status da resposta:', response.status, response.statusText);
        console.log('📥 [PDV] Headers da resposta:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 [PDV] Dados brutos recebidos:', JSON.stringify(data, null, 2));
          const sales = data.sales || data.data || [];
          
          console.log('✅ [PDV] Vendas encontradas no response:', sales.length);
          if (sales.length > 0) {
            console.log('📋 [PDV] Primeira venda completa:', JSON.stringify(sales[0], null, 2));
          } else {
            console.warn('⚠️ [PDV] Array de vendas está vazio!');
            console.log('🔍 [PDV] Conteúdo completo da resposta:', data);
          }
          
          // Converter para formato local
          const localSales: Sale[] = sales.map((sale: any) => ({
            id: sale.id,
            numero: sale.sale_number || sale.numero || `#${sale.id}`,
            cliente: sale.customer_name || sale.cliente || 'Cliente não informado',
            total: parseFloat(sale.total_amount || sale.final_amount || sale.total || 0),
            forma_pagamento: sale.payment_method || sale.forma_pagamento || 'dinheiro',
            data_venda: sale.created_at || sale.sold_at || sale.data_venda,
            status: sale.status === 'completed' ? 'paga' : (sale.status || 'paga'),
          }));
          
          console.log('✅ Vendas convertidas:', localSales.length);
          setTodaySales(localSales);
          saveTodaySalesLocal(localSales);
        } else {
          const errorText = await response.text();
          console.error('❌ Erro ao carregar vendas:', response.status, errorText);
          // Mantém dados locais, mas não elimina
        }
      } catch (fetchError: any) {
        console.error('❌ Erro na requisição de vendas:', fetchError);
        // Mantém dados locais
      }
    } catch (error) {
      console.error('❌ Erro ao carregar vendas do dia:', error);
      // Mantém dados locais
    }
  }, [tenant?.id, loadTodaySalesLocal, saveTodaySalesLocal]);

  // Carregar vendas do dia
  useEffect(() => {
    reloadTodaySales();
  }, [reloadTodaySales]);

  // Buscar ou criar sessão de caixa ao abrir o PDV
  useEffect(() => {
    const loadCashSession = async () => {
      if (!tenant?.id) return;

      try {
        // Buscar sessão aberta
        const response = await fetch(`/next_api/cash-sessions?status=open&tenant_id=${encodeURIComponent(tenant.id)}`);
        if (response.ok) {
          const data = await response.json();
          const sessions = data.data || data.sales || [];
          const openSession = sessions.find((s: any) => s.status === 'open');
          
          if (openSession) {
            setCashSessionId(openSession.id);
            setCashSessionOpenedAt(openSession.opened_at);
            setCashSessionOpenedBy(openSession.opened_by);
            setCaixaInicial(parseFloat(openSession.opening_amount || openSession.initial_amount || 0));
          } else {
            // Se não houver sessão aberta, inicializar com valores padrão
            setCashSessionOpenedAt(new Date().toISOString());
            setCashSessionOpenedBy(user?.email || 'Operador');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar sessão de caixa:', error);
        // Inicializar com valores padrão em caso de erro
        setCashSessionOpenedAt(new Date().toISOString());
        setCashSessionOpenedBy(user?.email || 'Operador');
      }
    };

    loadCashSession();
  }, [tenant?.id, user?.email]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            document.getElementById('search-input')?.focus();
            break;
          case 'Enter':
            e.preventDefault();
            addSelectedToCart();
            break;
          case 'Escape':
            e.preventDefault();
            setSelectedProduct(null);
            setSearchTerm('');
            setPriceInputValue('');
            break;
        }
      }

      if (e.key === 'F1') {
        e.preventDefault();
        setSidebarOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [addSelectedToCart]); // Incluir addSelectedToCart nas dependências

  // Função para normalizar texto removendo acentos
  const normalizeText = (text: string): string => {
    return String(text || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  };

  const filteredProducts = useMemo(() => {
    if (loading || !Array.isArray(products)) return [];
    if (products.length === 0) return [];
    
    const normalizedSearch = normalizeText(searchTerm);
    const isNumericSearch = /^\d+$/.test(normalizedSearch);
    
    if (!normalizedSearch) {
      return products.map((product, index) => ({
        id: product.id || index + 1,
        name: String(product.name || 'Produto sem nome').trim(),
        price: Number(product.sale_price || product.cost_price || 0),
        code: String(product.sku || product.barcode || product.id || index + 1).trim(),
      }));
    }
    
    const mapped = products
      .map((product, index) => {
        const name = String(product.name || 'Produto sem nome').trim();
        const code = String(product.sku || product.barcode || product.id || index + 1).trim();
        const normalizedName = normalizeText(name);
        const normalizedCode = normalizeText(code);

        const codeStarts = normalizedCode.startsWith(normalizedSearch);
        const codeIncludes = normalizedCode.includes(normalizedSearch);
        const nameIncludes = normalizedName.includes(normalizedSearch);

        if (!codeStarts && !codeIncludes && !nameIncludes) {
          return null;
        }

        // Score menor = aparece antes (para ordenação crescente)
        const score = codeStarts ? 0 : codeIncludes ? 1 : nameIncludes ? 2 : 3;

        return {
          id: product.id || index + 1,
          name,
          price: Number(product.sale_price || product.cost_price || 0),
          code,
          _score: score,
          _codeStarts: codeStarts,
          _codeIncludes: codeIncludes,
          _nameIncludes: nameIncludes,
        };
      })
      .filter((product): product is NonNullable<typeof product> => product !== null)
      .filter((product) => {
        // Quando for numérico: aceita código começa/contém e nome contém, mas prioriza "começa" no sort
        if (isNumericSearch) {
          return product._codeStarts || product._codeIncludes || product._nameIncludes;
        }

        // Quando for texto: mantém busca por código que começa OU nome que contém
        return product._codeStarts || product._nameIncludes;
      })
      .sort((a, b) => {
        // Quando for numérico, garantir que códigos que começam apareçam primeiro
        if (isNumericSearch) {
          if (a._score !== b._score) return a._score - b._score;
        } else {
          // Para texto, ordenar por score (menor primeiro)
          if (a._score !== b._score) return a._score - b._score;
        }
        // Desempate estável para não "pular" muito a lista
        const codeCmp = String(a.code).localeCompare(String(b.code), 'pt-BR', { numeric: true, sensitivity: 'base' });
        if (codeCmp !== 0) return codeCmp;
        return String(a.name).localeCompare(String(b.name), 'pt-BR', { numeric: true, sensitivity: 'base' });
      })
      .map(({ _score, _codeStarts, _codeIncludes, _nameIncludes, ...rest }) => rest);
    
    return mapped;
  }, [loading, products, searchTerm]);

  const selectProduct = async (product: { id: number; name: string; price: number; code: string }) => {
    // Se o produto tem variações de valor, carregá-las e permitir seleção inline (sem modal)
    if (!tenant?.id) {
      setSelectedProduct({ ...product, quantity: 1, discount: 0 });
      setSelectedVariants([]);
      setSelectedVariantId(null);
      setSelectedPriceTiers([]);
      setPriceInputValue(product.price > 0 ? product.price.toFixed(2).replace('.', ',') : '');
      return;
    }
    
    // Carregar price tiers
    let tiers: Array<{ name: string; price: number; price_type_id?: number }> = [];
    try {
      const resTiers = await fetch(
        `/next_api/product-price-tiers?tenant_id=${encodeURIComponent(tenant.id)}&product_id=${encodeURIComponent(String(product.id))}`
      );
      const jsonTiers = await resTiers.json().catch(() => ({}));
      const tiersRaw = Array.isArray(jsonTiers?.data) ? jsonTiers.data : [];
      tiers = tiersRaw
        .map((t: any) => ({
          name: String(t?.price_type?.name || '').trim(),
          price: Number(t?.price),
          price_type_id: Number(t?.price_type_id),
        }))
        .filter((t: any) => t.name && Number.isFinite(t.price) && t.price > 0);
      setSelectedPriceTiers(tiers);
    } catch (err) {
      setSelectedPriceTiers([]);
    }

    // Carregar variações do produto
    try {
      const resVariants = await fetch(
        `/next_api/product-variants?tenant_id=${encodeURIComponent(tenant.id)}&product_id=${encodeURIComponent(String(product.id))}`
      );
      if (resVariants.ok) {
        const jsonVariants = await resVariants.json().catch(() => ({}));
        const variantsRaw = Array.isArray(jsonVariants?.data) ? jsonVariants.data : [];
        const variants = variantsRaw
          .map((v: any) => {
            const label = String(v?.label || v?.name || '').trim();
            return {
              id: Number(v?.id),
              label: label || `Variação ${v?.id}`,
              name: v?.name ?? null,
              sale_price: v?.sale_price ?? null,
            };
          })
          .filter((v: any) => Number.isFinite(v.id) && v.id > 0 && v.label && v.label.length > 0);
        
        setSelectedVariants(variants);
        setSelectedVariantId(null);
      } else {
        setSelectedVariants([]);
        setSelectedVariantId(null);
      }
    } catch (err) {
      setSelectedVariants([]);
      setSelectedVariantId(null);
    }

    // Se existir "Valor Varejo", usar como padrão; senão usa o primeiro tier; senão cai no preço do produto
    const varejo = tiers.find((t: any) => String(t.name).toLowerCase().includes('varejo'));
    const initial = varejo || tiers[0];

    if (initial) {
      setSelectedProduct({
        ...product,
        price: initial.price,
        quantity: 1,
        discount: 0,
        price_type_name: initial.name as any,
        price_type_id: initial.price_type_id as any,
      } as any);
      setPriceInputValue(initial.price > 0 ? initial.price.toFixed(2).replace('.', ',') : '');
    } else {
      setSelectedProduct({ ...product, quantity: 1, discount: 0 });
      setPriceInputValue(product.price > 0 ? product.price.toFixed(2).replace('.', ',') : '');
    }
  };

  const clearSelection = () => {
    setSelectedProduct(null);
    setSelectedPriceTiers([]);
    setSelectedVariants([]);
    setSelectedVariantId(null);
    setSearchTerm('');
    setPriceInputValue('');
  };

  const removeFromCart = useCallback((productId: number, variantId?: number | null) => {
    setCart((prevCart) => {
      if (variantId) {
        return prevCart.filter((item) => !(item.id === productId && item.variant_id === variantId));
      } else {
        return prevCart.filter((item) => !(item.id === productId && !item.variant_id));
      }
    });
  }, []);

  const updateQuantity = useCallback((productId: number, newQuantity: number, variantId?: number | null) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, variantId);
    } else {
      setCart((prevCart) =>
        prevCart.map((item) => {
          if (variantId) {
            return item.id === productId && item.variant_id === variantId ? { ...item, quantity: newQuantity } : item;
          } else {
            return item.id === productId && !item.variant_id ? { ...item, quantity: newQuantity } : item;
          }
        }),
      );
    }
  }, [removeFromCart]);

  const calculateItemTotal = useCallback((item: PDVItem) => {
    const subtotal = item.price * item.quantity;
    return subtotal - (subtotal * item.discount) / 100;
  }, []);

  const total = useMemo(() => cart.reduce((sum, item) => sum + calculateItemTotal(item), 0), [cart, calculateItemTotal]); // Dependências estáveis

  const clearCart = useCallback(() => {
    // Limpar carrinho NÃO deve apagar venda em espera.
    // A venda em espera só deve ser removida quando a venda restaurada for FINALIZADA
    // (ver finalizeSale) ou removida manualmente pelo usuário.
    if (restoredSaleId) setRestoredSaleId(null);

    setCart([]);
    setSelectedProduct(null);
    setCustomerName('');
    setSelectedCustomerId(null);
    setSelectedVariantId(null);
    setSelectedVariants([]);
    setPriceInputValue('');
    setSelectedPriceTiers([]);
    setSearchTerm('');
  }, [restoredSaleId]);

  // Função para cancelar seleção e limpar carrinho
  const cancelSelection = useCallback(() => {
    // Cancelar não deve remover a venda em espera; apenas interrompe a edição.
    if (restoredSaleId) setRestoredSaleId(null);
    clearSelection();
    // Limpar carrinho diretamente sem depender da função clearCart
    setCart([]);
    setSelectedProduct(null);
    setCustomerName('');
    setSelectedCustomerId(null);
    setSelectedVariantId(null);
    setSelectedVariants([]);
    setPriceInputValue('');
    setSelectedPriceTiers([]);
    setSearchTerm('');
  }, [restoredSaleId]);

  // Função para colocar venda em espera
  const putSaleOnHold = useCallback(() => {
    if (cart.length === 0) {
      toast.error('Adicione produtos ao carrinho antes de colocar em espera');
      return;
    }

    const pendingSale: PendingSale = {
      id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cart: [...cart],
      customerName: customerName || '',
      customerId: selectedCustomerId,
      total: total,
      createdAt: new Date().toISOString(),
    };

    const updatedPendingSales = [...pendingSales, pendingSale];
    savePendingSales(updatedPendingSales);
    
    toast.success('Venda colocada em espera');
    clearCart();
  }, [cart, customerName, selectedCustomerId, total, pendingSales, savePendingSales, clearCart]);

  // Função para restaurar uma venda em espera
  const restorePendingSale = useCallback((pendingSale: PendingSale) => {
    setCart(pendingSale.cart);
    setCustomerName(pendingSale.customerName || '');
    setSelectedCustomerId(pendingSale.customerId);
    setRestoredSaleId(pendingSale.id); // Rastrear qual venda foi restaurada
    setShowPendingSalesDialog(false);
    toast.success('Venda restaurada');
  }, []);

  // Função para remover uma venda em espera
  const removePendingSale = useCallback((id: string) => {
    const updatedPendingSales = pendingSales.filter(sale => sale.id !== id);
    savePendingSales(updatedPendingSales);
    toast.success('Venda em espera removida');
  }, [pendingSales, savePendingSales]);

  const startNewSale = useCallback(() => {
    clearCart();
    setSearchTerm('');
    setSidebarOpen(false);
    toast.success('Nova venda iniciada');
    setTimeout(() => {
      document.getElementById('search-input')?.focus();
    }, 0);
  }, [clearCart]);

  const processPayment = useCallback(() => {
    if (cart.length === 0) {
      toast.error('Adicione produtos ao carrinho');
      return;
    }
    setCurrentSection('payment');
  }, [cart.length]);
  
  const finalizeSale = useCallback(async (paymentData?: any) => {
    try {
      // ✅ DEBUG: Verificar tenant antes de criar venda
      console.log('🔍 DEBUG - Tenant atual:', tenant);
      console.log('🔍 DEBUG - Tenant ID:', tenant?.id);
      console.log('🔍 DEBUG - User ID:', user?.id);
      
      if (!tenant?.id) {
        throw new Error('Tenant não disponível para finalizar venda');
      }

      // Preparar dados da venda para o Supabase (versão simplificada)
      const productsArray = cart.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code || 'N/A',
        price: item.price,
        quantity: item.quantity,
        discount: item.discount || 0,
        subtotal: calculateItemTotal(item),
        variant_id: (item as any).variant_id || null,
        price_type_id: (item as any).price_type_id || null,
      }));

      console.log('📦 Produtos preparados:', productsArray.length, productsArray);
      console.log('💰 Total da venda:', total);
      console.log('👤 Tenant ID:', tenant.id);
      console.log('👤 User ID:', user?.id);

      if (productsArray.length === 0) {
        throw new Error('Carrinho vazio. Adicione produtos antes de finalizar a venda.');
      }

      if (!total || total <= 0) {
        throw new Error('Total da venda inválido.');
      }

       const saleData = {
        tenant_id: tenant.id,
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        branch_id: scope === 'branch' ? branchId : null,
        sale_type: null,
        sale_source: 'pdv', // Marcar como venda do PDV
        customer_id: selectedCustomerId,
        customer_name: customerName || 'Cliente Avulso',
        total_amount: total,
        total: total,
        payment_method: paymentData?.paymentMethod || paymentMethod,
        status: null,
        notes: cart.length > 0 ? `Venda com ${cart.length} itens` : '',
        amount_paid: paymentData?.amountPaid || total,
        change_amount: paymentData?.change || 0,
        remaining_amount: paymentData?.remaining || 0,
        payment_status: paymentData?.paymentStatus || 'paid',
        payment_notes: paymentData?.notes,
        products: productsArray
      };

      console.log('📤 Enviando dados da venda:', {
        tenant_id: saleData.tenant_id,
        user_id: saleData.user_id,
        total_amount: saleData.total_amount,
        products_count: saleData.products.length,
        payment_method: saleData.payment_method
      });

      // Salvar venda no Supabase
      const response = await fetch('/next_api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      console.log('📥 Resposta da API:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = 'Erro ao salvar venda';
        try {
          const errorData = await response.json();
          console.error('❌ Erro da API:', errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          console.error('❌ Erro da API (texto):', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Venda criada com sucesso:', result);
      
      // Verificar se a resposta contém os dados esperados
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar venda: resposta inválida da API');
      }

      const savedSaleData = result.data || result;
      if (!savedSaleData || !savedSaleData.id) {
        console.error('❌ Dados da venda inválidos:', savedSaleData);
        throw new Error('Dados da venda inválidos retornados pela API');
      }
      
      // Criar objeto de venda para o estado local
      const localSaleData: Sale = {
        id: savedSaleData.id,
        numero: savedSaleData.sale_number || `VND-${Date.now().toString().slice(-6)}`,
        cliente: customerName || 'Cliente Avulso',
        total: total,
        forma_pagamento: paymentMethod,
        data_venda: savedSaleData.created_at || new Date().toISOString(),
        status: 'paga',
      };
      
      // Adicionar venda ao histórico local
      setTodaySales(prev => {
        const updated = [localSaleData, ...prev];
        saveTodaySalesLocal(updated);
        return updated;
      });
      
      // Recarregar vendas do dia para garantir sincronização
      setTimeout(() => {
        reloadTodaySales();
      }, 1500);
      
      // Mostrar mensagem de sucesso com detalhes do pagamento
      if (paymentData?.paymentMethod === 'dinheiro' && paymentData?.change > 0) {
        toast.success(`Venda #${localSaleData.numero} finalizada!`, {
          description: `Total: R$ ${total.toFixed(2)} • Troco: R$ ${paymentData.change.toFixed(2)}`,
          duration: 5000,
        });
      } else if (paymentData?.paymentMethod && paymentData?.paymentMethod !== 'dinheiro') {
        toast.success(`Venda #${localSaleData.numero} finalizada!`, {
          description: `Total: R$ ${total.toFixed(2)} • ${paymentData.paymentMethod.toUpperCase()}`,
          duration: 5000,
        });
      } else {
        toast.success(`Venda #${localSaleData.numero} finalizada!`, {
          description: `Total: R$ ${total.toFixed(2)} • ${(paymentData?.paymentMethod || paymentMethod).toUpperCase()}`,
          duration: 5000,
        });
      }
      
      // Preparar dados para o modal de confirmação
      const confirmationData = {
        id: localSaleData.id, // Adicionar ID para impressão do cupom
        tenant_id: tenant.id,
        customer_id: selectedCustomerId,
        numero: localSaleData.numero,
        cliente: localSaleData.cliente,
        total: localSaleData.total,
        forma_pagamento: localSaleData.forma_pagamento,
        data_venda: localSaleData.data_venda,
        itens: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: calculateItemTotal(item)
        }))
      };

      // Se havia uma venda restaurada, removê-la da lista de vendas em espera
      if (restoredSaleId) {
        const updatedPendingSales = pendingSales.filter(sale => sale.id !== restoredSaleId);
        savePendingSales(updatedPendingSales);
        setRestoredSaleId(null);
      }

      // Mostrar modal de confirmação
      setLastSaleData(confirmationData);
      setShowConfirmationModal(true);
      setCurrentSection('pdv');
      
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast.error(`Erro ao salvar venda: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, [total, customerName, paymentMethod, cart, calculateItemTotal, saveTodaySalesLocal, tenant, user?.id, selectedCustomerId, reloadTodaySales, scope, branchId, restoredSaleId, pendingSales, savePendingSales]);

  const loadCustomers = useCallback(async () => {
    if (!tenant?.id) {
      setCustomers([]);
      return;
    }
    try {
      setCustomersLoading(true);
      const params = new URLSearchParams();
      params.set('tenant_id', tenant.id);
      if (typeof scope === 'string' && scope.length > 0) params.set('branch_scope', scope);
      if (branchId) params.set('branch_id', String(branchId));

      const res = await fetch(`/next_api/customers?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
      setCustomers(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar clientes');
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  }, [tenant?.id, scope, branchId]);

  const openCustomerPicker = useCallback(() => {
    setCustomerPickerOpen(true);
    setCustomerSearch('');
    loadCustomers();
  }, [loadCustomers]);

  const selectCustomer = useCallback((c: any) => {
    setSelectedCustomerId(Number(c.id));
    setCustomerName(c.name || '');
    setCustomerPickerOpen(false);
    toast.success(`Cliente selecionado: ${c.name}`);
  }, []);

  const clearCustomer = useCallback(() => {
    setSelectedCustomerId(null);
    setCustomerName('');
  }, []);

  const filteredCustomers = useMemo(() => {
    const s = customerSearch.trim().toLowerCase();
    const rows = Array.isArray(customers) ? customers : [];
    if (!s) return rows;
    return rows.filter((c) =>
      `${c?.name || ''} ${c?.phone || ''} ${c?.document || ''}`.toLowerCase().includes(s)
    );
  }, [customers, customerSearch]);

  const openCustomerCreateFromSearch = useCallback(() => {
    const raw = customerSearch.trim();
    const digits = raw.replace(/\D/g, '');
    const seed: any = {
      name: '',
      email: '',
      phone: '',
      document: '',
      address: '',
      neighborhood: '',
      city: '',
      state: '',
      zipcode: '',
      notes: '',
      type: 'PF',
      status: 'active',
    };
    if (digits.length >= 8) seed.phone = digits;
    else seed.name = raw;

    setNewCustomer(seed);
    setCustomerPickerOpen(false);
    setCustomerCreateOpen(true);
  }, [customerSearch]);

  const handleCreateCustomer = useCallback(async () => {
    if (!tenant?.id) {
      toast.error('Tenant não disponível');
      return;
    }
    if (!newCustomer.name?.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    try {
      setCustomerCreateLoading(true);
      const res = await fetch('/next_api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCustomer,
          tenant_id: tenant.id,
          branch_id: scope === 'branch' && branchId ? branchId : null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao cadastrar cliente');
      }

      const created = json?.data || json?.customer || null;
      if (created) {
        selectCustomer(created);
      } else {
        toast.success('Cliente cadastrado com sucesso!');
      }

      setCustomerCreateOpen(false);
      setCustomerSearch('');
      await loadCustomers();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erro ao cadastrar cliente');
    } finally {
      setCustomerCreateLoading(false);
    }
  }, [tenant?.id, newCustomer, scope, branchId, selectCustomer, loadCustomers]);

  // Funções para operações do PDV
  const handleSangria = useCallback(() => {
    setCaixaOperationType('sangria');
    setShowCaixaDialog(true);
  }, []);

  const handleReforco = useCallback(() => {
    setCaixaOperationType('reforco');
    setShowCaixaDialog(true);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Função para abrir modal de abertura de caixa
  const handleAberturaCaixa = useCallback(() => {
    // Verificar se já existe um caixa aberto
    if (cashSessionId) {
      toast.error('Já existe um caixa aberto!', {
        description: `Aberto em ${new Date(cashSessionOpenedAt).toLocaleString('pt-BR')} por ${cashSessionOpenedBy}`,
      });
      return;
    }
    setShowCashOpeningModal(true);
  }, [cashSessionId, cashSessionOpenedAt, cashSessionOpenedBy]);

  // Função para salvar abertura de caixa na API
  const handleCashOpening = useCallback(async (openingData: CashOpeningData) => {
    try {
      if (!tenant?.id) {
        throw new Error('Tenant não disponível');
      }

      // Verificar novamente se não há caixa aberto
      if (cashSessionId) {
        throw new Error('Já existe um caixa aberto');
      }

      // Preparar dados para criar nova sessão
      const openingPayload: any = {
        register_id: '1', // ID do caixa/terminal
        opened_at: new Date().toISOString(),
        opening_amount: openingData.opening_amount,
        opened_by: user?.email || user?.id?.toString() || 'Operador',
        status: 'open',
        tenant_id: tenant.id,
        notes: openingData.notes,
      };

      // Adicionar user_id se for UUID válido
      if (user?.id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(user.id)) {
          openingPayload.user_id = user.id;
        }
      }

      console.log('📤 Criando nova sessão de caixa:', openingPayload);

      const response = await fetch('/next_api/cash-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openingPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao abrir caixa');
      }

      const result = await response.json();
      
      if (result.data?.id) {
        // Atualizar estados com a nova sessão
        setCashSessionId(result.data.id);
        setCashSessionOpenedAt(result.data.opened_at);
        setCashSessionOpenedBy(result.data.opened_by);
        setCaixaInicial(openingData.opening_amount);

        // Registrar operação localmente
        const operation: CaixaOperation = {
          id: Date.now().toString(),
          tipo: 'abertura',
          valor: openingData.opening_amount,
          descricao: `Abertura de caixa - Valor inicial: ${formatCurrency(openingData.opening_amount)}`,
          data: new Date().toISOString(),
          usuario: user?.email || 'Operador',
        };
        
        setCaixaOperations(prev => [operation, ...prev]);

        toast.success('Caixa aberto com sucesso!', {
          description: `Valor inicial: ${formatCurrency(openingData.opening_amount)}`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      throw error;
    }
  }, [tenant?.id, user, cashSessionId]);

  const handleFechamento = useCallback(() => {
    setShowCashClosingModal(true);
  }, []);

  // Função para salvar fechamento de caixa na API
  const handleCashClosing = useCallback(async (closingData: CashClosingData) => {
    try {
      if (!tenant?.id) {
        throw new Error('Tenant não disponível');
      }

      // Calcular valores esperados
      const vendasPagas = todaySales.filter(s => s.status === 'paga');
      const vendasPorMetodo = vendasPagas.reduce((acc, venda) => {
        const metodo = venda.forma_pagamento || 'dinheiro';
        if (!acc[metodo]) {
          acc[metodo] = 0;
        }
        acc[metodo] += venda.total;
        return acc;
      }, {} as Record<string, number>);

      const totalReforcos = caixaOperations
        .filter(op => op.tipo === 'reforco')
        .reduce((sum, op) => sum + op.valor, 0);
      
      const totalSangrias = caixaOperations
        .filter(op => op.tipo === 'sangria')
        .reduce((sum, op) => sum + op.valor, 0);

      const expectedCash = caixaInicial + (vendasPorMetodo['dinheiro'] || 0) + totalReforcos - totalSangrias;
      const expectedCardDebit = vendasPorMetodo['cartao_debito'] || 0;
      const expectedCardCredit = vendasPorMetodo['cartao_credito'] || 0;
      const expectedPix = vendasPorMetodo['pix'] || 0;
      const expectedOther = Object.entries(vendasPorMetodo)
        .filter(([metodo]) => !['dinheiro', 'cartao_debito', 'cartao_credito', 'pix'].includes(metodo))
        .reduce((sum, [, valor]) => sum + valor, 0);

      // Calcular diferenças
      const differenceCash = closingData.closing_amount_cash - expectedCash;
      const differenceCardDebit = closingData.closing_amount_card_debit - expectedCardDebit;
      const differenceCardCredit = closingData.closing_amount_card_credit - expectedCardCredit;
      const differencePix = closingData.closing_amount_pix - expectedPix;
      const differenceOther = closingData.closing_amount_other - expectedOther;
      const totalDifference = differenceCash + differenceCardDebit + differenceCardCredit + differencePix + differenceOther;

      // Coletar informações do dispositivo para auditoria
      const deviceInfo = getDeviceInfo();
      const closedAtTime = new Date().toISOString();
      
      // Preparar dados para salvar
      const closingPayload: any = {
        status: 'closed',
        closed_at: closedAtTime,
        closed_by: user?.email || user?.id?.toString() || 'Operador',
        closing_amount_cash: closingData.closing_amount_cash,
        closing_amount_card_debit: closingData.closing_amount_card_debit,
        closing_amount_card_credit: closingData.closing_amount_card_credit,
        closing_amount_pix: closingData.closing_amount_pix,
        closing_amount_other: closingData.closing_amount_other,
        expected_cash: expectedCash,
        expected_card_debit: expectedCardDebit,
        expected_card_credit: expectedCardCredit,
        expected_pix: expectedPix,
        expected_other: expectedOther,
        difference_amount: totalDifference,
        difference_cash: differenceCash,
        difference_card_debit: differenceCardDebit,
        difference_card_credit: differenceCardCredit,
        difference_pix: differencePix,
        difference_other: differenceOther,
        total_sales: vendasPagas.length,
        total_sales_amount: vendasPagas.reduce((sum, v) => sum + v.total, 0),
        total_withdrawals: caixaOperations.filter(op => op.tipo === 'sangria').length,
        total_withdrawals_amount: totalSangrias,
        total_supplies: caixaOperations.filter(op => op.tipo === 'reforco').length,
        total_supplies_amount: totalReforcos,
        notes: closingData.notes,
        difference_reason: closingData.difference_reason,
        // Adicionar informações de auditoria
        device_info: formatDeviceInfo(deviceInfo),
        closed_by_user_id: user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id) ? user.id : undefined,
      };

      // Se já existe uma sessão de caixa aberta, atualizar
      if (cashSessionId) {
        const updatePayload: any = {
          ...closingPayload,
          tenant_id: tenant.id,
        };

        // ✅ CRÍTICO: Adicionar user_id SOMENTE se for UUID válido
        if (user?.id) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(user.id)) {
            updatePayload.user_id = user.id;
          }
        }

        // ✅ Remover campos que contenham email onde não deveria
        Object.keys(updatePayload).forEach(key => {
          const value = updatePayload[key];
          if (key !== 'opened_by' && key !== 'closed_by' && typeof value === 'string' && value.includes('@')) {
            console.error(`❌ Removendo campo ${key} do PATCH:`, value);
            delete updatePayload[key];
          }
        });

        console.log('📤 Payload final para atualizar sessão:', JSON.stringify(updatePayload, null, 2));

        const response = await fetch(`/next_api/cash-sessions?id=${cashSessionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erro ao fechar sessão de caixa');
        }
      } else {
        // Criar nova sessão de caixa (caso não exista)
        // Incluir dados de abertura e fechamento juntos
        const createPayload: any = {
          register_id: '1', // ID do caixa/terminal (pode ser configurável)
          opened_at: cashSessionOpenedAt || new Date().toISOString(),
          initial_amount: caixaInicial, // Usar initial_amount conforme a API
          opened_by: cashSessionOpenedBy || user?.email || 'Operador',
          status: 'closed', // Já criar como fechada
          tenant_id: tenant.id,
          // Campos de fechamento
          closed_at: closingPayload.closed_at,
          closed_by: closingPayload.closed_by,
          closing_amount_cash: closingPayload.closing_amount_cash,
          closing_amount_card_debit: closingPayload.closing_amount_card_debit,
          closing_amount_card_credit: closingPayload.closing_amount_card_credit,
          closing_amount_pix: closingPayload.closing_amount_pix,
          closing_amount_other: closingPayload.closing_amount_other,
          expected_cash: closingPayload.expected_cash,
          expected_card_debit: closingPayload.expected_card_debit,
          expected_card_credit: closingPayload.expected_card_credit,
          expected_pix: closingPayload.expected_pix,
          expected_other: closingPayload.expected_other,
          difference_amount: closingPayload.difference_amount,
          difference_cash: closingPayload.difference_cash,
          difference_card_debit: closingPayload.difference_card_debit,
          difference_card_credit: closingPayload.difference_card_credit,
          difference_pix: closingPayload.difference_pix,
          difference_other: closingPayload.difference_other,
          difference_reason: closingPayload.difference_reason,
          total_sales: closingPayload.total_sales,
          total_sales_amount: closingPayload.total_sales_amount,
          total_withdrawals: closingPayload.total_withdrawals,
          total_withdrawals_amount: closingPayload.total_withdrawals_amount,
          total_supplies: closingPayload.total_supplies,
          total_supplies_amount: closingPayload.total_supplies_amount,
          notes: closingPayload.notes,
        };

        // ✅ CRÍTICO: Adicionar user_id SOMENTE se for um UUID válido
        // Nunca enviar email no campo user_id
        if (user?.id) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(user.id)) {
            createPayload.user_id = user.id;
            console.log('✅ user_id válido adicionado:', user.id);
          } else {
            console.warn('⚠️ user_id não é UUID válido, não será enviado:', user.id);
          }
        }

        // ✅ GARANTIR que não há campos problemáticos
        // Remover qualquer campo que contenha email onde não deveria
        Object.keys(createPayload).forEach(key => {
          const value = createPayload[key];
          if (key !== 'opened_by' && key !== 'closed_by' && typeof value === 'string' && value.includes('@')) {
            console.error(`❌ Removendo campo ${key} que contém email:`, value);
            delete createPayload[key];
          }
        });

        console.log('📤 Payload final para criar sessão de caixa:', JSON.stringify(createPayload, null, 2));

        const response = await fetch('/next_api/cash-sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || 'Erro desconhecido' };
          }
          console.error('❌ Erro ao criar sessão de caixa:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            payload: createPayload
          });
          throw new Error(errorData.error || errorData.errorMessage || `Erro ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.data?.id) {
          setCashSessionId(result.data.id);
        }
      }

      // Preparar dados para o modal de sucesso
      const successData = {
        id: cashSessionId || 0,
        register_id: '1',
        opened_at: cashSessionOpenedAt || new Date().toISOString(),
        closed_at: closedAtTime,
        opened_by: cashSessionOpenedBy || user?.email || 'Operador',
        closed_by: user?.email || user?.id?.toString() || 'Operador',
        opening_amount: caixaInicial,
        closing_amounts: {
          cash: closingData.closing_amount_cash,
          card_debit: closingData.closing_amount_card_debit,
          card_credit: closingData.closing_amount_card_credit,
          pix: closingData.closing_amount_pix,
          other: closingData.closing_amount_other,
        },
        expected_amounts: {
          cash: expectedCash,
          card_debit: expectedCardDebit,
          card_credit: expectedCardCredit,
          pix: expectedPix,
          other: expectedOther,
        },
        differences: {
          cash: differenceCash,
          card_debit: differenceCardDebit,
          card_credit: differenceCardCredit,
          pix: differencePix,
          other: differenceOther,
          total: totalDifference,
        },
        total_sales: vendasPagas.length,
        total_sales_amount: vendasPagas.reduce((sum, v) => sum + v.total, 0),
        notes: closingData.notes,
        difference_reason: closingData.difference_reason,
      };

      // Registrar operação de fechamento localmente
      const operation: CaixaOperation = {
        id: Date.now().toString(),
        tipo: 'fechamento',
        valor: totalDifference,
        descricao: `Fechamento - ${vendasPagas.length} vendas - Diferença: ${formatCurrency(totalDifference)}`,
        data: new Date().toISOString(),
        usuario: user?.email || 'Operador',
      };
      
      setCaixaOperations(prev => [operation, ...prev]);

      // Fechar modal de fechamento e abrir modal de sucesso
      setShowCashClosingModal(false);
      setClosingResult(successData);
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      throw error;
    }
  }, [tenant?.id, todaySales, caixaInicial, caixaOperations, cashSessionId, cashSessionOpenedAt, cashSessionOpenedBy, user]);

  // Função para fechar o modal de sucesso e limpar os dados
  const handleCloseSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    setClosingResult(null);
    
    // Resetar caixa inicial para próximo período
    setCaixaInicial(0);
    setTodaySales([]);
    
    // Limpar localStorage de vendas do dia
    try {
      if (typeof window !== 'undefined') {
        const tenantId = tenant?.id || 'default';
        const today = new Date().toISOString().split('T')[0];
        const key = `pdv_sales_${tenantId}_${today}`;
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error('Erro ao limpar vendas do dia:', e);
    }
  }, [tenant?.id]);
  
  const executeCaixaOperation = useCallback(async (valor: number, descricao: string) => {
    if (caixaOperationType === 'fechamento' && currentCashSessionId) {
      try {
        const res = await fetch(`/next_api/cash-sessions?id=${encodeURIComponent(currentCashSessionId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            closed_at: new Date().toISOString(),
            closing_amount: valor,
            status: 'closed',
          }),
        });
        if (!res.ok) throw new Error('Erro ao fechar caixa na API');
        setCurrentCashSessionId(null);
        setCaixaInicial(0);
        setCaixaOperations([]);
        toast.success('Caixa fechado com sucesso. Abra o caixa amanhã para continuar.', { duration: 5000 });
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || 'Erro ao fechar caixa');
        return;
      }
    } else {
      const operation: CaixaOperation = {
        id: Date.now().toString(),
        tipo: caixaOperationType,
        valor,
        descricao,
        data: new Date().toISOString(),
        usuario: user?.email || 'Operador',
      };
      setCaixaOperations(prev => [operation, ...prev]);
      const messages = {
        sangria: `Sangria de R$ ${valor.toFixed(2)} realizada`,
        reforco: `Reforço de R$ ${valor.toFixed(2)} realizado`,
        fechamento: `Fechamento do caixa realizado`,
      };
      toast.success(messages[caixaOperationType], { description: descricao, duration: 4000 });
    }
    setShowCaixaDialog(false);
  }, [caixaOperationType, user, currentCashSessionId]);

  const menuGroups: MenuGroup[] = [
    {
      title: 'Principal',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
        { icon: Users, label: 'Clientes', href: '/clientes' },
        { icon: Package, label: 'Produtos', href: '/produtos' },
        { icon: Receipt, label: 'Vendas', href: '/vendas' },
        { icon: ShoppingCart, label: 'PDV', href: '/pdv' },
      ],
    },
    {
      title: 'Operações',
      items: [
        { icon: Warehouse, label: 'Estoque', href: '/estoque' },
        { icon: RotateCcw, label: 'Devolução', href: '/estoque/devolucao' },
        { icon: Truck, label: 'Entregas', href: '/entregas' },
        { icon: Wrench, label: 'Ordem de Serviços', href: '/ordem-servicos' },
      ],
    },
    {
      title: 'Gestão',
      items: [
        { icon: DollarSign, label: 'Financeiro', href: '/financeiro' },
        { icon: BarChart3, label: 'Relatórios', href: '/relatorios' },
        { icon: Building2, label: 'Perfil da Empresa', href: '/perfil-empresa' },
        { icon: UserCog, label: 'Perfil do Usuário', href: '/perfil-usuario' },
        { icon: CreditCard, label: 'Assinatura', href: '/assinatura' },
        { icon: Settings, label: 'Configurações', href: '/configuracoes' },
      ],
    },
  ];

  // Cálculos de KPIs
  const totalVendasDia = useMemo(() => 
    todaySales.filter(s => s.status === 'paga').reduce((sum, s) => sum + s.total, 0),
    [todaySales]
  );
  
  const totalSangrias = useMemo(() =>
    caixaOperations.filter(op => op.tipo === 'sangria').reduce((sum, op) => sum + op.valor, 0),
    [caixaOperations]
  );
  
  const totalReforcos = useMemo(() =>
    caixaOperations.filter(op => op.tipo === 'reforco').reduce((sum, op) => sum + op.valor, 0),
    [caixaOperations]
  );
  
  const saldoCaixa = useMemo(() =>
    caixaInicial + totalVendasDia + totalReforcos - totalSangrias,
    [caixaInicial, totalVendasDia, totalReforcos, totalSangrias]
  );

  const kpi = {
    itensCarrinho: cart.reduce((sum, i) => sum + i.quantity, 0),
    totalItens: cart.length,
    totalValor: total,
    vendasDia: todaySales.filter(s => s.status === 'paga').length,
    totalVendasDia,
    saldoCaixa,
  };

  // Função para voltar ao PDV
  const backToPDV = () => {
    setCurrentSection('pdv');
  };

  // Funções para o modal de confirmação
  const handlePrintReceipt = () => {
    if (lastSaleData) {
      // Abrir cupom em nova aba usando o ID da venda
      const cupomUrl = `/cupom/${lastSaleData.id}`;
      window.open(cupomUrl, '_blank');
    }
    // Limpar carrinho e fechar modal
    clearCart();
    setShowConfirmationModal(false);
    setLastSaleData(null);
  };

  const handlePrintA4 = () => {
    if (lastSaleData?.id) {
      // Abrir impressão A4 em nova aba usando o ID da venda
      const a4Url = `/vendas/${lastSaleData.id}/a4`;
      window.open(a4Url, '_blank');
    }
    // Limpar carrinho e fechar modal
    clearCart();
    setShowConfirmationModal(false);
    setLastSaleData(null);
  };

  // Função para imprimir cupom do histórico
  const handlePrintHistoryReceipt = (saleId: string) => {
    const cupomUrl = `/cupom/${saleId}`;
    window.open(cupomUrl, '_blank');
  };

  // Função para imprimir A4 do histórico
  const handlePrintHistoryA4 = (saleId: string) => {
    const a4Url = `/vendas/${saleId}/a4`;
    window.open(a4Url, '_blank');
  };

  const handleNewSale = () => {
    // Limpar carrinho e fechar modal
    clearCart();
    setShowConfirmationModal(false);
    setPaymentMethod('dinheiro');
    setLastSaleData(null);
  };

  const handleCloseConfirmation = () => {
    // Limpar carrinho completamente quando fechar o modal após venda confirmada
    clearCart();
    setShowConfirmationModal(false);
    setPaymentMethod('dinheiro');
    setSearchTerm('');
    setLastSaleData(null);
    toast.success('Carrinho limpo. Pronto para nova venda!');
  };

  const handleEmitirNota = () => {
    if (lastSaleData?.id) {
      router.push(`/emitir-nota?sale_id=${lastSaleData.id}`);
      // Limpar carrinho e fechar modal
      clearCart();
      setShowConfirmationModal(false);
      setLastSaleData(null);
    }
  };

  // Limpar carrinho automaticamente SOMENTE quando o modal ACABAR de fechar.
  // (evita limpar carrinho depois ao restaurar uma venda em espera enquanto lastSaleData ainda existe)
  const prevShowConfirmationModalRef = useRef<boolean>(showConfirmationModal);
  useEffect(() => {
    const prev = prevShowConfirmationModalRef.current;
    prevShowConfirmationModalRef.current = showConfirmationModal;
    if (prev && !showConfirmationModal && lastSaleData) {
      clearCart();
      setPaymentMethod('dinheiro');
      setLastSaleData(null);
    }
  }, [showConfirmationModal, lastSaleData, clearCart]);

  // Se estiver na seção de pagamento, mostrar apenas ela
  if (currentSection === 'payment') {
    return (
      <PaymentSection
        total={total}
        customerName={customerName}
        cartItems={cart.map(item => ({
          id: item.id.toString(),
          name: item.name,
          code: item.code || 'N/A',
          price: item.price,
          quantity: item.quantity,
          subtotal: calculateItemTotal(item)
        }))}
        onFinalize={(paymentData) => {
          finalizeSale(paymentData);
        }}
        onCancel={backToPDV}
      />
    );
  }

  return (
    <TenantPageWrapper>
      {loadingCashSession && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
          <RefreshCw className="h-10 w-10 animate-spin" />
          <p>Verificando sessão de caixa...</p>
        </div>
      )}
      {!loadingCashSession && showOpenCaixaModal && (
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Abrir Caixa
              </DialogTitle>
              <DialogDescription>
                É obrigatório abrir o caixa todo dia para usar o PDV. Informe o valor inicial em dinheiro.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Label htmlFor="open-caixa-amount">Valor inicial (R$)</Label>
              <Input
                id="open-caixa-amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={openCaixaInitialAmount}
                onChange={(e) => setOpenCaixaInitialAmount(e.target.value.replace(/[^\d,.-]/g, '').replace(',', '.'))}
              />
              <Button className="w-full" onClick={handleOpenCaixaConfirm}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Abrir Caixa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {!loadingCashSession && !showOpenCaixaModal && (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Seleção de variação de preço agora é inline (abaixo do valor unitário) */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <div className="fixed top-4 left-4 z-40">
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="shadow-lg">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
          </div>

          <SheetContent side="left" className="w-64 p-0 juga-sidebar-gradient flex flex-col">
            <SheetHeader className="p-6 border-b border-white/10">
              <SheetTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-bold text-lg">J</span>
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl">JUGA</h1>
                  <p className="text-white/70 text-xs">ERP SaaS</p>
                </div>
              </SheetTitle>
            </SheetHeader>

            <div className="p-4 pb-8 space-y-5 flex-1 overflow-y-auto">
              {menuGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                    {group.title}
                  </div>
                  <div className="space-y-1">
                    {group.items.filter((item) => item.href !== '/pdv').map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            setSidebarOpen(false);
                            router.push(item.href);
                          }}
                        >
                          <IconComponent className="h-5 w-5" />
                          <span className="font-medium text-sm">{item.label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 pt-0">
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-full justify-center gap-2 text-white hover:bg-white/20 border border-white/30"
                onClick={() => {
                  if (ENABLE_AUTH) {
                    signOut();
                  } else {
                    window.location.href = '/login';
                  }
                }}
              >
                <LogOut className="h-3 w-3" />
                Finalizar sessão
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <div className="px-2 sm:px-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4 sm:mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-heading">Ponto de Venda</h1>
              <p className="text-sm sm:text-base text-body">F1 - Menu | Ctrl+F - Buscar | Ctrl+Enter - Adicionar | Esc - Cancelar</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDeliveryQuickOpen(true)}
                className="flex items-center gap-2"
              >
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Entregas</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowHistoryDialog(true);
                  reloadTodaySales();
                }}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Histórico</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span className="hidden sm:inline">Caixa</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <DropdownMenuLabel className="text-gray-900 dark:text-gray-100 font-semibold">Operações de Caixa</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                  <DropdownMenuItem 
                    onClick={handleAberturaCaixa} 
                    className="cursor-pointer text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 focus:bg-green-50 dark:focus:bg-green-900/20"
                    disabled={!!cashSessionId}
                  >
                    <Wallet className="mr-2 h-4 w-4 text-green-500" />
                    <span>{cashSessionId ? 'Caixa Já Aberto' : 'Abrir Caixa'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                  <DropdownMenuItem onClick={handleSangria} className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">
                    <MinusCircle className="mr-2 h-4 w-4 text-red-500" />
                    <span>Sangria</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleReforco} className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">
                    <RefreshCw className="mr-2 h-4 w-4 text-green-500" />
                    <span>Reforço</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                  <DropdownMenuItem onClick={handleFechamento} className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20">
                    <Lock className="mr-2 h-4 w-4 text-red-500" />
                    <span>Fechamento de Caixa</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (currentCashSessionId) {
                    if (confirm('O caixa ainda está aberto. Deseja fechar o caixa antes de sair?')) {
                      setCaixaOperationType('fechamento');
                      setShowCaixaDialog(true);
                    } else {
                      router.push('/dashboard');
                    }
                  } else {
                    router.push('/dashboard');
                  }
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Sair do PDV</span>
              </Button>
              <Button size="sm" className="juga-gradient text-white" onClick={startNewSale}>
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nova Venda</span>
              </Button>
            </div>
          </div>

          {/* Cards superiores removidos conforme solicitação */}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 space-y-4">
              <Card className="border border-slate-200 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur rounded-xl">
                <CardHeader className="pb-2 bg-gradient-to-r from-[#0f1f3b] via-[#162a4d] to-[#0f1f3b] text-white rounded-t-xl">
                  <CardTitle className="text-xs sm:text-sm text-white font-semibold tracking-wide">
                    Localizar um produto/serviço abaixo
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_48px] gap-2">
                    <Input
                      id="search-input"
                      placeholder="Digite o código ou o nome"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-sm h-10 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-300/60 dark:border-slate-700/70 focus-visible:ring-blue-500/40"
                    />
                    <OverlaySelect
                      value={''}
                      onChange={() => {}}
                      placeholder="Status do produto"
                      options={[
                        { value: 'all', label: 'Todos' },
                        { value: 'active', label: 'Ativo' },
                        { value: 'inactive', label: 'Inativo' },
                      ]}
                      className="w-full h-10"
                    />
                    <Button variant="outline" size="sm" className="px-0 rounded-xl border-blue-400/40 h-10">
                      <Barcode className="h-4 w-4" />
                    </Button>
                  </div>

                  {!loading && searchTerm && (
                    <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                          <div className="max-h-40 overflow-y-auto bg-white dark:bg-slate-900">
                        {filteredProducts.length === 0 && (
                          <div className="p-2 text-xs text-muted-foreground">Nenhum produto encontrado.</div>
                        )}
                        {filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b last:border-b-0 flex items-center justify-between"
                            onClick={() => selectProduct(product)}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">Cód: {product.code}</p>
                            </div>
                            <p className="font-semibold text-sm text-blue-600 whitespace-nowrap">R$ {product.price.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {loading && <div className="mt-4 text-sm text-muted-foreground">Carregando produtos...</div>}
            </CardContent>
          </Card>

              <Card className="juga-card">
                <CardContent className="p-4">
                  {selectedProduct ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase">Código</Label>
                          <p className="text-sm font-semibold text-heading mt-1">{selectedProduct.code}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase">Valor Total</Label>
                          <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-md border text-center">
                            <span className="text-lg font-bold text-primary">R$ {calculateItemTotal(selectedProduct).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase">Quantidade</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={selectedProduct.quantity === 0 || selectedProduct.quantity === undefined ? '' : String(selectedProduct.quantity).replace(/^0+/, '') || ''}
                          onChange={(e) => {
                            let value = e.target.value;
                            // Remover caracteres não numéricos exceto vazio
                            value = value.replace(/[^\d]/g, '');
                            // Remover zeros à esquerda
                            value = value.replace(/^0+/, '') || '';
                            
                            if (value === '') {
                              setSelectedProduct({
                                ...selectedProduct,
                                quantity: 0,
                              });
                              return;
                            }
                            
                            const numValue = parseInt(value, 10);
                            if (!isNaN(numValue) && numValue > 0) {
                              setSelectedProduct({
                                ...selectedProduct,
                                quantity: numValue,
                              });
                            }
                          }}
                          onFocus={(e) => {
                            // Selecionar todo o texto ao focar para facilitar edição
                            e.target.select();
                          }}
                          onBlur={(e) => {
                            // Garantir valor mínimo ao perder foco
                            if (!selectedProduct.quantity || selectedProduct.quantity < 1) {
                              setSelectedProduct({
                                ...selectedProduct,
                                quantity: 1,
                              });
                            }
                          }}
                          className="mt-1 h-9"
                          placeholder="1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase">Valor Unitário</Label>
                        <Input 
                          type="text"
                          inputMode="decimal"
                          value={priceInputValue}
                          onChange={(e) => {
                            let value = e.target.value;
                            
                            // Permitir apenas números, vírgula e ponto
                            value = value.replace(/[^\d,.]/g, '');
                            
                            // Substituir ponto por vírgula (padrão brasileiro)
                            value = value.replace(/\./g, ',');
                            
                            // Remover múltiplas vírgulas (manter apenas a primeira)
                            const commaIndex = value.indexOf(',');
                            if (commaIndex !== -1) {
                              const beforeComma = value.substring(0, commaIndex + 1);
                              const afterComma = value.substring(commaIndex + 1).replace(/,/g, '');
                              value = beforeComma + afterComma;
                            }
                            
                            // Limitar a 2 casas decimais após a vírgula
                            const parts = value.split(',');
                            if (parts.length === 2 && parts[1].length > 2) {
                              value = parts[0] + ',' + parts[1].substring(0, 2);
                            }
                            
                            // Remover zeros à esquerda (mas manter se for apenas "0,")
                            if (value.length > 1 && value.startsWith('0') && value[1] !== ',') {
                              value = value.replace(/^0+/, '') || '';
                            }
                            
                            // Atualizar o estado local (string formatada)
                            setPriceInputValue(value);
                            
                            // Converter para número e atualizar o produto
                            const numValue = parseFloat(value.replace(',', '.'));
                            if (value === '' || value === '0' || value === '0,') {
                              setSelectedProduct({
                                ...selectedProduct,
                                price: 0,
                              });
                            } else if (!isNaN(numValue) && numValue >= 0) {
                              setSelectedProduct({
                                ...selectedProduct,
                                price: numValue,
                              });
                            }
                          }}
                          onFocus={(e) => {
                            // Selecionar todo o texto ao focar para facilitar edição
                            e.target.select();
                          }}
                          onBlur={(e) => {
                            // Garantir valor válido ao perder foco e formatar
                            const numValue = parseFloat(priceInputValue.replace(',', '.'));
                            if (!priceInputValue || isNaN(numValue) || numValue < 0) {
                              setSelectedProduct({
                                ...selectedProduct,
                                price: 0,
                              });
                              setPriceInputValue('');
                            } else {
                              // Formatar com 2 casas decimais ao perder foco
                              setPriceInputValue(numValue.toFixed(2).replace('.', ','));
                            }
                          }}
                          className="mt-1 h-9"
                          placeholder="0,00"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {selectedProduct.price > 0 ? `R$ ${selectedProduct.price.toFixed(2)}` : 'Digite o valor'}
                          {(selectedProduct as any).price_type_name && ` • Tabela: ${(selectedProduct as any).price_type_name}`}
                        </p>
                      </div>

                      {selectedVariants.length > 0 && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase">Variação do Produto</Label>
                          <Select
                            value={selectedVariantId ? String(selectedVariantId) : ''}
                            onValueChange={(value) => {
                              const variantId = Number(value);
                              const variant = selectedVariants.find((v) => v.id === variantId);
                              if (variant) {
                                setSelectedVariantId(variantId);
                                // Se a variação tem preço, aplicar; senão mantém o preço atual
                                if (variant.sale_price !== null && variant.sale_price !== undefined && variant.sale_price > 0) {
                                  setSelectedProduct({
                                    ...selectedProduct,
                                    price: variant.sale_price,
                                  });
                                  setPriceInputValue(variant.sale_price.toFixed(2).replace('.', ','));
                                }
                              } else {
                                setSelectedVariantId(null);
                              }
                            }}
                          >
                            <SelectTrigger className="mt-1 h-9">
                              <SelectValue placeholder="Selecione uma variação (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Nenhuma variação</SelectItem>
                              {selectedVariants.map((v) => (
                                <SelectItem key={v.id} value={String(v.id)}>
                                  {v.label}
                                  {v.sale_price !== null && v.sale_price !== undefined && v.sale_price > 0
                                    ? ` — R$ ${v.sale_price.toFixed(2)}`
                                    : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedVariantId && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Variação selecionada: {selectedVariants.find((v) => v.id === selectedVariantId)?.label}
                            </p>
                          )}
                        </div>
                      )}

                      {selectedPriceTiers.length > 1 && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase">Variação de valor</Label>
                          <Select
                            value={String((selectedProduct as any)?.price_type_id || '')}
                            onValueChange={(value) => {
                              const tier = selectedPriceTiers.find((t) => String(t.price_type_id) === String(value));
                              if (!tier) return;
                              setSelectedProduct({
                                ...selectedProduct,
                                price: tier.price,
                                price_type_id: tier.price_type_id as any,
                                price_type_name: tier.name as any,
                              } as any);
                              setPriceInputValue(tier.price > 0 ? tier.price.toFixed(2).replace('.', ',') : '');
                            }}
                          >
                            <SelectTrigger className="mt-1 h-9">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedPriceTiers.map((t) => (
                                <SelectItem key={`${t.price_type_id}-${t.name}`} value={String(t.price_type_id)}>
                                  {t.name} — R$ {t.price.toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase">Desconto (%)</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={selectedProduct.discount === 0 || selectedProduct.discount === undefined ? '' : String(selectedProduct.discount).replace(/^0+/, '') || ''}
                          onChange={(e) => {
                            let value = e.target.value;
                            // Permitir apenas números, ponto e vírgula (substituir vírgula por ponto)
                            value = value.replace(',', '.').replace(/[^\d.]/g, '');
                            // Remover múltiplos pontos
                            const parts = value.split('.');
                            if (parts.length > 2) {
                              value = parts[0] + '.' + parts.slice(1).join('');
                            }
                            // Limitar a 2 casas decimais
                            if (parts.length === 2 && parts[1].length > 2) {
                              value = parts[0] + '.' + parts[1].substring(0, 2);
                            }
                            // Remover zeros à esquerda (mas manter se for apenas "0.")
                            if (value.length > 1 && value.startsWith('0') && value[1] !== '.') {
                              value = value.replace(/^0+/, '') || '';
                            }
                            
                            if (value === '' || value === '0') {
                              setSelectedProduct({
                                ...selectedProduct,
                                discount: 0,
                              });
                              return;
                            }
                            
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue >= 0) {
                              setSelectedProduct({
                                ...selectedProduct,
                                discount: Math.min(100, Math.max(0, numValue)),
                              });
                            }
                          }}
                          onFocus={(e) => {
                            // Selecionar todo o texto ao focar para facilitar edição
                            e.target.select();
                          }}
                          onBlur={(e) => {
                            // Garantir valor válido ao perder foco
                            if (selectedProduct.discount === undefined || selectedProduct.discount < 0) {
                              setSelectedProduct({
                                ...selectedProduct,
                                discount: 0,
                              });
                            } else if (selectedProduct.discount > 100) {
                              setSelectedProduct({
                                ...selectedProduct,
                                discount: 100,
                              });
                            }
                          }}
                          className="mt-1 h-9"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Selecione um produto para visualizar</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t">
                    <Button className="w-full juga-gradient text-white h-10 text-sm" disabled={!selectedProduct} onClick={addSelectedToCart}>
                      ADICIONAR PRODUTO/ITEM
                    </Button>
              </div>
            </CardContent>
          </Card>
        </div>

            <div className="xl:col-span-1">
              <Card className="juga-card h-full">
                <CardContent className="p-0 h-full flex flex-col">
                  <div className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg text-heading">Itens do Pedido</h3>
                      {pendingSales.length > 0 && (
                        <button
                          onClick={() => setShowPendingSalesDialog(true)}
                          className="text-xs text-orange-600 hover:text-orange-700 hover:underline font-medium flex items-center gap-1"
                        >
                          <Clock className="h-3 w-3" />
                          {pendingSales.length} em espera
                        </button>
                      )}
                    </div>

                    {cart.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum item adicionado</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {cart.map((item) => {
                          const itemKey = item.variant_id ? `${item.id}-${item.variant_id}` : `${item.id}-null`;
                          return (
                          <div key={itemKey} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm text-heading">{item.name}</h5>
                                <p className="text-xs text-muted-foreground">Cód: {item.code}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.id, item.variant_id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity - 1, item.variant_id)}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  value={item.quantity || ''}
                                  onChange={(e) => {
                                    let value = e.target.value;
                                    // Remover caracteres não numéricos
                                    value = value.replace(/[^\d]/g, '');
                                    // Remover zeros à esquerda
                                    value = value.replace(/^0+/, '') || '';
                                    
                                    if (value === '') {
                                      updateQuantity(item.id, 0, item.variant_id);
                                      return;
                                    }
                                    
                                    const numValue = parseInt(value, 10);
                                    if (!isNaN(numValue) && numValue > 0) {
                                      updateQuantity(item.id, numValue, item.variant_id);
                                    }
                                  }}
                                  onFocus={(e) => {
                                    e.target.select();
                                  }}
                                  onBlur={(e) => {
                                    if (!item.quantity || item.quantity < 1) {
                                      updateQuantity(item.id, 1, item.variant_id);
                                    }
                                  }}
                                  className="w-12 h-8 text-center text-sm font-medium p-0"
                                  style={{ textAlign: 'center' }}
                                />
                                <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant_id)}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">R$ {item.price.toFixed(2)} un.</p>
                                {item.discount > 0 && <p className="text-xs text-orange-600">-{item.discount}%</p>}
                                <p className="font-semibold text-primary">R$ {calculateItemTotal(item).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="border-t p-6 space-y-5">
                    <div className="bg-gray-800 text-white rounded-xl p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm opacity-90">TOTAL DO PEDIDO</span>
                        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">R$ {total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-white/70 dark:bg-gray-900/60 px-3 py-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Nome do cliente (opcional)"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="h-10 border-none bg-transparent focus-visible:ring-2 focus-visible:ring-primary/40"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={openCustomerPicker}
                          className="shrink-0"
                        >
                          Selecionar
                        </Button>
                        {selectedCustomerId && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearCustomer}
                            className="shrink-0 text-muted-foreground"
                            title="Limpar cliente selecionado"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                        <Button
                          className="h-11 w-full px-7 rounded-lg text-white text-xs sm:text-[13px] font-semibold shadow-sm disabled:opacity-100 disabled:saturate-75 disabled:brightness-95 disabled:cursor-not-allowed border border-white/10 bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors flex items-center justify-center"
                          onClick={putSaleOnHold}
                          disabled={cart.length === 0}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          AGUARDAR
                        </Button>

                        <Button
                          className="h-11 w-full px-7 rounded-lg text-white text-xs sm:text-[13px] font-semibold shadow-sm border border-white/10 bg-gradient-to-br from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors flex items-center justify-center"
                          onClick={cancelSelection}
                        >
                          CANCELAR
                        </Button>
            
                        <Button
                          className="h-11 w-full px-7 rounded-lg text-white text-xs sm:text-[13px] font-semibold shadow-sm disabled:opacity-100 disabled:saturate-75 disabled:brightness-95 disabled:cursor-not-allowed border border-white/10 bg-gradient-to-br from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors flex items-center justify-center"
                          onClick={processPayment}
                          disabled={cart.length === 0}
                        >
                          <span className="flex flex-col leading-tight items-center">
                            <span>FINALIZAR</span>
                            <span>VENDA</span>
                          </span>
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button variant="outline" className="h-11 rounded-lg flex items-center justify-center gap-2 text-sm">
                          <CreditCard className="h-4 w-4 text-primary" />
                          Pagamento Rápido
                        </Button>
                        <Button variant="outline" className="h-11 rounded-lg flex items-center justify-center gap-2 text-sm">
                          <Receipt className="h-4 w-4 text-primary" />
                          Pré-Venda
                        </Button>
                      </div>

                      <Button variant="outline" className="w-full h-11 rounded-lg" onClick={clearCart} disabled={cart.length === 0}>
                        Limpar Carrinho
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>


      {/* Diálogo de Histórico */}
      {showHistoryDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <History className="h-6 w-6" />
                  Histórico de Vendas - Hoje
                </h2>
                <button
                  onClick={() => setShowHistoryDialog(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {todaySales.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>Nenhuma venda realizada hoje</p>
                  </div>
                ) : (
                  todaySales.map((sale) => (
                    <Card key={sale.id} className="juga-card hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {sale.numero}
                              </Badge>
                              <Badge 
                                variant={sale.status === 'paga' ? 'default' : 'secondary'}
                                className={sale.status === 'paga' ? 'bg-green-500' : ''}
                              >
                                {sale.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{sale.cliente}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(sale.data_venda).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CreditCard className="h-3 w-3" />
                              <span className="capitalize">{sale.forma_pagamento.replace('_', ' ')}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-2xl font-bold text-primary">
                              R$ {sale.total.toFixed(2)}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintHistoryA4(sale.id)}
                                className="gap-1 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                              >
                                <FileText className="h-4 w-4" />
                                A4
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintHistoryReceipt(sale.id)}
                                className="gap-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                              >
                                <Receipt className="h-4 w-4" />
                                Cupom
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <div className="border-t pt-4 mt-6">
                <div className="flex justify-between items-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg">
                  <span className="font-semibold">Total do Dia:</span>
                  <span className="text-2xl font-extrabold text-green-600 dark:text-green-400">
                    R$ {totalVendasDia.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seletor de Cliente */}
      <Dialog open={customerPickerOpen} onOpenChange={setCustomerPickerOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          <div className="relative">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">Selecionar cliente</DialogTitle>
                  <DialogDescription className="text-blue-100 mt-1">
                    Busque por nome, telefone ou documento. Se não encontrar, cadastre rapidamente.
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Conteúdo principal */}
            <div className="p-6 bg-slate-800/50 backdrop-blur-sm space-y-4">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                  <Input
                    className="pl-10 pr-4 h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    placeholder="Buscar por nome, telefone, documento..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={openCustomerCreateFromSearch}
                    className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                    title="Cadastrar cliente"
                  >
                    <Plus className="h-4 w-4" />
                    Cadastrar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={loadCustomers} 
                    disabled={customersLoading} 
                    className="gap-2 border-slate-500 bg-slate-700/50 hover:bg-slate-600 text-slate-200 hover:text-white"
                  >
                    <RefreshCw className={`h-4 w-4 ${customersLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </div>

              <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-slate-600/50 bg-slate-700/30">
                {customersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mx-auto mb-4" />
                    <p className="font-medium text-slate-200">Carregando clientes...</p>
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center border-2 border-blue-500/20">
                      <Users className="h-8 w-8 text-blue-400" />
                    </div>
                    <p className="font-semibold text-lg text-white mb-2">Nenhum cliente encontrado</p>
                    <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                      Não encontrou o cliente que procura? Cadastre rapidamente e já selecione para a venda.
                    </p>
                    <Button 
                      onClick={openCustomerCreateFromSearch} 
                      className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white" 
                      size="lg"
                    >
                      <Plus className="h-4 w-4" />
                      Cadastrar novo cliente
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-700/80 backdrop-blur-sm z-10 border-b border-slate-600">
                      <TableRow className="hover:bg-slate-700/80 border-0">
                        <TableHead className="font-semibold text-slate-200">Nome</TableHead>
                        <TableHead className="font-semibold text-slate-200">Telefone</TableHead>
                        <TableHead className="font-semibold text-slate-200">Endereço</TableHead>
                        <TableHead className="text-right font-semibold text-slate-200">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((c) => (
                        <TableRow
                          key={c.id}
                          className={`cursor-pointer transition-colors border-b border-slate-700/50 ${
                            Number(selectedCustomerId) === Number(c.id)
                              ? 'bg-blue-500/20 hover:bg-blue-500/30'
                              : 'hover:bg-slate-700/40'
                          }`}
                          onClick={() => selectCustomer(c)}
                        >
                          <TableCell className="font-medium text-white">
                            <div className="flex items-center gap-2">
                              {Number(selectedCustomerId) === Number(c.id) && (
                                <div className="h-2 w-2 rounded-full bg-blue-400" />
                              )}
                              {c.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">{c.phone || <span className="text-slate-500">—</span>}</TableCell>
                          <TableCell className="text-sm text-slate-400">
                            {[c.address, c.neighborhood, c.city, c.state, c.zipcode].filter(Boolean).join(' - ') || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                selectCustomer(c);
                              }}
                              className={`gap-1 ${
                                Number(selectedCustomerId) === Number(c.id)
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
                              }`}
                            >
                              {Number(selectedCustomerId) === Number(c.id) ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  Selecionado
                                </>
                              ) : (
                                'Selecionar'
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cadastro rápido de Cliente (PDV) */}
      <Dialog open={customerCreateOpen} onOpenChange={setCustomerCreateOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          <div className="relative">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">Cadastrar Cliente</DialogTitle>
                  <DialogDescription className="text-blue-100 mt-1">
                    Cadastre rapidamente e já selecione o cliente para a venda.
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Conteúdo principal */}
            <div className="p-6 bg-slate-800/50 backdrop-blur-sm">
              <div className="grid gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <Label className="text-sm font-medium text-slate-200">Nome *</Label>
                    <Input
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Nome do cliente"
                      autoFocus
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-200">Telefone</Label>
                    <Input
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                      inputMode="tel"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-200">Documento</Label>
                    <Input
                      value={newCustomer.document}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, document: e.target.value }))}
                      placeholder="CPF/CNPJ"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <Label className="text-sm font-medium text-slate-200">Endereço</Label>
                    <Input
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Rua, número"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-200">Bairro</Label>
                    <Input
                      value={newCustomer.neighborhood}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, neighborhood: e.target.value }))}
                      placeholder="Bairro"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-200">Cidade</Label>
                    <Input
                      value={newCustomer.city}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, city: e.target.value }))}
                      placeholder="Cidade"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-200">UF</Label>
                    <Input
                      value={newCustomer.state}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, state: e.target.value.toUpperCase() }))}
                      placeholder="UF"
                      maxLength={2}
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-200">CEP</Label>
                    <Input
                      value={newCustomer.zipcode}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, zipcode: e.target.value }))}
                      placeholder="00000-000"
                      inputMode="numeric"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé com gradiente */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-b-lg border-t border-slate-600/50">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCustomerCreateOpen(false)}
                  disabled={customerCreateLoading}
                  className="w-full sm:w-auto border-slate-500 bg-slate-700/50 hover:bg-slate-600 text-slate-200 hover:text-white h-11 font-medium transition-all duration-200 hover:shadow-md"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateCustomer}
                  disabled={customerCreateLoading}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-11 font-medium transition-all duration-200 hover:shadow-lg gap-2"
                >
                  {customerCreateLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Salvar e selecionar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Operações de Caixa */}
      {showCaixaDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Wallet className="h-6 w-6" />
                  {caixaOperationType === 'sangria' && 'Sangria de Caixa'}
                  {caixaOperationType === 'reforco' && 'Reforço de Caixa'}
                </h2>
                <button
                  onClick={() => setShowCaixaDialog(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Saldo Atual:</span>
                    <span className="text-xl font-bold">R$ {saldoCaixa.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor-operacao">Valor *</Label>
                  <Input
                    id="valor-operacao"
                    type="number"
                    placeholder="0,00"
                    step="0.01"
                    min="0"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const valor = parseFloat((e.target as HTMLInputElement).value);
                        const descricao = (document.getElementById('descricao-operacao') as HTMLInputElement)?.value || '';
                        if (valor > 0) {
                          executeCaixaOperation(valor, descricao);
                        }
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao-operacao">Descrição</Label>
                  <Input
                    id="descricao-operacao"
                    placeholder="Motivo da operação (opcional)"
                  />
                </div>

                <Button
                  onClick={() => {
                    const valor = parseFloat((document.getElementById('valor-operacao') as HTMLInputElement)?.value || '0');
                    const descricao = (document.getElementById('descricao-operacao') as HTMLInputElement)?.value || '';
                    if (valor > 0) {
                      executeCaixaOperation(valor, descricao);
                    } else {
                      toast.error('Digite um valor válido');
                    }
                  }}
                  className="w-full juga-gradient text-white"
                >
                  Confirmar {caixaOperationType === 'sangria' ? 'Sangria' : 'Reforço'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Venda */}
      <SaleConfirmationModal
        isOpen={showConfirmationModal}
        onClose={handleCloseConfirmation}
        onNewSale={handleNewSale}
        onPrintReceipt={handlePrintReceipt}
        onPrintA4={handlePrintA4}
        onEmitirNota={handleEmitirNota}
        saleData={lastSaleData}
      />

      <DeliveryQuickModal
        open={deliveryQuickOpen}
        onOpenChange={setDeliveryQuickOpen}
        tenantId={tenant?.id || null}
      />

      {/* Modal de Abertura de Caixa */}
      <CashOpeningModal
        isOpen={showCashOpeningModal}
        onClose={() => setShowCashOpeningModal(false)}
        onConfirm={handleCashOpening}
        operatorName={user?.email || user?.id?.toString() || 'Operador'}
        existingOpenSession={!!cashSessionId}
      />

      {/* Modal de Fechamento de Caixa */}
      <CashClosingModal
        isOpen={showCashClosingModal}
        onClose={() => setShowCashClosingModal(false)}
        onConfirm={handleCashClosing}
        todaySales={todaySales}
        caixaInicial={caixaInicial}
        caixaOperations={caixaOperations}
        openedAt={cashSessionOpenedAt}
        openedBy={cashSessionOpenedBy}
        tenantId={tenant?.id}
        userId={user?.id?.toString()}
      />

      {/* Modal de Sucesso do Fechamento */}
      {closingResult && (
        <CashClosingSuccessModal
          isOpen={showSuccessModal}
          onClose={handleCloseSuccessModal}
          closingData={closingResult}
        />
      )}

      {/* Dialog de Vendas em Espera */}
      <Dialog open={showPendingSalesDialog} onOpenChange={setShowPendingSalesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Vendas em Espera
            </DialogTitle>
            <DialogDescription>
              Selecione uma venda para restaurar ou continuar editando
            </DialogDescription>
          </DialogHeader>
          
          {pendingSales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma venda em espera</p>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {pendingSales.map((sale) => {
                const saleDate = new Date(sale.createdAt);
                const timeAgo = Math.floor((Date.now() - saleDate.getTime()) / 1000 / 60); // minutos
                const timeAgoText = timeAgo < 1 ? 'Agora' : timeAgo < 60 ? `${timeAgo} min atrás` : `${Math.floor(timeAgo / 60)}h ${timeAgo % 60}min atrás`;
                
                return (
                  <div
                    key={sale.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            {sale.cart.length} {sale.cart.length === 1 ? 'item' : 'itens'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{timeAgoText}</span>
                        </div>
                        {sale.customerName && (
                          <p className="text-sm font-medium text-heading">
                            Cliente: {sale.customerName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {saleDate.toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          R$ {sale.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => restorePendingSale(sale)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('Deseja realmente remover esta venda em espera?')) {
                            removePendingSale(sale.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
      )}
    </TenantPageWrapper>
  );
}

