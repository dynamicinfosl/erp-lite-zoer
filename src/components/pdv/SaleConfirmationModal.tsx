'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle2, 
  Printer, 
  Plus, 
  Receipt,
  Calendar,
  User,
  CreditCard,
  DollarSign,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface SaleConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSale: () => void;
  onPrintReceipt: () => void;
  onPrintA4?: () => void;
  onEmitirNota?: () => void;
  saleData: {
    id?: string;
    tenant_id?: string;
    customer_id?: number | null;
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
  onPrintA4,
  onEmitirNota,
  saleData 
}: SaleConfirmationModalProps) {
  const [isDelivery, setIsDelivery] = useState(false);
  const [drivers, setDrivers] = useState<Array<{ id: number; name: string }>>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [savingDelivery, setSavingDelivery] = useState(false);
  const canConfigureDelivery = Boolean(saleData?.tenant_id && saleData?.id);

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

  const loadDrivers = useCallback(async () => {
    if (!saleData?.tenant_id) {
      setDrivers([]);
      return;
    }
    try {
      setDriversLoading(true);
      const res = await fetch(`/next_api/delivery-drivers?tenant_id=${encodeURIComponent(saleData.tenant_id)}`);
      if (!res.ok) {
        console.error('Erro ao carregar entregadores:', res.status, res.statusText);
        setDrivers([]);
        return;
      }
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
      const list = Array.isArray(rows) ? rows : [];
      const driversList = list
        .filter((d: any) => d.id && d.name)
        .map((d: any) => ({ id: Number(d.id), name: String(d.name) }));
      setDrivers(driversList);
      console.log('Entregadores carregados:', driversList.length);
    } catch (error) {
      console.error('Erro ao carregar entregadores:', error);
      setDrivers([]);
      toast.error('Erro ao carregar entregadores');
    } finally {
      setDriversLoading(false);
    }
  }, [saleData?.tenant_id]);

  const loadExistingDelivery = useCallback(async () => {
    if (!saleData?.tenant_id || !saleData?.id) return;
    try {
      const res = await fetch(
        `/next_api/deliveries?tenant_id=${encodeURIComponent(saleData.tenant_id)}&sale_id=${encodeURIComponent(String(saleData.id))}&limit=1`
      );
      if (!res.ok) return;
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
      const existing = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
      if (existing?.id) {
        setIsDelivery(true);
        setSelectedDriverId(existing.driver_id ? String(existing.driver_id) : '');
      } else {
        setIsDelivery(false);
        setSelectedDriverId('');
      }
    } catch {
      // ignore
    }
  }, [saleData?.tenant_id, saleData?.id]);

  useEffect(() => {
    if (!isOpen) return;
    loadDrivers();
    loadExistingDelivery();
  }, [isOpen, loadDrivers, loadExistingDelivery]);

  const selectedDriverName = useMemo(() => {
    const id = Number(selectedDriverId);
    return drivers.find((d) => d.id === id)?.name || '';
  }, [drivers, selectedDriverId]);

  const saveDeliveryConfig = async () => {
    if (!canConfigureDelivery) {
      toast.error('Não é possível configurar entrega para esta venda');
      return;
    }

    if (!isDelivery) {
      // Se desmarcar entrega, apenas cancela/removendo vínculo (mantém registro como cancelada)
      try {
        setSavingDelivery(true);
        const res = await fetch('/next_api/deliveries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: saleData.tenant_id,
            sale_id: saleData.id,
            customer_id: saleData.customer_id,
            status: 'cancelada',
            driver_id: null,
            notes: 'Entrega desmarcada no PDV',
          }),
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ errorMessage: 'Erro desconhecido' }));
          throw new Error(errorData.errorMessage || `Erro ${res.status}`);
        }
        
        toast.success('Entrega desmarcada com sucesso');
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Erro ao desmarcar entrega';
        console.error('Erro ao desmarcar entrega:', e);
        toast.error(errorMessage);
      } finally {
        setSavingDelivery(false);
      }
      return;
    }

    // Validações para marcar como entrega
    if (!saleData.customer_id) {
      toast.error('Para marcar como entrega, é necessário selecionar um cliente cadastrado no PDV.', {
        description: 'Selecione um cliente (o endereço pode ser preenchido depois).',
        duration: 5000,
      });
      return;
    }

    try {
      setSavingDelivery(true);
      const res = await fetch('/next_api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: saleData.tenant_id,
          sale_id: saleData.id,
          customer_id: saleData.customer_id,
          driver_id: selectedDriverId ? Number(selectedDriverId) : null,
          status: 'aguardando',
          notes: selectedDriverId
            ? `Vinculada no PDV para entregador: ${selectedDriverName || selectedDriverId}`
            : 'Marcada como entrega no PDV (sem entregador)',
        }),
      });
      
      if (!res.ok) {
        let errorMessage = 'Erro ao salvar entrega';
        try {
          const errorData = await res.json();
          errorMessage = errorData.errorMessage || errorMessage;
          
          // Mensagens específicas para erros comuns
          if (errorMessage.includes('customer_id')) {
            errorMessage = 'Cliente inválido. Verifique se o cliente está cadastrado corretamente.';
          }
        } catch {
          const text = await res.text().catch(() => '');
          errorMessage = text || `Erro ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      toast.success('Venda marcada para entrega com sucesso!', {
        description: selectedDriverId ? `Entregador: ${selectedDriverName || selectedDriverId}` : 'Sem entregador',
        duration: 4000,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Erro ao salvar entrega';
      console.error('Erro ao salvar entrega:', e);
      toast.error(errorMessage, {
        description: 'Verifique os dados do cliente e tente novamente.',
        duration: 6000,
      });
    } finally {
      setSavingDelivery(false);
    }
  };

  // Só renderiza quando aberto (mas os hooks acima sempre rodam na mesma ordem)
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl border-0 rounded-xl max-h-[95vh]">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-xl p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold">Venda Finalizada!</CardTitle>
              <p className="text-green-100 text-xs mt-0.5">
                Venda #{saleData.numero} processada com sucesso
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 sm:p-4">
          {/* Resumo da Venda */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            
            {/* Informações da Venda */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" />
                Detalhes
              </h3>
              
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                    #{saleData.numero}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{formatDate(saleData.data_venda)}</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{saleData.cliente}</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-3 w-3 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{saleData.forma_pagamento.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Financeiro
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">Itens:</span>
                  <span className="font-medium">{saleData.itens.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Total:</span>
                  <span className="font-bold text-sm text-green-600">
                    {formatCurrency(saleData.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Itens */}
          <div className="mb-3">
            <h3 className="font-semibold text-gray-800 text-sm mb-1.5">Itens Vendidos</h3>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="space-y-1">
                {saleData.itens.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-xs">
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="font-medium truncate block">{item.name}</span>
                      <span className="text-gray-500 text-[10px]">
                        Qtd: {item.quantity.toFixed(2)}
                      </span>
                    </div>
                    <span className="font-medium text-gray-700 flex-shrink-0 text-xs">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mini seção: Entrega */}
          <div className="mb-3 rounded-lg border border-gray-200 bg-white p-2.5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-sm">Entrega</h3>
                <p className="text-[10px] text-gray-500">
                  Marque para que essa venda apareça na lista de entregas e possa entrar em um romaneio.
                </p>
              </div>
              <label className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isDelivery}
                  onChange={(e) => setIsDelivery(e.target.checked)}
                  disabled={!canConfigureDelivery}
                  className="w-3.5 h-3.5"
                />
                É entrega
              </label>
            </div>

            {isDelivery && (
              <div className="mt-2 space-y-2">
                <div className="text-[10px] text-gray-600">
                  <strong>Cliente:</strong> {saleData.cliente}
                  {!saleData.customer_id && (
                    <span className="ml-1 text-red-600">
                      (selecione um cliente cadastrado)
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-gray-700 block">Entregador (opcional)</span>
                  <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder={driversLoading ? 'Carregando...' : drivers.length === 0 ? 'Nenhum entregador cadastrado' : 'Selecione um entregador (opcional)'} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000] max-h-[200px] overflow-y-auto">
                      <SelectItem value="" className="text-xs">
                        Sem entregador
                      </SelectItem>
                      {drivers.length === 0 && !driversLoading ? (
                        <div className="px-2 py-1.5 text-xs text-gray-400 text-center">
                          Nenhum entregador cadastrado
                        </div>
                      ) : driversLoading ? (
                        <div className="px-2 py-1.5 text-xs text-gray-400 text-center">
                          Carregando...
                        </div>
                      ) : (
                        drivers.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)} className="text-xs">
                            {d.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-1.5 pt-1">
                  <Button 
                    variant="outline" 
                    onClick={loadDrivers} 
                    disabled={driversLoading}
                    className="text-xs h-7 px-2"
                  >
                    Atualizar
                  </Button>
                  <Button
                    onClick={saveDeliveryConfig}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 px-2"
                    disabled={savingDelivery || !canConfigureDelivery}
                  >
                    {savingDelivery ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {onPrintA4 && (
              <Button
                onClick={onPrintA4}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 text-xs"
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">A4</span>
                <span className="sm:hidden">A4</span>
              </Button>
            )}
            <Button
              onClick={onPrintReceipt}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Cupom</span>
              <span className="sm:hidden">Cupom</span>
            </Button>
            
            {onEmitirNota && (
              <Button
                onClick={onEmitirNota}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1.5 text-xs"
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">NFe</span>
                <span className="sm:hidden">NFe</span>
              </Button>
            )}
            
            <Button
              onClick={onNewSale}
              variant="outline"
              className="border-2 border-green-600 text-green-600 hover:bg-green-50 font-semibold py-1.5 text-xs col-span-2 sm:col-span-1"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nova Venda
            </Button>
          </div>

          {/* Botão Fechar */}
          <div className="flex justify-center mt-2">
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700 text-xs h-7"
            >
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
















