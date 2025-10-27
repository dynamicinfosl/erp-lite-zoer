'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  CreditCard, 
  Calendar, 
  Download,
  ArrowRight,
  Home,
  Receipt
} from 'lucide-react';

function PagamentoSucessoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    // Simular dados do pagamento (em produção, viria dos parâmetros da URL ou localStorage)
    const mockPaymentData = {
      planId: searchParams.get('plan') || 'pro',
      amount: searchParams.get('amount') || '139.90',
      transactionId: searchParams.get('transaction_id') || `tx_${Date.now()}`,
      status: 'completed',
      paymentMethod: 'credit_card',
      timestamp: new Date().toISOString(),
      planName: searchParams.get('plan') === 'basic' ? 'Básico' : 
                searchParams.get('plan') === 'pro' ? 'Profissional' : 
                searchParams.get('plan') === 'enterprise' ? 'Enterprise' : 'Profissional'
    };

    setPaymentData(mockPaymentData);
  }, [searchParams]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleGoToSubscriptions = () => {
    router.push('/assinatura');
  };

  const handleDownloadReceipt = () => {
    // Simular download do recibo
    const receiptData = {
      ...paymentData,
      company: 'ERP Lite',
      address: 'Rua Exemplo, 123 - São Paulo, SP',
      cnpj: '12.345.678/0001-90'
    };

    const receiptText = `
RECIBO DE PAGAMENTO
==================

Empresa: ${receiptData.company}
CNPJ: ${receiptData.cnpj}
Endereço: ${receiptData.address}

DADOS DO PAGAMENTO
==================
Plano: ${receiptData.planName}
Valor: R$ ${receiptData.amount}
Método: Cartão de Crédito
ID da Transação: ${receiptData.transactionId}
Data: ${new Date(receiptData.timestamp).toLocaleString('pt-BR')}
Status: ${receiptData.status === 'completed' ? 'Aprovado' : 'Pendente'}

Obrigado pela sua assinatura!
    `.trim();

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo-${receiptData.transactionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header de Sucesso */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pagamento Aprovado!
          </h1>
          <p className="text-gray-600">
            Sua assinatura foi ativada com sucesso
          </p>
        </div>

        {/* Card de Confirmação */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Detalhes do Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Plano</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold">{paymentData.planName}</span>
                  <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Valor</label>
                <p className="font-semibold text-lg">R$ {paymentData.amount}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Método de Pagamento</label>
                <p className="font-medium">Cartão de Crédito</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ID da Transação</label>
                <p className="font-mono text-sm">{paymentData.transactionId}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Data do Pagamento</label>
              <p className="font-medium">
                {new Date(paymentData.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Próximos Passos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">1</span>
                </div>
                <div>
                  <p className="font-medium">Acesso Imediato</p>
                  <p className="text-sm text-gray-600">
                    Seu plano já está ativo e você pode usar todas as funcionalidades
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">2</span>
                </div>
                <div>
                  <p className="font-medium">Renovação Automática</p>
                  <p className="text-sm text-gray-600">
                    Sua assinatura será renovada automaticamente no próximo mês
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">3</span>
                </div>
                <div>
                  <p className="font-medium">Suporte Prioritário</p>
                  <p className="text-sm text-gray-600">
                    Entre em contato conosco se precisar de ajuda
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleGoToDashboard}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Home className="h-4 w-4 mr-2" />
            Ir para Dashboard
          </Button>
          
          <Button
            onClick={handleGoToSubscriptions}
            variant="outline"
            className="flex-1"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Ver Assinaturas
          </Button>
          
          <Button
            onClick={handleDownloadReceipt}
            variant="outline"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Recibo
          </Button>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Um e-mail de confirmação foi enviado para você com todos os detalhes.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Em caso de dúvidas, entre em contato conosco.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PagamentoSucessoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PagamentoSucessoContent />
    </Suspense>
  );
}
