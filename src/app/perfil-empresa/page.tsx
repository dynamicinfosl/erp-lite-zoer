'use client';

import { useState, useEffect } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Mail, Phone, MapPin, FileText, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TenantData {
  id: string;
  name: string;
  slug: string;
  status: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at?: string;
}

export default function PerfilEmpresaPage() {
  const { user, tenant: authTenant, loading: authLoading, refreshTenant } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  useEffect(() => {
    if (authLoading) return;
    loadTenantData();
  }, [authTenant, authLoading]);

  const loadTenantData = async () => {
    if (!authTenant) {
      // Se a autenticação estiver desativada, usa um tenant mock para evitar tela vazia
      if (process.env.NEXT_PUBLIC_ENABLE_AUTH !== 'true') {
        setTenant({
          id: '00000000-0000-0000-0000-000000000000',
          name: 'Minha Empresa',
          slug: 'minha-empresa',
          status: 'trial',
          email: '',
          phone: '',
          document: '',
          address: '',
          city: '',
          state: '',
          zip_code: ''
        } as any);
        setFormData({
          name: 'Minha Empresa',
          email: '',
          phone: '',
          document: '',
          address: '',
          city: '',
          state: '',
          zip_code: ''
        });
        setLoading(false);
        return;
      }

      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Usar o tenant do contexto de autenticação
      const tenantData = authTenant;
      
      console.log('📋 Dados do tenant carregados:', {
        name: tenantData.name,
        email: tenantData.email,
        phone: tenantData.phone,
        document: tenantData.document,
        address: tenantData.address,
        city: tenantData.city,
        state: tenantData.state,
        zip_code: tenantData.zip_code,
      });
      
      setTenant(tenantData);
      setFormData({
        name: tenantData.name || '',
        email: tenantData.email || '',
        phone: tenantData.phone || '',
        document: tenantData.document || '',
        address: tenantData.address || '',
        city: tenantData.city || '',
        state: tenantData.state || '',
        zip_code: tenantData.zip_code || '',
      });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      setSaving(true);

      console.log('📝 Enviando dados do tenant:', {
        id: tenant.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        document: formData.document,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
      });

      const res = await fetch('/next_api/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tenant.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          document: formData.document,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
        })
      });

      console.log('📡 Resposta do servidor:', res.status);

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Erro do servidor:', errorData);
        throw new Error(errorData.details || errorData.error || 'Erro ao atualizar dados');
      }

      const result = await res.json();
      console.log('✅ Resultado:', result);

      // Atualizar os dados do formulário com o que foi salvo
      if (result.data) {
        console.log('🔄 Atualizando formulário com dados salvos:', result.data);
        
        const updatedFormData = {
          name: result.data.name || '',
          email: result.data.email || '',
          phone: result.data.phone || '',
          document: result.data.document || '',
          address: result.data.address || '',
          city: result.data.city || '',
          state: result.data.state || '',
          zip_code: result.data.zip_code || '',
        };
        
        setFormData(updatedFormData);
        setTenant(result.data);
        
        console.log('✅ Formulário atualizado:', updatedFormData);
      }

      console.log('🎉 Mostrando toast de sucesso');
      toast.success('Dados atualizados com sucesso!');
      
      // Atualizar contexto global também
      if (refreshTenant) {
        await refreshTenant();
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao salvar dados');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'trial':
        return 'bg-blue-500';
      case 'suspended':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'trial':
        return 'Trial';
      case 'suspended':
        return 'Suspenso';
      default:
        return status;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-3">
              <p className="text-gray-600">Empresa não encontrada</p>
              <Button variant="outline" onClick={refreshTenant}>Tentar novamente</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header - Responsivo */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Perfil da Empresa</h1>
          <p className="text-sm sm:text-base text-body">Gerencie as informações da sua empresa</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Badge className={`${getStatusColor(tenant.status)} text-white w-full sm:w-auto justify-center`}>
            {getStatusLabel(tenant.status)}
          </Badge>
        </div>
      </div>

      {/* Main Content - Responsivo */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          <Tabs defaultValue="dados" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados" className="text-xs sm:text-sm">Dados da Empresa</TabsTrigger>
              <TabsTrigger value="endereco" className="text-xs sm:text-sm">Endereço</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="dados">
                <Card className="juga-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl text-heading">Informações Básicas</CardTitle>
                    <CardDescription className="text-sm">Dados principais da empresa</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-heading">Nome da Empresa *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Empresa JUGA"
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-heading flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          E-mail
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="contato@empresa.com"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-heading flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="(21) 98765-4321"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="document" className="text-sm font-medium text-heading flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        CNPJ
                      </Label>
                      <Input
                        id="document"
                        value={formData.document}
                        onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                        placeholder="00.000.000/0000-00"
                        className="h-11"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="endereco">
                <Card className="juga-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl text-heading">Endereço</CardTitle>
                    <CardDescription className="text-sm">Localização da empresa</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium text-heading">Endereço</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Rua, número, complemento"
                        className="h-11"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium text-heading">Cidade</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Rio de Janeiro"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-medium text-heading">Estado</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="RJ"
                          maxLength={2}
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zip_code" className="text-sm font-medium text-heading">CEP</Label>
                      <Input
                        id="zip_code"
                        value={formData.zip_code}
                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        placeholder="00000-000"
                        className="h-11"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadTenantData}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="juga-gradient text-white w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </div>

        {/* Sidebar - Responsivo */}
        <div className="space-y-4 sm:space-y-6">
          {/* Informações da Empresa - Responsivo */}
          <Card className="juga-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg text-heading">Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className="text-body text-sm">Status</span>
                <Badge className={`${getStatusColor(tenant.status)} text-white`}>
                  {getStatusLabel(tenant.status)}
                </Badge>
              </div>
              {tenant.created_at && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className="text-body text-sm">Criada em</span>
                  <span className="text-heading text-sm">{new Date(tenant.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações Rápidas - Responsivo */}
          <Card className="juga-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg text-heading">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <Button className="w-full justify-start juga-gradient text-white text-sm">
                <Building2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Editar Perfil</span>
                <span className="sm:hidden">Perfil</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Documentos</span>
                <span className="sm:hidden">Docs</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Endereços</span>
                <span className="sm:hidden">Endereço</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}


