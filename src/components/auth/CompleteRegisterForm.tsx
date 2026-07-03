'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
  MapPinIcon,
  Lock,
  Home,
  Briefcase,
  Info,
  Check,
  Building,
  Sparkles
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
    description: 'Ideal para pequenas empresas e MEI',
    price: 79.90,
    features: ['Gestão de produtos', 'Gestão de clientes', 'Relatórios básicos', 'Suporte por email'],
    max_users: 1,
    max_products: 100,
    max_customers: 1000,
  },
  {
    id: 'professional',
    name: 'Profissional',
    description: 'Para empresas em crescimento acelerado',
    price: 139.90,
    features: ['Tudo do Básico', 'Múltiplos usuários (até 5)', 'Relatórios avançados', 'Integração com APIs', 'Suporte prioritário'],
    max_users: 5,
    max_products: 1000,
    max_customers: 10000,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solução completa sob medida',
    price: 199.90,
    features: ['Tudo do Profissional', 'Usuários ilimitados', 'Produtos ilimitados', 'Clientes ilimitados', 'Suporte 24/7 dedicado', 'Customizações exclusivas'],
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
    setSelectedPlan(PLANS[1]); // Seleciona o Profissional como padrão
    setError(null);
    setAcceptedTerms(false);
    setCurrentStep(1);
  };

  // Dados do formulário
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

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(PLANS[1]);

  const progress = (currentStep / STEPS.length) * 100;

  // Busca de CEP por ViaCEP
  useEffect(() => {
    const cleanCep = addressData.zip_code.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      const fetchCepData = async () => {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await res.json();
          if (data.erro) {
            toast.error('CEP não localizado. Insira os dados manualmente.');
            return;
          }
          setAddressData(prev => ({
            ...prev,
            address: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '',
          }));
          toast.success('Endereço autocompletado com sucesso!');
        } catch (err) {
          console.error('Erro de rede ao buscar CEP:', err);
        }
      };
      fetchCepData();
    }
  }, [addressData.zip_code]);

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
          setError('Preencha os campos obrigatórios.');
          return false;
        }
        if (responsibleData.password !== responsibleData.confirmPassword) {
          setError('As senhas digitadas não coincidem.');
          return false;
        }
        if (responsibleData.password.length < 6) {
          setError('A senha deve conter no mínimo 6 caracteres.');
          return false;
        }
        break;
      case 2:
        if (!companyData.name || !companyData.document) {
          setError('Razão Social e Documento da Empresa são obrigatórios.');
          return false;
        }
        break;
      case 3:
        if (!addressData.zip_code || !addressData.address || !addressData.number || !addressData.city || !addressData.state) {
          setError('Campos obrigatórios de endereço estão pendentes.');
          return false;
        }
        break;
      case 4:
        if (!selectedPlan) {
          setError('Selecione um plano para continuar.');
          return false;
        }
        break;
      case 5:
        if (!acceptedTerms) {
          setError('É necessário aceitar os termos de uso.');
          return false;
        }
        break;
    }
    setError(null);
    return true;
  };

  useEffect(() => {
    clearForm();
  }, []);

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
        let errorMessage = 'Erro ao realizar cadastro';
        if (result.error) {
          if (result.error.includes('User already registered') || result.error.includes('already exists')) {
            errorMessage = 'Este endereço de e-mail já está em uso.';
          } else {
            errorMessage = result.error;
          }
        }
        throw new Error(errorMessage);
      }

      toast.success('Empresa registrada com sucesso!');
      clearForm();
      
      setTimeout(() => {
        onSuccess?.();
      }, 1200);
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      setError(err.message || 'Houve um erro no servidor de rede.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDocument = (value: string, type: 'CNPJ' | 'CPF') => {
    const numbers = value.replace(/\D/g, '');
    if (type === 'CNPJ') {
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
      if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
      if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
    } else {
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    const limitedNumbers = numbers.slice(0, 11);
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const validateCPF = (cpf: string) => cpf.replace(/\D/g, '').length === 11;
  const validateCNPJ = (cnpj: string) => cnpj.replace(/\D/g, '').length === 14;
  const validatePhoneLength = (phone: string) => {
    const len = phone.replace(/\D/g, '').length;
    return len === 10 || len === 11;
  };

  // Render Step 1
  const renderStep1 = () => (
    <div className="space-y-4 animate-fadeIn text-slate-800">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Completo *</Label>
        <div className="relative group">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <Input
            id="name"
            value={responsibleData.name}
            onChange={(e) => setResponsibleData({ ...responsibleData, name: e.target.value })}
            placeholder="Digite seu nome completo"
            className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail *</Label>
        <div className="relative group">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <Input
            id="email"
            type="email"
            value={responsibleData.email}
            onChange={(e) => setResponsibleData({ ...responsibleData, email: e.target.value })}
            placeholder="nome@exemplo.com"
            autoComplete="off"
            className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefone</Label>
          <div className="relative group">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              id="phone"
              value={responsibleData.phone}
              onChange={(e) => setResponsibleData({ ...responsibleData, phone: formatPhone(e.target.value) })}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className={`pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm ${
                responsibleData.phone && !validatePhoneLength(responsibleData.phone) ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50' : ''
              }`}
            />
          </div>
          {responsibleData.phone && !validatePhoneLength(responsibleData.phone) && (
            <p className="text-[11px] text-red-500 font-medium">Formato inválido. Deve ter 10 ou 11 dígitos.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cpf" className="text-xs font-bold text-slate-500 uppercase tracking-wider">CPF (Opcional)</Label>
          <div className="relative group">
            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              id="cpf"
              value={responsibleData.cpf}
              onChange={(e) => setResponsibleData({ ...responsibleData, cpf: formatDocument(e.target.value, 'CPF') })}
              placeholder="000.000.000-00"
              maxLength={14}
              className={`pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm ${
                responsibleData.cpf && !validateCPF(responsibleData.cpf) ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50' : ''
              }`}
            />
          </div>
          {responsibleData.cpf && !validateCPF(responsibleData.cpf) && (
            <p className="text-[11px] text-red-500 font-medium">CPF inválido. Deve conter 11 dígitos.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Senha *</Label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              id="password"
              type="password"
              value={responsibleData.password}
              onChange={(e) => setResponsibleData({ ...responsibleData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmar Senha *</Label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              id="confirmPassword"
              type="password"
              value={responsibleData.confirmPassword}
              onChange={(e) => setResponsibleData({ ...responsibleData, confirmPassword: e.target.value })}
              placeholder="Repita sua senha"
              className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 2
  const renderStep2 = () => (
    <div className="space-y-4 animate-fadeIn text-slate-800">
      <div className="space-y-1.5">
        <Label htmlFor="companyName" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Razão Social / Nome da Empresa *</Label>
        <div className="relative group">
          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <Input
            id="companyName"
            value={companyData.name}
            onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
            placeholder="Razão social oficial"
            className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fantasyName" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Fantasia (Opcional)</Label>
        <div className="relative group">
          <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <Input
            id="fantasyName"
            value={companyData.fantasy_name}
            onChange={(e) => setCompanyData({ ...companyData, fantasy_name: e.target.value })}
            placeholder="Nome fantasia comercial"
            className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Documento</Label>
          <Select
            value={companyData.document_type}
            onValueChange={(value: 'CNPJ' | 'CPF') => setCompanyData({ ...companyData, document_type: value, document: '' })}
          >
            <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-12 rounded-xl focus:ring-1 focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50 bg-white border-slate-200 text-slate-900 shadow-2xl">
              <SelectItem value="CNPJ" className="cursor-pointer hover:bg-slate-100">CNPJ</SelectItem>
              <SelectItem value="CPF" className="cursor-pointer hover:bg-slate-100">CPF (Autônomo/MEI)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="document" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {companyData.document_type} *
          </Label>
          <div className="relative group">
            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              id="document"
              value={companyData.document}
              onChange={(e) => setCompanyData({ 
                ...companyData, 
                document: formatDocument(e.target.value, companyData.document_type) 
              })}
              placeholder={companyData.document_type === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'}
              maxLength={companyData.document_type === 'CNPJ' ? 18 : 14}
              className={`pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm ${
                companyData.document && (
                  (companyData.document_type === 'CNPJ' && !validateCNPJ(companyData.document)) ||
                  (companyData.document_type === 'CPF' && !validateCPF(companyData.document))
                ) ? 'border-red-500/50 focus:border-red-500' : ''
              }`}
            />
          </div>
          {companyData.document && (
            (companyData.document_type === 'CNPJ' && !validateCNPJ(companyData.document)) ||
            (companyData.document_type === 'CPF' && !validateCPF(companyData.document))
          ) && (
            <p className="text-[11px] text-red-500 font-medium">
              {companyData.document_type === 'CNPJ' ? 'CNPJ deve conter 14 dígitos.' : 'CPF deve conter 11 dígitos.'}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="corporateEmail" className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail Corporativo</Label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              id="corporateEmail"
              type="email"
              value={companyData.corporate_email}
              onChange={(e) => setCompanyData({ ...companyData, corporate_email: e.target.value })}
              placeholder="financeiro@empresa.com"
              className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="corporatePhone" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefone Corporativo</Label>
          <div className="relative group">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              id="corporatePhone"
              value={companyData.corporate_phone}
              onChange={(e) => setCompanyData({ ...companyData, corporate_phone: formatPhone(e.target.value) })}
              placeholder="(00) 0000-0000"
              maxLength={15}
              className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 3
  const renderStep3 = () => (
    <div className="space-y-4 animate-fadeIn text-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="zipCode" className="text-xs font-bold text-slate-500 uppercase tracking-wider">CEP *</Label>
          <div className="relative group">
            <MapPinIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              id="zipCode"
              value={addressData.zip_code}
              onChange={(e) => setAddressData({ ...addressData, zip_code: formatZipCode(e.target.value) })}
              placeholder="00000-000"
              maxLength={9}
              className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="number" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Número *</Label>
          <div className="relative group">
            <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              id="number"
              value={addressData.number}
              onChange={(e) => setAddressData({ ...addressData, number: e.target.value })}
              placeholder="Nº ou S/N"
              className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Endereço (Rua/Avenida) *</Label>
        <div className="relative group">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <Input
            id="address"
            value={addressData.address}
            onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
            placeholder="Nome do logradouro"
            className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="complement" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Complemento (Opcional)</Label>
          <div className="relative group">
            <Info className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              id="complement"
              value={addressData.complement}
              onChange={(e) => setAddressData({ ...addressData, complement: e.target.value })}
              placeholder="Ex: Apto 101, Bloco B"
              className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="neighborhood" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bairro</Label>
          <div className="relative group">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              id="neighborhood"
              value={addressData.neighborhood}
              onChange={(e) => setAddressData({ ...addressData, neighborhood: e.target.value })}
              placeholder="Nome do bairro"
              className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cidade *</Label>
          <div className="relative group">
            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              id="city"
              value={addressData.city}
              onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
              placeholder="Cidade"
              className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="state" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado *</Label>
          <div className="relative group">
            <MapPinIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              id="state"
              value={addressData.state}
              onChange={(e) => setAddressData({ ...addressData, state: e.target.value.toUpperCase() })}
              placeholder="Ex: SP"
              maxLength={2}
              className="pl-11 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 transition-all rounded-xl shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 4
  const renderStep4 = () => (
    <div className="space-y-5 animate-fadeIn text-slate-800">
      <div className="text-center pb-2">
        <p className="text-xs text-blue-600 font-bold tracking-wider uppercase">Faturamento Flexível</p>
        <h4 className="text-lg font-extrabold text-slate-900 mt-1">Selecione o plano ideal</h4>
        <p className="text-slate-500 text-xs mt-1">Todos os planos iniciam com 3 dias grátis, cancele quando quiser</p>
      </div>

      <div className="space-y-3.5">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan?.id === plan.id;
          return (
            <div 
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`relative overflow-hidden cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 ${
                isSelected 
                  ? 'bg-blue-50/50 border-blue-500 shadow-lg shadow-slate-200/50' 
                  : 'bg-white border-slate-200 hover:bg-slate-50/50 hover:border-slate-350'
              }`}
            >
              {plan.id === 'professional' && (
                <div className="absolute top-0 right-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    Recomendado
                  </span>
                </div>
              )}
              
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 tracking-tight">{plan.name}</span>
                    {isSelected && (
                      <span className="h-4.5 w-4.5 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white stroke-[3px]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm">{plan.description}</p>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-black text-slate-900">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">/mês</span>
                </div>
              </div>

              {/* Limites em badges */}
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100/70 border border-slate-200/40 px-2 py-0.5 rounded-md">
                  Usuários: {plan.max_users === -1 ? 'Ilimitado' : plan.max_users}
                </span>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100/70 border border-slate-200/40 px-2 py-0.5 rounded-md">
                  Produtos: {plan.max_products === -1 ? 'Ilimitado' : plan.max_products}
                </span>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100/70 border border-slate-200/40 px-2 py-0.5 rounded-md">
                  Clientes: {plan.max_customers === -1 ? 'Ilimitado' : plan.max_customers}
                </span>
              </div>

              {/* Recursos */}
              <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-y-1.5 gap-x-4">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                    <CheckCircle className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render Step 5
  const renderStep5 = () => (
    <div className="space-y-5 animate-fadeIn text-slate-800">
      <div className="text-center">
        <h4 className="text-lg font-bold text-slate-900">Revisão de Informações</h4>
        <p className="text-xs text-slate-500 mt-0.5">Confirme seus dados antes de concluir</p>
      </div>

      <div className="space-y-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl p-5 md:p-6 divide-y divide-slate-200">
        {/* Responsável */}
        <div className="pb-3 space-y-2">
          <h5 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
            <User className="h-3 w-3" />
            Dados do Responsável
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <p className="text-slate-500 font-medium">Nome: <span className="text-slate-900 font-semibold">{responsibleData.name}</span></p>
            <p className="text-slate-500 font-medium">E-mail: <span className="text-slate-900 font-semibold">{responsibleData.email}</span></p>
            <p className="text-slate-500 font-medium">Fone: <span className="text-slate-900 font-semibold">{responsibleData.phone || 'Não informado'}</span></p>
            <p className="text-slate-500 font-medium">CPF: <span className="text-slate-900 font-semibold">{responsibleData.cpf || 'Não informado'}</span></p>
          </div>
        </div>

        {/* Empresa */}
        <div className="py-3.5 space-y-2">
          <h5 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
            <Building2 className="h-3 w-3" />
            Empresa
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <p className="text-slate-500 font-medium">Razão Social: <span className="text-slate-900 font-semibold">{companyData.name}</span></p>
            <p className="text-slate-500 font-medium">Nome Fantasia: <span className="text-slate-900 font-semibold">{companyData.fantasy_name || 'Não informado'}</span></p>
            <p className="text-slate-500 font-medium">Doc: <span className="text-slate-900 font-semibold">{companyData.document} ({companyData.document_type})</span></p>
            <p className="text-slate-500 font-medium">E-mail Corp: <span className="text-slate-900 font-semibold">{companyData.corporate_email || 'Não informado'}</span></p>
          </div>
        </div>

        {/* Endereço */}
        <div className="py-3.5 space-y-2">
          <h5 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
            <MapPinIcon className="h-3 w-3" />
            Endereço Principal
          </h5>
          <div className="text-xs space-y-1">
            <p className="text-slate-500 font-medium">
              Logradouro:{' '}
              <span className="text-slate-900 font-semibold">
                {addressData.address}, Nº {addressData.number}
                {addressData.complement ? ` - ${addressData.complement}` : ''}
              </span>
            </p>
            <p className="text-slate-500 font-medium">
              Bairro/Cidade:{' '}
              <span className="text-slate-900 font-semibold">
                {addressData.neighborhood ? `${addressData.neighborhood}, ` : ''}
                {addressData.city} - {addressData.state}
              </span>
            </p>
            <p className="text-slate-500 font-medium">CEP: <span className="text-slate-900 font-semibold">{addressData.zip_code}</span></p>
          </div>
        </div>

        {/* Plano */}
        <div className="pt-3.5 space-y-2">
          <h5 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
            <CreditCard className="h-3 w-3" />
            Plano Escolhido
          </h5>
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3.5">
            <div>
              <p className="text-xs font-bold text-slate-900">{selectedPlan?.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{selectedPlan?.description}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-blue-600">R$ {selectedPlan?.price.toFixed(2).replace('.', ',')}/mês</span>
              <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">3 dias de teste grátis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Termos de uso */}
      <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 md:p-5">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            className="mt-0.5 border-slate-300 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <div className="grid gap-1">
            <label
              htmlFor="terms"
              className="text-xs font-semibold leading-none text-slate-800 cursor-pointer select-none"
            >
              Declaro que li e concordo com os Termos de Uso
            </label>
            <p className="text-[11px] text-slate-500 leading-normal">
              Ao concluir o cadastro, você concorda com nossos{' '}
              <a href="#" className="text-blue-600 hover:underline font-bold transition-all">Termos de Serviço</a> e{' '}
              <a href="#" className="text-blue-600 hover:underline font-bold transition-all">Políticas de Privacidade</a>.
            </p>
          </div>
        </div>
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
      <div className="space-y-6">
        {/* Stepper info */}
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Cadastro Empresarial</span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Criar Nova Conta</h2>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500">Passo {currentStep} de {STEPS.length}</span>
              <p className="text-[10px] text-slate-400 font-medium">{Math.round(progress)}% completo</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="relative w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Stepper Dots (Tema claro) */}
          <div className="flex justify-between items-center gap-1.5 pt-1.5">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div 
                  key={step.id} 
                  className={`flex flex-col items-center flex-1 transition-all ${
                    isActive ? 'scale-105' : ''
                  }`}
                >
                  <div 
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all border ${
                      isActive 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/10' 
                        : isCompleted
                        ? 'bg-indigo-50 border-indigo-200/50 text-indigo-600'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className={`hidden md:block text-[9px] font-bold uppercase tracking-wider mt-1 text-center truncate w-full ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-indigo-600/80' : 'text-slate-400'
                  }`}>
                    {step.title.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container Card */}
        <Card className="bg-white border border-slate-200/85 rounded-2xl shadow-xl shadow-slate-100 relative overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-6">
            
            {/* Erros */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs font-semibold text-red-600 flex items-start gap-2.5">
                <Info className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Passo ativo */}
            {renderCurrentStep()}

            {/* Ações */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 h-11 px-5 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/10 h-11 px-6 rounded-xl transition-all active:scale-95 shrink-0"
                >
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold shadow-lg shadow-green-500/10 h-11 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Concluir Registro
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Link para login */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Já possui uma conta ativa?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-colors ml-0.5"
            >
              Fazer Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
