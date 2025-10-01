

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { Product, PDVItem } from '@/types';
import { ENABLE_AUTH } from '@/constants/auth';
import { api } from '@/lib/api-client';
import { mockProducts as defaultMockProducts, mockUserProfile } from '@/lib/mock-data';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

export default function PDVPage() {
  const { user, tenant, signOut } = useSimpleAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<PDVItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<PDVItem | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const mockProducts = useMemo(() => defaultMockProducts.map((p, index) => ({
    id: index + 1,
    name: p.name,
    price: Number(p.sale_price || p.cost_price || 0),
    code: p.sku || String(p.id),
  })), []);

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
      if (ENABLE_AUTH) {
          const response = await api.get<Product[]>('/products');
          setProducts(response);
      } else {
          setProducts(mockProducts as unknown as Product[]);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
        toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

    loadProducts();
  }, [mockProducts]);

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
  }, [addSelectedToCart]);

  const filteredProducts = useMemo(() => {
    if (loading) return [];
    return products
      .map((product, index) => ({
        id: product.id || index + 1,
        name: product.name,
        price: Number(product.sale_price || product.cost_price || 0),
        code: product.sku || product.barcode || String(product.id || index + 1),
      }))
      .filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.code.toLowerCase().includes(searchTerm.toLowerCase()),
      );
  }, [loading, products, searchTerm]);

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

  const total = useMemo(() => cart.reduce((sum, item) => sum + calculateItemTotal(item), 0), [cart, calculateItemTotal]);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedProduct(null);
    setCustomerName('');
  }, []);

  const processPayment = useCallback(() => {
    if (cart.length === 0) return;

    alert(`Venda finalizada!\nTotal: R$ ${total.toFixed(2)}\nCliente: ${customerName || 'Cliente Avulso'}`);
    clearCart();
  }, [cart.length, total, customerName, clearCart]);

  const menuItems: MenuItem[] = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Clientes', href: '/clientes' },
    { icon: Package, label: 'Produtos', href: '/produtos' },
    { icon: Archive, label: 'Estoque', href: '/estoque' },
    { icon: DollarSign, label: 'Financeiro', href: '/financeiro' },
    { icon: Settings, label: 'Configurações', href: '/configuracoes' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-10">

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="fixed top-4 left-4 z-40">
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white shadow-lg border-gray-200 hover:bg-gray-50">
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
                  {user?.email || mockUserProfile.email}
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

      <div className="pt-16 px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ponto de Venda</h1>
            <p className="text-gray-600">F1 - Menu | Ctrl+F - Buscar | Ctrl+Enter - Adicionar | Esc - Cancelar</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <Card className="shadow-sm border border-blue-200 bg-gradient-to-br from-white via-blue-50 to-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-blue-700 uppercase font-semibold">
                    Localizar um produto/serviço abaixo
                  </CardTitle>
            </CardHeader>
            <CardContent>
                  <div className="flex gap-3">
                    <Input
                      id="search-input"
                      placeholder="Digite o código ou o nome"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-lg h-12"
                    />
                    <Button variant="outline" size="lg" className="px-6">
                      <Barcode className="h-5 w-5" />
                    </Button>
                  </div>

                  {!loading && searchTerm && (
                    <div className="mt-4 border rounded-lg max-h-48 overflow-y-auto bg-white/90">
                      {filteredProducts.length === 0 && (
                        <div className="p-3 text-sm text-gray-500">Nenhum produto encontrado.</div>
                      )}
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex items-center justify-between"
                          onClick={() => selectProduct(product)}
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">Código: {product.code}</p>
                          </div>
                          <p className="font-semibold text-blue-600">R$ {product.price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {loading && <div className="mt-4 text-sm text-gray-500">Carregando produtos...</div>}
            </CardContent>
          </Card>

              <Card className="shadow-sm min-h-[400px] border border-blue-200 bg-gradient-to-br from-white via-blue-50 to-white">
                <CardContent className="p-6">
                  {selectedProduct ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-center">
                        <div className="w-full max-w-sm aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                          <Package className="h-20 w-20 text-gray-400" />
                        </div>
                      </div>

                      <div className="space-y-4">
                <div>
                          <Label className="text-sm font-medium text-gray-600 uppercase">Código</Label>
                          <p className="text-lg font-semibold">{selectedProduct.code}</p>
                </div>

                <div>
                          <Label className="text-sm font-medium text-gray-600 uppercase">Quantidade</Label>
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
                          <Label className="text-sm font-medium text-gray-600 uppercase">Valor Unitário</Label>
                          <Input value={`R$ ${selectedProduct.price.toFixed(2)}`} disabled className="mt-1 bg-gray-50" />
                </div>

                <div>
                          <Label className="text-sm font-medium text-gray-600 uppercase">Desconto (%)</Label>
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
                          <Label className="text-sm font-medium text-gray-600 uppercase">Valor Total</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border text-center">
                            <span className="text-xl font-bold text-blue-600">R$ {calculateItemTotal(selectedProduct).toFixed(2)}</span>
                          </div>
                  </div>
                </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[300px]">
                      <div className="text-center">
                        <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Selecione um produto para visualizar</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t">
                    <Button className="w-full bg-gray-700 hover:bg-gray-800 text-white h-12" disabled={!selectedProduct} onClick={addSelectedToCart}>
                      ADICIONAR PRODUTO/ITEM
                    </Button>
              </div>
            </CardContent>
          </Card>
        </div>

            <div className="xl:col-span-1">
              <Card className="shadow-sm h-full bg-white border border-blue-100">
                <CardContent className="p-0 h-full flex flex-col">
                  <div className="flex-1 p-6">
                    <h3 className="font-semibold text-lg mb-4">Itens do Pedido</h3>

                    {cart.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum item adicionado</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm">{item.name}</h5>
                                <p className="text-xs text-gray-600">Cód: {item.code}</p>
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
                                <p className="text-sm text-gray-600">R$ {item.price.toFixed(2)} un.</p>
                                {item.discount > 0 && <p className="text-xs text-orange-600">-{item.discount}%</p>}
                                <p className="font-semibold text-blue-600">R$ {calculateItemTotal(item).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t p-6 space-y-4">
                    <div className="bg-gray-800 text-white rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-90">TOTAL DO PEDIDO</span>
                        <span className="text-2xl font-bold">R$ {total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Nome do cliente (opcional)"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="bg-white"
                        />
                      </div>

                      <Separator />

                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          className="bg-orange-500 hover:bg-orange-600 text-white text-xs py-2"
                          onClick={() => selectedProduct && addSelectedToCart()}
                          disabled={!selectedProduct}
                        >
                          ADICIONAR
                        </Button>

            <Button
                          className="bg-red-500 hover:bg-red-600 text-white text-xs py-2"
                          onClick={cancelSelection}
                        >
                          CANCELAR
            </Button>
            
            <Button
                          className="bg-green-600 hover:bg-green-700 text-white text-xs py-2"
                          onClick={processPayment}
                          disabled={cart.length === 0}
                        >
                          FINALIZAR VENDA
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="flex items-center justify-center gap-2 text-sm border-blue-200 hover:bg-blue-50">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          Pagamento Rápido
                        </Button>
                        <Button variant="outline" className="flex items-center justify-center gap-2 text-sm border-blue-200 hover:bg-blue-50">
                          <Receipt className="h-4 w-4 text-blue-600" />
                          Pré-Venda
                        </Button>
                      </div>

                      <Button variant="outline" className="w-full border-blue-200 hover:bg-blue-50" onClick={clearCart} disabled={cart.length === 0}>
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
    </div>
  );
}

