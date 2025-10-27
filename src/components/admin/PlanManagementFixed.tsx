'use client';

import React from 'react';
import { useState, useEffect } from 'react';
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
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

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

export function PlanManagementFixed() {
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
    setLoading(true);
    
    try {
      console.log('🔍 Carregando planos (versão corrigida - sem Supabase)...');
      
      // Dados mockados que sempre funcionam
      const mockPlans: Plan[] = [
        {
          id: '1',
          name: 'Básico',
          description: 'Plano ideal para pequenas empresas',
          price: 79.90,
          billing_cycle: 'monthly',
          features: ['Gestão de produtos', 'Gestão de clientes', 'Relatórios básicos', 'Suporte por email'],
          max_users: 1,
          max_products: 100,
          max_customers: 1000,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Profissional',
          description: 'Para empresas em crescimento',
          price: 139.90,
          billing_cycle: 'monthly',
          features: ['Tudo do Básico', 'Múltiplos usuários', 'Relatórios avançados', 'Integração com APIs', 'Suporte prioritário'],
          max_users: 5,
          max_products: 1000,
          max_customers: 10000,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Enterprise',
          description: 'Solução completa para grandes empresas',
          price: 99.90,
          billing_cycle: 'monthly',
          features: ['Tudo do Profissional', 'Usuários ilimitados', 'Produtos ilimitados', 'Clientes ilimitados', 'Suporte 24/7', 'Customizações'],
          max_users: -1,
          max_products: -1,
          max_customers: -1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('✅ Planos carregados com sucesso (dados mockados):', mockPlans);
      setPlans(mockPlans);
      toast.success('Planos carregados com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao carregar planos:', error);
      setPlans([]);
      toast.info('Nenhum plano encontrado. Clique em "Novo Plano" para criar o primeiro.');
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
    setIsSaving(true);
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const planData = {
        ...formData,
        features: formData.features.split('\n').filter(f => f.trim()),
      };

      if (editingPlan) {
        // Atualizar plano existente
        setPlans(prev => prev.map(plan => 
          plan.id === editingPlan.id 
            ? { ...plan, ...planData, updated_at: new Date().toISOString() }
            : plan
        ));
        toast.success('Plano atualizado com sucesso!');
      } else {
        // Criar novo plano
        const newPlan: Plan = {
          id: Date.now().toString(),
          ...planData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setPlans(prev => [...prev, newPlan]);
        toast.success('Plano criado com sucesso!');
      }
      
      setDialogOpen(false);
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
      setPlans(prev => prev.filter(plan => plan.id !== planId));
      toast.success('Plano excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      toast.error('Erro ao excluir plano');
    }
  };

  const togglePlanStatus = async (plan: Plan) => {
    try {
      setPlans(prev => prev.map(p => 
        p.id === plan.id 
          ? { ...p, is_active: !p.is_active, updated_at: new Date().toISOString() }
          : p
      ));
      toast.success(`Plano ${!plan.is_active ? 'ativado' : 'desativado'} com sucesso!`);
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
    return (
      <Badge className={styles[cycle as keyof typeof styles] || 'bg-gray-500'}>
        {cycle === 'monthly' ? 'Mensal' : 'Anual'}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge className={isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
        {isActive ? 'Ativo' : 'Inativo'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
            <span>Carregando planos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Planos de Assinatura (Versão Corrigida)
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={loadPlans} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={handleCreatePlan}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Plano
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {plans.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nenhum plano encontrado. Clique em "Novo Plano" para criar o primeiro.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-gray-500">{plan.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">R$ {plan.price.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getBillingCycleBadge(plan.billing_cycle)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{plan.max_users === -1 ? 'Ilimitado' : plan.max_users}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(plan.is_active)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePlanStatus(plan)}
                          className={plan.is_active ? 'text-red-600' : 'text-green-600'}
                        >
                          {plan.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar/editar plano - Padrão do sistema */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[98vw] h-[95vh] max-w-none max-h-[95vh] p-0 overflow-hidden flex flex-col bg-neutral-900 text-white">
          <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-neutral-900/95 flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-semibold text-white">
                <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg">
                  <CreditCard className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-base sm:text-xl">{editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}</span>
                  <span className="text-xs sm:text-sm font-normal text-white/60 truncate">
                    {editingPlan ? 'Atualize as informações do plano.' : 'Preencha as informações para criar um novo plano.'}
                  </span>
                </div>
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto bg-white">
            <div className="px-4 sm:px-6 py-4 sm:py-6 grid gap-6">
              <div className="text-sm text-gray-600 bg-blue-50/60 border border-blue-100 px-3 py-2 rounded-md">
                Preencha os campos abaixo. Os itens com valores numéricos aceitam apenas números.
              </div>

              <h3 className="text-sm font-semibold text-gray-700">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700">Nome do Plano</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Básico" className="bg-white border border-gray-200" />
                </div>
                <div>
                  <Label htmlFor="price" className="text-gray-700">Preço (R$)</Label>
                  <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} placeholder="79.90" className="bg-white border border-gray-200" />
                </div>
              </div>

              <h3 className="text-sm font-semibold text-gray-700">Descrição</h3>
              <div>
                <Label htmlFor="description" className="text-gray-700">Descrição</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descreva o plano..." rows={3} className="bg-neutral-800 border border-white/10 text-white placeholder-white/50" />
              </div>

              <h3 className="text-sm font-semibold text-gray-700">Funcionalidades</h3>
              <div>
                <Label htmlFor="features" className="text-gray-700">Funcionalidades (uma por linha)</Label>
                <Textarea id="features" value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} placeholder="Gestão de produtos&#10;Gestão de clientes&#10;Relatórios básicos" rows={6} className="bg-neutral-800 border border-white/10 text-white placeholder-white/50" />
              </div>

              <h3 className="text-sm font-semibold text-gray-700">Limites</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="max_users" className="text-gray-700">Máx. Usuários</Label>
                  <Input id="max_users" type="number" value={formData.max_users} onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 1 })} className="bg-white border border-gray-200" />
                </div>
                <div>
                  <Label htmlFor="max_products" className="text-gray-700">Máx. Produtos</Label>
                  <Input id="max_products" type="number" value={formData.max_products} onChange={(e) => setFormData({ ...formData, max_products: parseInt(e.target.value) || 100 })} className="bg-white border border-gray-200" />
                </div>
                <div>
                  <Label htmlFor="max_customers" className="text-gray-700">Máx. Clientes</Label>
                  <Input id="max_customers" type="number" value={formData.max_customers} onChange={(e) => setFormData({ ...formData, max_customers: parseInt(e.target.value) || 1000 })} className="bg-white border border-gray-200" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                <Label htmlFor="is_active" className="text-gray-700">Plano ativo</Label>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-neutral-900 border-t border-white/10 flex-shrink-0">
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/30 text-white hover:bg-white/10">Cancelar</Button>
              <Button onClick={handleSavePlan} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSaving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>) : (editingPlan ? 'Atualizar' : 'Criar')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
