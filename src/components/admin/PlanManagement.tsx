'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Database,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  features: string[];
  max_users: number;
  max_products: number;
  max_customers: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function PlanManagement() {
  const supabase = createClientComponentClient();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    billing_cycle: 'monthly' as 'monthly' | 'yearly',
    features: '',
    max_users: 1,
    max_products: 100,
    max_customers: 1000,
    is_active: true,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando planos...');
      
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price');

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Planos carregados:', data);
      setPlans(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar planos:', error);
      toast.error(`Erro ao carregar planos: ${error.message || 'Tabela plans não encontrada'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      billing_cycle: 'monthly',
      features: '',
      max_users: 1,
      max_products: 100,
      max_customers: 1000,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      features: plan.features.join('\n'),
      max_users: plan.max_users,
      max_products: plan.max_products,
      max_customers: plan.max_customers,
      is_active: plan.is_active,
    });
    setDialogOpen(true);
  };

  const handleSavePlan = async () => {
    try {
      setIsSaving(true);

      const planData = {
        ...formData,
        features: formData.features.split('\n').filter(f => f.trim()),
      };

      if (editingPlan) {
        // Atualizar plano existente
        const { error } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast.success('Plano atualizado com sucesso!');
      } else {
        // Criar novo plano
        const { error } = await supabase
          .from('plans')
          .insert(planData);

        if (error) throw error;
        toast.success('Plano criado com sucesso!');
      }

      setDialogOpen(false);
      await loadPlans();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      toast.error('Erro ao salvar plano');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast.success('Plano excluído com sucesso!');
      await loadPlans();
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      toast.error('Erro ao excluir plano');
    }
  };

  const togglePlanStatus = async (plan: Plan) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id);

      if (error) throw error;

      toast.success(`Plano ${!plan.is_active ? 'ativado' : 'desativado'} com sucesso!`);
      await loadPlans();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do plano');
    }
  };

  const getBillingCycleBadge = (cycle: string) => {
    const styles = {
      monthly: 'bg-blue-500 text-white',
      yearly: 'bg-green-500 text-white',
    };

    const labels = {
      monthly: 'Mensal',
      yearly: 'Anual',
    };

    return (
      <Badge className={styles[cycle as keyof typeof styles] || styles.monthly}>
        {labels[cycle as keyof typeof labels] || cycle}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Carregando planos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Planos</h2>
          <p className="text-gray-600">Configure os planos de assinatura disponíveis</p>
        </div>
        <Button onClick={handleCreatePlan} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Planos</p>
                <p className="text-2xl font-bold">{plans.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {plans.filter(p => p.is_active).length}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inativos</p>
                <p className="text-2xl font-bold text-red-600">
                  {plans.filter(p => !p.is_active).length}
                </p>
              </div>
              <X className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Preço Médio</p>
                <p className="text-2xl font-bold">
                  {plans.length > 0 
                    ? formatPrice(plans.reduce((acc, p) => acc + p.price, 0) / plans.length)
                    : 'R$ 0,00'
                  }
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Planos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Planos de Assinatura
            </CardTitle>
            <Button onClick={loadPlans} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {plans.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nenhum plano encontrado. Crie seu primeiro plano!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Limites</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-gray-600">{plan.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-lg">
                          {formatPrice(plan.price)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getBillingCycleBadge(plan.billing_cycle)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {plan.max_users === -1 ? 'Ilimitado' : plan.max_users}
                          </div>
                          <div className="flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            {plan.max_products === -1 ? 'Ilimitado' : plan.max_products}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.is_active}
                            onCheckedChange={() => togglePlanStatus(plan)}
                          />
                          <Badge className={plan.is_active ? 'bg-green-500' : 'bg-gray-500'}>
                            {plan.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditPlan(plan)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeletePlan(plan.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Dialog de Criação/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan 
                ? 'Atualize as informações do plano' 
                : 'Preencha as informações para criar um novo plano'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Plano Básico"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="29.90"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do plano"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_cycle">Ciclo de Cobrança</Label>
              <select
                id="billing_cycle"
                value={formData.billing_cycle}
                onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as 'monthly' | 'yearly' })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Recursos (um por linha)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="Gestão de produtos&#10;Relatórios básicos&#10;Suporte por email"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_users">Máx. Usuários</Label>
                <Input
                  id="max_users"
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_products">Máx. Produtos</Label>
                <Input
                  id="max_products"
                  type="number"
                  value={formData.max_products}
                  onChange={(e) => setFormData({ ...formData, max_products: parseInt(e.target.value) || 100 })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_customers">Máx. Clientes</Label>
                <Input
                  id="max_customers"
                  type="number"
                  value={formData.max_customers}
                  onChange={(e) => setFormData({ ...formData, max_customers: parseInt(e.target.value) || 1000 })}
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Plano ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePlan} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                editingPlan ? 'Atualizar' : 'Criar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
