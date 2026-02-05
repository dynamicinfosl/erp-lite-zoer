'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  CreditCard, 
  Smartphone,
  TrendingUp,
  FileText,
  Calendar,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Sale {
  id: string;
  total: number;
  forma_pagamento: string;
  status: 'pendente' | 'paga' | 'cancelada';
}

interface CaixaOperation {
  id: string;
  tipo: 'sangria' | 'reforco' | 'abertura' | 'fechamento';
  valor: number;
  descricao: string;
  data: string;
  usuario: string;
}

interface CashClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (closingData: CashClosingData) => Promise<void>;
  todaySales: Sale[];
  caixaInicial: number;
  caixaOperations: CaixaOperation[];
  openedAt?: string;
  openedBy?: string;
  tenantId?: string;
  userId?: string;
}

export interface CashClosingData {
  // Valores contados
  closing_amount_cash: number;
  closing_amount_card_debit: number;
  closing_amount_card_credit: number;
  closing_amount_pix: number;
  closing_amount_other: number;
  
  // Observações
  notes?: string;
  difference_reason?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'Não informado';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function CashClosingModal({
  isOpen,
  onClose,
  onConfirm,
  todaySales,
  caixaInicial,
  caixaOperations,
  openedAt,
  openedBy,
  tenantId,
  userId,
}: CashClosingModalProps) {
  const [closingAmounts, setClosingAmounts] = useState({
    cash: '',
    card_debit: '',
    card_credit: '',
    pix: '',
    other: '',
  });
  const [notes, setNotes] = useState('');
  const [differenceReason, setDifferenceReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resetar valores ao abrir
  useEffect(() => {
    if (isOpen) {
      // Preencher valores esperados como sugestão
      const expected = calculateExpectedValues();
      setClosingAmounts({
        cash: expected.cash > 0 ? expected.cash.toFixed(2) : '',
        card_debit: expected.card_debit > 0 ? expected.card_debit.toFixed(2) : '',
        card_credit: expected.card_credit > 0 ? expected.card_credit.toFixed(2) : '',
        pix: expected.pix > 0 ? expected.pix.toFixed(2) : '',
        other: expected.other > 0 ? expected.other.toFixed(2) : '',
      });
      setNotes('');
      setDifferenceReason('');
    }
  }, [isOpen]);

  // Calcular valores esperados por método de pagamento
  const calculateExpectedValues = useMemo(() => {
    return () => {
      const vendasPagas = todaySales.filter(s => s.status === 'paga');
      
      // Agrupar vendas por método de pagamento
      const vendasPorMetodo = vendasPagas.reduce((acc, venda) => {
        const metodo = venda.forma_pagamento || 'dinheiro';
        if (!acc[metodo]) {
          acc[metodo] = 0;
        }
        acc[metodo] += venda.total;
        return acc;
      }, {} as Record<string, number>);

      // Calcular totais
      const vendasDinheiro = vendasPorMetodo['dinheiro'] || 0;
      const vendasCartaoDebito = vendasPorMetodo['cartao_debito'] || 0;
      const vendasCartaoCredito = vendasPorMetodo['cartao_credito'] || 0;
      const vendasPix = vendasPorMetodo['pix'] || 0;
      const vendasOutros = Object.entries(vendasPorMetodo)
        .filter(([metodo]) => !['dinheiro', 'cartao_debito', 'cartao_credito', 'pix'].includes(metodo))
        .reduce((sum, [, valor]) => sum + valor, 0);

      // Calcular reforços e sangrias
      const totalReforcos = caixaOperations
        .filter(op => op.tipo === 'reforco')
        .reduce((sum, op) => sum + op.valor, 0);
      
      const totalSangrias = caixaOperations
        .filter(op => op.tipo === 'sangria')
        .reduce((sum, op) => sum + op.valor, 0);

      return {
        cash: caixaInicial + vendasDinheiro + totalReforcos - totalSangrias,
        card_debit: vendasCartaoDebito,
        card_credit: vendasCartaoCredito,
        pix: vendasPix,
        other: vendasOutros,
      };
    };
  }, [todaySales, caixaInicial, caixaOperations]);

  const expectedValues = calculateExpectedValues();

  // Calcular valores contados
  const countedValues = useMemo(() => {
    return {
      cash: parseFloat(closingAmounts.cash) || 0,
      card_debit: parseFloat(closingAmounts.card_debit) || 0,
      card_credit: parseFloat(closingAmounts.card_credit) || 0,
      pix: parseFloat(closingAmounts.pix) || 0,
      other: parseFloat(closingAmounts.other) || 0,
    };
  }, [closingAmounts]);

  // Calcular diferenças
  const differences = useMemo(() => {
    return {
      cash: countedValues.cash - expectedValues.cash,
      card_debit: countedValues.card_debit - expectedValues.card_debit,
      card_credit: countedValues.card_credit - expectedValues.card_credit,
      pix: countedValues.pix - expectedValues.pix,
      other: countedValues.other - expectedValues.other,
    };
  }, [countedValues, expectedValues]);

  // Calcular diferença total
  const totalDifference = useMemo(() => {
    return Object.values(differences).reduce((sum, diff) => sum + diff, 0);
  }, [differences]);

  // Verificar se há diferenças significativas
  const hasSignificantDifference = useMemo(() => {
    const threshold = 0.50; // R$ 0,50
    return Math.abs(totalDifference) > threshold || 
           Object.values(differences).some(diff => Math.abs(diff) > threshold);
  }, [totalDifference, differences]);

  // Estatísticas do período
  const stats = useMemo(() => {
    const vendasPagas = todaySales.filter(s => s.status === 'paga');
    const totalVendas = vendasPagas.reduce((sum, v) => sum + v.total, 0);
    const ticketMedio = vendasPagas.length > 0 ? totalVendas / vendasPagas.length : 0;
    const maiorVenda = vendasPagas.length > 0 
      ? Math.max(...vendasPagas.map(v => v.total))
      : 0;
    
    const totalReforcos = caixaOperations
      .filter(op => op.tipo === 'reforco')
      .reduce((sum, op) => sum + op.valor, 0);
    
    const totalSangrias = caixaOperations
      .filter(op => op.tipo === 'sangria')
      .reduce((sum, op) => sum + op.valor, 0);

    return {
      totalVendas: vendasPagas.length,
      totalVendasAmount: totalVendas,
      ticketMedio,
      maiorVenda,
      totalReforcos,
      totalSangrias,
    };
  }, [todaySales, caixaOperations]);

  const handleInputChange = (field: keyof typeof closingAmounts, value: string) => {
    // Permitir apenas números e ponto decimal
    const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
    setClosingAmounts(prev => ({ ...prev, [field]: cleaned }));
  };

  const handleConfirm = async () => {
    // Validar se pelo menos um valor foi informado
    if (Object.values(countedValues).every(v => v === 0)) {
      toast.error('Informe pelo menos um valor contado');
      return;
    }

    // Se houver diferença significativa, exigir justificativa
    if (hasSignificantDifference && !differenceReason.trim()) {
      toast.error('Justifique a diferença encontrada');
      return;
    }

    setIsSubmitting(true);
    try {
      const closingData: CashClosingData = {
        closing_amount_cash: countedValues.cash,
        closing_amount_card_debit: countedValues.card_debit,
        closing_amount_card_credit: countedValues.card_credit,
        closing_amount_pix: countedValues.pix,
        closing_amount_other: countedValues.other,
        notes: notes.trim() || undefined,
        difference_reason: differenceReason.trim() || undefined,
      };

      await onConfirm(closingData);
      toast.success('Caixa fechado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      toast.error(`Erro ao fechar caixa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifferenceBadge = (difference: number) => {
    if (Math.abs(difference) < 0.01) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />OK</Badge>;
    } else if (Math.abs(difference) <= 0.50) {
      return <Badge variant="secondary" className="bg-yellow-500"><AlertCircle className="h-3 w-3 mr-1" />Pequena</Badge>;
    } else {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Significativa</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Lock className="h-6 w-6" />
            Fechamento de Caixa
          </DialogTitle>
          <DialogDescription>
            Confira os valores e finalize o fechamento do caixa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo do Período */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Abertura</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{formatDateTime(openedAt)}</span>
                  </div>
                  {openedBy && (
                    <div className="text-xs text-muted-foreground mt-1">Por: {openedBy}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valor Inicial</Label>
                  <div className="text-lg font-bold text-primary mt-1">
                    {formatCurrency(caixaInicial)}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total de Vendas</Label>
                  <div className="text-lg font-bold mt-1">
                    {stats.totalVendas} vendas
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Faturamento</Label>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                    {formatCurrency(stats.totalVendasAmount)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Estatísticas do Período
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Ticket Médio</Label>
                  <div className="text-lg font-semibold mt-1">
                    {formatCurrency(stats.ticketMedio)}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Maior Venda</Label>
                  <div className="text-lg font-semibold mt-1">
                    {formatCurrency(stats.maiorVenda)}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Reforços</Label>
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400 mt-1">
                    {formatCurrency(stats.totalReforcos)}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Sangrias</Label>
                  <div className="text-lg font-semibold text-red-600 dark:text-red-400 mt-1">
                    {formatCurrency(stats.totalSangrias)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Operações de Caixa (Sangrias e Reforços) */}
          {caixaOperations.filter(op => op.tipo === 'sangria' || op.tipo === 'reforco').length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Operações de Caixa (Sangrias e Reforços)
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {caixaOperations
                    .filter(op => op.tipo === 'sangria' || op.tipo === 'reforco')
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                    .map((op) => (
                      <div
                        key={op.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          op.tipo === 'reforco'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={op.tipo === 'reforco' ? 'default' : 'destructive'}
                              className={
                                op.tipo === 'reforco'
                                  ? 'bg-green-600 hover:bg-green-700'
                                  : 'bg-red-600 hover:bg-red-700'
                              }
                            >
                              {op.tipo === 'reforco' ? 'Reforço' : 'Sangria'}
                            </Badge>
                            <span className="text-sm font-semibold">
                              {formatCurrency(op.valor)}
                            </span>
                          </div>
                          {op.descricao && (
                            <p className="text-xs text-muted-foreground mt-1">{op.descricao}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDateTime(op.data)}</span>
                            {op.usuario && (
                              <>
                                <span>•</span>
                                <span>Por: {op.usuario}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Valores Esperados vs Contados */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Valores Esperados vs Contados</h3>
            
            {/* Dinheiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Dinheiro Esperado
                </Label>
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold">{formatCurrency(expectedValues.cash)}</div>
                </div>
              </div>
              <div>
                <Label>Dinheiro Contado</Label>
                <Input
                  type="text"
                  value={closingAmounts.cash}
                  onChange={(e) => handleInputChange('cash', e.target.value)}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Diferença</Label>
                <div className="mt-1 p-3 rounded-lg flex items-center justify-between">
                  <div className={`text-xl font-bold ${
                    Math.abs(differences.cash) < 0.01 
                      ? 'text-green-600 dark:text-green-400' 
                      : Math.abs(differences.cash) <= 0.50
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(differences.cash)}
                  </div>
                  {getDifferenceBadge(differences.cash)}
                </div>
              </div>
            </div>

            {/* Cartão Débito */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Cartão Débito Esperado
                </Label>
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold">{formatCurrency(expectedValues.card_debit)}</div>
                </div>
              </div>
              <div>
                <Label>Cartão Débito Contado</Label>
                <Input
                  type="text"
                  value={closingAmounts.card_debit}
                  onChange={(e) => handleInputChange('card_debit', e.target.value)}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Diferença</Label>
                <div className="mt-1 p-3 rounded-lg flex items-center justify-between">
                  <div className={`text-xl font-bold ${
                    Math.abs(differences.card_debit) < 0.01 
                      ? 'text-green-600 dark:text-green-400' 
                      : Math.abs(differences.card_debit) <= 0.50
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(differences.card_debit)}
                  </div>
                  {getDifferenceBadge(differences.card_debit)}
                </div>
              </div>
            </div>

            {/* Cartão Crédito */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Cartão Crédito Esperado
                </Label>
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold">{formatCurrency(expectedValues.card_credit)}</div>
                </div>
              </div>
              <div>
                <Label>Cartão Crédito Contado</Label>
                <Input
                  type="text"
                  value={closingAmounts.card_credit}
                  onChange={(e) => handleInputChange('card_credit', e.target.value)}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Diferença</Label>
                <div className="mt-1 p-3 rounded-lg flex items-center justify-between">
                  <div className={`text-xl font-bold ${
                    Math.abs(differences.card_credit) < 0.01 
                      ? 'text-green-600 dark:text-green-400' 
                      : Math.abs(differences.card_credit) <= 0.50
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(differences.card_credit)}
                  </div>
                  {getDifferenceBadge(differences.card_credit)}
                </div>
              </div>
            </div>

            {/* PIX */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  PIX Esperado
                </Label>
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold">{formatCurrency(expectedValues.pix)}</div>
                </div>
              </div>
              <div>
                <Label>PIX Contado</Label>
                <Input
                  type="text"
                  value={closingAmounts.pix}
                  onChange={(e) => handleInputChange('pix', e.target.value)}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Diferença</Label>
                <div className="mt-1 p-3 rounded-lg flex items-center justify-between">
                  <div className={`text-xl font-bold ${
                    Math.abs(differences.pix) < 0.01 
                      ? 'text-green-600 dark:text-green-400' 
                      : Math.abs(differences.pix) <= 0.50
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(differences.pix)}
                  </div>
                  {getDifferenceBadge(differences.pix)}
                </div>
              </div>
            </div>

            {/* Outros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Outros Esperado
                </Label>
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold">{formatCurrency(expectedValues.other)}</div>
                </div>
              </div>
              <div>
                <Label>Outros Contado</Label>
                <Input
                  type="text"
                  value={closingAmounts.other}
                  onChange={(e) => handleInputChange('other', e.target.value)}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Diferença</Label>
                <div className="mt-1 p-3 rounded-lg flex items-center justify-between">
                  <div className={`text-xl font-bold ${
                    Math.abs(differences.other) < 0.01 
                      ? 'text-green-600 dark:text-green-400' 
                      : Math.abs(differences.other) <= 0.50
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(differences.other)}
                  </div>
                  {getDifferenceBadge(differences.other)}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Diferença Total */}
          <Card className={hasSignificantDifference ? 'border-red-500' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg">Diferença Total</Label>
                  <div className={`text-3xl font-bold mt-2 ${
                    Math.abs(totalDifference) < 0.01 
                      ? 'text-green-600 dark:text-green-400' 
                      : Math.abs(totalDifference) <= 0.50
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(totalDifference)}
                  </div>
                </div>
                {getDifferenceBadge(totalDifference)}
              </div>
            </CardContent>
          </Card>

          {/* Justificativa de Diferença */}
          {hasSignificantDifference && (
            <div className="space-y-2">
              <Label htmlFor="difference-reason" className="text-red-600 dark:text-red-400">
                Justificativa da Diferença *
              </Label>
              <Textarea
                id="difference-reason"
                value={differenceReason}
                onChange={(e) => setDifferenceReason(e.target.value)}
                placeholder="Explique a razão da diferença encontrada..."
                className="min-h-[100px]"
                required
              />
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais sobre o fechamento..."
              className="min-h-[80px]"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Fechando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Confirmar Fechamento
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}









