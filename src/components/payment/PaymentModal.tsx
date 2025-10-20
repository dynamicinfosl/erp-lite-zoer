'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Lock, 
  CheckCircle, 
  Loader2, 
  X,
  Calendar,
  User,
  Shield
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
    popular?: boolean;
  };
  onPaymentSuccess: (paymentData: any) => void;
}

interface PaymentFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  cpf: string;
  email: string;
  phone: string;
}

export function PaymentModal({ isOpen, onClose, plan, onPaymentSuccess }: PaymentModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    cpf: '',
    email: '',
    phone: ''
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [error, setError] = useState<string | null>(null);

  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiryDate = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/');
  };

  const formatCPF = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const validateForm = () => {
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 16) {
      setError('Número do cartão inválido');
      return false;
    }
    if (!formData.expiryDate || formData.expiryDate.length < 5) {
      setError('Data de validade inválida');
      return false;
    }
    if (!formData.cvv || formData.cvv.length < 3) {
      setError('CVV inválido');
      return false;
    }
    if (!formData.cardholderName.trim()) {
      setError('Nome do portador é obrigatório');
      return false;
    }
    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length < 11) {
      setError('CPF inválido');
      return false;
    }
    if (!formData.email.trim()) {
      setError('E-mail é obrigatório');
      return false;
    }
    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 10) {
      setError('Telefone inválido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsProcessing(true);
      setStep('processing');
      setError(null);

      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simular sucesso do pagamento
      const paymentData = {
        planId: plan.id,
        amount: plan.price,
        status: 'completed',
        transactionId: `tx_${Date.now()}`,
        paymentMethod: 'credit_card',
        timestamp: new Date().toISOString()
      };

      setStep('success');
      
      // Chamar callback de sucesso
      onPaymentSuccess(paymentData);
      
      // Redirecionar para página de sucesso após 2 segundos
      setTimeout(() => {
        router.push(`/pagamento-sucesso?plan=${plan.id}&amount=${plan.price}&transaction_id=${paymentData.transactionId}`);
      }, 2000);

    } catch (error) {
      console.error('Erro no pagamento:', error);
      setError('Erro ao processar pagamento. Tente novamente.');
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (step === 'processing') return; // Não permitir fechar durante processamento
    setStep('form');
    setError(null);
    onClose();
  };

  const resetForm = () => {
    setFormData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      cpf: '',
      email: '',
      phone: ''
    });
    setStep('form');
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Finalizar Assinatura
          </DialogTitle>
          <DialogDescription>
            Complete o pagamento para ativar seu plano {plan.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resumo do Plano */}
          <div className="space-y-4">
            <Card className="border-2 border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.popular && (
                    <Badge className="bg-blue-600 text-white">Mais Popular</Badge>
                  )}
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  R$ {plan.price.toFixed(2).replace('.', ',')}/mês
                </div>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Informações de Segurança */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 text-sm">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Pagamento 100% Seguro</span>
              </div>
              <p className="text-green-700 text-xs mt-1">
                Seus dados são criptografados e protegidos por SSL
              </p>
            </div>
          </div>

          {/* Formulário de Pagamento */}
          <div className="space-y-4">
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Dados do Cartão */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Dados do Cartão</h3>
                  
                  <div>
                    <Label htmlFor="cardNumber">Número do Cartão</Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })}
                      maxLength={19}
                      className="font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="expiryDate">Validade</Label>
                      <Input
                        id="expiryDate"
                        type="text"
                        placeholder="MM/AA"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: formatExpiryDate(e.target.value) })}
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="text"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cardholderName">Nome no Cartão</Label>
                    <Input
                      id="cardholderName"
                      type="text"
                      placeholder="Nome como está no cartão"
                      value={formData.cardholderName}
                      onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                <Separator />

                {/* Dados Pessoais */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Dados Pessoais</h3>
                  
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                      maxLength={14}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="text"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      maxLength={15}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Pagar R$ {plan.price.toFixed(2).replace('.', ',')}
                  </Button>
                </div>
              </form>
            )}

            {step === 'processing' && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Processando Pagamento
                </h3>
                <p className="text-gray-600">
                  Aguarde enquanto processamos seu pagamento...
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Pagamento Aprovado!
                </h3>
                <p className="text-gray-600 mb-4">
                  Sua assinatura do plano {plan.name} foi ativada com sucesso.
                </p>
                <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
                  Continuar
                </Button>
              </div>
            )}

            {step === 'error' && (
              <div className="text-center py-8">
                <X className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Erro no Pagamento
                </h3>
                <p className="text-gray-600 mb-4">
                  {error || 'Ocorreu um erro ao processar seu pagamento.'}
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={resetForm}>
                    Tentar Novamente
                  </Button>
                  <Button onClick={handleClose}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
