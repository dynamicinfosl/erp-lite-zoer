
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Banknote, Smartphone, DollarSign, Clock } from 'lucide-react';

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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Finalizar Venda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo da Venda */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span>Subtotal:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>Desconto:</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
            <span>Total Final:</span>
            <span>{formatCurrency(finalAmount)}</span>
          </div>
        </div>

        {/* Desconto */}
        <div className="space-y-2">
          <Label htmlFor="discount">Desconto (R$)</Label>
          <Input
            id="discount"
            type="number"
            value={discount}
            onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
            min="0"
            max={total}
            step="0.01"
          />
        </div>

        {/* Forma de Pagamento */}
        <div className="space-y-3">
          <Label>Forma de Pagamento</Label>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <div key={method.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={method.value} id={method.value} />
                  <Label
                    htmlFor={method.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <method.icon className="h-4 w-4" />
                    {method.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Tipo de Venda */}
        <div className="space-y-2">
          <Label>Tipo de Venda</Label>
          <Select value={saleType} onValueChange={setSaleType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="balcao">Retirada no Balcão</SelectItem>
              <SelectItem value="entrega">Entrega</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Informações de Entrega */}
        {saleType === 'entrega' && (
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">Informações de Entrega</h3>
            
            <div className="space-y-2">
              <Label htmlFor="customerName">Nome do Cliente *</Label>
              <Input
                id="customerName"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerAddress">Endereço Completo *</Label>
              <Textarea
                id="customerAddress"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                required
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Telefone</Label>
              <Input
                id="customerPhone"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
        )}

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar (F5)
          </Button>
          <Button
            onClick={handleFinalize}
            className="flex-1"
            disabled={saleType === 'entrega' && (!customerInfo.name || !customerInfo.address)}
          >
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
