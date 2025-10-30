'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Printer, 
  Plus, 
  Receipt,
  Calendar,
  User,
  CreditCard,
  DollarSign
} from 'lucide-react';

interface SaleConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSale: () => void;
  onPrintReceipt: () => void;
  saleData: {
    numero: string;
    cliente: string;
    total: number;
    forma_pagamento: string;
    data_venda: string;
    itens: Array<{
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>;
  };
}

export function SaleConfirmationModal({ 
  isOpen, 
  onClose, 
  onNewSale, 
  onPrintReceipt, 
  saleData 
}: SaleConfirmationModalProps) {
  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl border-0 rounded-xl">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-xl p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8" />
            <div>
              <CardTitle className="text-2xl font-bold">Venda Finalizada!</CardTitle>
              <p className="text-green-100 text-sm mt-1">
                Venda #{saleData.numero} processada com sucesso
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Resumo da Venda */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* Informações da Venda */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Detalhes da Venda
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    #{saleData.numero}
                  </Badge>
                  <span className="text-sm text-gray-600">Número da Venda</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formatDate(saleData.data_venda)}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Cliente: {saleData.cliente}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Pagamento: {saleData.forma_pagamento.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Resumo Financeiro
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Itens vendidos:</span>
                  <span className="font-medium">{saleData.itens.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total da venda:</span>
                  <span className="font-bold text-lg text-green-600">
                    {formatCurrency(saleData.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Itens */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 text-lg mb-3">Itens Vendidos</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <div className="space-y-2">
                {saleData.itens.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500 ml-2">
                        (Qtd: {item.quantity.toFixed(2)})
                      </span>
                    </div>
                    <span className="font-medium text-gray-700">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onPrintReceipt}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-base"
            >
              <Printer className="h-5 w-5 mr-2" />
              Imprimir Cupom
            </Button>
            
            <Button
              onClick={onNewSale}
              variant="outline"
              className="flex-1 border-2 border-green-600 text-green-600 hover:bg-green-50 font-semibold py-3 text-base"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nova Venda
            </Button>
          </div>

          {/* Botão Fechar */}
          <div className="flex justify-center mt-4">
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
            >
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}















