'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Trash2, 
  Search, 
  X, 
  Package, 
  Wrench, 
  Truck, 
  MapPin, 
  DollarSign, 
  CreditCard,
  FileText,
  Calendar,
  User,
  Building,
  ChevronsUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { DeliveryAddress } from '@/types';

interface Product {
  id: number;
  name: string;
  sale_price: number;
  stock_quantity: number;
  sku?: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

interface SaleItem {
  product_id: number;
  product_name: string;
  details?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
}

interface ServiceItem {
  service_id?: number;
  service_name: string;
  details?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
}

interface PaymentItem {
  due_date: string;
  value: number;
  payment_method: string;
  chart_of_accounts?: string;
  observation?: string;
}

interface NewSaleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function NewSaleForm({ onSuccess, onCancel }: NewSaleFormProps) {
  const { tenant, user } = useSimpleAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchService, setSearchService] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeliveryAddress, setShowDeliveryAddress] = useState(false);
  const [generatePaymentConditions, setGeneratePaymentConditions] = useState(true);
  const [paymentType, setPaymentType] = useState<'vista' | 'parcelado'>('vista');
  const [customerOpen, setCustomerOpen] = useState(false);
  const customerTriggerRef = useRef<HTMLButtonElement>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    sale_number: '',
    customer_id: '',
    customer_name: '',
    seller_name: user?.email?.split('@')[0] || '',
    status: 'pendente',
    sale_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    sales_channel: 'presencial',
    cost_center: '',
    freight_value: 0,
    carrier_name: '',
    discount_amount: 0,
    discount_percentage: 0,
    notes: '',
    internal_notes: '',
  });

  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  const [items, setItems] = useState<SaleItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([{
    due_date: formData.sale_date,
    value: 0,
    payment_method: '',
    chart_of_accounts: 'Vendas de produtos',
    observation: '',
  }]);

  const [currentItem, setCurrentItem] = useState({
    product_id: 0,
    details: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
  });

  const [currentService, setCurrentService] = useState({
    service_name: '',
    details: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
  });

  // Load products and customers
  useEffect(() => {
    if (tenant?.id) {
      loadProducts();
      loadCustomers();
    }
  }, [tenant?.id]);

  const loadProducts = async () => {
    try {
      const response = await fetch(`/next_api/products?tenant_id=${encodeURIComponent(tenant!.id)}`);
      if (response.ok) {
        const data = await response.json();
        const rows = Array.isArray(data?.data) ? data.data : (data?.rows || []);
        setProducts(rows);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(`/next_api/customers?tenant_id=${encodeURIComponent(tenant!.id)}`);
      if (response.ok) {
        const data = await response.json();
        const rows = Array.isArray(data?.data) ? data.data : (data?.rows || []);
        setCustomers(rows);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchProduct.toLowerCase()))
  );

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    (c.document && c.document.includes(searchCustomer))
  );

  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({ ...prev, customer_id: customerId, customer_name: customer.name }));
      setDeliveryAddress({
        cep: customer.zipcode || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        number: '',
        complement: '',
        neighborhood: '',
      });
    }
    setSearchCustomer('');
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentItem({
      product_id: product.id,
      details: '',
      quantity: 1,
      unit_price: product.sale_price,
      discount: 0,
    });
    setSearchProduct('');
  };

  const handleAddItem = () => {
    if (!selectedProduct || currentItem.quantity <= 0) {
      toast.error('Selecione um produto e informe a quantidade');
      return;
    }

    const subtotal = (currentItem.unit_price * currentItem.quantity) - currentItem.discount;
    
    const newItem: SaleItem = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      details: currentItem.details,
      quantity: currentItem.quantity,
      unit_price: currentItem.unit_price,
      discount: currentItem.discount,
      subtotal: subtotal,
    };

    setItems([...items, newItem]);
    setSelectedProduct(null);
    setCurrentItem({
      product_id: 0,
      details: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddService = () => {
    if (!currentService.service_name || currentService.quantity <= 0) {
      toast.error('Informe o nome do serviço e a quantidade');
      return;
    }

    const subtotal = (currentService.unit_price * currentService.quantity) - currentService.discount;
    
    const newService: ServiceItem = {
      service_name: currentService.service_name,
      details: currentService.details,
      quantity: currentService.quantity,
      unit_price: currentService.unit_price,
      discount: currentService.discount,
      subtotal: subtotal,
    };

    setServices([...services, newService]);
    setCurrentService({
      service_name: '',
      details: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
    });
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleAddPayment = () => {
    setPayments([...payments, {
      due_date: formData.sale_date,
      value: 0,
      payment_method: '',
      chart_of_accounts: 'Vendas de produtos',
      observation: '',
    }]);
  };

  const handleRemovePayment = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };

  const handlePaymentChange = (index: number, field: keyof PaymentItem, value: any) => {
    const updated = [...payments];
    updated[index] = { ...updated[index], [field]: value };
    setPayments(updated);
  };

  const totals = useMemo(() => {
    const productsTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const servicesTotal = services.reduce((sum, service) => sum + service.subtotal, 0);
    const freightTotal = formData.freight_value || 0;
    const subtotal = productsTotal + servicesTotal + freightTotal;
    
    // Aplicar descontos
    const discountAmount = formData.discount_amount || 0;
    const discountPercent = formData.discount_percentage || 0;
    const discountFromPercent = (subtotal * discountPercent) / 100;
    const totalDiscount = discountAmount + discountFromPercent;
    
    const total = subtotal - totalDiscount;
    
    return {
      products: productsTotal,
      services: servicesTotal,
      freight: freightTotal,
      subtotal,
      discount_amount: discountAmount,
      discount_percentage: discountPercent,
      total_discount: totalDiscount,
      total: Math.max(0, total),
    };
  }, [items, services, formData.freight_value, formData.discount_amount, formData.discount_percentage]);

  useEffect(() => {
    if (generatePaymentConditions && paymentType === 'vista') {
      const totalValue = totals.total;
      // À vista: um único pagamento com o valor total
      setPayments(prev => {
        if (prev.length === 1 && Math.abs(prev[0].value - totalValue) < 0.01) {
          return prev; // Não atualizar se o valor já está correto
        }
        return [{
          due_date: formData.sale_date,
          value: totalValue,
          payment_method: prev[0]?.payment_method || '',
          chart_of_accounts: 'Vendas de produtos',
          observation: prev[0]?.observation || '',
        }];
      });
    }
  }, [totals.total, paymentType, generatePaymentConditions, formData.sale_date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_name) {
      toast.error('Selecione um cliente');
      return;
    }

    if (items.length === 0 && services.length === 0) {
      toast.error('Adicione pelo menos um produto ou serviço');
      return;
    }

    if (!tenant?.id) {
      toast.error('Tenant não disponível');
      return;
    }

    setLoading(true);

    try {
      const saleData = {
        tenant_id: tenant.id,
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        sale_source: 'produtos',
        customer_name: formData.customer_name,
        seller_name: formData.seller_name,
        carrier_name: formData.carrier_name || null,
        payment_condition: paymentType === 'vista' ? 'dinheiro_vista' : 'parcelado',
        payment_method: payments[0]?.payment_method || 'dinheiro',
        delivery_date: formData.delivery_date || null,
        delivery_address: showDeliveryAddress ? deliveryAddress : null,
        total_amount: totals.total,
        final_amount: totals.total,
        discount_amount: totals.total_discount,
        notes: formData.notes || null,
        internal_notes: formData.internal_notes || null,
        products: items.map(item => ({
          id: item.product_id,
          name: item.product_name,
          price: item.unit_price,
          quantity: item.quantity,
          discount: item.discount,
          subtotal: item.subtotal,
        })),
        services: services.map(service => ({
          name: service.service_name,
          price: service.unit_price,
          quantity: service.quantity,
          discount: service.discount,
          subtotal: service.subtotal,
        })),
        payments: generatePaymentConditions ? payments : [],
      };

      const response = await fetch('/next_api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar venda');
      }

      toast.success('Venda criada com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar venda');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Opções de forma de pagamento
  const paymentMethods = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'pix', label: 'PIX' },
    { value: 'cartao_debito', label: 'Cartão de Débito' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'transferencia', label: 'Transferência Bancária' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Dados Gerais */}
      <Card className="border-2 juga-card shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-600/10 via-blue-500/10 to-blue-600/10 border-b border-blue-200/50 dark:border-blue-800/50">
          <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-300 font-semibold">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Dados Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 bg-juga-surface-elevated/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale_number">Número</Label>
              <div className="flex gap-2">
                <Input
                  id="sale_number"
                  value={formData.sale_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, sale_number: e.target.value }))}
                  placeholder="Auto"
                  readOnly
                  className="bg-muted"
                />
                <Button type="button" variant="outline" size="icon">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer" className="text-blue-700 dark:text-blue-300 font-medium">Cliente *</Label>
              {formData.customer_name ? (
                <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium flex-1 text-blue-900 dark:text-blue-100">{formData.customer_name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, customer_id: '', customer_name: '' }));
                      setSearchCustomer('');
                      setDeliveryAddress({
                        cep: '', address: '', city: '', state: '',
                        number: '', complement: '', neighborhood: '',
                      });
                    }}
                    className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                  >
                    <X className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </Button>
                </div>
              ) : (
                <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      ref={customerTriggerRef}
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerOpen}
                      className="w-full justify-between bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className={searchCustomer ? 'text-foreground' : 'text-muted-foreground'}>
                          {searchCustomer || 'Digite para buscar cliente...'}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="p-0" 
                    align="start" 
                    sideOffset={4}
                    style={{ 
                      width: customerTriggerRef.current ? `${customerTriggerRef.current.offsetWidth}px` : '100%',
                      minWidth: '300px'
                    }}
                  >
                    <Command>
                      <CommandInput 
                        placeholder="Buscar cliente..." 
                        value={searchCustomer}
                        onValueChange={setSearchCustomer}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {filteredCustomers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name}
                              onSelect={() => {
                                handleSelectCustomer(customer.id);
                                setCustomerOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <User className="mr-2 h-4 w-4" />
                              <div className="flex flex-col">
                                <span className="font-medium">{customer.name}</span>
                                {customer.document && (
                                  <span className="text-xs text-muted-foreground">{customer.document}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller">Vendedor / Responsável</Label>
              <Input
                id="seller"
                value={formData.seller_name}
                onChange={(e) => setFormData(prev => ({ ...prev, seller_name: e.target.value }))}
                placeholder="Nome do vendedor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Situação *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="concretizada">Concretizada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_date">Data *</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="sale_date"
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, sale_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_date">Prazo de entrega</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sales_channel">Canal de venda</Label>
              <Select
                value={formData.sales_channel}
                onValueChange={(value) => setFormData(prev => ({ ...prev, sales_channel: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_center">Centro de custo</Label>
              <Input
                id="cost_center"
                placeholder="Digite para buscar"
                value={formData.cost_center}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_center: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Produtos */}
      <Card className="border-2 juga-card shadow-md">
        <CardHeader className="bg-gradient-to-r from-purple-600/10 via-purple-500/10 to-purple-600/10 border-b border-purple-200/50 dark:border-purple-800/50">
          <CardTitle className="flex items-center gap-2 text-lg text-purple-700 dark:text-purple-300 font-semibold">
            <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Produtos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 bg-juga-surface-elevated/30">
          {/* Buscar produto */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite para buscar"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="pl-10"
              />
              {searchProduct && filteredProducts.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleSelectProduct(product)}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        R$ {product.sale_price.toFixed(2)} | Estoque: {product.stock_quantity}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulário do item atual */}
            {selectedProduct && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  <div className="md:col-span-2">
                    <Label>Produto *</Label>
                    <div className="p-2 bg-background rounded-md border">{selectedProduct.name}</div>
                  </div>
                  <div>
                    <Label>Detalhes</Label>
                    <Input
                      value={currentItem.details}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, details: e.target.value }))}
                      placeholder="Detalhes"
                    />
                  </div>
                  <div>
                    <Label>Quant. *</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Valor *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentItem.unit_price}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Desconto</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentItem.discount}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      placeholder="R$"
                    />
                  </div>
                  <div>
                    <Label>Subtotal</Label>
                    <Input
                      value={formatCurrency((currentItem.unit_price * currentItem.quantity) - currentItem.discount)}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="mt-4 w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar produto
                </Button>
              </div>
            )}

            {/* Lista de produtos */}
            {items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto*</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>Quant.*</TableHead>
                      <TableHead>Valor*</TableHead>
                      <TableHead>Desconto</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>{item.details || '-'}</TableCell>
                        <TableCell>{item.quantity.toFixed(2)}</TableCell>
                        <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell>{formatCurrency(item.discount)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(item.subtotal)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Serviços */}
      <Card className="border-2 juga-card shadow-md">
        <CardHeader className="bg-gradient-to-r from-orange-600/10 via-orange-500/10 to-orange-600/10 border-b border-orange-200/50 dark:border-orange-800/50">
          <CardTitle className="flex items-center gap-2 text-lg text-orange-700 dark:text-orange-300 font-semibold">
            <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Serviços
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 bg-juga-surface-elevated/30">
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                <div className="md:col-span-2">
                  <Label>Serviço *</Label>
                  <Input
                    placeholder="Nome do serviço"
                    value={currentService.service_name}
                    onChange={(e) => setCurrentService(prev => ({ ...prev, service_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Detalhes</Label>
                  <Input
                    value={currentService.details}
                    onChange={(e) => setCurrentService(prev => ({ ...prev, details: e.target.value }))}
                    placeholder="Detalhes"
                  />
                </div>
                <div>
                  <Label>Quant. *</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={currentService.quantity}
                    onChange={(e) => setCurrentService(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <Label>Valor *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentService.unit_price}
                    onChange={(e) => setCurrentService(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <Label>Desconto</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentService.discount}
                    onChange={(e) => setCurrentService(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                    placeholder="R$"
                  />
                </div>
                <div>
                  <Label>Subtotal</Label>
                  <Input
                    value={formatCurrency((currentService.unit_price * currentService.quantity) - currentService.discount)}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={handleAddService}
                className="mt-4 w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar serviço
              </Button>
            </div>

            {services.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço*</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>Quant.*</TableHead>
                      <TableHead>Valor*</TableHead>
                      <TableHead>Desconto</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{service.service_name}</TableCell>
                        <TableCell>{service.details || '-'}</TableCell>
                        <TableCell>{service.quantity.toFixed(2)}</TableCell>
                        <TableCell>{formatCurrency(service.unit_price)}</TableCell>
                        <TableCell>{formatCurrency(service.discount)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(service.subtotal)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveService(index)}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Transporte */}
      <Card className="border-2 juga-card shadow-md">
        <CardHeader className="bg-gradient-to-r from-teal-600/10 via-teal-500/10 to-teal-600/10 border-b border-teal-200/50 dark:border-teal-800/50">
          <CardTitle className="flex items-center gap-2 text-lg text-teal-700 dark:text-teal-300 font-semibold">
            <Truck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Transporte
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 bg-juga-surface-elevated/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="freight_value">Valor do frete</Label>
              <Input
                id="freight_value"
                type="number"
                min="0"
                step="0.01"
                value={formData.freight_value}
                onChange={(e) => setFormData(prev => ({ ...prev, freight_value: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrier">Transportadora</Label>
              <Input
                id="carrier"
                placeholder="Digite para buscar"
                value={formData.carrier_name}
                onChange={(e) => setFormData(prev => ({ ...prev, carrier_name: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Endereço de Entrega */}
      <Card className="border-2 juga-card shadow-md">
        <CardHeader className="bg-gradient-to-r from-pink-600/10 via-pink-500/10 to-pink-600/10 border-b border-pink-200/50 dark:border-pink-800/50">
          <CardTitle className="flex items-center gap-2 text-lg text-pink-700 dark:text-pink-300 font-semibold">
            <MapPin className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            Endereço de entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 bg-juga-surface-elevated/30">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="show_delivery"
              checked={showDeliveryAddress}
              onCheckedChange={(checked) => setShowDeliveryAddress(checked as boolean)}
            />
            <Label htmlFor="show_delivery" className="font-normal cursor-pointer">
              Informar endereço de entrega
            </Label>
          </div>

          {showDeliveryAddress && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={deliveryAddress.cep}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, cep: e.target.value }))}
                  placeholder="00000-000"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={deliveryAddress.address}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, Avenida, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={deliveryAddress.number}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={deliveryAddress.complement}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, complement: e.target.value }))}
                  placeholder="Apto, Bloco, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={deliveryAddress.neighborhood}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                  placeholder="Bairro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={deliveryAddress.city}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={deliveryAddress.state}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. Total */}
      <Card className="border-2 juga-card shadow-md">
        <CardHeader className="bg-gradient-to-r from-green-600/10 via-green-500/10 to-green-600/10 border-b border-green-200/50 dark:border-green-800/50">
          <CardTitle className="flex items-center gap-2 text-lg text-green-700 dark:text-green-300 font-semibold">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            Total
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 bg-juga-surface-elevated/30">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Serviços</TableHead>
                  <TableHead>Desconto (R$)</TableHead>
                  <TableHead>Desconto (%)</TableHead>
                  <TableHead>Valor total*</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{formatCurrency(totals.products)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(totals.services)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0,00"
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) || 0 }))}
                      placeholder="0,00"
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell className="font-bold text-lg">{formatCurrency(totals.total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 7. Pagamento */}
      <Card className="border-2 juga-card shadow-md">
        <CardHeader className="bg-gradient-to-r from-cyan-600/10 via-cyan-500/10 to-cyan-600/10 border-b border-cyan-200/50 dark:border-cyan-800/50">
          <CardTitle className="flex items-center gap-2 text-lg text-cyan-700 dark:text-cyan-300 font-semibold">
            <CreditCard className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 bg-juga-surface-elevated/30">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="generate_payment"
                checked={generatePaymentConditions}
                onCheckedChange={(checked) => setGeneratePaymentConditions(checked as boolean)}
              />
              <Label htmlFor="generate_payment" className="font-normal cursor-pointer">
                Gerar condições de pagamento
              </Label>
            </div>

            {generatePaymentConditions && (
              <>
                <RadioGroup 
                  value={paymentType} 
                  onValueChange={(value: 'vista' | 'parcelado') => setPaymentType(value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vista" id="vista" />
                    <Label htmlFor="vista" className="font-normal cursor-pointer">À vista *</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="parcelado" id="parcelado" />
                    <Label htmlFor="parcelado" className="font-normal cursor-pointer">Parcelado *</Label>
                  </div>
                </RadioGroup>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vencimento*</TableHead>
                        <TableHead>Valor*</TableHead>
                        <TableHead>Forma de pagamento*</TableHead>
                        <TableHead>Plano de contas</TableHead>
                        <TableHead>Observação</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              type="date"
                              value={payment.due_date}
                              onChange={(e) => handlePaymentChange(index, 'due_date', e.target.value)}
                              required
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={payment.value}
                              onChange={(e) => handlePaymentChange(index, 'value', parseFloat(e.target.value) || 0)}
                              required
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={payment.payment_method}
                              onValueChange={(value) => handlePaymentChange(index, 'payment_method', value)}
                              required
                            >
                              <SelectTrigger className="w-full bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600">
                                <SelectValue placeholder="Selecione a forma de pagamento" />
                              </SelectTrigger>
                              <SelectContent>
                                {paymentMethods.map((method) => (
                                  <SelectItem key={method.value} value={method.value}>
                                    {method.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Input
                                value={payment.chart_of_accounts || ''}
                                onChange={(e) => handlePaymentChange(index, 'chart_of_accounts', e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePaymentChange(index, 'chart_of_accounts', '')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={payment.observation || ''}
                              onChange={(e) => handlePaymentChange(index, 'observation', e.target.value)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            {payments.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePayment(index)}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddPayment}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar pagamento
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 8. Observações */}
      <Card className="border-2 juga-card shadow-md">
        <CardHeader className="bg-gradient-to-r from-indigo-600/10 via-indigo-500/10 to-indigo-600/10 border-b border-indigo-200/50 dark:border-indigo-800/50">
          <CardTitle className="flex items-center gap-2 text-lg text-indigo-700 dark:text-indigo-300 font-semibold">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Observações
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 bg-juga-surface-elevated/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="notes">Observações</Label>
              </div>
              <p className="text-xs text-muted-foreground">Esta observação será impressa no pedido</p>
              <textarea
                id="notes"
                className="w-full px-3 py-2 border rounded-md min-h-[120px] bg-background text-foreground border-input resize-y"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações que serão impressas no pedido..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="internal_notes">Observações internas</Label>
              </div>
              <p className="text-xs text-muted-foreground">Esta observação é de uso interno, portanto não será impressa no pedido.</p>
              <textarea
                id="internal_notes"
                className="w-full px-3 py-2 border rounded-md min-h-[120px] bg-background text-foreground border-input resize-y"
                value={formData.internal_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
                placeholder="Observações internas..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-6 border-t border-blue-200 dark:border-blue-800">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={loading || (items.length === 0 && services.length === 0)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/50 dark:shadow-blue-900/50 font-semibold px-6"
        >
          {loading ? 'Salvando...' : 'Cadastrar Venda'}
        </Button>
      </div>
    </form>
  );
}
