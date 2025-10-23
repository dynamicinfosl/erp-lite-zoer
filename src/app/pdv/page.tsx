
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JugaKPICard } from '@/components/dashboard/JugaComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { OverlaySelect } from '@/components/ui/overlay-select';
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
  User,
  Package,
  X,
  Check,
  Home,
  Users,
  Archive,
  DollarSign,
  Settings,
  LogOut,
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
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Product, PDVItem } from '@/types';
import { ENABLE_AUTH } from '@/constants/auth';
import { api } from '@/lib/api-client';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';
import { PaymentSection } from '@/components/pdv/PaymentSection';
import { SaleConfirmationModal } from '@/components/pdv/SaleConfirmationModal';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
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

export default function PDVPage() {
  const { user, tenant, signOut } = useSimpleAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<PDVItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<PDVItem | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Novos estados para funcionalidades avançadas
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showCaixaDialog, setShowCaixaDialog] = useState(false);
  const [caixaOperationType, setCaixaOperationType] = useState<'sangria' | 'reforco' | 'fechamento'>('sangria');
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  // Persistência local do histórico do dia
  const getLocalSalesKey = useCallback(() => {
    const tenantId = tenant?.id || 'no-tenant';
    // Usar data fixa para evitar hidratação
    const today = new Date('2025-01-20');
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `pdv.todaySales.${tenantId}.${y}-${m}-${d}`;
  }, [tenant?.id]);

  const saveTodaySalesLocal = useCallback((sales: Sale[]) => {
    try {
      const key = getLocalSalesKey();
      localStorage.setItem(key, JSON.stringify(sales));
      // fallback global (independente do tenant) para garantir visibilidade
      const today = new Date('2025-01-20'); // Data fixa para evitar hidratação
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


  const addSelectedToCart = useCallback(() => {
    if (!selectedProduct) return;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === selectedProduct.id);
      if (existingIndex >= 0) {
        const updatedCart = [...prevCart];
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: updatedCart[existingIndex].quantity + selectedProduct.quantity,
          discount: selectedProduct.discount,
        };
        return updatedCart;
      }
      return [...prevCart, { ...selectedProduct }];
    });

    toast.success(`${selectedProduct.name} adicionado ao carrinho`);
    setSelectedProduct(null);
    setSearchTerm('');
  }, [selectedProduct]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        
        // Aguardar tenant estar disponível (máximo 2 segundos)
        let attempts = 0;
        while (!tenant?.id && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!tenant?.id) { 
          console.warn('⚠️ Tenant não disponível após 2 segundos');
          setProducts([]); 
          return; 
        }

        console.log('🔄 Carregando produtos para tenant:', tenant.id);
        const res = await fetch(`/next_api/products?tenant_id=${encodeURIComponent(tenant.id)}`);
        if (!res.ok) throw new Error('Erro ao carregar produtos');
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
        setProducts(data);
        console.log('✅ Produtos carregados:', data.length);
      } catch (error) {
        console.error('❌ Erro ao carregar produtos:', error);
        toast.error('Erro ao carregar produtos');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [tenant?.id]);

  // Carregar vendas do dia
  useEffect(() => {
    const loadTodaySales = async () => {
      try {
        if (!tenant?.id) {
          console.warn('⚠️ Tenant não disponível para carregar vendas');
          setTodaySales([]);
          return;
        }
        
        console.log('🔄 Carregando vendas do dia para tenant:', tenant.id);
        
        // Primeiro tenta carregar do localStorage para feedback imediato
        loadTodaySalesLocal();

        // Timeout de 3 segundos para a requisição
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        try {
          const tz = -new Date().getTimezoneOffset();
          const response = await fetch(`/next_api/sales?today=true&tenant_id=${encodeURIComponent(tenant.id)}&tz=${tz}`, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            const sales = data.sales || data.data || [];
            
            console.log('✅ Vendas carregadas:', sales.length);
            
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
            
            setTodaySales(localSales);
            saveTodaySalesLocal(localSales);
          } else {
            console.log('⚠️ Erro ao carregar vendas:', response.status, '- usando array vazio');
            // Mantém dados locais, mas não elimina
          }
        } catch (fetchError: any) {
          if (fetchError.name === 'AbortError') {
            console.log('⏰ Timeout ao carregar vendas, usando array vazio');
          } else {
            console.log('⚠️ Erro na requisição de vendas:', fetchError.message);
          }
          // Mantém dados locais
        }
      } catch (error) {
        console.log('⚠️ Erro ao carregar vendas do dia:', error);
        // Mantém dados locais
      }
    };

    loadTodaySales();
  }, [tenant?.id]);

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
  }, []); // Array vazio - função addSelectedToCart já é estável com useCallback

  const filteredProducts = useMemo(() => {
    if (loading) return [];
    return products
      .map((product, index) => ({
        id: product.id || index + 1,
        name: product.name || 'Produto sem nome',
        price: Number(product.sale_price || product.cost_price || 0),
        code: product.sku || product.barcode || String(product.id || index + 1),
      }))
      .filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.code.toLowerCase().includes(searchTerm.toLowerCase()),
      );
  }, [loading, products, searchTerm]); // Dependências estáveis

  const selectProduct = (product: { id: number; name: string; price: number; code: string }) => {
    setSelectedProduct({
      ...product,
      quantity: 1,
      discount: 0,
    });
  };

  const clearSelection = () => {
    setSelectedProduct(null);
    setSearchTerm('');
  };

  const cancelSelection = () => {
    clearSelection();
  };

  const removeFromCart = useCallback((productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item,
        ),
      );
    }
  }, []);

  const calculateItemTotal = useCallback((item: PDVItem) => {
    const subtotal = item.price * item.quantity;
    return subtotal - (subtotal * item.discount) / 100;
  }, []);

  const total = useMemo(() => cart.reduce((sum, item) => sum + calculateItemTotal(item), 0), [cart, calculateItemTotal]); // Dependências estáveis

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedProduct(null);
    setCustomerName('');
  }, []);

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
      const saleData = {
        tenant_id: tenant.id, // ✅ Usar tenant.id diretamente
        user_id: user?.id || '00000000-0000-0000-0000-000000000000', // ✅ Adicionar user_id
        sale_type: null, // ✅ Usar NULL para evitar constraint
        customer_name: customerName || 'Cliente Avulso',
        total_amount: total, // ✅ Corrigir: usar 'total_amount' para compatibilidade com API
        total: total, // ✅ Manter 'total' também para compatibilidade
        payment_method: paymentData?.paymentMethod || paymentMethod,
        status: null, // ✅ Usar NULL para evitar constraint
        notes: cart.length > 0 ? `Venda com ${cart.length} itens` : '',
        // Dados de pagamento (se fornecidos)
        amount_paid: paymentData?.amountPaid || total,
        change_amount: paymentData?.change || 0,
        remaining_amount: paymentData?.remaining || 0,
        payment_status: paymentData?.paymentStatus || 'paid',
        payment_notes: paymentData?.notes,
        products: cart.map(item => ({
          id: item.id,
          name: item.name,
          code: item.code || 'N/A', // ✅ Garantir que code existe
          price: item.price,
          quantity: item.quantity,
          discount: item.discount || 0, // ✅ Garantir que discount existe
          subtotal: calculateItemTotal(item)
        }))
      };

      // Salvar venda no Supabase
      const response = await fetch('/next_api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar venda');
      }

      const result = await response.json();
      
      // Criar objeto de venda para o estado local
      const localSaleData: Sale = {
        id: result.data.id,
        numero: result.data.sale_number || `VND-${Date.now().toString().slice(-6)}`,
        cliente: customerName || 'Cliente Avulso',
        total: total,
        forma_pagamento: paymentMethod,
        data_venda: result.data.created_at || new Date().toISOString(),
        status: 'paga',
      };
      
      // Adicionar venda ao histórico local
      setTodaySales(prev => {
        const updated = [localSaleData, ...prev];
        saveTodaySalesLocal(updated);
        return updated;
      });
      
      // Recarregar vendas do dia para garantir sincronização
      setTimeout(async () => {
        try {
          const tz = -new Date().getTimezoneOffset();
          const response = await fetch(`/next_api/sales?today=true&tenant_id=${encodeURIComponent(tenant?.id || '')}&tz=${tz}`);
          if (response.ok) {
            const data = await response.json();
            const sales = data.data || [];
            const localSales: Sale[] = sales.map((sale: any) => ({
              id: sale.id,
              numero: sale.sale_number,
              cliente: sale.customer_name,
              total: parseFloat(sale.total_amount || sale.final_amount || 0),
              forma_pagamento: sale.payment_method,
              data_venda: sale.created_at,
              status: sale.status === 'completed' ? 'paga' : (sale.status || 'paga'),
            }));
            setTodaySales(localSales);
            console.log('🔄 Histórico de vendas atualizado:', localSales.length);
          }
        } catch (error) {
          console.error('❌ Erro ao recarregar vendas:', error);
        }
      }, 1000);
      
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

      // Mostrar modal de confirmação
      setLastSaleData(confirmationData);
      setShowConfirmationModal(true);
      setCurrentSection('pdv');
      
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast.error(`Erro ao salvar venda: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, [total, customerName, paymentMethod, clearCart, cart, calculateItemTotal]);

  // Funções para operações do PDV
  const handleSangria = useCallback(() => {
    setCaixaOperationType('sangria');
    setShowCaixaDialog(true);
  }, []);

  const handleTrocaDevolucao = useCallback(() => {
    toast.info('Funcionalidade de Troca/Devolução em desenvolvimento');
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

  const menuItems: MenuItem[] = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Clientes', href: '/clientes' },
    { icon: Package, label: 'Produtos', href: '/produtos' },
    { icon: Archive, label: 'Estoque', href: '/estoque' },
    { icon: DollarSign, label: 'Financeiro', href: '/financeiro' },
    { icon: Settings, label: 'Configurações', href: '/configuracoes' },
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
    setShowConfirmationModal(false);
  };

  // Função para imprimir cupom do histórico
  const handlePrintHistoryReceipt = (saleId: string) => {
    const cupomUrl = `/cupom/${saleId}`;
    window.open(cupomUrl, '_blank');
  };

  const handleNewSale = () => {
    // Limpar carrinho e fechar modal
    clearCart();
    setShowConfirmationModal(false);
    setPaymentMethod('dinheiro');
  };

  const handleCloseConfirmation = () => {
    setShowConfirmationModal(false);
  };

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

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="fixed top-4 left-4 z-40">
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="shadow-lg">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
        </div>

        <SheetContent side="left" className="w-64 p-0 juga-sidebar-gradient">
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

          <div className="p-4 space-y-2">
            {menuItems.map((item) => {
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

          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="flex flex-col gap-2 mb-3">
                <span className="text-xs font-semibold text-white truncate">
                  {user?.email || 'Usuário'}
                </span>
                <span className="text-xs text-white/60">
                  {tenant?.name || (user?.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ') : 'Meu Negócio')}
                </span>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-full justify-center gap-2 text-white hover:bg-white/20 border border-white/30"
                onClick={() => {
                  if (confirm('Deseja sair do sistema?')) {
                    if (ENABLE_AUTH) {
                      signOut();
                    } else {
                      window.location.href = '/login';
                    }
                  }
                }}
              >
                <LogOut className="h-3 w-3" />
                Finalizar sessão
              </Button>
            </div>
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
                onClick={() => setShowHistoryDialog(true)}
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
                  <DropdownMenuItem onClick={handleTrocaDevolucao} className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">
                    <RotateCcw className="mr-2 h-4 w-4 text-orange-500" />
                    <span>Troca/Devolução</span>
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <Card className="border border-slate-200 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur rounded-xl">
                <CardHeader className="pb-0 bg-gradient-to-r from-[#0f1f3b] via-[#162a4d] to-[#0f1f3b] text-white rounded-t-xl">
                  <CardTitle className="text-sm sm:text-base text-white font-semibold tracking-wide">
                    Localizar um produto/serviço abaixo
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_56px] gap-3">
                    <Input
                      id="search-input"
                      placeholder="Digite o código ou o nome"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-lg h-12 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-300/60 dark:border-slate-700/70 focus-visible:ring-blue-500/40"
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
                      className="w-full"
                    />
                    <Button variant="outline" size="lg" className="px-0 rounded-xl border-blue-400/40">
                      <Barcode className="h-5 w-5" />
                    </Button>
                  </div>

                  {!loading && searchTerm && (
                    <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                          <div className="max-h-72 overflow-y-auto bg-white dark:bg-slate-900">
                        {filteredProducts.length === 0 && (
                          <div className="p-3 text-sm text-muted-foreground">Nenhum produto encontrado.</div>
                        )}
                        {filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b last:border-b-0 flex items-center justify-between"
                            onClick={() => selectProduct(product)}
                          >
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-100">{product.name}</p>
                              <p className="text-sm text-muted-foreground">Código: {product.code}</p>
                            </div>
                            <p className="font-semibold text-blue-600">R$ {product.price.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {loading && <div className="mt-4 text-sm text-muted-foreground">Carregando produtos...</div>}
            </CardContent>
          </Card>

              <Card className="juga-card min-h-[400px]">
                <CardContent className="p-6">
                  {selectedProduct ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-center">
                        <div className="w-full max-w-sm aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                          <Package className="h-20 w-20 text-gray-400" />
                        </div>
                      </div>

                      <div className="space-y-4">
                <div>
                          <Label className="text-sm font-medium text-muted-foreground uppercase">Código</Label>
                          <p className="text-lg font-semibold text-heading">{selectedProduct.code}</p>
                </div>

                <div>
                          <Label className="text-sm font-medium text-muted-foreground uppercase">Quantidade</Label>
                          <Input
                            type="number"
                            min="1"
                            value={selectedProduct.quantity}
                            onChange={(e) =>
                              setSelectedProduct({
                                ...selectedProduct,
                                quantity: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            className="mt-1"
                          />
                  </div>

                        <div>
                          <Label className="text-sm font-medium text-muted-foreground uppercase">Valor Unitário</Label>
                          <Input value={`R$ ${selectedProduct.price.toFixed(2)}`} disabled className="mt-1 bg-gray-50 dark:bg-gray-900" />
                </div>

                <div>
                          <Label className="text-sm font-medium text-muted-foreground uppercase">Desconto (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={selectedProduct.discount}
                            onChange={(e) =>
                              setSelectedProduct({
                                ...selectedProduct,
                                discount: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)),
                              })
                            }
                            className="mt-1"
                          />
                </div>

                <div>
                          <Label className="text-sm font-medium text-muted-foreground uppercase">Valor Total</Label>
                          <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border text-center">
                            <span className="text-xl font-bold text-primary">R$ {calculateItemTotal(selectedProduct).toFixed(2)}</span>
                          </div>
                  </div>
                </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[300px]">
                      <div className="text-center">
                        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Selecione um produto para visualizar</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t">
                    <Button className="w-full juga-gradient text-white h-12" disabled={!selectedProduct} onClick={addSelectedToCart}>
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
                    <h3 className="font-semibold text-lg mb-4 text-heading">Itens do Pedido</h3>

                    {cart.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum item adicionado</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm text-heading">{item.name}</h5>
                                <p className="text-xs text-muted-foreground">Cód: {item.code}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
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
                        ))}
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
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                        <Button
                          className="h-11 w-full px-7 rounded-lg text-white text-xs sm:text-[13px] font-semibold shadow-sm disabled:opacity-100 disabled:saturate-75 disabled:brightness-95 disabled:cursor-not-allowed border border-white/10 bg-gradient-to-br from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors flex items-center justify-center"
                          onClick={() => selectedProduct && addSelectedToCart()}
                          disabled={!selectedProduct}
                        >
                          ADICIONAR
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
        saleData={lastSaleData}
      />
      </div>
    </TenantPageWrapper>
  );
}

