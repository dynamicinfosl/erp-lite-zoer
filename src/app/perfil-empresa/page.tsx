'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Mail, Phone, MapPin, FileText, Save, Loader2, Search, Plus } from 'lucide-react';

interface TenantData {
  id: string;
  name: string;
  slug: string;
  status: string;
  // Dados gerais
  tipo?: string;
  document?: string; // CNPJ
  nome_fantasia?: string;
  razao_social?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  cnae_principal?: string;
  regime_tributario?: string;
  regime_especial?: string;
  // Contato
  email?: string;
  phone?: string;
  celular?: string;
  site?: string;
  // Endereço
  zip_code?: string;
  address?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  city?: string;
  state?: string;
  created_at?: string;
}

export default function PerfilEmpresaPage() {
  const { user, tenant: authTenant, loading: authLoading } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Funções de máscara
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 14);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 10);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  };

  const formatCelular = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8);
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  };
  
  const [formData, setFormData] = useState({
    // Dados gerais
    tipo: 'juridica',
    document: '',
    nome_fantasia: '',
    razao_social: '',
    inscricao_estadual: '',
    inscricao_municipal: '',
    cnae_principal: '',
    regime_tributario: '',
    regime_especial: '',
    // Contato
    email: '',
    phone: '',
    celular: '',
    site: '',
    // Endereço
    zip_code: '',
    address: '',
    numero: '',
    complemento: '',
    bairro: '',
    city: '',
    state: '',
  });

  const [originalFormData, setOriginalFormData] = useState(formData);

  const loadTenantData = useCallback(async () => {
    const fallbackTenantId = user?.id || '00000000-0000-0000-0000-000000000000';
    const tenantId = authTenant?.id || fallbackTenantId;
    try {
      setLoading(true);
      const response = await fetch(`/next_api/tenants?tenant_id=${tenantId}`);
      const result = await response.json();

      if (response.ok && result?.data) {
        const tenantData: TenantData = {
          ...result.data,
          slug: (result.data.slug ||
            result.data.name?.toLowerCase().replace(/\s+/g, '-') ||
            'minha-empresa') as string,
        };

        setTenant(tenantData);
        const loadedFormData = {
          tipo: tenantData.tipo || 'juridica',
          document: tenantData.document || '',
          nome_fantasia: tenantData.nome_fantasia || tenantData.name || '',
          razao_social: tenantData.razao_social || '',
          inscricao_estadual: tenantData.inscricao_estadual || '',
          inscricao_municipal: tenantData.inscricao_municipal || '',
          cnae_principal: tenantData.cnae_principal || '',
          regime_tributario: tenantData.regime_tributario || '',
          regime_especial: tenantData.regime_especial || '',
          email: tenantData.email || '',
          phone: tenantData.phone || '',
          celular: tenantData.celular || '',
          site: tenantData.site || '',
          zip_code: tenantData.zip_code || '',
          address: tenantData.address || '',
          numero: tenantData.numero || '',
          complemento: tenantData.complemento || '',
          bairro: tenantData.bairro || '',
          city: tenantData.city || '',
          state: tenantData.state || '',
        };

        setFormData(loadedFormData);
        setOriginalFormData(loadedFormData);
        return;
      }

      // Fallback caso não exista tenant salvo
      const baseTenant = authTenant
        ? ({
            ...authTenant,
            slug:
              authTenant.name?.toLowerCase().replace(/\s+/g, '-') ||
              'minha-empresa',
          } as TenantData)
        : ({
            id: tenantId,
            name: user?.email?.split('@')[0] || 'Minha Empresa',
            slug: 'minha-empresa',
            status: 'trial',
            tipo: 'juridica',
            email: user?.email || '',
          } as TenantData);

      setTenant(baseTenant);
      const defaultFormData = {
        tipo: baseTenant.tipo || 'juridica',
        document: baseTenant.document || '',
        nome_fantasia: baseTenant.nome_fantasia || baseTenant.name || '',
        razao_social: baseTenant.razao_social || '',
        inscricao_estadual: baseTenant.inscricao_estadual || '',
        inscricao_municipal: baseTenant.inscricao_municipal || '',
        cnae_principal: baseTenant.cnae_principal || '',
        regime_tributario: baseTenant.regime_tributario || '',
        regime_especial: baseTenant.regime_especial || '',
        email: baseTenant.email || '',
        phone: baseTenant.phone || '',
        celular: baseTenant.celular || '',
        site: baseTenant.site || '',
        zip_code: baseTenant.zip_code || '',
        address: baseTenant.address || '',
        numero: baseTenant.numero || '',
        complemento: baseTenant.complemento || '',
        bairro: baseTenant.bairro || '',
        city: baseTenant.city || '',
        state: baseTenant.state || '',
      };

      setFormData(defaultFormData);
      setOriginalFormData(defaultFormData);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [authTenant, user?.id, user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      setSaving(true);

      // Primeiro, verificar se o tenant existe
      const checkResponse = await fetch(`/next_api/tenants?tenant_id=${tenant.id}`);
      const checkResult = await checkResponse.json();

      let response;
      
      if (!checkResponse.ok || !checkResult.data) {
        // Tenant não existe, criar primeiro
        console.log('📝 Tenant não existe, criando...');
        response = await fetch('/next_api/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: tenant.id,
            name: formData.nome_fantasia || tenant.name,
            slug: (formData.nome_fantasia || tenant.name).toLowerCase().replace(/\s+/g, '-'),
            status: 'trial',
            ...formData,
          }),
        });
      } else {
        // Tenant existe, atualizar
        console.log('📝 Tenant existe, atualizando...');
        response = await fetch('/next_api/tenants', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: tenant.id,
            name: formData.nome_fantasia || tenant.name,
            ...formData,
          }),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar');
      }

      console.log('✅ Dados salvos com sucesso');
      setShowSuccessMessage(true);
      setOriginalFormData(formData);

      // Atualizar o tenant local com os dados salvos
      if (result.data) {
        setTenant(result.data);
      }

      await loadTenantData();
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Erro ao salvar dados: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    loadTenantData();
  }, [authTenant, authLoading, loadTenantData]);

  // Auto-esconder mensagem de sucesso após 5 segundos
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando informações da empresa...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Empresa não encontrada</CardTitle>
            <CardDescription>Não foi possível carregar os dados da empresa.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dados da Empresa</h1>
            <p className="text-muted-foreground">
              Gerencie as informações da sua empresa
            </p>
          </div>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-green-800 font-medium">Dados da empresa atualizados com sucesso!</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSuccessMessage(false)}
            className="text-green-600 hover:bg-green-100"
          >
            ✕
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="dados-gerais" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dados-gerais">Dados Gerais</TabsTrigger>
            <TabsTrigger value="contato">Contato</TabsTrigger>
            <TabsTrigger value="endereco">Endereço</TabsTrigger>
          </TabsList>

          {/* ABA: DADOS GERAIS */}
          <TabsContent value="dados-gerais" className="space-y-6">
            <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <FileText className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  Informações da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Linha 1: Tipo, CNPJ, Nome Fantasia */}
                <div className="grid md:grid-cols-[200px_1fr_1fr] gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo<span className="text-red-500">*</span></Label>
                    <select
                      id="tipo"
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="flex h-11 w-full rounded-md border border-input bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2 text-sm text-gray-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="juridica">Pessoa jurídica</option>
                      <option value="fisica">Pessoa física</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="document">
                      CNPJ<span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2 items-start">
                      <Input
                        id="document"
                        value={formData.document}
                        onChange={(e) => setFormData({ ...formData, document: formatCNPJ(e.target.value) })}
                        placeholder="00.000.000/0000-00"
                        required
                        className="h-11 flex-1"
                        maxLength={18}
                      />
                      <Button type="button" variant="outline" size="icon" className="h-11 w-11 flex-shrink-0">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nome_fantasia">Nome fantasia<span className="text-red-500">*</span></Label>
                    <Input
                      id="nome_fantasia"
                      value={formData.nome_fantasia}
                      onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                      placeholder="Nome fantasia"
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Linha 2: Razão Social */}
                <div className="space-y-2">
                  <Label htmlFor="razao_social">Razão social</Label>
                  <Input
                    id="razao_social"
                    value={formData.razao_social}
                    onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                    placeholder="Razão social da empresa"
                    className="h-11"
                  />
                </div>

                {/* Linha 3: Inscrição Estadual, Municipal */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="inscricao_estadual">Ins. estadual</Label>
                      <label className="flex items-center gap-1 text-sm">
                        <input type="checkbox" className="rounded" />
                        <span className="text-muted-foreground">ISENTA</span>
                      </label>
                    </div>
                    <Input
                      id="inscricao_estadual"
                      value={formData.inscricao_estadual}
                      onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                      placeholder="000.000.000.000"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inscricao_municipal">Ins. municipal</Label>
                    <Input
                      id="inscricao_municipal"
                      value={formData.inscricao_municipal}
                      onChange={(e) => setFormData({ ...formData, inscricao_municipal: e.target.value })}
                      placeholder="Inscrição municipal"
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Linha 4: CNAE Principal, Regime Tributário, Regime Especial */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnae_principal">CNAE Principal</Label>
                    <Input
                      id="cnae_principal"
                      value={formData.cnae_principal}
                      onChange={(e) => setFormData({ ...formData, cnae_principal: e.target.value })}
                      placeholder="Digite para buscar"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regime_tributario">Regime tributário</Label>
                    <select
                      id="regime_tributario"
                      value={formData.regime_tributario}
                      onChange={(e) => setFormData({ ...formData, regime_tributario: e.target.value })}
                      className="flex h-11 w-full rounded-md border border-input bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2 text-sm text-gray-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Selecione</option>
                      <option value="simples">Simples Nacional</option>
                      <option value="presumido">Lucro Presumido</option>
                      <option value="real">Lucro Real</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regime_especial">Regime especial de tributação</Label>
                    <select
                      id="regime_especial"
                      value={formData.regime_especial}
                      onChange={(e) => setFormData({ ...formData, regime_especial: e.target.value })}
                      className="flex h-11 w-full rounded-md border border-input bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2 text-sm text-gray-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Sem regime</option>
                      <option value="mei">MEI</option>
                      <option value="simples">Simples Nacional</option>
                    </select>
                  </div>
                </div>

                {/* I.E. Substitutos Tributários */}
                <div className="space-y-3 pt-4 border-t dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">I.E. substitutos tributários</Label>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    Os contribuintes que praticam operações com substituição tributária, tem o recurso de registrar a inscrição estadual do substituto tributário, para que ele referencia recolha o ICMSST na UF de origem da mercadoria.
                  </p>
                  <Button type="button" variant="outline" size="sm" className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar inscrição
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: CONTATO */}
          <TabsContent value="contato" className="space-y-6">
            <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Phone className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  Informações de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Linha 1: E-mail, Telefone, Celular, Site */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      E-mail<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@empresa.com"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone<span className="text-red-500">*</span></Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      placeholder="(00) 0000-0000"
                      required
                      className="h-11"
                      maxLength={14}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="celular">Celular</Label>
                    <Input
                      id="celular"
                      value={formData.celular}
                      onChange={(e) => setFormData({ ...formData, celular: formatCelular(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      className="h-11"
                      maxLength={15}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site">Site</Label>
                    <Input
                      id="site"
                      value={formData.site}
                      onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                      placeholder="www.empresa.com"
                      className="h-11"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: ENDEREÇO */}
          <TabsContent value="endereco" className="space-y-6">
            <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <MapPin className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Linha 1: CEP, Logradouro, Número */}
                <div className="grid md:grid-cols-[200px_1fr_200px] gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">CEP<span className="text-red-500">*</span></Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: formatCEP(e.target.value) })}
                      placeholder="00000-000"
                      required
                      className="h-11"
                      maxLength={9}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Logradouro<span className="text-red-500">*</span></Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, Avenida, etc"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero">Número<span className="text-red-500">*</span></Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="000"
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Linha 2: Complemento, Bairro */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.complemento}
                      onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                      placeholder="Apto, Sala, Bloco, etc"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro<span className="text-red-500">*</span></Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      placeholder="Nome do bairro"
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Linha 3: Cidade */}
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade<span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Nome da cidade (Estado)"
                      required
                      className="h-11"
                    />
                    <Button type="button" variant="ghost" size="icon" className="h-11 w-11">
                      <span className="text-sm">🗑️</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormData(originalFormData)}
            disabled={saving || loading}
            className="min-w-[120px] bg-red-600 hover:bg-red-700 text-white hover:text-white"
          >
            <span>✕</span>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving || loading}
            className="min-w-[120px] bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Salvando...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <span>✓ Atualizar</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
