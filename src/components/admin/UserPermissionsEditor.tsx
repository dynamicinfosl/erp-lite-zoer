'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Save, Lock, Unlock } from 'lucide-react';
import type { UserPermissions } from '@/lib/permissions';

interface UserPermissionsEditorProps {
  userId: string;
  tenantId: string;
  currentUserId: string; // ID do usuário logado (admin que está configurando)
  userName?: string;
  userEmail?: string;
  onSave?: () => void;
}

export function UserPermissionsEditor({
  userId,
  tenantId,
  currentUserId,
  userName,
  userEmail,
  onSave,
}: UserPermissionsEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<Partial<UserPermissions>>({});

  useEffect(() => {
    if (userId && tenantId && currentUserId) {
      loadPermissions();
    }
  }, [userId, tenantId, currentUserId]);

  const loadPermissions = async () => {
    if (!currentUserId) {
      console.error('[UserPermissionsEditor] currentUserId não definido');
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(
        `/next_api/user-permissions?user_id=${encodeURIComponent(userId)}&tenant_id=${encodeURIComponent(tenantId)}&current_user_id=${encodeURIComponent(currentUserId)}`
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao carregar permissões');
      }

      setPermissions(json.data || {});
    } catch (error: any) {
      console.error('Erro ao carregar permissões:', error);
      toast.error(error.message || 'Erro ao carregar permissões');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUserId) {
      toast.error('Erro: usuário não identificado');
      return;
    }
    
    try {
      setSaving(true);
      const res = await fetch('/next_api/user-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          tenant_id: tenantId,
          current_user_id: currentUserId,
          ...permissions,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao salvar permissões');
      }

      toast.success('Permissões salvas com sucesso!');
      onSave?.();
    } catch (error: any) {
      console.error('Erro ao salvar permissões:', error);
      toast.error(error.message || 'Erro ao salvar permissões');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (key: keyof UserPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Permissões de Acesso</h3>
        <p className="text-sm text-muted-foreground">
          Configure quais funcionalidades {userName || userEmail} pode acessar
        </p>
      </div>

      {/* Vendas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vendas</CardTitle>
          <CardDescription>Controle de acesso ao módulo de vendas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="can_view_sales">Visualizar vendas</Label>
            <Switch
              id="can_view_sales"
              checked={permissions.can_view_sales ?? false}
              onCheckedChange={() => togglePermission('can_view_sales')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_create_sales">Criar vendas</Label>
            <Switch
              id="can_create_sales"
              checked={permissions.can_create_sales ?? false}
              onCheckedChange={() => togglePermission('can_create_sales')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_edit_sales">Editar vendas</Label>
            <Switch
              id="can_edit_sales"
              checked={permissions.can_edit_sales ?? false}
              onCheckedChange={() => togglePermission('can_edit_sales')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_cancel_sales" className="text-red-600">
              Cancelar vendas
            </Label>
            <Switch
              id="can_cancel_sales"
              checked={permissions.can_cancel_sales ?? false}
              onCheckedChange={() => togglePermission('can_cancel_sales')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_view_sales_reports">Ver relatórios de vendas</Label>
            <Switch
              id="can_view_sales_reports"
              checked={permissions.can_view_sales_reports ?? false}
              onCheckedChange={() => togglePermission('can_view_sales_reports')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financeiro</CardTitle>
          <CardDescription>Controle de acesso ao módulo financeiro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="can_view_financial">Visualizar financeiro</Label>
            <Switch
              id="can_view_financial"
              checked={permissions.can_view_financial ?? false}
              onCheckedChange={() => togglePermission('can_view_financial')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_edit_financial">Editar financeiro</Label>
            <Switch
              id="can_edit_financial"
              checked={permissions.can_edit_financial ?? false}
              onCheckedChange={() => togglePermission('can_edit_financial')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_view_financial_reports">Ver relatórios financeiros</Label>
            <Switch
              id="can_view_financial_reports"
              checked={permissions.can_view_financial_reports ?? false}
              onCheckedChange={() => togglePermission('can_view_financial_reports')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_manage_payments">Gerenciar pagamentos</Label>
            <Switch
              id="can_manage_payments"
              checked={permissions.can_manage_payments ?? false}
              onCheckedChange={() => togglePermission('can_manage_payments')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Produtos</CardTitle>
          <CardDescription>Controle de acesso ao cadastro de produtos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="can_view_products">Visualizar produtos</Label>
            <Switch
              id="can_view_products"
              checked={permissions.can_view_products ?? false}
              onCheckedChange={() => togglePermission('can_view_products')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_create_products">Criar produtos</Label>
            <Switch
              id="can_create_products"
              checked={permissions.can_create_products ?? false}
              onCheckedChange={() => togglePermission('can_create_products')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_edit_products">Editar produtos</Label>
            <Switch
              id="can_edit_products"
              checked={permissions.can_edit_products ?? false}
              onCheckedChange={() => togglePermission('can_edit_products')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_delete_products">Excluir produtos</Label>
            <Switch
              id="can_delete_products"
              checked={permissions.can_delete_products ?? false}
              onCheckedChange={() => togglePermission('can_delete_products')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clientes</CardTitle>
          <CardDescription>Controle de acesso ao cadastro de clientes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="can_view_customers">Visualizar clientes</Label>
            <Switch
              id="can_view_customers"
              checked={permissions.can_view_customers ?? false}
              onCheckedChange={() => togglePermission('can_view_customers')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_create_customers">Criar clientes</Label>
            <Switch
              id="can_create_customers"
              checked={permissions.can_create_customers ?? false}
              onCheckedChange={() => togglePermission('can_create_customers')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_edit_customers">Editar clientes</Label>
            <Switch
              id="can_edit_customers"
              checked={permissions.can_edit_customers ?? false}
              onCheckedChange={() => togglePermission('can_edit_customers')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_delete_customers">Excluir clientes</Label>
            <Switch
              id="can_delete_customers"
              checked={permissions.can_delete_customers ?? false}
              onCheckedChange={() => togglePermission('can_delete_customers')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Caixa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Caixa</CardTitle>
          <CardDescription>Controle de acesso às operações de caixa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="can_open_cash">Abrir caixa</Label>
            <Switch
              id="can_open_cash"
              checked={permissions.can_open_cash ?? false}
              onCheckedChange={() => togglePermission('can_open_cash')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_close_cash">Fechar caixa</Label>
            <Switch
              id="can_close_cash"
              checked={permissions.can_close_cash ?? false}
              onCheckedChange={() => togglePermission('can_close_cash')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_view_cash_history">Ver histórico de caixas</Label>
            <Switch
              id="can_view_cash_history"
              checked={permissions.can_view_cash_history ?? false}
              onCheckedChange={() => togglePermission('can_view_cash_history')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_manage_cash_operations">Gerenciar reforços/sangrias</Label>
            <Switch
              id="can_manage_cash_operations"
              checked={permissions.can_manage_cash_operations ?? false}
              onCheckedChange={() => togglePermission('can_manage_cash_operations')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurações</CardTitle>
          <CardDescription>Controle de acesso às configurações do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="can_view_settings">Visualizar configurações</Label>
            <Switch
              id="can_view_settings"
              checked={permissions.can_view_settings ?? false}
              onCheckedChange={() => togglePermission('can_view_settings')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_edit_settings">Editar configurações</Label>
            <Switch
              id="can_edit_settings"
              checked={permissions.can_edit_settings ?? false}
              onCheckedChange={() => togglePermission('can_edit_settings')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_manage_users">Gerenciar usuários</Label>
            <Switch
              id="can_manage_users"
              checked={permissions.can_manage_users ?? false}
              onCheckedChange={() => togglePermission('can_manage_users')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Relatórios</CardTitle>
          <CardDescription>Controle de acesso aos relatórios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="can_view_reports">Visualizar relatórios</Label>
            <Switch
              id="can_view_reports"
              checked={permissions.can_view_reports ?? false}
              onCheckedChange={() => togglePermission('can_view_reports')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="can_export_reports">Exportar relatórios</Label>
            <Switch
              id="can_export_reports"
              checked={permissions.can_export_reports ?? false}
              onCheckedChange={() => togglePermission('can_export_reports')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-4">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Permissões
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
