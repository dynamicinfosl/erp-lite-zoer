'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Banknote, Smartphone, DollarSign, Clock, CheckCircle2, User, MapPin, Phone, Percent, Receipt } from 'lucide-react';

interface PaymentFormProps {
  total: number;
  onFinalizeSale: (saleData: {
    paymentMethod: string;
    saleType: string;
    discount: number;
    customerInfo?: {
      name: string;
      address: string;
      phone: string;
    };
    notes?: string;
  }) => void;
  onCancel: () => void;
}

export function PaymentForm({ total, onFinalizeSale, onCancel }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [saleType, setSaleType] = useState('balcao');
  const [discount, setDiscount] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    address: '',
    phone: '',
  });
  const [notes, setNotes] = useState('');

  const finalAmount = total - discount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleFinalize = () => {
    const saleData = {
      paymentMethod,
      saleType,
      discount,
      customerInfo: saleType === 'entrega' ? customerInfo : undefined,
      notes: notes || undefined,
    };
    
    onFinalizeSale(saleData);
  };

  const paymentMethods = [
    { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
    { value: 'pix', label: 'PIX', icon: Smartphone },
    { value: 'cartao_debito', label: 'Cartão Débito', icon: CreditCard },
    { value: 'cartao_credito', label: 'Cartão Crédito', icon: CreditCard },
    { value: 'fiado', label: 'Fiado', icon: Clock },
  ];

  return (
    <Card className="w-full max-w-3xl mx-auto juga-card">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Receipt className="h-6 w-6" />
            Finalizar Venda
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {saleType === 'balcao' ? 'Balcão' : 'Entrega'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* Resumo da Venda */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-800">
          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-semibold">{formatCurrency(total)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400">
                <span className="flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Desconto:
                </span>
                <span className="font-semibold">-{formatCurrency(discount)}</span>
              </div>
            )}
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">TOTAL:</span>
            <span className="text-3xl font-extrabold text-primary">{formatCurrency(finalAmount)}</span>
          </div>
        </div>

        {/* Desconto */}
        <div className="space-y-2">
          <Label htmlFor="discount" className="text-base font-semibold flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Desconto (R$)
          </Label>
          <Input
            id="discount"
            type="number"
            value={discount}
            onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
            min="0"
            max={total}
            step="0.01"
            placeholder="0,00"
            className="h-12 text-lg"
          />
        </div>

        {/* Forma de Pagamento */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Forma de Pagamento</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.value;
              return (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-md scale-105'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  }`}
                >
                  <Icon className={`h-8 w-8 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-semibold text-sm ${isSelected ? 'text-primary' : ''}`}>
                    {method.label}
                  </span>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tipo de Venda */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Tipo de Venda</Label>
          <Select value={saleType} onValueChange={setSaleType}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="balcao">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Retirada no Balcão
                </div>
              </SelectItem>
              <SelectItem value="entrega">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Entrega
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Informações de Entrega */}
        {saleType === 'entrega' && (
          <div className="space-y-4 p-5 border-2 border-orange-200 dark:border-orange-800 rounded-xl bg-orange-50/50 dark:bg-orange-950/20">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Informações de Entrega
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="customerName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome do Cliente *
              </Label>
              <Input
                id="customerName"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Nome completo"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerAddress" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço Completo *
              </Label>
              <Textarea
                id="customerAddress"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                required
                rows={3}
                placeholder="Rua, número, bairro, cidade, CEP"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input
                id="customerPhone"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(00) 00000-0000"
                className="h-11"
              />
            </div>
          </div>
        )}

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-base font-semibold">Observações</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Observações adicionais sobre a venda"
          />
        </div>

        <Separator />

        {/* Botões */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={onCancel}
            size="lg"
            className="h-14"
          >
            Cancelar (F5)
          </Button>
          <Button
            onClick={handleFinalize}
            size="lg"
            className="h-14 juga-gradient text-white font-bold"
            disabled={saleType === 'entrega' && (!customerInfo.name || !customerInfo.address)}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Finalizar Venda (F4)
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          F4 = Finalizar Venda • F5 = Cancelar
        </div>
      </CardContent>
    </Card>
  );
}
