'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Unlock, 
  X, 
  CheckCircle2, 
  DollarSign,
  Calendar,
  User,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface CashOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (openingData: CashOpeningData) => Promise<void>;
  operatorName: string;
  existingOpenSession?: boolean;
}

export interface CashOpeningData {
  opening_amount: number;
  notes?: string;
  opened_by: string;
  opened_at: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function CashOpeningModal({
  isOpen,
  onClose,
  onConfirm,
  operatorName,
  existingOpenSession = false,
}: CashOpeningModalProps) {
  const [openingAmount, setOpeningAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resetar valores ao abrir
  useEffect(() => {
    if (isOpen) {
      setOpeningAmount('');
      setNotes('');
    }
  }, [isOpen]);

  const handleInputChange = (value: string) => {
    // Permitir apenas números e ponto/vírgula decimal
    const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
    setOpeningAmount(cleaned);
  };

  const handleConfirm = async () => {
    const amount = parseFloat(openingAmount) || 0;

    // Validar valor mínimo
    if (amount < 0) {
      toast.error('O valor inicial não pode ser negativo');
      return;
    }

    // Confirmar se o valor é zero
    if (amount === 0) {
      const confirmed = window.confirm('Deseja abrir o caixa com valor inicial zero (R$ 0,00)?');
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      const openingData: CashOpeningData = {
        opening_amount: amount,
        notes: notes.trim() || undefined,
        opened_by: operatorName,
        opened_at: new Date().toISOString(),
      };

      await onConfirm(openingData);
      toast.success('Caixa aberto com sucesso!', {
        description: `Valor inicial: ${formatCurrency(amount)}`,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      toast.error(`Erro ao abrir caixa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedAmount = parseFloat(openingAmount) || 0;

  // Se já existe sessão aberta, mostrar aviso
  if (existingOpenSession) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="h-6 w-6" />
              Caixa Já Aberto
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Já existe uma sessão de caixa aberta. Para abrir um novo caixa, 
                  é necessário fechar o caixa atual primeiro.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Unlock className="h-6 w-6 text-green-600 dark:text-green-400" />
            Abertura de Caixa
          </DialogTitle>
          <DialogDescription>
            Defina o valor inicial em dinheiro para começar o período de trabalho
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Operador */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Operador
                  </Label>
                  <div className="text-lg font-semibold mt-1">
                    {operatorName}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Data/Hora
                  </Label>
                  <div className="text-lg font-semibold mt-1">
                    {formatDateTime(new Date().toISOString())}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valor Inicial */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Valor Inicial em Dinheiro
            </h3>
            
            <div>
              <Label htmlFor="opening-amount">
                Quanto você tem em dinheiro no caixa agora?
              </Label>
              <Input
                id="opening-amount"
                type="text"
                value={openingAmount}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="0,00"
                className="mt-2 text-2xl font-bold h-16"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Digite apenas o valor em dinheiro físico disponível no caixa
              </p>
            </div>

            {/* Preview do Valor */}
            {openingAmount && (
              <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm text-muted-foreground">Valor Inicial</Label>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {formatCurrency(parsedAmount)}
                      </div>
                    </div>
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Dicas */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Dicas para Abertura de Caixa:
                  </p>
                  <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                    <li>• Conte o dinheiro físico disponível</li>
                    <li>• Não inclua valores de cartão ou PIX</li>
                    <li>• Confira notas verdadeiras e em bom estado</li>
                    <li>• Anote o valor exato encontrado</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Observações (Opcional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre a abertura do caixa..."
              className="min-h-[80px]"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Abrindo...
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Abrir Caixa
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
