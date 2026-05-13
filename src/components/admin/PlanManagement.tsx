'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Loader2,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Users,
  Star,
  Menu,
} from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  billing_cycle: string;
  features: Record<string, any>;
  limits: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subscriber_count?: number;
  total_subscriber_count?: number;
}

export function PlanManagement() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    billing_cycle: 'monthly',
    features_text: '',
    max_users: 1,
    max_products: 100,
    max_customers: 1000,
    is_active: true,
  });

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/next_api/admin/plans?include_inactive=true');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        setPlans(result.data || []);
      } else {
        throw new Error(result.error || 'Erro ao carregar planos');
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar planos:', error);
      toast.error(error.message || 'Erro ao carregar planos');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      price_monthly: 0,
      price_yearly: 0,
      billing_cycle: 'monthly',
      features_text: '',
      max_users: 1,
      max_products: 100,
      max_customers: 1000,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);

    // Converter features JSONB em texto legível (uma feature por linha)
    let featuresText = '';
    if (plan.features && typeof plan.features === 'object') {
      featuresText = Object.entries(plan.features)
        .map(([key, value]) => {
          if (typeof value === 'boolean') return value ? key : null;
          return `${key}: ${value}`;
        })
        .filter(Boolean)
        .join('\n');
    }

    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price_monthly: plan.price_monthly || 0,
      price_yearly: plan.price_yearly || 0,
      billing_cycle: plan.billing_cycle || 'monthly',
      features_text: featuresText,
      max_users: plan.limits?.max_users || 1,
      max_products: plan.limits?.max_products || 100,
      max_customers: plan.limits?.max_customers || 1000,
      is_active: plan.is_active,
    });
    setDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Nome e slug são obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      // Converter features_text em JSONB
      const features: Record<string, any> = {};
      formData.features_text.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          features[key] = value;
        } else {
          features[line.trim()] = true;
        }
      });

      const payload = {
        ...(editingPlan ? { id: editingPlan.id } : {}),
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price_monthly: formData.price_monthly,
        price_yearly: formData.price_yearly,
        billing_cycle: formData.billing_cycle,
        features,
        limits: {
          max_users: formData.max_users,
          max_products: formData.max_products,
          max_customers: formData.max_customers,
        },
        is_active: formData.is_active,
      };

      const response = await fetch('/next_api/admin/plans', {
        method: editingPlan ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao salvar plano');
      }

      toast.success(result.message || 'Plano salvo com sucesso!');
      setDialogOpen(false);
      await loadPlans();
    } catch (error: any) {
      console.error('❌ Erro ao salvar plano:', error);
      toast.error(error.message || 'Erro ao salvar plano');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Tem certeza que deseja desativar este plano?')) return;

    try {
      const response = await fetch(`/next_api/admin/plans?id=${planId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao desativar plano');
      }

      toast.success(result.message || 'Plano desativado!');
      await loadPlans();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao desativar plano');
    }
  };

  const togglePlanStatus = async (plan: Plan) => {
    try {
      const response = await fetch('/next_api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plan.id, is_active: !plan.is_active }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao alterar status');
      }

      toast.success(`Plano ${!plan.is_active ? 'ativado' : 'desativado'}!`);
      await loadPlans();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar status');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
            <span className="text-white">Carregando planos do banco de dados...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5" />
              Planos de Assinatura
              <Badge variant="outline" className="text-gray-400 border-gray-600 ml-2">
                {plans.filter(p => p.is_active).length} ativos
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex gap-2">
                <Button onClick={loadPlans} variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                <Button onClick={handleCreatePlan} className="juga-gradient text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Plano
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="sm:hidden border-gray-700 text-gray-300 hover:bg-gray-800">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 border-gray-700 bg-gray-900 text-white">
                  <DropdownMenuLabel className="text-xs text-gray-300">Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800" onSelect={() => loadPlans()}>
                    <RefreshCw className="h-4 w-4 text-gray-300" /> Atualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800" onSelect={() => handleCreatePlan()}>
                    <Plus className="h-4 w-4 text-gray-300" /> Novo Plano
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {plans.length === 0 ? (
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                Nenhum plano encontrado. Clique em &quot;Novo Plano&quot; para criar o primeiro.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800/50">
                    <TableHead className="text-gray-300">Nome</TableHead>
                    <TableHead className="text-gray-300">Slug</TableHead>
                    <TableHead className="text-gray-300">Preço/mês</TableHead>
                    <TableHead className="text-gray-300">Preço/ano</TableHead>
                    <TableHead className="text-gray-300">Limites</TableHead>
                    <TableHead className="text-gray-300">Assinantes</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id} className={`border-gray-700 hover:bg-gray-800/50 ${!plan.is_active ? 'opacity-50' : ''}`}>
                      <TableCell className="text-white">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {plan.name}
                            {plan.slug === 'trial' && <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px]">TRIAL</Badge>}
                          </div>
                          <div className="text-sm text-gray-400 truncate max-w-[200px]">{plan.description}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 font-mono text-sm">{plan.slug}</TableCell>
                      <TableCell className="text-white">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-400" />
                          <span className="font-medium">{formatCurrency(plan.price_monthly)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">{formatCurrency(plan.price_yearly)}</TableCell>
                      <TableCell className="text-white">
                        <div className="text-xs space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            {plan.limits?.max_users === -1 ? '∞' : plan.limits?.max_users || '?'}
                          </div>
                          <div className="text-gray-400">
                            Prod: {plan.limits?.max_products === -1 ? '∞' : plan.limits?.max_products || '?'}
                          </div>
                          <div className="text-gray-400">
                            Cli: {plan.limits?.max_customers === -1 ? '∞' : plan.limits?.max_customers || '?'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className="text-white font-medium">{plan.subscriber_count || 0}</span>
                          <span className="text-gray-500 text-xs"> / {plan.total_subscriber_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={plan.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                          {plan.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan)}
                            className="text-gray-300 hover:text-white hover:bg-gray-800 h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => togglePlanStatus(plan)}
                            className={`h-8 w-8 p-0 ${plan.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'} hover:bg-gray-800`}>
                            {plan.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </Button>
                          {plan.slug !== 'trial' && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-gray-800 h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar/editar plano */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[98vw] h-[95vh] max-w-none max-h-[95vh] p-0 overflow-hidden flex flex-col bg-neutral-900 text-white">
          <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-neutral-900/95 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <DialogTitle className="text-lg sm:text-xl font-semibold text-white">
                  {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
                </DialogTitle>
                <span className="text-xs sm:text-sm font-normal text-white/60">
                  {editingPlan ? `Editando: ${editingPlan.name}` : 'Preencha todos os campos'}
                </span>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto bg-neutral-900">
            <div className="px-4 sm:px-6 py-4 sm:py-6 grid gap-6">
              {/* Informações Básicas */}
              <h3 className="text-sm font-semibold text-white/90">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name" className="text-white/90">Nome do Plano *</Label>
                  <Input id="name" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Profissional" className="bg-gray-800 border-gray-700 text-white" />
                </div>
                <div>
                  <Label htmlFor="slug" className="text-white/90">Slug (identificador) *</Label>
                  <Input id="slug" value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                    placeholder="Ex: pro" className="bg-gray-800 border-gray-700 text-white font-mono"
                    disabled={!!editingPlan && (editingPlan.subscriber_count || 0) > 0} />
                </div>
                <div>
                  <Label className="text-white/90">Status</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Switch id="is_active" checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                    <Label htmlFor="is_active" className="text-white/80">{formData.is_active ? 'Ativo' : 'Inativo'}</Label>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="description" className="text-white/90">Descrição</Label>
                <Textarea id="description" value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o plano..." rows={2}
                  className="bg-neutral-800 border border-white/10 text-white" />
              </div>

              {/* Preços */}
              <h3 className="text-sm font-semibold text-white/90">Preços</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_monthly" className="text-white/90">Preço Mensal (R$)</Label>
                  <Input id="price_monthly" type="number" step="0.01" value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                    className="bg-gray-800 border-gray-700 text-white" />
                </div>
                <div>
                  <Label htmlFor="price_yearly" className="text-white/90">Preço Anual (R$)</Label>
                  <Input id="price_yearly" type="number" step="0.01" value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                    className="bg-gray-800 border-gray-700 text-white" />
                </div>
              </div>

              {/* Limites */}
              <h3 className="text-sm font-semibold text-white/90">Limites (-1 = ilimitado)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="max_users" className="text-white/90">Máx. Usuários</Label>
                  <Input id="max_users" type="number" value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 1 })}
                    className="bg-gray-800 border-gray-700 text-white" />
                </div>
                <div>
                  <Label htmlFor="max_products" className="text-white/90">Máx. Produtos</Label>
                  <Input id="max_products" type="number" value={formData.max_products}
                    onChange={(e) => setFormData({ ...formData, max_products: parseInt(e.target.value) || 100 })}
                    className="bg-gray-800 border-gray-700 text-white" />
                </div>
                <div>
                  <Label htmlFor="max_customers" className="text-white/90">Máx. Clientes</Label>
                  <Input id="max_customers" type="number" value={formData.max_customers}
                    onChange={(e) => setFormData({ ...formData, max_customers: parseInt(e.target.value) || 1000 })}
                    className="bg-gray-800 border-gray-700 text-white" />
                </div>
              </div>

              {/* Features */}
              <h3 className="text-sm font-semibold text-white/90">Funcionalidades (chave: valor, uma por linha)</h3>
              <div>
                <Textarea id="features" value={formData.features_text}
                  onChange={(e) => setFormData({ ...formData, features_text: e.target.value })}
                  placeholder={"users: Até 10 usuários\nsupport: Prioritário\nreports\nintegrations"}
                  rows={6} className="bg-neutral-800 border border-white/10 text-white font-mono text-sm" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-neutral-900 border-t border-white/10 flex-shrink-0">
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/30 text-white hover:bg-white/10">
                Cancelar
              </Button>
              <Button onClick={handleSavePlan} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingPlan ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
