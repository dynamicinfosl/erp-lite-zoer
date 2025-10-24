'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building2, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Mail,
  Phone,
  FileText,
  MapPinIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  max_users: number;
  max_products: number;
  max_customers: number;
}

interface CompleteRegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

interface ResponsibleData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  password: string;
  confirmPassword: string;
}

interface CompanyData {
  name: string;
  fantasy_name: string;
  document: string;
  document_type: 'CNPJ' | 'CPF';
  corporate_email: string;
  corporate_phone: string;
}

interface AddressData {
  zip_code: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

const STEPS = [
  { id: 1, title: 'Dados do Responsável', icon: User },
  { id: 2, title: 'Dados da Empresa', icon: Building2 },
  { id: 3, title: 'Endereço', icon: MapPin },
  { id: 4, title: 'Escolher Plano', icon: CreditCard },
  { id: 5, title: 'Confirmação', icon: CheckCircle },
];

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    description: 'Ideal para pequenas empresas',
    price: 29.90,
    features: ['Gestão de produtos', 'Gestão de clientes', 'Relatórios básicos', 'Suporte por email'],
    max_users: 1,
    max_products: 100,
    max_customers: 1000,
  },
  {
    id: 'professional',
    name: 'Profissional',
    description: 'Para empresas em crescimento',
    price: 59.90,
    features: ['Tudo do Básico', 'Múltiplos usuários', 'Relatórios avançados', 'Integração com APIs', 'Suporte prioritário'],
    max_users: 5,
    max_products: 1000,
    max_customers: 10000,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solução completa para grandes empresas',
    price: 99.90,
    features: ['Tudo do Profissional', 'Usuários ilimitados', 'Produtos ilimitados', 'Clientes ilimitados', 'Suporte 24/7', 'Customizações'],
    max_users: -1,
    max_products: -1,
    max_customers: -1,
  },
];

export function CompleteRegisterForm({ onSuccess, onSwitchToLogin }: CompleteRegisterFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Função para limpar completamente o formulário
  const clearForm = () => {
    setResponsibleData({
      name: '',
      email: '',
      phone: '',
      cpf: '',
      password: '',
      confirmPassword: '',
    });
    setCompanyData({
      name: '',
      fantasy_name: '',
      document: '',
      document_type: 'CNPJ',
      corporate_email: '',
      corporate_phone: '',
    });
    setAddressData({
      zip_code: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    });
    setSelectedPlan(null);
    setError(null);
    setAcceptedTerms(false);
    setCurrentStep(1);
  };

  // Dados do formulário - garantindo que sempre iniciem vazios
  const [responsibleData, setResponsibleData] = useState<ResponsibleData>({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    password: '',
    confirmPassword: '',
  });

  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    fantasy_name: '',
    document: '',
    document_type: 'CNPJ',
    corporate_email: '',
    corporate_phone: '',
  });

  const [addressData, setAddressData] = useState<AddressData>({
    zip_code: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const progress = (currentStep / STEPS.length) * 100;

  // Validação sem efeitos colaterais (não altera estado de erro)
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!responsibleData.name || !responsibleData.email || !responsibleData.password) return false;
        if (responsibleData.password !== responsibleData.confirmPassword) return false;
        if (responsibleData.password.length < 6) return false;
        return true;
      case 2:
        return !!(companyData.name && companyData.document);
      case 3:
        return !!(
          addressData.zip_code &&
          addressData.address &&
          addressData.number &&
          addressData.city &&
          addressData.state
        );
      case 4:
        return !!selectedPlan;
      case 5:
        return !!acceptedTerms;
      default:
        return true;
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!responsibleData.name || !responsibleData.email || !responsibleData.password) {
          setError('Preencha todos os campos obrigatórios');
          return false;
        }
        if (responsibleData.password !== responsibleData.confirmPassword) {
          setError('As senhas não coincidem');
          return false;
        }
        if (responsibleData.password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres');
          return false;
        }
        break;
      case 2:
        if (!companyData.name || !companyData.document) {
          setError('Preencha todos os campos obrigatórios');
          return false;
        }
        break;
      case 3:
        if (!addressData.zip_code || !addressData.address || !addressData.number || !addressData.city || !addressData.state) {
          setError('Preencha todos os campos obrigatórios');
          return false;
        }
        break;
      case 4:
        if (!selectedPlan) {
          setError('Selecione um plano');
          return false;
        }
        break;
      case 5:
        if (!acceptedTerms) {
          setError('Você deve aceitar os termos de uso');
          return false;
        }
        break;
    }
    setError(null);
    return true;
  };

  // Limpa o formulário quando o componente for montado
  useEffect(() => {
    // Limpeza simples e eficaz
    clearForm();
  }, []);


  // Limpa o erro automaticamente quando os campos da etapa atual ficarem válidos
  useEffect(() => {
    if (error && isStepValid(currentStep)) {
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, responsibleData, companyData, addressData, selectedPlan, acceptedTerms]);

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    try {
      setIsLoading(true);
      setError(null);

      const registrationData = {
        responsible: {
          name: responsibleData.name,
          email: responsibleData.email,
          phone: responsibleData.phone || undefined,
          cpf: responsibleData.cpf || undefined,
          password: responsibleData.password,
        },
        company: {
          name: companyData.name,
          fantasy_name: companyData.fantasy_name || undefined,
          document: companyData.document,
          document_type: companyData.document_type,
          corporate_email: companyData.corporate_email || undefined,
          corporate_phone: companyData.corporate_phone || undefined,
        },
        address: {
          zip_code: addressData.zip_code,
          address: addressData.address,
          number: addressData.number,
          complement: addressData.complement || undefined,
          neighborhood: addressData.neighborhood || undefined,
          city: addressData.city,
          state: addressData.state,
        },
        plan_id: selectedPlan?.id || 'basic',
      };

      const response = await fetch('/next_api/register-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Tratamento específico de erros
        let errorMessage = 'Erro ao realizar cadastro';
        
        if (result.error) {
          if (result.error.includes('Invalid login credentials')) {
            errorMessage = 'Erro de configuração do servidor. Tente novamente em alguns minutos.';
          } else if (result.error.includes('User already registered') || result.error.includes('already exists')) {
            errorMessage = 'Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.';
          } else if (result.error.includes('Invalid verification code')) {
            errorMessage = 'Código de verificação inválido. Tente novamente.';
          } else if (result.error.includes('Dados do responsável são obrigatórios')) {
            errorMessage = 'Preencha todos os dados do responsável.';
          } else if (result.error.includes('Dados da empresa são obrigatórios')) {
            errorMessage = 'Preencha todos os dados da empresa.';
          } else if (result.error.includes('Endereço completo é obrigatório')) {
            errorMessage = 'Preencha todos os dados de endereço.';
          } else {
            errorMessage = result.error;
          }
        }
        
        throw new Error(errorMessage);
      }

      toast.success('Cadastro realizado com sucesso!');
      
      // Limpar dados do formulário após sucesso
      clearForm();
      
      // Pequeno delay para garantir que o toast seja exibido
      setTimeout(() => {
        onSuccess?.();
      }, 1000);
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      setError(err.message || 'Erro ao realizar cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDocument = (value: string, type: 'CNPJ' | 'CPF') => {
    const numbers = value.replace(/\D/g, '');
    if (type === 'CNPJ') {
      // CNPJ: 14 dígitos - 00.000.000/0000-00
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
      if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
      if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
    } else {
      // CPF: 11 dígitos - 000.000.000-00
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    // Telefone fixo: 10 dígitos - (00) 0000-0000
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    
    // Celular: 11 dígitos - (00) 00000-0000
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);
    if (limitedNumbers.length <= 2) return limitedNumbers;
    if (limitedNumbers.length <= 6) return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    if (limitedNumbers.length <= 10) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`;
    }
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  // Funções de validação
  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    return numbers.length === 11;
  };

  const validatePhone = (phone: string): boolean => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length === 10 || numbers.length === 11;
  };

  const validateCNPJ = (cnpj: string): boolean => {
    const numbers = cnpj.replace(/\D/g, '');
    return numbers.length === 14;
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-gray-900 font-semibold">Nome Completo *</Label>
        <Input
          id="name"
          value={responsibleData.name}
          onChange={(e) => setResponsibleData({ ...responsibleData, name: e.target.value })}
          placeholder="Seu nome completo"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-900 font-semibold">E-mail *</Label>
        <Input
          id="email"
          type="email"
          value={responsibleData.email}
          onChange={(e) => setResponsibleData({ ...responsibleData, email: e.target.value })}
          placeholder="seu@email.com"
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-gray-900 font-semibold">Telefone</Label>
          <Input
            id="phone"
            value={responsibleData.phone}
            onChange={(e) => {
              const newValue = e.target.value;
              setResponsibleData({ 
                ...responsibleData, 
                phone: formatPhone(newValue) 
              });
            }}
            placeholder="(21) 98765-4321"
            maxLength={15}
            autoComplete="off"
            className={responsibleData.phone && !validatePhone(responsibleData.phone) ? 'border-red-400 focus:border-red-400' : ''}
          />
          {responsibleData.phone && !validatePhone(responsibleData.phone) && (
            <p className="text-sm text-red-400">Telefone deve ter 10 ou 11 dígitos</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf" className="text-gray-900 font-semibold">CPF (opcional)</Label>
          <Input
            id="cpf"
            value={responsibleData.cpf}
            onChange={(e) => setResponsibleData({ 
              ...responsibleData, 
              cpf: formatDocument(e.target.value, 'CPF') 
            })}
            placeholder="000.000.000-00"
            maxLength={14}
            autoComplete="off"
            className={responsibleData.cpf && !validateCPF(responsibleData.cpf) ? 'border-red-400 focus:border-red-400' : ''}
          />
          {responsibleData.cpf && !validateCPF(responsibleData.cpf) && (
            <p className="text-sm text-red-400">CPF deve ter 11 dígitos</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-900 font-semibold">Senha *</Label>
          <Input
            id="password"
            type="password"
            value={responsibleData.password}
            onChange={(e) => setResponsibleData({ ...responsibleData, password: e.target.value })}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-900 font-semibold">Confirmar Senha *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={responsibleData.confirmPassword}
            onChange={(e) => setResponsibleData({ ...responsibleData, confirmPassword: e.target.value })}
            placeholder="Digite a senha novamente"
            autoComplete="new-password"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="companyName">Razão Social / Nome da Empresa *</Label>
        <Input
          id="companyName"
          value={companyData.name}
          onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
          placeholder="Nome oficial da empresa"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fantasyName">Nome Fantasia</Label>
        <Input
          id="fantasyName"
          value={companyData.fantasy_name}
          onChange={(e) => setCompanyData({ ...companyData, fantasy_name: e.target.value })}
          placeholder="Nome comercial da empresa"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="documentType">Tipo de Documento</Label>
          <Select
            value={companyData.document_type}
            onValueChange={(value: 'CNPJ' | 'CPF') => setCompanyData({ ...companyData, document_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CNPJ">CNPJ</SelectItem>
              <SelectItem value="CPF">CPF (MEI)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="document">
            {companyData.document_type} *
          </Label>
          <Input
            id="document"
            value={companyData.document}
            onChange={(e) => setCompanyData({ 
              ...companyData, 
              document: formatDocument(e.target.value, companyData.document_type) 
            })}
            placeholder={companyData.document_type === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'}
            maxLength={companyData.document_type === 'CNPJ' ? 18 : 14}
            className={companyData.document && (
              (companyData.document_type === 'CNPJ' && !validateCNPJ(companyData.document)) ||
              (companyData.document_type === 'CPF' && !validateCPF(companyData.document))
            ) ? 'border-red-400 focus:border-red-400' : ''}
          />
          {companyData.document && (
            (companyData.document_type === 'CNPJ' && !validateCNPJ(companyData.document)) ||
            (companyData.document_type === 'CPF' && !validateCPF(companyData.document))
          ) && (
            <p className="text-sm text-red-400">
              {companyData.document_type === 'CNPJ' ? 'CNPJ deve ter 14 dígitos' : 'CPF deve ter 11 dígitos'}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="corporateEmail">E-mail Corporativo</Label>
          <Input
            id="corporateEmail"
            type="email"
            value={companyData.corporate_email}
            onChange={(e) => setCompanyData({ ...companyData, corporate_email: e.target.value })}
            placeholder="contato@empresa.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="corporatePhone">Telefone Corporativo</Label>
          <Input
            id="corporatePhone"
            value={companyData.corporate_phone}
            onChange={(e) => setCompanyData({ 
              ...companyData, 
              corporate_phone: formatPhone(e.target.value) 
            })}
            placeholder="(21) 98765-4321"
            maxLength={15}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zipCode">CEP *</Label>
          <Input
            id="zipCode"
            value={addressData.zip_code}
            onChange={(e) => setAddressData({ 
              ...addressData, 
              zip_code: formatZipCode(e.target.value) 
            })}
            placeholder="00000-000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="number">Número *</Label>
          <Input
            id="number"
            value={addressData.number}
            onChange={(e) => setAddressData({ ...addressData, number: e.target.value })}
            placeholder="123"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Rua *</Label>
        <Input
          id="address"
          value={addressData.address}
          onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
          placeholder="Nome da rua"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={addressData.complement}
            onChange={(e) => setAddressData({ ...addressData, complement: e.target.value })}
            placeholder="Apto, sala, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input
            id="neighborhood"
            value={addressData.neighborhood}
            onChange={(e) => setAddressData({ ...addressData, neighborhood: e.target.value })}
            placeholder="Nome do bairro"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade *</Label>
          <Input
            id="city"
            value={addressData.city}
            onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
            placeholder="Rio de Janeiro"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">Estado *</Label>
          <Input
            id="state"
            value={addressData.state}
            onChange={(e) => setAddressData({ ...addressData, state: e.target.value.toUpperCase() })}
            placeholder="RJ"
            maxLength={2}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2 text-gray-900">Escolha seu plano</h3>
        <p className="text-gray-700 font-medium">Todos os planos incluem 14 dias de teste gratuito</p>
      </div>

      <div className="space-y-4">
        {PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`cursor-pointer transition-all border-2 ${
              selectedPlan?.id === plan.id 
                ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 shadow-lg' 
                : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
            }`}
            onClick={() => setSelectedPlan(plan)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base text-gray-900 font-bold">
                  <CreditCard className="h-4 w-4" />
                  {plan.name}
                </CardTitle>
                {selectedPlan?.id === plan.id && (
                  <Badge className="bg-blue-600 text-white font-semibold">Selecionado</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 mb-1 font-medium">{plan.description}</p>
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                    <span className="text-sm font-normal text-gray-600">/mês</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Recursos incluídos:</h4>
                <ul className="space-y-1 text-sm">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Confirmação dos Dados</h3>
        <p className="text-gray-600">Revise os dados antes de finalizar o cadastro</p>
      </div>

      <div className="space-y-4">
        <Card className="border-2 border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-gray-900 font-bold">
              <User className="h-4 w-4" />
              Dados do Responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-gray-900"><strong className="text-gray-800">Nome:</strong> <span className="text-gray-700">{responsibleData.name}</span></p>
            <p className="text-gray-900"><strong className="text-gray-800">E-mail:</strong> <span className="text-gray-700">{responsibleData.email}</span></p>
            <p className="text-gray-900"><strong className="text-gray-800">Telefone:</strong> <span className="text-gray-700">{responsibleData.phone || 'Não informado'}</span></p>
            <p className="text-gray-900"><strong className="text-gray-800">CPF:</strong> <span className="text-gray-700">{responsibleData.cpf || 'Não informado'}</span></p>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-gray-900 font-bold">
              <Building2 className="h-4 w-4" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-gray-900"><strong className="text-gray-800">Razão Social:</strong> <span className="text-gray-700">{companyData.name}</span></p>
            <p className="text-gray-900"><strong className="text-gray-800">Nome Fantasia:</strong> <span className="text-gray-700">{companyData.fantasy_name || 'Não informado'}</span></p>
            <p className="text-gray-900"><strong className="text-gray-800">Documento:</strong> <span className="text-gray-700">{companyData.document} ({companyData.document_type})</span></p>
            <p className="text-gray-900"><strong className="text-gray-800">E-mail Corporativo:</strong> <span className="text-gray-700">{companyData.corporate_email || 'Não informado'}</span></p>
            <p className="text-gray-900"><strong className="text-gray-800">Telefone Corporativo:</strong> <span className="text-gray-700">{companyData.corporate_phone || 'Não informado'}</span></p>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-gray-900 font-bold">
              <MapPinIcon className="h-4 w-4" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-gray-900"><strong className="text-gray-800">CEP:</strong> <span className="text-gray-700">{addressData.zip_code}</span></p>
            <p className="text-gray-900"><strong className="text-gray-800">Endereço:</strong> <span className="text-gray-700">{addressData.address}, {addressData.number}</span></p>
            <p className="text-gray-900"><strong className="text-gray-800">Complemento:</strong> <span className="text-gray-700">{addressData.complement || 'Não informado'}</span></p>
            <p className="text-gray-900"><strong className="text-gray-800">Bairro:</strong> <span className="text-gray-700">{addressData.neighborhood || 'Não informado'}</span></p>
            <p className="text-gray-900"><strong className="text-gray-800">Cidade/Estado:</strong> <span className="text-gray-700">{addressData.city}/{addressData.state}</span></p>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-gray-900 font-bold">
              <CreditCard className="h-4 w-4" />
              Plano Selecionado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-gray-900"><strong className="text-gray-800">Plano:</strong> <span className="text-gray-700">{selectedPlan?.name}</span></p>
            <p className="text-gray-900"><strong className="text-gray-800">Preço:</strong> <span className="text-gray-700">R$ {selectedPlan?.price.toFixed(2).replace('.', ',')}/mês</span></p>
            <p className="text-gray-900"><strong className="text-gray-800">Período de Teste:</strong> <span className="text-gray-700">14 dias gratuitos</span></p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="border-2 border-gray-200 shadow-md bg-gray-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="terms"
                  className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 cursor-pointer"
                >
                  Aceito os termos de uso e política de privacidade
                </label>
                <p className="text-sm text-gray-700">
                  Ao continuar, você concorda com nossos{' '}
                  <a href="#" className="text-blue-600 hover:underline font-medium">Termos de Uso</a> e{' '}
                  <a href="#" className="text-blue-600 hover:underline font-medium">Política de Privacidade</a>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-8">
        {/* Progress Section */}
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Cadastro da Empresa</h2>
            <p className="text-sm text-gray-600">Complete seu cadastro em poucos passos</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Etapa {currentStep} de {STEPS.length}</span>
              <span>{Math.round(progress)}% concluído</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex justify-between px-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center space-y-2 ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      currentStep >= step.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight max-w-[80px]">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardContent className="pt-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {renderCurrentStep()}

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
              >
                Próximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium shadow-md disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Finalizar Cadastro
                  </>
                )}
              </Button>
            )}
          </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Faça login
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
