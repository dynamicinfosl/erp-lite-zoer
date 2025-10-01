'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
  const { user } = useAuth();
  const supabase = createClientComponentClient();
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
    loadTenantData();
  }, [user]);

  const loadTenantData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar membership
      const { data: membership, error: memberError } = await supabase
        .from('user_memberships')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (memberError || !membership) {
        toast.error('Erro ao carregar dados da empresa');
        return;
      }

      // Buscar tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', membership.tenant_id)
        .single();

      if (tenantError || !tenantData) {
        toast.error('Erro ao carregar dados da empresa');
        return;
      }

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

      const { error } = await supabase
        .from('tenants')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          document: formData.document,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
        })
        .eq('id', tenant.id);

      if (error) throw error;

      toast.success('Dados atualizados com sucesso!');
      await loadTenantData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar dados');
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

  if (loading) {
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
            <p className="text-gray-600">Empresa não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Perfil da Empresa</h1>
          <Badge className={getStatusColor(tenant.status)}>
            {getStatusLabel(tenant.status)}
          </Badge>
        </div>
        <p className="text-gray-600">
          Gerencie as informações da sua empresa
        </p>
      </div>

      <Tabs defaultValue="dados" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dados">Dados da Empresa</TabsTrigger>
          <TabsTrigger value="endereco">Endereço</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="dados" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>
                  Dados principais da empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Empresa JUGA"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@empresa.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(21) 98765-4321"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CNPJ
                  </Label>
                  <Input
                    id="document"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endereco" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço
                </CardTitle>
                <CardDescription>
                  Localização da empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, complemento"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Rio de Janeiro"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="RJ"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={loadTenantData}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
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

      {tenant.created_at && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">
              Empresa cadastrada em: {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


