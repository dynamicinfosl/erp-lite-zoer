

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProductSearch } from '@/components/pdv/ProductSearch';
import { CartItems } from '@/components/pdv/CartItems';
import { PaymentForm } from '@/components/pdv/PaymentForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, AlertTriangle, LogOut } from 'lucide-react';
import { Product, CartItem } from '@/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { ENABLE_AUTH } from '@/constants/auth';
import { mockProducts } from '@/lib/mock-data';

export default function PDVPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cashSession, setCashSession] = useState<any | null>(null);

  const handleCancelSale = useCallback(() => {
    if (cartItems.length > 0) {
      if (confirm('Deseja cancelar a venda atual?')) {
        setCartItems([]);
        setShowPayment(false);
        toast.success('Venda cancelada');
      }
    }
  }, [cartItems.length]);

  useEffect(() => {
    fetchProducts();
    fetchCashSession();
    
    // Atalhos de teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        // Foco no campo de quantidade do último item
        if (cartItems.length > 0) {
          const lastIndex = cartItems.length - 1;
          const quantityInput = document.querySelector(`input[data-item-index="${lastIndex}"]`) as HTMLInputElement;
          quantityInput?.focus();
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cartItems.length > 0) {
          setShowPayment(true);
        }
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleCancelSale();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, handleCancelSale]);
  const fetchCashSession = async () => {
    try {
      if (ENABLE_AUTH) {
        const session = await api.get<any>('/cash-sessions');
        setCashSession(session);
      } else {
        setCashSession({ id: 0, status: 'open' });
      }
    } catch (error) {
      console.error('Erro ao obter sessão de caixa:', error);
    }
  };


  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      if (ENABLE_AUTH) {
        // Se autenticação estiver habilitada, buscar dados da API
        const productsData = await api.get<Product[]>('/products');
        setProducts(productsData);
      } else {
        // Se autenticação estiver desabilitada, usar dados mockados
        setProducts(mockProducts);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      if (ENABLE_AUTH) {
        toast.error('Erro ao carregar produtos');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = useCallback((product: Product) => {
    if (product.stock_quantity <= 0) {
      toast.error('Produto sem estoque');
      return;
    }

    const existingIndex = cartItems.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      // Produto já existe no carrinho, aumentar quantidade
      const newQuantity = cartItems[existingIndex].quantity + 1;
      if (newQuantity > product.stock_quantity) {
        toast.error('Quantidade excede o estoque disponível');
        return;
      }
      
      const updatedItems = [...cartItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: newQuantity,
        total_price: newQuantity * product.sale_price,
      };
      setCartItems(updatedItems);
    } else {
      // Novo produto no carrinho
      const newItem: CartItem = {
        product,
        quantity: 1,
        unit_price: product.sale_price,
        total_price: product.sale_price,
      };
      setCartItems([...cartItems, newItem]);
    }
    
    toast.success(`${product.name} adicionado ao carrinho`);
  }, [cartItems]);

  const handleUpdateQuantity = useCallback((index: number, quantity: number) => {
    const item = cartItems[index];
    if (quantity > item.product.stock_quantity) {
      toast.error('Quantidade excede o estoque disponível');
      return;
    }

    const updatedItems = [...cartItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
      total_price: quantity * item.unit_price,
    };
    setCartItems(updatedItems);
  }, [cartItems]);

  const handleRemoveItem = useCallback((index: number) => {
    const updatedItems = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedItems);
    toast.success('Item removido do carrinho');
  }, [cartItems]);

  const handleFinalizeSale = async (saleData: any) => {
    try {
      const salePayload = {
        items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payment_method: saleData.paymentMethod,
        sale_type: saleData.saleType,
        discount_amount: saleData.discount,
        customer_info: saleData.customerInfo,
        notes: saleData.notes,
      };

      await api.post('/sales', salePayload);
      
      toast.success('Venda finalizada com sucesso!');
      setCartItems([]);
      setShowPayment(false);
      
      // Atualizar lista de produtos para refletir novo estoque
      fetchProducts();
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast.error('Erro ao finalizar venda');
    }
  };

  const total = cartItems.reduce((sum, item) => sum + item.total_price, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Guard: exigir caixa aberto
  if (ENABLE_AUTH && !cashSession) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Nenhuma sessão de caixa aberta. Abra um caixa para iniciar vendas.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div className="container mx-auto p-6">
        <PaymentForm
          total={total}
          onFinalizeSale={handleFinalizeSale}
          onCancel={() => setShowPayment(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PDV - Ponto de Venda</h1>
          <p className="text-muted-foreground">
            Sistema otimizado para vendas rápidas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
            Voltar ao Menu
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (confirm('Deseja sair do sistema?')) {
                // Sempre redirecionar para login
                router.push('/login');
              }
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sair
          </Button>
          <ShoppingCart className="h-5 w-5" />
          <span className="font-semibold">
            {cartItems.length} itens - {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(total)}
          </span>
        </div>
      </div>

      {/* Atalhos de Teclado */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Atalhos:</strong> F2 = Buscar Produto • F3 = Alterar Quantidade • F4 = Finalizar Venda • F5 = Cancelar Venda
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Busca de Produtos */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Localizar Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductSearch
                products={products}
                onProductSelect={handleProductSelect}
              />
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Produtos Cadastrados:</span>
                  <div className="font-semibold">{products.length}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Produtos em Estoque:</span>
                  <div className="font-semibold">
                    {products.filter(p => p.stock_quantity > 0).length}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Vendedor:</span>
                  <div className="font-semibold">Sistema</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Data/Hora:</span>
                  <div className="font-semibold">
                    {new Date().toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carrinho */}
        <div className="space-y-4">
          <CartItems
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
          />

          {/* Botões de Ação */}
          <div className="space-y-2">
            <Button
              onClick={() => setShowPayment(true)}
              disabled={cartItems.length === 0}
              className="w-full h-12 text-base sm:text-lg"
              size="lg"
            >
              Finalizar Venda (F4)
            </Button>
            
            <Button
              variant="outline"
              onClick={handleCancelSale}
              disabled={cartItems.length === 0}
              className="w-full"
            >
              Cancelar Venda (F5)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

