'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  Lock, 
  Printer, 
  Download, 
  Shield,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface CashClosingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  closingData: {
    id: number;
    register_id: string;
    opened_at: string;
    closed_at: string;
    opened_by: string;
    closed_by: string;
    opening_amount: number;
    closing_amounts: {
      cash: number;
      card_debit: number;
      card_credit: number;
      pix: number;
      other: number;
    };
    expected_amounts: {
      cash: number;
      card_debit: number;
      card_credit: number;
      pix: number;
      other: number;
    };
    differences: {
      cash: number;
      card_debit: number;
      card_credit: number;
      pix: number;
      other: number;
      total: number;
    };
    total_sales: number;
    total_sales_amount: number;
    security_hash?: string;
    notes?: string;
    difference_reason?: string;
  };
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

const calculateSessionDuration = (openedAt: string, closedAt: string) => {
  const start = new Date(openedAt);
  const end = new Date(closedAt);
  const durationMs = end.getTime() - start.getTime();
  const hours = Math.floor(durationMs / 3600000);
  const minutes = Math.floor((durationMs % 3600000) / 60000);
  return `${hours}h ${minutes}min`;
};

export function CashClosingSuccessModal({
  isOpen,
  onClose,
  closingData,
}: CashClosingSuccessModalProps) {
  const totalClosed = 
    closingData.closing_amounts.cash +
    closingData.closing_amounts.card_debit +
    closingData.closing_amounts.card_credit +
    closingData.closing_amounts.pix +
    closingData.closing_amounts.other;

  const totalExpected = 
    closingData.expected_amounts.cash +
    closingData.expected_amounts.card_debit +
    closingData.expected_amounts.card_credit +
    closingData.expected_amounts.pix +
    closingData.expected_amounts.other;

  const hasDifference = Math.abs(closingData.differences.total) >= 0.01;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Fechamento de Caixa</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 20px;
            font-size: 12px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .section {
            margin: 15px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .label {
            font-weight: bold;
          }
          .total {
            font-size: 14px;
            font-weight: bold;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #000;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            border-top: 2px solid #000;
            padding-top: 10px;
            font-size: 10px;
          }
          .signature {
            margin-top: 40px;
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #000;
            width: 300px;
            margin: 0 auto;
            padding-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>RELATÓRIO DE FECHAMENTO DE CAIXA</h2>
          <p>Caixa: ${closingData.register_id} | ID: ${closingData.id}</p>
        </div>

        <div class="section">
          <h3>INFORMAÇÕES DA SESSÃO</h3>
          <div class="row">
            <span class="label">Abertura:</span>
            <span>${formatDateTime(closingData.opened_at)}</span>
          </div>
          <div class="row">
            <span class="label">Fechamento:</span>
            <span>${formatDateTime(closingData.closed_at)}</span>
          </div>
          <div class="row">
            <span class="label">Duração:</span>
            <span>${calculateSessionDuration(closingData.opened_at, closingData.closed_at)}</span>
          </div>
          <div class="row">
            <span class="label">Aberto por:</span>
            <span>${closingData.opened_by}</span>
          </div>
          <div class="row">
            <span class="label">Fechado por:</span>
            <span>${closingData.closed_by}</span>
          </div>
        </div>

        <div class="section">
          <h3>VALORES FINANCEIROS</h3>
          <div class="row">
            <span class="label">Valor Inicial:</span>
            <span>${formatCurrency(closingData.opening_amount)}</span>
          </div>
        </div>

        <div class="section">
          <h3>DINHEIRO</h3>
          <div class="row">
            <span>Esperado:</span>
            <span>${formatCurrency(closingData.expected_amounts.cash)}</span>
          </div>
          <div class="row">
            <span>Contado:</span>
            <span>${formatCurrency(closingData.closing_amounts.cash)}</span>
          </div>
          <div class="row">
            <span class="label">Diferença:</span>
            <span style="color: ${closingData.differences.cash >= 0 ? 'green' : 'red'}">${formatCurrency(closingData.differences.cash)}</span>
          </div>
        </div>

        <div class="section">
          <h3>CARTÃO DÉBITO</h3>
          <div class="row">
            <span>Esperado:</span>
            <span>${formatCurrency(closingData.expected_amounts.card_debit)}</span>
          </div>
          <div class="row">
            <span>Contado:</span>
            <span>${formatCurrency(closingData.closing_amounts.card_debit)}</span>
          </div>
          <div class="row">
            <span class="label">Diferença:</span>
            <span style="color: ${closingData.differences.card_debit >= 0 ? 'green' : 'red'}">${formatCurrency(closingData.differences.card_debit)}</span>
          </div>
        </div>

        <div class="section">
          <h3>CARTÃO CRÉDITO</h3>
          <div class="row">
            <span>Esperado:</span>
            <span>${formatCurrency(closingData.expected_amounts.card_credit)}</span>
          </div>
          <div class="row">
            <span>Contado:</span>
            <span>${formatCurrency(closingData.closing_amounts.card_credit)}</span>
          </div>
          <div class="row">
            <span class="label">Diferença:</span>
            <span style="color: ${closingData.differences.card_credit >= 0 ? 'green' : 'red'}">${formatCurrency(closingData.differences.card_credit)}</span>
          </div>
        </div>

        <div class="section">
          <h3>PIX</h3>
          <div class="row">
            <span>Esperado:</span>
            <span>${formatCurrency(closingData.expected_amounts.pix)}</span>
          </div>
          <div class="row">
            <span>Contado:</span>
            <span>${formatCurrency(closingData.closing_amounts.pix)}</span>
          </div>
          <div class="row">
            <span class="label">Diferença:</span>
            <span style="color: ${closingData.differences.pix >= 0 ? 'green' : 'red'}">${formatCurrency(closingData.differences.pix)}</span>
          </div>
        </div>

        <div class="section total">
          <div class="row">
            <span class="label">TOTAL ESPERADO:</span>
            <span>${formatCurrency(totalExpected)}</span>
          </div>
          <div class="row">
            <span class="label">TOTAL CONTADO:</span>
            <span>${formatCurrency(totalClosed)}</span>
          </div>
          <div class="row">
            <span class="label">DIFERENÇA TOTAL:</span>
            <span style="color: ${closingData.differences.total >= 0 ? 'green' : 'red'}">${formatCurrency(closingData.differences.total)}</span>
          </div>
        </div>

        <div class="section">
          <h3>ESTATÍSTICAS</h3>
          <div class="row">
            <span>Vendas Realizadas:</span>
            <span>${closingData.total_sales}</span>
          </div>
          <div class="row">
            <span>Faturamento Total:</span>
            <span>${formatCurrency(closingData.total_sales_amount)}</span>
          </div>
        </div>

        ${closingData.difference_reason ? `
        <div class="section">
          <h3>JUSTIFICATIVA DE DIFERENÇA</h3>
          <p>${closingData.difference_reason}</p>
        </div>
        ` : ''}

        ${closingData.notes ? `
        <div class="section">
          <h3>OBSERVAÇÕES</h3>
          <p>${closingData.notes}</p>
        </div>
        ` : ''}

        ${closingData.security_hash ? `
        <div class="section">
          <h3>SEGURANÇA</h3>
          <div class="row">
            <span class="label">Hash de Integridade:</span>
          </div>
          <div style="word-break: break-all; font-size: 10px; margin-top: 5px;">
            ${closingData.security_hash}
          </div>
        </div>
        ` : ''}

        <div class="signature">
          <div class="signature-line">
            Assinatura do Responsável
          </div>
        </div>

        <div class="footer">
          <p>Documento gerado automaticamente pelo sistema ERP</p>
          <p>Data de geração: ${formatDateTime(new Date().toISOString())}</p>
          <p>Este documento possui validade legal e está protegido por hash de integridade</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadJSON = () => {
    const dataToExport = {
      ...closingData,
      exported_at: new Date().toISOString(),
      version: '1.0.0',
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fechamento-caixa-${closingData.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-6 w-6" />
            Caixa Fechado com Sucesso!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status de Segurança */}
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <Lock className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Fechamento Seguro</h3>
                  <p className="text-sm text-muted-foreground">
                    O caixa foi fechado e bloqueado. Os dados estão protegidos e prontos para auditoria.
                  </p>
                </div>
                <Badge variant="default" className="bg-green-600">
                  <Shield className="h-3 w-3 mr-1" />
                  Protegido
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Sessão */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Resumo do Fechamento
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID da Sessão</p>
                  <p className="font-semibold">#{closingData.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Caixa</p>
                  <p className="font-semibold">{closingData.register_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fechado por</p>
                  <p className="font-semibold">{closingData.closed_by}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duração</p>
                  <p className="font-semibold">
                    {calculateSessionDuration(closingData.opened_at, closingData.closed_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Totais */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Resumo Financeiro
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Esperado</span>
                  <span className="text-lg font-semibold">{formatCurrency(totalExpected)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Contado</span>
                  <span className="text-lg font-semibold">{formatCurrency(totalClosed)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Diferença Total</span>
                  <span className={`text-xl font-bold ${
                    Math.abs(closingData.differences.total) < 0.01 
                      ? 'text-green-600 dark:text-green-400' 
                      : Math.abs(closingData.differences.total) <= 0.50
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(closingData.differences.total)}
                  </span>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vendas Realizadas</p>
                  <p className="text-2xl font-bold">{closingData.total_sales}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Faturamento Total</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(closingData.total_sales_amount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diferença (se houver) */}
          {hasDifference && closingData.difference_reason && (
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="h-4 w-4" />
                  Justificativa de Diferença
                </h3>
                <p className="text-sm">{closingData.difference_reason}</p>
              </CardContent>
            </Card>
          )}

          {/* Hash de Segurança */}
          {closingData.security_hash && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Hash de Integridade
                </h3>
                <p className="text-xs font-mono break-all bg-white dark:bg-gray-900 p-2 rounded">
                  {closingData.security_hash}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Este hash garante que os dados do fechamento não foram alterados.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleDownloadJSON}>
              <Download className="h-4 w-4 mr-2" />
              Exportar JSON
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Relatório
            </Button>
            <Button onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


