import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { 
  Menu,
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search,
  Barcode,
  Calculator,
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
  Settings
} from 'lucide-react';

// Mock data para produtos
const mockProducts = [
  { id: 1, name: 'Camiseta Básica', price: 29.90, code: '001', category: 'Roupas' },
  { id: 2, name: 'Calça Jeans', price: 89.90, code: '002', category: 'Roupas' },
  { id: 3, name: 'Tênis Esportivo', price: 149.90, code: '003', category: 'Calçados' },
  { id: 4, name: 'Boné', price: 39.90, code: '004', category: 'Acessórios' },
  { id: 5, name: 'Mochila', price: 79.90, code: '005', category: 'Acessórios' },
  { id: 6, name: 'Smartphone', price: 899.90, code: '006', category: 'Eletrônicos' },
  { id: 7, name: 'Fone Bluetooth', price: 199.90, code: '007', category: 'Eletrônicos' },
  { id: 8, name: 'Notebook', price: 2499.90, code: '008', category: 'Eletrônicos' },
];

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  code: string;
  discount: number;
}

interface SelectedProduct {
  id: number;
  name: string;
  price: number;
  code: string;
  quantity: number;
  discount: number;
}

export function PDVPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Keyboard shortcuts
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
            if (selectedProduct) {
              addSelectedToCart();
            }
            break;
          case 'Escape':
            e.preventDefault();
            clearSelection();
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
  }, [selectedProduct]);

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.includes(searchTerm)
  );

  const selectProduct = (product: any) => {
    setSelectedProduct({
      ...product,
      quantity: 1,
      discount: 0
    });
  };

  const addSelectedToCart = () => {
    if (!selectedProduct) return;
    
    const existingItem = cart.find(item => item.id === selectedProduct.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === selectedProduct.id
          ? { 
              ...item, 
              quantity: item.quantity + selectedProduct.quantity,
              discount: selectedProduct.discount
            }
          : item
      ));
    } else {
      setCart([...cart, { ...selectedProduct }]);
    }
    
    clearSelection();
  };

  const clearSelection = () => {
    setSelectedProduct(null);
    setSearchTerm('');
  };

  const cancelSelection = () => {
    clearSelection();
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const calculateItemTotal = (item: CartItem | SelectedProduct) => {
    const subtotal = item.price * item.quantity;
    return subtotal - (subtotal * item.discount / 100);
  };

  const total = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  const clearCart = () => {
    setCart([]);
    setSelectedProduct(null);
    setCustomerName('');
  };

  const processPayment = () => {
    if (cart.length === 0) return;
    
    // Aqui seria a integração com o sistema de pagamento
    alert(`Venda finalizada!\nTotal: R$ ${total.toFixed(2)}\nCliente: ${customerName || 'Cliente Avulso'}`);
    clearCart();
  };

  // Sidebar menu items
  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Clientes', href: '/clientes' },
    { icon: Package, label: 'Produtos', href: '/produtos' },
    { icon: Archive, label: 'Estoque', href: '/estoque' },
    { icon: DollarSign, label: 'Financeiro', href: '/financeiro' },
    { icon: Settings, label: 'Configurações', href: '/configuracoes' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar Menu */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        {/* Fixed Menu Button */}
        <div className="fixed top-4 left-4 z-40">
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-white shadow-lg border-gray-200 hover:bg-gray-50"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
        </div>

        <SheetContent side="left" className="w-64 p-0 juga-sidebar-gradient">
          {/* Logo Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-lg">J</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">JUGA</h1>
                <p className="text-white/70 text-xs">ERP SaaS</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
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

          {/* Bottom Section */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10">
              <div className="text-white/90 text-xs mb-1">
                Usuário: Admin
              </div>
              <Button size="sm" variant="ghost" className="w-full text-white hover:bg-white/10">
                Sair
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="pt-16 px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ponto de Venda</h1>
            <p className="text-gray-600">F1 - Menu | Ctrl+F - Buscar | Ctrl+Enter - Adicionar | Esc - Cancelar</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Side - Product Search & Selected Product */}
            <div className="xl:col-span-2 space-y-6">
              {/* Search Section */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-green-700 uppercase font-semibold">
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
                  
                  {/* Search Results */}
                  {searchTerm && (
                    <div className="mt-4 border rounded-lg max-h-48 overflow-y-auto">
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
                </CardContent>
              </Card>

              {/* Selected Product Display */}
              <Card className="shadow-sm min-h-[400px]">
                <CardContent className="p-6">
                  {selectedProduct ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Product Image Placeholder */}
                      <div className="flex items-center justify-center">
                        <div className="w-full max-w-sm aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                          <Package className="h-20 w-20 text-gray-400" />
                        </div>
                      </div>

                      {/* Product Details */}
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
                            onChange={(e) => setSelectedProduct({
                              ...selectedProduct,
                              quantity: Math.max(1, parseInt(e.target.value) || 1)
                            })}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600 uppercase">Valor Unitário</Label>
                          <Input
                            value={`R$ ${selectedProduct.price.toFixed(2)}`}
                            disabled
                            className="mt-1 bg-gray-50"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600 uppercase">Desconto (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={selectedProduct.discount}
                            onChange={(e) => setSelectedProduct({
                              ...selectedProduct,
                              discount: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0))
                            })}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600 uppercase">Valor Total</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border text-center">
                            <span className="text-xl font-bold text-blue-600">
                              R$ {calculateItemTotal(selectedProduct).toFixed(2)}
                            </span>
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

                  {/* Bottom Action Button */}
                  <div className="mt-6 pt-6 border-t">
                    <Button 
                      className="w-full bg-gray-700 hover:bg-gray-800 text-white h-12"
                      disabled={!selectedProduct}
                      onClick={addSelectedToCart}
                    >
                      ADICIONAR PRODUTO/ITEM
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Cart Summary */}
            <div className="xl:col-span-1">
              <Card className="shadow-sm h-full">
                <CardContent className="p-0 h-full flex flex-col">
                  {/* Cart Items */}
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">R$ {item.price.toFixed(2)} un.</p>
                                {item.discount > 0 && (
                                  <p className="text-xs text-orange-600">-{item.discount}%</p>
                                )}
                                <p className="font-semibold text-blue-600">
                                  R$ {calculateItemTotal(item).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total and Actions */}
                  <div className="border-t p-6 space-y-4">
                    <div className="bg-gray-800 text-white rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-90">TOTAL DO PEDIDO</span>
                        <span className="text-2xl font-bold">R$ {total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
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