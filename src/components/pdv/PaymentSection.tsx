'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  CreditCard, 
  Smartphone, 
  Clock,
  DollarSign,
  CheckCircle2,
  X,
  Calculator,
  Banknote,
  Minus,
  Plus,
  Trash2,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentSectionProps {
  total: number;
  onFinalize: (paymentData: PaymentData) => void;
  onCancel: () => void;
  customerName?: string;
  cartItems?: Array<{
    id: string;
    name: string;
    code: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
}

interface PaymentData {
  paymentMethod: string;
  amountPaid: number;
  change: number;
  remaining: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  discountAmount?: number;
  discountPercentage?: number;
  notes?: string;
}

interface PaymentEntry {
  id: string;
  method: string;
  amount: number;
}

const paymentMethods = [
  { value: 'dinheiro', label: 'Dinheiro à Vista', icon: Banknote, color: 'bg-green-500' },
  { value: 'pix', label: 'PIX', icon: Smartphone, color: 'bg-blue-500' },
  { value: 'cartao_debito', label: 'Cartão Débito', icon: CreditCard, color: 'bg-purple-500' },
  { value: 'cartao_credito', label: 'Cartão Crédito', icon: CreditCard, color: 'bg-indigo-500' },
  { value: 'fiado', label: 'Fiado', icon: Clock, color: 'bg-orange-500' },
];

export function PaymentSection({ total, onFinalize, onCancel, customerName, cartItems = [] }: PaymentSectionProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('dinheiro');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [notes, setNotes] = useState('');

  // Calcular valores
  const discountValue = parseFloat(discountAmount) || 0;
  const discountPerc = parseFloat(discountPercentage) || 0;
  const calculatedDiscount = Math.max(discountValue, (total * discountPerc) / 100);
  const subtotal = total;
  const finalTotal = subtotal - calculatedDiscount;
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = Math.max(0, finalTotal - totalPaid);
  const change = Math.max(0, totalPaid - finalTotal);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const addPayment = useCallback(() => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    const payment: PaymentEntry = {
      id: Date.now().toString(),
      method: selectedPaymentMethod,
      amount: amount
    };

    setPayments(prev => [...prev, payment]);
    setPaymentAmount('');
    toast.success(`Pagamento de ${formatCurrency(amount)} adicionado`);
  }, [paymentAmount, selectedPaymentMethod]);

  const removePayment = useCallback((id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    toast.success('Pagamento removido');
  }, []);

  const applyDiscount = useCallback((type: 'amount' | 'percentage') => {
    if (type === 'amount') {
      setDiscountPercentage('');
    } else {
      setDiscountAmount('');
    }
  }, []);

  const finalizePayment = useCallback(() => {
    if (payments.length === 0) {
      toast.error('Adicione pelo menos um pagamento');
      return;
    }

    const paymentData: PaymentData = {
      paymentMethod: payments[0].method, // Usar o primeiro método como principal
      amountPaid: totalPaid,
      change: change,
      remaining: remaining,
      paymentStatus: remaining > 0 ? 'partial' : 'paid',
      discountAmount: calculatedDiscount,
      discountPercentage: discountPerc > 0 ? discountPerc : undefined,
      notes: notes || undefined,
    };

    onFinalize(paymentData);
  }, [payments, totalPaid, change, remaining, calculatedDiscount, discountPerc, notes, onFinalize]);

  const getPaymentMethodInfo = (method: string) => {
    return paymentMethods.find(m => m.value === method) || paymentMethods[0];
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        // Ciclar entre métodos de pagamento
        const currentIndex = paymentMethods.findIndex(m => m.value === selectedPaymentMethod);
        const nextIndex = (currentIndex + 1) % paymentMethods.length;
        setSelectedPaymentMethod(paymentMethods[nextIndex].value);
      } else if (e.key === 'F3') {
        addPayment();
      } else if (e.key === 'F6') {
        finalizePayment();
      } else if (e.key === 'F8') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [addPayment, finalizePayment, onCancel, selectedPaymentMethod]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="flex items-center gap-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao PDV
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Finalizar Venda
              </h1>
              <p className="text-gray-600">{customerName || 'Cliente Avulso'}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total da Venda</div>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(finalTotal)}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-6xl mx-auto">
          
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            
            {/* FORMA DE PAGAMENTO */}
            <Card className="bg-white shadow-lg border-0 rounded-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl p-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  FORMA DE PAGAMENTO
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Método de Pagamento</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {paymentMethods.slice(0, 3).map((method) => {
                        const Icon = method.icon;
                        const isSelected = selectedPaymentMethod === method.value;
                        return (
                          <Button
                            key={method.value}
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => setSelectedPaymentMethod(method.value)}
                            className={`h-16 flex flex-col items-center justify-center gap-1.5 ${
                              isSelected 
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className={`p-2 rounded-full ${method.color} text-white flex-shrink-0`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-medium leading-tight text-center">{method.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {paymentMethods.slice(3, 5).map((method) => {
                        const Icon = method.icon;
                        const isSelected = selectedPaymentMethod === method.value;
                        return (
                          <Button
                            key={method.value}
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => setSelectedPaymentMethod(method.value)}
                            className={`h-16 flex flex-col items-center justify-center gap-1.5 ${
                              isSelected 
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className={`p-2 rounded-full ${method.color} text-white flex-shrink-0`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-medium leading-tight text-center">{method.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">TOTAL A PAGAR</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="text-lg font-semibold h-10"
                        onKeyPress={(e) => e.key === 'Enter' && addPayment()}
                      />
                      <Button
                        onClick={addPayment}
                        className="h-10 px-4 bg-green-600 hover:bg-green-700 text-white font-bold text-sm"
                      >
                        CONFIRMAR
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ITENS DA COMPRA */}
            <Card className="bg-white shadow-lg border-0 rounded-xl">
              <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-xl p-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  ITENS DA COMPRA
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-semibold text-gray-700 text-sm">Qtd.</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700 text-sm">Nome</th>
                        <th className="text-right py-2 px-2 font-semibold text-gray-700 text-sm">Valor</th>
                        <th className="text-right py-2 px-2 font-semibold text-gray-700 text-sm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-2 px-2 font-medium text-sm">{item.quantity.toFixed(2)}</td>
                          <td className="py-2 px-2">
                            <div>
                              <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                              <div className="text-xs text-gray-500">Cód: {item.code}</div>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-right font-medium text-sm">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-blue-600 text-sm">
                            {formatCurrency(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            
            {/* % DESCONTOS */}
            <Card className="bg-white shadow-lg border-0 rounded-xl">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-xl p-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Minus className="h-5 w-5" />
                  % DESCONTOS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">R$</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={discountAmount}
                      onChange={(e) => {
                        setDiscountAmount(e.target.value);
                        applyDiscount('amount');
                      }}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">%</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0,00"
                      value={discountPercentage}
                      onChange={(e) => {
                        setDiscountPercentage(e.target.value);
                        applyDiscount('percentage');
                      }}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* $ PAGAMENTOS */}
            <Card className="bg-white shadow-lg border-0 rounded-xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl p-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  $ PAGAMENTOS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {payments.map((payment) => {
                    const methodInfo = getPaymentMethodInfo(payment.method);
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-full ${methodInfo.color} text-white`}>
                            <methodInfo.icon className="h-3 w-3" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{methodInfo.label}</div>
                            <div className="text-xs text-gray-500">1x</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{formatCurrency(payment.amount)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePayment(payment.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {payments.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Calculator className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Nenhum pagamento adicionado</p>
                      <p className="text-xs">Use o formulário ao lado para adicionar</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* TOTAL */}
            <Card className="bg-white shadow-lg border-0 rounded-xl">
              <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-t-xl p-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  TOTAL
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">SUBTOTAL:</span>
                    <span className="font-bold text-base">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {calculatedDiscount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">DESCONTOS:</span>
                      <span className="font-bold text-base text-red-600">-{formatCurrency(calculatedDiscount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">PAGAMENTOS:</span>
                    <span className="font-bold text-base">{formatCurrency(totalPaid)}</span>
                  </div>
                  
                  <Separator />
                  
                  {change > 0 && (
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg border-2 border-green-200">
                      <span className="font-bold text-green-800 text-sm">TROCO:</span>
                      <span className="font-bold text-xl text-green-600">{formatCurrency(change)}</span>
                    </div>
                  )}
                  
                  {remaining > 0 && (
                    <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg border-2 border-orange-200">
                      <span className="font-bold text-orange-800 text-sm">VALOR RESTANTE:</span>
                      <span className="font-bold text-xl text-orange-600">{formatCurrency(remaining)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <span className="font-bold text-blue-800 text-sm">TOTAL A PAGAR:</span>
                    <span className="font-bold text-xl text-blue-600">{formatCurrency(remaining)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-center gap-4 mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            className="px-6 py-2 text-base font-semibold border-2 border-gray-300 hover:bg-gray-50"
          >
            CANCELAR
          </Button>
          
          <Button
            onClick={finalizePayment}
            disabled={payments.length === 0}
            className={`px-6 py-2 text-base font-bold ${
              remaining > 0 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {remaining > 0 ? 'PAGAMENTO PARCIAL' : 'FINALIZAR'}
          </Button>
        </div>

        {/* Atalhos de Teclado */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-3 text-sm">
          <div className="flex justify-center gap-6">
            <span><strong>F2</strong> = Mudar Forma de Pagamento</span>
            <span><strong>F3</strong> = Confirmar Pagamento</span>
            <span><strong>F6</strong> = Finalizar Venda</span>
            <span><strong>F8</strong> = Cancelar</span>
          </div>
        </div>
      </div>
    </div>
  );
}