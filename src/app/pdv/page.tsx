'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [caixaOperationType, setCaixaOperationType] = useState<'sangria' | 'reforco' | 'fechamento'>('sangria');
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
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito' | 'boleto'>('dinheiro');
  const [currentSection, setCurrentSection] = useState<'pdv' | 'payment'>('pdv');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const [deliveryQuickOpen, setDeliveryQuickOpen] = useState(false);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [showPendingSalesDialog, setShowPendingSalesDialog] = useState(false);
  const [restoredSaleId, setRestoredSaleId] = useState<string | null>(null);
  
  // Estados para cadastro de novo cliente
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    city: '',
    address: '',
    neighborhood: '',
    state: '',
    zipcode: '',
    type: 'PF' as 'PF' | 'PJ',
  });
  
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
        const url = `/next_api/sales?today=true&tenant_id=${encodeURIComponent(tenant.id)}&tz=${tz}`;
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
    // Se há uma venda restaurada e o carrinho está sendo esvaziado, remover a venda restaurada
    if (restoredSaleId) {
      const updatedPendingSales = pendingSales.filter(sale => sale.id !== restoredSaleId);
      savePendingSales(updatedPendingSales);
      setRestoredSaleId(null);
    }
    
    setCart([]);
    setSelectedProduct(null);
    setCustomerName('');
    setSelectedCustomerId(null);
    setSelectedVariantId(null);
    setSelectedVariants([]);
    setPriceInputValue('');
    setSelectedPriceTiers([]);
    setSearchTerm('');
  }, [restoredSaleId, pendingSales, savePendingSales]);

  // Função para cancelar seleção e limpar carrinho
  const cancelSelection = useCallback(() => {
    // Se há uma venda restaurada, removê-la ao cancelar
    if (restoredSaleId) {
      const updatedPendingSales = pendingSales.filter(sale => sale.id !== restoredSaleId);
      savePendingSales(updatedPendingSales);
      setRestoredSaleId(null);
    }
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
  }, [restoredSaleId, pendingSales, savePendingSales]);

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
        subtotal: calculateItemTotal(item)
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
      const res = await fetch(`/next_api/customers?tenant_id=${encodeURIComponent(tenant.id)}`);
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
  }, [tenant?.id]);

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

  const handleAddCustomer = async () => {
    if (!tenant?.id) {
      toast.error('Tenant não disponível');
      return;
    }

    if (!newCustomer.name) {
      toast.error('O nome do cliente é obrigatório');
      return;
    }

    setIsRegisteringCustomer(true);
    try {
      const response = await fetch('/next_api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCustomer,
          tenant_id: tenant.id,
          branch_id: scope === 'branch' && branchId ? branchId : null,
          status: 'active'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao adicionar cliente');
      }

      const result = await response.json();
      const createdCustomer = result.data || result;

      await loadCustomers();
      selectCustomer(createdCustomer);
      setShowAddCustomerDialog(false);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        document: '',
        city: '',
        address: '',
        neighborhood: '',
        state: '',
        zipcode: '',
        type: 'PF',
      });
      toast.success('Cliente cadastrado e selecionado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar cliente');
    } finally {
      setIsRegisteringCustomer(false);
    }
  };

  const clearCustomer = useCallback(() => {
    setSelectedCustomerId(null);
    setCustomerName('');
  }, []);

  // Funções para operações do PDV
  const handleSangria = useCallback(() => {
    setCaixaOperationType('sangria');
    setShowCaixaDialog(true);
  }, []);

  const handleReforco = useCallback(() => {
    setCaixaOperationType('reforco');
    setShowCaixaDialog(true);
  }, []);

  const handleFechamento = useCallback(() => {
    setCaixaOperationType('fechamento');
    setShowCaixaDialog(true);
  }, []);
  
  const executeCaixaOperation = useCallback((valor: number, descricao: string) => {
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
    
    toast.success(messages[caixaOperationType], {
      description: descricao,
      duration: 4000,
    });
    
    setShowCaixaDialog(false);
  }, [caixaOperationType, user]);

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
  };

  const handleCloseConfirmation = () => {
    // Limpar carrinho completamente quando fechar o modal após venda confirmada
    clearCart();
    setShowConfirmationModal(false);
    setPaymentMethod('dinheiro');
    setSearchTerm('');
    toast.success('Carrinho limpo. Pronto para nova venda!');
  };

  const handleEmitirNota = () => {
    if (lastSaleData?.id) {
      router.push(`/emitir-nota?sale_id=${lastSaleData.id}`);
      // Limpar carrinho e fechar modal
      clearCart();
      setShowConfirmationModal(false);
    }
  };

  // Limpar carrinho automaticamente quando o modal fechar por qualquer motivo
  useEffect(() => {
    if (!showConfirmationModal && lastSaleData) {
      // Modal foi fechado e havia uma venda confirmada - limpar carrinho
      clearCart();
      setPaymentMethod('dinheiro');
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
                onClick={() => router.push('/dashboard')}
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
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-juga-gradient p-6 text-white shrink-0">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-white">
                    <User className="h-6 w-6" />
                    Selecionar Cliente
                  </DialogTitle>
                  <DialogDescription className="text-blue-100 mt-1">
                    Pesquise ou cadastre um novo cliente para a venda.
                  </DialogDescription>
                </div>
                <Button 
                  onClick={() => {
                    setCustomerPickerOpen(false);
                    setShowAddCustomerDialog(true);
                  }}
                  className="bg-white text-blue-600 hover:bg-blue-50 font-bold gap-2 shadow-lg border-none"
                >
                  <Plus className="h-5 w-5" />
                  Novo Cliente
                </Button>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome, telefone ou CPF/CNPJ..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10 h-12 text-lg shadow-sm focus-visible:ring-blue-500"
                  autoFocus
                />
              </div>
              <Button 
                variant="outline" 
                onClick={loadCustomers} 
                disabled={customersLoading} 
                className="h-12 px-6 gap-2 border-2 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                <RefreshCw className={`h-5 w-5 ${customersLoading ? 'animate-spin' : ''}`} />
                {customersLoading ? 'Carregando...' : 'Atualizar'}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl border-2 border-gray-100 dark:border-gray-800 shadow-inner bg-gray-50/50 dark:bg-gray-900/50 min-h-[300px]">
              <Table>
                <TableHeader className="bg-white dark:bg-gray-950 sticky top-0 z-10 shadow-sm">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[40%] font-bold text-gray-700 dark:text-gray-300">Cliente</TableHead>
                    <TableHead className="w-[20%] font-bold text-gray-700 dark:text-gray-300">Contato</TableHead>
                    <TableHead className="w-[30%] font-bold text-gray-700 dark:text-gray-300">Localização</TableHead>
                    <TableHead className="w-[10%] text-right font-bold text-gray-700 dark:text-gray-300">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customersLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600" />
                          <p className="text-muted-foreground font-medium">Buscando clientes...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (() => {
                      const s = customerSearch.trim().toLowerCase();
                      const filtered = (Array.isArray(customers) ? customers : [])
                        .filter((c) => {
                          if (!s) return true;
                          return `${c.name || ''} ${c.phone || ''} ${c.document || ''}`
                            .toLowerCase()
                            .includes(s);
                        });

                      if (filtered.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={4} className="h-64 text-center">
                              <div className="flex flex-col items-center justify-center gap-4 py-8">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full">
                                  <Users className="h-12 w-12 text-blue-500" />
                                </div>
                                <div>
                                  <p className="text-xl font-bold text-gray-800 dark:text-gray-200">Nenhum cliente encontrado</p>
                                  <p className="text-muted-foreground mt-1">Não encontramos resultados para "{customerSearch}"</p>
                                </div>
                                <Button 
                                  onClick={() => {
                                    setCustomerPickerOpen(false);
                                    setNewCustomer(prev => ({ ...prev, name: customerSearch }));
                                    setShowAddCustomerDialog(true);
                                  }}
                                  className="juga-gradient text-white px-8 h-12 font-bold gap-2 shadow-lg"
                                >
                                  <Plus className="h-5 w-5" />
                                  Cadastrar "{customerSearch}"
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return filtered.map((c) => (
                        <TableRow key={c.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer" onClick={() => selectCustomer(c)}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-lg group-hover:text-blue-600 transition-colors">{c.name}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <FileText className="h-3 w-3" />
                                {c.document || 'Sem documento'}
                                <Badge variant="outline" className="ml-2 text-[10px] py-0 h-4 uppercase">
                                  {c.type || 'PF'}
                                </Badge>
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3.5 w-3.5 text-blue-500" />
                                {c.phone || '—'}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3.5 w-3.5" />
                                {c.email || '—'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm max-w-[200px] truncate">
                              <Package className="h-4 w-4 text-gray-400 shrink-0" />
                              <span>{[c.neighborhood, c.city].filter(Boolean).join(' - ') || '—'}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate pl-6">
                              {c.address || 'Endereço não informado'}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" className="rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm group-hover:scale-110">
                              <Check className="h-5 w-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ));
                    })()
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-950 border-t flex justify-end shrink-0">
            <Button variant="ghost" onClick={() => setCustomerPickerOpen(false)} className="font-medium">
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cadastro de Novo Cliente */}
      <Dialog open={showAddCustomerDialog} onOpenChange={setShowAddCustomerDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl">
          <div className="juga-gradient p-6 text-white shrink-0 sticky top-0 z-10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-white">
                <Plus className="h-6 w-6" />
                Cadastrar Novo Cliente
              </DialogTitle>
              <DialogDescription className="text-blue-100">
                Preencha os dados abaixo para cadastrar o cliente rapidamente.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="new-cust-name" className="text-sm font-bold flex items-center gap-1">
                  Nome Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new-cust-name"
                  placeholder="Ex: João da Silva"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="h-11 focus-visible:ring-blue-500 border-gray-300"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-cust-type" className="text-sm font-bold">Tipo de Cliente</Label>
                <Select
                  value={newCustomer.type}
                  onValueChange={(v: 'PF' | 'PJ') => setNewCustomer({ ...newCustomer, type: v })}
                >
                  <SelectTrigger id="new-cust-type" className="h-11 border-gray-300">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">Pessoa Física (CPF)</SelectItem>
                    <SelectItem value="PJ">Pessoa Jurídica (CNPJ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-cust-doc" className="text-sm font-bold">Documento (CPF/CNPJ)</Label>
                <Input
                  id="new-cust-doc"
                  placeholder="000.000.000-00"
                  value={newCustomer.document}
                  onChange={(e) => setNewCustomer({ ...newCustomer, document: e.target.value })}
                  className="h-11 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-cust-phone" className="text-sm font-bold">Telefone / WhatsApp</Label>
                <Input
                  id="new-cust-phone"
                  placeholder="(00) 00000-0000"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="h-11 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-cust-email" className="text-sm font-bold">E-mail</Label>
                <Input
                  id="new-cust-email"
                  type="email"
                  placeholder="cliente@exemplo.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="h-11 border-gray-300"
                />
              </div>

              <div className="space-y-4 md:col-span-2 pt-2">
                <div className="flex items-center gap-2 text-blue-600 font-bold border-b pb-2 mb-4">
                  <Package className="h-5 w-5" />
                  Endereço e Localização
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="new-cust-address" className="text-sm font-medium text-gray-700">Rua / Logradouro</Label>
                    <Input
                      id="new-cust-address"
                      placeholder="Ex: Av. Brasil, 123"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      className="h-11 border-gray-200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-cust-neighborhood" className="text-sm font-medium text-gray-700">Bairro</Label>
                    <Input
                      id="new-cust-neighborhood"
                      placeholder="Ex: Centro"
                      value={newCustomer.neighborhood}
                      onChange={(e) => setNewCustomer({ ...newCustomer, neighborhood: e.target.value })}
                      className="h-11 border-gray-200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-cust-city" className="text-sm font-medium text-gray-700">Cidade</Label>
                    <Input
                      id="new-cust-city"
                      placeholder="Ex: São Paulo"
                      value={newCustomer.city}
                      onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                      className="h-11 border-gray-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-gray-950 border-t flex flex-col-reverse sm:flex-row gap-3 justify-end sticky bottom-0 z-10">
            <Button 
              variant="ghost" 
              onClick={() => setShowAddCustomerDialog(false)}
              className="font-bold h-12 px-6"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddCustomer} 
              disabled={isRegisteringCustomer}
              className="juga-gradient text-white font-bold h-12 px-8 min-w-[150px] shadow-lg"
            >
              {isRegisteringCustomer ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Salvar e Selecionar'
              )}
            </Button>
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
                  {caixaOperationType === 'fechamento' && 'Fechamento de Caixa'}
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

                {caixaOperationType !== 'fechamento' ? (
                  <>
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
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2 p-4 bg-muted rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-sm">Saldo Inicial:</span>
                        <span className="font-semibold">R$ {caixaInicial.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span className="text-sm">Vendas:</span>
                        <span className="font-semibold">+ R$ {totalVendasDia.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span className="text-sm">Reforços:</span>
                        <span className="font-semibold">+ R$ {totalReforcos.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-red-600 dark:text-red-400">
                        <span className="text-sm">Sangrias:</span>
                        <span className="font-semibold">- R$ {totalSangrias.toFixed(2)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Saldo Final:</span>
                        <span className="font-extrabold text-primary">R$ {saldoCaixa.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        executeCaixaOperation(saldoCaixa, `Fechamento - ${todaySales.length} vendas`);
                        toast.info('Caixa fechado. Iniciando novo período...', {
                          duration: 5000,
                        });
                      }}
                      className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Confirmar Fechamento
                    </Button>
                  </div>
                )}
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
    </TenantPageWrapper>
  );
}

