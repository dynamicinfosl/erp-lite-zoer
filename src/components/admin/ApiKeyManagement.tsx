'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Key, Copy, Trash2, CheckCircle2, XCircle } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  email?: string;
}

interface ApiKey {
  id: string;
  name: string;
  tenant_id: string;
  tenant_name?: string;
  permissions: string[];
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export function ApiKeyManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    tenant_id: '',
    name: '',
    permissions: [] as string[],
    expires_at: '',
  });

  // Buscar lista de tenants
  useEffect(() => {
    loadTenants();
    loadApiKeys();
  }, []);

  const loadTenants = async () => {
    try {
      // Primeiro tentar buscar da API de admin/users
      const response = await fetch('/next_api/admin/users');
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        // Extrair tenants únicos
        const uniqueTenants = result.data.reduce((acc: Tenant[], item: any) => {
          if (item.tenant_id && !acc.find(t => t.id === item.tenant_id)) {
            acc.push({
              id: item.tenant_id,
              name: item.tenant_name || item.tenant_email || 'Tenant sem nome',
              email: item.tenant_email,
            });
          }
          return acc;
        }, [] as Tenant[]);
        
        if (uniqueTenants.length > 0) {
          setTenants(uniqueTenants);
          return;
        }
      }
      
      // Fallback: buscar todos os tenants diretamente se disponível
      // (isso requer um endpoint específico ou acesso direto ao Supabase)
      toast.warning('Nenhum tenant encontrado');
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
      toast.error('Erro ao carregar lista de tenants');
    }
  };

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      
      // Aguardar tenants se ainda não foram carregados
      if (tenants.length === 0) {
        await loadTenants();
        // Aguardar um pouco para garantir que tenants foram carregados
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Buscar API keys de todos os tenants
      const allKeys: ApiKey[] = [];
      
      for (const tenant of tenants) {
        try {
          const response = await fetch(`/next_api/api-keys?tenant_id=${tenant.id}&include_inactive=true`);
          const result = await response.json();
          
          if (result.success && result.data) {
            const keysWithTenant = result.data.map((key: any) => ({
              ...key,
              tenant_name: tenant.name,
            }));
            allKeys.push(...keysWithTenant);
          }
        } catch (error) {
          console.error(`Erro ao carregar keys do tenant ${tenant.id}:`, error);
        }
      }
      
      // Ordenar por data de criação (mais recentes primeiro)
      allKeys.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setApiKeys(allKeys);
    } catch (error) {
      console.error('Erro ao carregar API keys:', error);
      toast.error('Erro ao carregar API keys');
    } finally {
      setLoading(false);
    }
  };

  // Recarregar quando tenants forem carregados
  useEffect(() => {
    if (tenants.length > 0) {
      loadApiKeys();
    }
  }, [tenants.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateKey = async () => {
    if (!formData.tenant_id || !formData.name.trim()) {
      toast.error('Preencha o tenant e o nome da API key');
      return;
    }

    try {
      setCreating(true);

      const response = await fetch('/next_api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: formData.tenant_id,
          name: formData.name.trim(),
          permissions: formData.permissions,
          expires_at: formData.expires_at || null,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setNewApiKey(result.data.api_key);
        setShowNewKey(true);
        toast.success('API key criada com sucesso!');
        // Limpar formulário
        setFormData({
          tenant_id: '',
          name: '',
          permissions: [],
          expires_at: '',
        });
        // Recarregar lista
        await loadApiKeys();
      } else {
        toast.error(result.error || 'Erro ao criar API key');
      }
    } catch (error) {
      console.error('Erro ao criar API key:', error);
      toast.error('Erro ao criar API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Tem certeza que deseja revogar a API key "${keyName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/next_api/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('API key revogada com sucesso');
        await loadApiKeys();
      } else {
        toast.error(result.error || 'Erro ao revogar API key');
      }
    } catch (error) {
      console.error('Erro ao revogar API key:', error);
      toast.error('Erro ao revogar API key');
    }
  };

  const handleToggleActive = async (keyId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/next_api/api-keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`API key ${!currentStatus ? 'ativada' : 'desativada'} com sucesso`);
        await loadApiKeys();
      } else {
        toast.error(result.error || 'Erro ao atualizar API key');
      }
    } catch (error) {
      console.error('Erro ao atualizar API key:', error);
      toast.error('Erro ao atualizar API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const availablePermissions = [
    { value: 'sales:create', label: 'Criar Vendas' },
    { value: 'sales:read', label: 'Listar Vendas' },
    { value: 'customers:create', label: 'Criar Clientes' },
    { value: 'customers:read', label: 'Listar Clientes' },
    { value: 'products:create', label: 'Criar Produtos' },
    { value: 'products:read', label: 'Listar Produtos' },
  ];

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Dialog para mostrar nova API key */}
      <Dialog open={showNewKey} onOpenChange={setShowNewKey}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>API Key Criada</DialogTitle>
            <DialogDescription>
              Guarde esta API key em local seguro. Ela não será exibida novamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg border-2 border-dashed">
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono break-all flex-1">
                  {newApiKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => newApiKey && copyToClipboard(newApiKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Esta é a única vez que você verá esta chave. Certifique-se de salvá-la em local seguro.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card de criação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Nova API Key
          </CardTitle>
          <CardDescription>
            Crie uma nova chave de API para permitir acesso externo ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant">Tenant/Empresa *</Label>
            <Select
              value={formData.tenant_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, tenant_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name} {tenant.email && `(${tenant.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome da API Key *</Label>
            <Input
              id="name"
              placeholder="Ex: Integração WooCommerce"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Permissões (deixe vazio para acesso total)</Label>
            <div className="grid grid-cols-2 gap-2">
              {availablePermissions.map((perm) => (
                <div key={perm.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={perm.value}
                    checked={formData.permissions.includes(perm.value)}
                    onChange={() => togglePermission(perm.value)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor={perm.value} className="text-sm cursor-pointer">
                    {perm.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires_at">Data de Expiração (opcional)</Label>
            <Input
              id="expires_at"
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
            />
          </div>

          <Button onClick={handleCreateKey} disabled={creating || !formData.tenant_id || !formData.name.trim()}>
            {creating ? 'Criando...' : 'Criar API Key'}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de API keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys Existentes
          </CardTitle>
          <CardDescription>
            Gerencie todas as API keys criadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma API key encontrada. Crie uma nova acima.
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{key.name}</h3>
                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                          {key.is_active ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Ativa
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Revogada
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Tenant: {key.tenant_name || key.tenant_id}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(key.id, key.is_active)}
                      >
                        {key.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevokeKey(key.id, key.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Permissões: </span>
                      <span className="font-medium">
                        {key.permissions.length === 0 ? 'Acesso total' : key.permissions.join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Criada em: </span>
                      <span className="font-medium">
                        {new Date(key.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {key.expires_at && (
                      <div>
                        <span className="text-muted-foreground">Expira em: </span>
                        <span className="font-medium">
                          {new Date(key.expires_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}
                    {key.last_used_at && (
                      <div>
                        <span className="text-muted-foreground">Último uso: </span>
                        <span className="font-medium">
                          {new Date(key.last_used_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
