'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Banknote, 
  CreditCard, 
  Smartphone, 
  Clock,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';

interface CashRegisterProps {
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
  notes?: string;
}

const CASH_DENOMINATIONS = [
  { value: 0.01, label: '1¢', type: 'coin' },
  { value: 0.05, label: '5¢', type: 'coin' },
  { value: 0.10, label: '10¢', type: 'coin' },
  { value: 0.25, label: '25¢', type: 'coin' },
  { value: 0.50, label: '50¢', type: 'coin' },
  { value: 1.00, label: 'R$ 1', type: 'bill' },
  { value: 2.00, label: 'R$ 2', type: 'bill' },
  { value: 5.00, label: 'R$ 5', type: 'bill' },
  { value: 10.00, label: 'R$ 10', type: 'bill' },
  { value: 20.00, label: 'R$ 20', type: 'bill' },
  { value: 50.00, label: 'R$ 50', type: 'bill' },
  { value: 100.00, label: 'R$ 100', type: 'bill' },
];

export function CashRegister({ total, onFinalize, onCancel, customerName, cartItems = [] }: CashRegisterProps) {
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [amountPaid, setAmountPaid] = useState(0);
  const [manualAmount, setManualAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [cashDrawer, setCashDrawer] = useState<Record<number, number>>({});

  const change = Math.max(0, amountPaid - total);
  const remaining = Math.max(0, total - amountPaid);
  
  const paymentStatus: 'paid' | 'partial' | 'pending' = 
    amountPaid >= total ? 'paid' : 
    amountPaid > 0 ? 'partial' : 'pending';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const addToCashDrawer = (denomination: number) => {
    setCashDrawer(prev => ({
      ...prev,
      [denomination]: (prev[denomination] || 0) + 1
    }));
    setAmountPaid(prev => prev + denomination);
  };

  const handleManualAmountChange = (value: string) => {
    setManualAmount(value);
    const numValue = parseFloat(value) || 0;
    if (numValue >= 0) {
      setAmountPaid(numValue);
    }
  };

  const calculateCashDrawerTotal = () => {
    return Object.entries(cashDrawer).reduce((total, [denomination, count]) => {
      return total + (parseFloat(denomination) * count);
    }, 0);
  };

  const clearCashDrawer = () => {
    setCashDrawer({});
    setAmountPaid(0);
    setManualAmount('');
  };

  const handleFinalize = () => {
    if (paymentMethod === 'dinheiro' && amountPaid < total) {
      toast.error('Valor pago insuficiente para dinheiro');
      return;
    }

    const paymentData: PaymentData = {
      paymentMethod,
      amountPaid: paymentMethod === 'dinheiro' ? amountPaid : total,
      change: paymentMethod === 'dinheiro' ? change : 0,
      remaining: paymentMethod === 'dinheiro' ? 0 : remaining,
      paymentStatus,
      notes
    };

    onFinalize(paymentData);
  };

  const paymentMethods = [
    { value: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: 'bg-green-500' },
    { value: 'pix', label: 'PIX', icon: Smartphone, color: 'bg-blue-500' },
    { value: 'cartao_debito', label: 'Cartão Débito', icon: CreditCard, color: 'bg-purple-500' },
    { value: 'cartao_credito', label: 'Cartão Crédito', icon: CreditCard, color: 'bg-indigo-500' },
    { value: 'fiado', label: 'Fiado', icon: Clock, color: 'bg-orange-500' },
  ];

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <Card 
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-200"
        style={{ backgroundColor: 'white' }}
      >
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Calculator className="h-6 w-6" />
              Caixa PDV - {customerName || 'Cliente Avulso'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent 
          className="p-6"
          style={{ backgroundColor: 'white' }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Coluna Esquerda - Informações da Venda */}
            <div className="space-y-6">
              
              {/* Total da Venda */}
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    VENDAS HOJE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <div className="text-sm text-gray-600">Total da Venda</div>
                    <div className="text-4xl font-bold text-blue-600">
                      {formatCurrency(total)}
                    </div>
                    <div className="text-sm text-gray-600">Valor Pago: {formatCurrency(amountPaid)}</div>
                    <Badge variant={paymentStatus === 'paid' ? 'default' : 'secondary'} className="mt-2">
                      {paymentStatus === 'paid' ? '✅ Pago' : 
                       paymentStatus === 'partial' ? '⚠️ Parcial' : '⏳ Pendente'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Método de Pagamento */}
              <Card 
                className="shadow-lg border border-gray-200"
                style={{ backgroundColor: 'white' }}
              >
                <CardHeader>
                  <CardTitle className="text-lg">Forma de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                      <Button
                        key={method.value}
                        variant={paymentMethod === method.value ? "default" : "outline"}
                        className={`h-12 flex flex-col gap-1 ${
                          paymentMethod === method.value ? method.color : ''
                        }`}
                        onClick={() => setPaymentMethod(method.value)}
                      >
                        <method.icon className="h-4 w-4" />
                        <span className="text-xs">{method.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Status do Pagamento */}
              <Card className="bg-white shadow-lg border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Status do Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Pago:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(amountPaid)}
                    </span>
                  </div>
                  
                  {paymentMethod === 'dinheiro' && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Troco:</span>
                        <span className={`font-semibold ${change > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                          {formatCurrency(change)}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {paymentMethod !== 'dinheiro' && remaining > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Restante:</span>
                        <span className="font-semibold text-orange-600">
                          {formatCurrency(remaining)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Itens do Pedido */}
              {cartItems.length > 0 && (
                <Card className="bg-white shadow-lg border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Itens do Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-xs text-gray-500">Cód: {item.code}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(item.subtotal)}</div>
                            <div className="text-xs text-gray-500">Qtd: {item.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>TOTAL:</span>
                      <span className="text-blue-600">{formatCurrency(total)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Observações */}
              <Card className="bg-white shadow-lg border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Observações adicionais (opcional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Coluna Direita - Interface de Caixa */}
            <div className="space-y-6">
              
              {paymentMethod === 'dinheiro' && (
                <>
                  {/* Entrada Manual */}
                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Banknote className="h-5 w-5" />
                        SALDO EM CAIXA
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-gray-600">Valor Pago Manual</div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(amountPaid)}
                        </div>
                        <Label htmlFor="manual-amount">Digite o valor recebido:</Label>
                        <Input
                          id="manual-amount"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={manualAmount}
                          onChange={(e) => handleManualAmountChange(e.target.value)}
                          className="text-lg"
                        />
                        <div className="text-sm text-gray-600">Saldo atual: {formatCurrency(calculateCashDrawerTotal())}</div>
                        <Button
                          variant="outline"
                          onClick={clearCashDrawer}
                          className="w-full"
                        >
                          Limpar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Caixa de Dinheiro */}
                  <Card className="bg-white shadow-lg border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Caixa de Dinheiro</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-2">
                        {CASH_DENOMINATIONS.map((denomination) => (
                          <Button
                            key={denomination.value}
                            variant="outline"
                            size="sm"
                            className="h-12 flex flex-col gap-1"
                            onClick={() => addToCashDrawer(denomination.value)}
                          >
                            <span className="text-xs font-medium">
                              {denomination.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {cashDrawer[denomination.value] || 0}
                            </span>
                          </Button>
                        ))}
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Total no Caixa:</div>
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(calculateCashDrawerTotal())}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {paymentMethod !== 'dinheiro' && (
                <Card className="bg-white shadow-lg border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Pagamento Eletrônico
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="text-2xl">
                        {formatCurrency(total)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Pagamento via {paymentMethods.find(m => m.value === paymentMethod)?.label}
                      </p>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                          O valor será processado automaticamente
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4 mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-12"
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleFinalize}
              disabled={paymentMethod === 'dinheiro' && amountPaid < total}
              className={`flex-1 h-14 text-lg font-bold ${
                paymentStatus === 'paid' ? 'bg-green-600 hover:bg-green-700 text-white' :
                paymentStatus === 'partial' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {paymentStatus === 'paid' ? '✅ FINALIZAR VENDA' : 
               paymentStatus === 'partial' ? '⚠️ PAGAMENTO PARCIAL' : '💰 CONFIRMAR PAGAMENTO'}
            </Button>
          </div>

          {/* Avisos */}
          {paymentMethod === 'dinheiro' && amountPaid < total && (
            <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <p className="text-sm font-semibold text-orange-800">
                  ⚠️ Valor insuficiente. Faltam {formatCurrency(remaining)} para completar o pagamento.
                </p>
              </div>
            </div>
          )}
          
          {paymentMethod === 'dinheiro' && change > 0 && (
            <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-semibold text-green-800">
                  💰 Troco para o cliente: {formatCurrency(change)}
                </p>
              </div>
            </div>
          )}

          {paymentMethod === 'dinheiro' && amountPaid === total && (
            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-semibold text-blue-800">
                  ✅ Valor exato! Pronto para finalizar a venda.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
