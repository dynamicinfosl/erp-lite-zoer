'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
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
  ChevronsUpDown,
  Minus,
  Percent,
  Lock,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { useBranch } from '@/contexts/BranchContext';
import { DeliveryAddress } from '@/types';
import { AddCustomerDialog } from '@/components/clientes/AddCustomerDialog';

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
  const { scope, branchId } = useBranch();
  const tenantId = tenant?.id;
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
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const customerTriggerRef = useRef<HTMLButtonElement>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    sale_number: '',
    customer_id: '',
    customer_name: '',
    seller_name: user?.email?.split('@')[0] || '',
    status: 'concretizada',
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

  const loadProducts = useCallback(async () => {
    if (!tenantId) return;
    try {
      const response = await fetch(`/next_api/products?tenant_id=${encodeURIComponent(tenantId)}`);
      if (response.ok) {
        const data = await response.json();
        const rows = Array.isArray(data?.data) ? data.data : (data?.rows || []);
        setProducts(rows);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  }, [tenantId]);

  const loadCustomers = useCallback(async (bypassCache = false) => {
    if (!tenantId) return;
    try {
      const url = `/next_api/customers?tenant_id=${encodeURIComponent(tenantId)}${bypassCache ? `&_nocache=${Date.now()}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const rows = Array.isArray(data?.data) ? data.data : (data?.rows || []);
        setCustomers(rows);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  }, [tenantId]);

  // Load products and customers
  useEffect(() => {
    if (!tenantId) return;
    loadProducts();
    loadCustomers();
  }, [tenantId, loadProducts, loadCustomers]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchProduct.toLowerCase()))
  );

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    (c.document && c.document.includes(searchCustomer))
  );

  const handleSelectCustomer = (customerId: string, customerObj?: any) => {
    const customer = customerObj || customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({ ...prev, customer_id: String(customer.id), customer_name: customer.name }));
      setDeliveryAddress({
        cep: (customer as any).zipcode || '',
        address: (customer as any).address || '',
        city: (customer as any).city || '',
        state: (customer as any).state || '',
        number: '',
        complement: '',
        neighborhood: '',
      });
    }
    setSearchCustomer('');
  };

  const handleCreateCustomerSuccess = async (result: any) => {
    // A API retorna { success: true, data: { ... } }
    const newCustomer = result?.data || result;
    
    if (newCustomer && newCustomer.id) {
      // Adicionar manualmente à lista local para garantir que apareça imediatamente (ignorando cache da API)
      setCustomers(prev => {
        // Evitar duplicidade se loadCustomers carregar rápido demais
        if (prev.some(c => String(c.id) === String(newCustomer.id))) return prev;
        return [newCustomer, ...prev];
      });

      // Selecionar o novo cliente
      handleSelectCustomer(String(newCustomer.id), newCustomer);
    }
    
    // Tenta recarregar a lista completa forçando bypass do cache para pegar o novo registro
    await loadCustomers(true);
    setCustomerOpen(false);
    setShowAddCustomer(false);
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
        branch_id: scope === 'branch' && branchId ? branchId : null,
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
    <form onSubmit={handleSubmit} className="space-y-8 pb-10 px-0.5">
      {/* 1. Dados Gerais */}
      <div className="space-y-5">
        <h3 className="font-semibold text-base text-slate-700 dark:text-slate-200 border-b-2 border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Dados da Venda
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sale_number" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Número</Label>
            <div className="flex gap-2">
              <Input
                id="sale_number"
                value={formData.sale_number}
                onChange={(e) => setFormData(prev => ({ ...prev, sale_number: e.target.value }))}
                placeholder="Auto"
                readOnly
                className="h-10 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 font-mono"
              />
              <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 border-slate-200 text-slate-500">
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="customer" className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Cliente *</Label>
            {formData.customer_name ? (
              <div className="flex items-center gap-2 p-2 h-10 bg-blue-50/50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg group transition-all duration-200">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold flex-1 text-blue-900 dark:text-blue-100 truncate">{formData.customer_name}</span>
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
                  className="h-7 w-7 p-0 hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 rounded-full"
                >
                  <X className="h-4 w-4" />
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
                    className="w-full h-10 justify-between bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-slate-600 dark:text-slate-400 font-normal transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Search className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{searchCustomer || 'Buscar cliente...'}</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="p-0 border-slate-200 dark:border-slate-800 shadow-xl" 
                  align="start" 
                  sideOffset={4}
                  style={{ 
                    width: customerTriggerRef.current ? `${customerTriggerRef.current.offsetWidth}px` : '100%',
                    minWidth: '320px'
                  }}
                >
                  <Command className="bg-white dark:bg-slate-900">
                    <CommandInput 
                      placeholder="Pesquisar por nome ou documento..." 
                      value={searchCustomer}
                      onValueChange={setSearchCustomer}
                      className="border-none focus:ring-0"
                    />
                    <CommandList>
                      <CommandEmpty className="py-6 px-4 flex flex-col items-center gap-3">
                        <span className="text-sm text-slate-500">Nenhum cliente encontrado.</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAddCustomer(true);
                            setCustomerOpen(false);
                          }}
                          className="w-full flex items-center justify-center gap-2 border-dashed border-2 text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span className="font-bold">Cadastrar Novo Cliente</span>
                        </Button>
                      </CommandEmpty>
                      {filteredCustomers.length > 0 && (
                        <div className="p-2 border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowAddCustomer(true);
                              setCustomerOpen(false);
                            }}
                            className="w-full h-10 flex items-center justify-start gap-2 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100/50 dark:hover:bg-blue-900/30 rounded-lg"
                          >
                            <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <UserPlus className="h-4 w-4" />
                            </div>
                            <span>Novo Cliente</span>
                          </Button>
                        </div>
                      )}
                      <CommandGroup>
                        {filteredCustomers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.name}
                            onSelect={() => {
                              handleSelectCustomer(customer.id);
                              setCustomerOpen(false);
                            }}
                            className="cursor-pointer py-3 px-4 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/30 transition-colors"
                          >
                            <User className="mr-3 h-4 w-4 text-slate-400" />
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{customer.name}</span>
                              {customer.document && (
                                <span className="text-xs text-slate-500 font-mono tracking-tighter mt-0.5">{customer.document}</span>
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

          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Situação *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
                <SelectValue placeholder="Selecione a situação" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <SelectItem value="pendente" className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">Pendente</SelectItem>
                <SelectItem value="concretizada" className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">Concretizada</SelectItem>
                <SelectItem value="cancelada" className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sale_date" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data da Venda *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="sale_date"
                type="date"
                value={formData.sale_date}
                onChange={(e) => setFormData(prev => ({ ...prev, sale_date: e.target.value }))}
                required
                className="h-10 pl-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="delivery_date" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prazo de Entrega</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                className="h-10 pl-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seller" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vendedor</Label>
            <Input
              id="seller"
              value={formData.seller_name}
              onChange={(e) => setFormData(prev => ({ ...prev, seller_name: e.target.value }))}
              placeholder="Nome do vendedor"
              className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sales_channel" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Canal</Label>
            <Select
              value={formData.sales_channel}
              onValueChange={(value) => setFormData(prev => ({ ...prev, sales_channel: value }))}
            >
              <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
                <SelectValue placeholder="Selecione o canal" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <SelectItem value="presencial" className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">Presencial</SelectItem>
                <SelectItem value="online" className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">Online</SelectItem>
                <SelectItem value="telefone" className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">Telefone</SelectItem>
                <SelectItem value="whatsapp" className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 2. Produtos */}
      <div className="space-y-5">
        <h3 className="font-semibold text-base text-slate-700 dark:text-slate-200 border-b-2 border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
          <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          Produtos e Itens
        </h3>
        <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 p-5 space-y-6">
          <div className="relative">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Buscar Produto</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Pesquisar por nome ou SKU..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="pl-10 h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
              />
            </div>
            {searchProduct && filteredProducts.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl max-h-64 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex justify-between items-center transition-colors border-b last:border-0 border-slate-100 dark:border-slate-800"
                    onClick={() => handleSelectProduct(product)}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{product.name}</span>
                      <span className="text-xs text-slate-500">{product.sku || 'Sem SKU'}</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{formatCurrency(product.sale_price)}</span>
                      <span className="text-[10px] uppercase text-slate-400">Estoque: {product.stock_quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div className="bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-lg p-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Inserindo Produto</span>
                    <span className="text-xs text-indigo-700/70 dark:text-indigo-400/70">{selectedProduct.name}</span>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedProduct(null)}
                  className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-4">
                <div className="sm:col-span-2 md:col-span-2 lg:col-span-1 space-y-1.5">
                  <Label className="text-[10px] font-bold text-indigo-700/70 uppercase">Quant.*</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="h-10 border-indigo-200 bg-white ring-indigo-500"
                    required
                  />
                </div>
                <div className="sm:col-span-1 md:col-span-1 lg:col-span-1 space-y-1.5">
                  <Label className="text-[10px] font-bold text-indigo-700/70 uppercase">Valor Un.*</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentItem.unit_price}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                    className="h-10 border-indigo-200 bg-white ring-indigo-500"
                    required
                  />
                </div>
                <div className="sm:col-span-1 md:col-span-1 lg:col-span-1 space-y-1.5">
                  <Label className="text-[10px] font-bold text-indigo-700/70 uppercase">Desconto</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentItem.discount}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                    className="h-10 border-indigo-200 bg-white ring-indigo-500"
                    placeholder="R$"
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-3 lg:col-span-2 space-y-1.5">
                  <Label className="text-[10px] font-bold text-indigo-700/70 uppercase">Subtotal</Label>
                  <div className="h-10 bg-indigo-100/50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center px-4 rounded-md font-bold text-indigo-900 dark:text-indigo-100">
                    {formatCurrency((currentItem.unit_price * currentItem.quantity) - currentItem.discount)}
                  </div>
                </div>
                <div className="sm:col-span-2 md:col-span-7 lg:col-span-1 space-y-1.5 flex flex-col justify-end">
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 font-bold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {items.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-slate-500 font-bold text-[10px] uppercase">Produto</TableHead>
                    <TableHead className="text-slate-500 font-bold text-[10px] uppercase text-center w-24">Quant.</TableHead>
                    <TableHead className="text-slate-500 font-bold text-[10px] uppercase text-right">Unitário</TableHead>
                    <TableHead className="text-slate-500 font-bold text-[10px] uppercase text-right">Desc.</TableHead>
                    <TableHead className="text-slate-500 font-bold text-[10px] uppercase text-right">Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index} className="group transition-colors border-slate-100 dark:border-slate-800/50">
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{item.product_name}</span>
                          {item.details && <span className="text-xs text-slate-400 mt-0.5">{item.details}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <Badge variant="outline" className="font-mono bg-white text-slate-700 border-slate-200">{item.quantity.toFixed(2)}</Badge>
                      </TableCell>
                      <TableCell className="text-right py-4 text-slate-600 dark:text-slate-400 font-mono">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right py-4 text-rose-500/80 font-mono">{item.discount > 0 ? `-${formatCurrency(item.discount)}` : '-'}</TableCell>
                      <TableCell className="text-right py-4 font-bold text-slate-800 dark:text-slate-100 font-mono">{formatCurrency(item.subtotal)}</TableCell>
                      <TableCell className="py-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* 3. Serviços */}
      <div className="space-y-5">
        <h3 className="font-semibold text-base text-slate-700 dark:text-slate-200 border-b-2 border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          Serviços
        </h3>
        <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 p-5 space-y-6">
          <div className="bg-orange-50/30 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-lg p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold text-orange-700 uppercase">Serviço *</Label>
                <Input
                  placeholder="Nome do serviço"
                  value={currentService.service_name}
                  onChange={(e) => setCurrentService(prev => ({ ...prev, service_name: e.target.value }))}
                  className="h-10 border-orange-200 bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-orange-700 uppercase">Quant.*</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={currentService.quantity}
                  onChange={(e) => setCurrentService(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  className="h-10 border-orange-200 bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-orange-700 uppercase">Valor Un.*</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentService.unit_price}
                  onChange={(e) => setCurrentService(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                  className="h-10 border-orange-200 bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-orange-700 uppercase">Desc. (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentService.discount}
                  onChange={(e) => setCurrentService(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                  className="h-10 border-orange-200 bg-white"
                />
              </div>
              <div className="flex flex-col justify-end">
                <Button
                  type="button"
                  onClick={handleAddService}
                  className="h-10 bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-200 font-bold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>
          </div>

          {services.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow>
                    <TableHead className="text-slate-500 font-bold text-[10px] uppercase">Serviço</TableHead>
                    <TableHead className="text-slate-500 font-bold text-[10px] uppercase text-center w-24">Quant.</TableHead>
                    <TableHead className="text-slate-500 font-bold text-[10px] uppercase text-right">Unitário</TableHead>
                    <TableHead className="text-slate-500 font-bold text-[10px] uppercase text-right">Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service, index) => (
                    <TableRow key={index} className="group border-slate-100 dark:border-slate-800/50">
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{service.service_name}</span>
                          {service.details && <span className="text-xs text-slate-400 mt-0.5">{service.details}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <Badge variant="outline" className="font-mono bg-white text-slate-700 border-slate-200">{service.quantity.toFixed(2)}</Badge>
                      </TableCell>
                      <TableCell className="text-right py-4 text-slate-600 dark:text-slate-400 font-mono">{formatCurrency(service.unit_price)}</TableCell>
                      <TableCell className="text-right py-4 font-bold text-slate-800 dark:text-slate-100 font-mono">{formatCurrency(service.subtotal)}</TableCell>
                      <TableCell className="py-4 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveService(index)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* 4. Logística e Entrega */}
      <div className="space-y-6">
        <h3 className="font-semibold text-base text-slate-700 dark:text-slate-200 border-b-2 border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
          <Truck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          Logística e Entrega
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transporte */}
          <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="freight_value" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor do Frete</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="freight_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.freight_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, freight_value: parseFloat(e.target.value) || 0 }))}
                    className="pl-9 h-10 border-slate-200 bg-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="carrier" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transportadora</Label>
                <Input
                  id="carrier"
                  placeholder="Nome da empresa"
                  value={formData.carrier_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, carrier_name: e.target.value }))}
                  className="h-10 border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Endereço Toggle */}
          <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 p-5 flex items-center">
            <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 w-full shadow-sm">
              <Checkbox
                id="show_delivery"
                checked={showDeliveryAddress}
                onCheckedChange={(checked) => setShowDeliveryAddress(checked as boolean)}
                className="h-5 w-5 border-2 border-teal-500"
              />
              <Label htmlFor="show_delivery" className="font-semibold text-slate-700 dark:text-slate-200 cursor-pointer flex-1">
                Utilizar endereço de entrega diferente do cadastro?
              </Label>
            </div>
          </div>
        </div>

        {showDeliveryAddress && (
          <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              <div className="md:col-span-1 space-y-1.5">
                <Label htmlFor="cep" className="text-[10px] font-bold text-slate-500 uppercase">CEP</Label>
                <Input
                  id="cep"
                  value={deliveryAddress.cep}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, cep: e.target.value.replace(/\D/g, '') }))}
                  placeholder="00000000"
                  className="h-10 border-slate-200 bg-white"
                />
              </div>
              <div className="md:col-span-3 space-y-1.5">
                <Label htmlFor="address" className="text-[10px] font-bold text-slate-500 uppercase">Logradouro</Label>
                <Input
                  id="address"
                  value={deliveryAddress.address}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, Avenida, etc."
                  className="h-10 border-slate-200 bg-white"
                />
              </div>
              <div className="md:col-span-1 space-y-1.5">
                <Label htmlFor="number" className="text-[10px] font-bold text-slate-500 uppercase">Número</Label>
                <Input
                  id="number"
                  value={deliveryAddress.number}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="123"
                  className="h-10 border-slate-200 bg-white"
                />
              </div>
              <div className="md:col-span-1 space-y-1.5">
                <Label htmlFor="state" className="text-[10px] font-bold text-slate-500 uppercase">UF</Label>
                <Input
                  id="state"
                  value={deliveryAddress.state}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                  placeholder="SP"
                  maxLength={2}
                  className="h-10 border-slate-200 bg-white text-center font-bold"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="complement" className="text-[10px] font-bold text-slate-500 uppercase">Complemento</Label>
                <Input
                  id="complement"
                  value={deliveryAddress.complement}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, complement: e.target.value }))}
                  placeholder="Ex: Sala 2"
                  className="h-10 border-slate-200 bg-white"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="neighborhood" className="text-[10px] font-bold text-slate-500 uppercase">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={deliveryAddress.neighborhood}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                  className="h-10 border-slate-200 bg-white"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="city" className="text-[10px] font-bold text-slate-500 uppercase">Cidade</Label>
                <Input
                  id="city"
                  value={deliveryAddress.city}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                  className="h-10 border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Resumo e Totais */}
      <div className="space-y-5">
        <h3 className="font-semibold text-base text-slate-700 dark:text-slate-200 border-b-2 border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          Resumo Financeiro
        </h3>
        <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="space-y-1.5 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Produtos</span>
              <span className="text-xl font-bold text-slate-700 dark:text-slate-200 font-mono">{formatCurrency(totals.products)}</span>
            </div>
            <div className="space-y-1.5 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Serviços</span>
              <span className="text-xl font-bold text-slate-700 dark:text-slate-200 font-mono">{formatCurrency(totals.services)}</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount_amount" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Desconto (R$)</Label>
              <div className="relative">
                <Minus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400" />
                <Input
                  id="discount_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                  className="pl-9 h-11 border-slate-200 bg-white font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount_percentage" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Desconto (%)</Label>
              <div className="relative">
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) || 0 }))}
                  className="h-11 border-slate-200 bg-white font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5 bg-green-600 dark:bg-green-700 p-4 rounded-lg shadow-lg shadow-green-100 dark:shadow-none flex flex-col justify-center border-2 border-green-500">
              <span className="text-[10px] font-black text-green-100 uppercase tracking-widest">Total Líquido</span>
              <span className="text-2xl font-black text-white font-mono leading-none mt-1">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Pagamento */}
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="font-semibold text-base text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            Condições de Pagamento
          </h3>
          <div className="flex items-center space-x-2 bg-cyan-50 dark:bg-cyan-900/30 px-3 py-1.5 rounded-full border border-cyan-100 dark:border-cyan-800">
            <Checkbox
              id="generate_payment"
              checked={generatePaymentConditions}
              onCheckedChange={(checked) => setGeneratePaymentConditions(checked as boolean)}
              className="h-4 w-4 border-2 border-cyan-500"
            />
            <Label htmlFor="generate_payment" className="text-xs font-bold text-cyan-700 dark:text-cyan-300 cursor-pointer">
              Gerar parcelas?
            </Label>
          </div>
        </div>

        {generatePaymentConditions && (
          <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 p-5 space-y-6 animate-in fade-in duration-300">
            <RadioGroup 
              value={paymentType} 
              onValueChange={(value: 'vista' | 'parcelado') => setPaymentType(value)}
              className="flex gap-8 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 w-fit shadow-sm"
            >
              <div className="flex items-center space-x-2 cursor-pointer">
                <RadioGroupItem value="vista" id="vista" className="text-cyan-600" />
                <Label htmlFor="vista" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">À vista</Label>
              </div>
              <div className="flex items-center space-x-2 cursor-pointer">
                <RadioGroupItem value="parcelado" id="parcelado" className="text-cyan-600" />
                <Label htmlFor="parcelado" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Parcelado</Label>
              </div>
            </RadioGroup>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase w-40">Vencimento*</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase w-32">Valor*</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase min-w-[200px]">Meio de Pagamento*</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">Obs. (Interna)</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment, index) => (
                    <TableRow key={index} className="border-slate-100 dark:border-slate-800/50">
                      <TableCell>
                        <Input
                          type="date"
                          value={payment.due_date}
                          onChange={(e) => handlePaymentChange(index, 'due_date', e.target.value)}
                          className="h-9 border-slate-200"
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={payment.value}
                          onChange={(e) => handlePaymentChange(index, 'value', parseFloat(e.target.value) || 0)}
                          className="h-9 border-slate-200 font-mono"
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={payment.payment_method}
                          onValueChange={(value) => handlePaymentChange(index, 'payment_method', value)}
                          required
                        >
                          <SelectTrigger className="h-9 border-slate-200">
                            <SelectValue placeholder="Selecione..." />
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
                        <Input
                          value={payment.observation || ''}
                          onChange={(e) => handlePaymentChange(index, 'observation', e.target.value)}
                          className="h-9 border-slate-200 text-xs"
                          placeholder="Opcional"
                        />
                      </TableCell>
                      <TableCell>
                        {payments.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemovePayment(index)}
                            className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPayment}
                  className="w-full h-9 border-dashed border-2 hover:border-cyan-500 hover:text-cyan-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Parcela
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. Observações */}
      <div className="space-y-5">
        <h3 className="font-semibold text-base text-slate-700 dark:text-slate-200 border-b-2 border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-400" />
          Observações e Notas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 p-6">
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              <FileText className="h-3 w-3" />
              Observações (Impressas no Pedido)
            </Label>
            <textarea
              id="notes"
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-lg min-h-[100px] bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none shadow-sm"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Digite aqui as informações que devem aparecer no documento impresso..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internal_notes" className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              <Lock className="h-3 w-3" />
              Observações Internas (Privadas)
            </Label>
            <textarea
              id="internal_notes"
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-lg min-h-[100px] bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none shadow-sm"
              value={formData.internal_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
              placeholder="Estas notas não serão visíveis para o cliente..."
            />
          </div>
        </div>
      </div>

      {/* Ações Finais */}
      <div className="flex items-center justify-between pt-8 border-t-2 border-slate-100 dark:border-slate-800">
        <div className="hidden md:flex flex-col">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">Confirme os dados antes de</span>
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Finalizar o Registro da Venda</span>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            className="flex-1 md:flex-none h-12 px-8 font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={loading || (items.length === 0 && services.length === 0)}
            className="flex-1 md:flex-none h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 dark:shadow-none font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Salvando...</span>
              </div>
            ) : (
              <span>Cadastrar Venda</span>
            )}
          </Button>
        </div>
      </div>
      {/* Modal Adicionar Cliente */}
      <AddCustomerDialog 
        open={showAddCustomer}
        onOpenChange={setShowAddCustomer}
        onSuccess={handleCreateCustomerSuccess}
      />
    </form>
  );
}
