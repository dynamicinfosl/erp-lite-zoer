'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Search,
  Mail,
  Calendar,
  Building2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Clock,
  MousePointer,
  Eye,
  X,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface TenantUser {
  user_id: string;
  user_email: string;
  user_created_at: string;
  user_last_login: string;
  tenant_id: string;
  tenant_name: string;
  tenant_status: 'trial' | 'active' | 'suspended' | 'cancelled' | 'pending_approval';
  role: 'owner' | 'admin' | 'member';
  is_active: boolean;
  tenant_email?: string;
  tenant_phone?: string;
  tenant_document?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  // Dados de subscription
  subscription_status?: string | null;
  subscription_trial_ends_at?: string | null;
  subscription_current_period_end?: string | null;
  subscription_plan_name?: string | null;
  subscription_plan_slug?: string | null;
}

export function UserManagement() {
  
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activatingPlan, setActivatingPlan] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [activationDays, setActivationDays] = useState(30);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [availablePlans, setAvailablePlans] = useState<Array<{ id: string; name: string; slug: string }>>([]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando usuários via API interna /next_api/admin/users ...');
      
      const response = await fetch('/next_api/admin/users', { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch((fetchError) => {
        console.error('❌ Erro de rede ao buscar usuários:', fetchError);
        throw new Error('Erro de conexão ao carregar usuários');
      });

      if (!response.ok) {
        let errorMessage = `Falha ao carregar usuários (${response.status})`;
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const err = await response.json();
            errorMessage = err?.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch {
          // Se não conseguir parsear, usar mensagem padrão
        }
        throw new Error(errorMessage);
      }

      // Verificar content-type antes de fazer parse
      const contentType = response.headers.get('content-type') || '';
      let json: any;
      
      if (contentType.includes('application/json')) {
        try {
          // Ler o texto primeiro para verificar se é JSON válido
          const text = await response.text();
          
          // Verificar se começa com HTML (erro comum)
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            console.error('❌ Resposta é HTML em vez de JSON:', text.substring(0, 200));
            throw new Error('O servidor retornou HTML em vez de JSON. Verifique se a rota de API existe.');
          }
          
          // Tentar fazer parse do JSON
          try {
            json = JSON.parse(text);
          } catch (parseError) {
            console.error('❌ Erro ao parsear JSON:', parseError);
            console.error('❌ Texto recebido:', text.substring(0, 500));
            throw new Error('Resposta inválida do servidor (JSON malformado)');
          }
        } catch (parseError: any) {
          // Se já é um erro que lançamos, re-lançar
          if (parseError.message.includes('HTML') || parseError.message.includes('JSON malformado')) {
            throw parseError;
          }
          console.error('❌ Erro ao processar resposta:', parseError);
          throw new Error('Erro ao processar resposta do servidor');
        }
      } else {
        const text = await response.text();
        console.error('❌ Resposta não é JSON. Content-Type:', contentType);
        console.error('❌ Preview da resposta:', text.substring(0, 200));
        
        // Se for HTML, dar mensagem mais clara
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          throw new Error('O servidor retornou uma página HTML. A rota de API pode não existir ou estar retornando erro.');
        }
        
        throw new Error('Resposta inválida do servidor (esperado JSON)');
      }

      const data = (json?.data || []) as TenantUser[];
      setUsers(data);
      setFilteredUsers(data);
      console.log('✅ Usuários carregados com sucesso:', data.length);
    } catch (error: any) {
      console.error('❌ Erro ao carregar usuários:', error);
      const errorMessage = error?.message || 'Erro desconhecido ao carregar usuários';
      toast.error(errorMessage);
      // Garantir que os estados são limpos em caso de erro
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      console.log('🔄 Carregando planos disponíveis...');
      const response = await fetch('/next_api/plans');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro HTTP ao buscar planos:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        toast.error(`Erro ao carregar planos: ${response.status} ${response.statusText}`);
        return;
      }
      
      const result = await response.json();
      console.log('📦 Resposta da API de planos:', result);
      
      if (result.success && result.data && Array.isArray(result.data)) {
        if (result.data.length === 0) {
          console.warn('⚠️ Nenhum plano ativo encontrado na tabela plans!');
          console.warn('💡 Execute o script criar-planos-basicos.sql no Supabase SQL Editor');
          toast.warning('Nenhum plano encontrado. Verifique o banco de dados.');
        } else {
          // Mapear planos e remover duplicatas (por nome ou slug)
          const plansMap = new Map<string, { id: string; name: string; slug: string }>();
          
          result.data.forEach((plan: any) => {
            const key = (plan.name?.toLowerCase() || plan.slug?.toLowerCase() || plan.id).trim();
            // Se já existe um plano com o mesmo nome, manter apenas o primeiro
            if (!plansMap.has(key)) {
              plansMap.set(key, {
                id: plan.id,
                name: plan.name,
                slug: plan.slug
              });
            } else {
              console.warn(`⚠️ Plano duplicado ignorado: ${plan.name} (ID: ${plan.id})`);
            }
          });
          
          // Converter para array e ordenar por nome
          const plans = Array.from(plansMap.values()).sort((a, b) => 
            a.name.localeCompare(b.name, 'pt-BR')
          );
          
          console.log('✅ Planos carregados (sem duplicatas):', plans);
          setAvailablePlans(plans);
        }
      } else {
        console.warn('⚠️ Resposta inválida da API de planos:', result);
        toast.warning('Resposta inválida ao carregar planos');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos. Verifique o console para mais detalhes.');
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadPlans();
  }, [loadUsers, loadPlans]);

  useEffect(() => {
    let filtered = users.filter(user =>
      user.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.tenant_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Aplicar filtro por status se ativo
    if (activeFilter) {
      if (activeFilter === 'pending') {
        filtered = filtered.filter(user => (user.approval_status || 'pending') === 'pending');
      } else if (activeFilter === 'active') {
        filtered = filtered.filter(user => user.tenant_status === 'active');
      } else if (activeFilter === 'trial') {
        filtered = filtered.filter(user => user.tenant_status === 'trial');
      } else if (activeFilter === 'suspended') {
        filtered = filtered.filter(user => user.tenant_status === 'suspended');
      } else if (activeFilter === 'no_plan') {
        filtered = filtered.filter(user => !user.subscription_plan_name);
      }
    }

    setFilteredUsers(filtered);
  }, [searchTerm, users, activeFilter]);

  const handleCardClick = (filterType: string) => {
    if (activeFilter === filterType) {
      // Se já está ativo, desativar filtro
      setActiveFilter(null);
    } else {
      // Ativar novo filtro
      setActiveFilter(filterType);
    }
  };

  const clearFilters = () => {
    setActiveFilter(null);
    setSearchTerm('');
  };


  const approveUser = async (user: TenantUser) => {
    if (!user.user_id || user.user_id.startsWith('tenant-') || user.user_id.startsWith('membership-')) {
      toast.error('Não é possível aprovar este tipo de usuário');
      return;
    }

    try {
      console.log('✅ Aprovando usuário:', user.user_id);
      
      const response = await fetch('/next_api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user_id,
          status: 'approved',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao aprovar usuário');
      }

      toast.success('Usuário aprovado com sucesso! O usuário precisa fazer logout e login novamente para acessar o sistema.');
      setDialogOpen(false);
      await loadUsers();
    } catch (error: any) {
      console.error('❌ Erro ao aprovar usuário:', error);
      toast.error(error.message || 'Erro ao aprovar usuário');
    }
  };

  const rejectUser = async (user: TenantUser, reason?: string) => {
    if (!user.user_id || user.user_id.startsWith('tenant-') || user.user_id.startsWith('membership-')) {
      toast.error('Não é possível rejeitar este tipo de usuário');
      return;
    }

    try {
      console.log('❌ Rejeitando usuário:', user.user_id, reason);
      
      const response = await fetch('/next_api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user_id,
          status: 'rejected',
          rejection_reason: reason || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao rejeitar usuário');
      }

      toast.success('Usuário rejeitado com sucesso!');
      await loadUsers();
    } catch (error: any) {
      console.error('❌ Erro ao rejeitar usuário:', error);
      toast.error(error.message || 'Erro ao rejeitar usuário');
    }
  };

  const deleteUser = async (user: TenantUser) => {
    if (!user) {
      console.error('❌ Usuário não selecionado');
      toast.error('Nenhum usuário selecionado');
      return;
    }

    try {
      console.log('🗑️ Iniciando exclusão do usuário:', {
        user_id: user.user_id,
        tenant_id: user.tenant_id,
        user_email: user.user_email,
        tenant_name: user.tenant_name
      });
      
      setDeletingUser(true);
      
      // Construir URL com parâmetros
      const params = new URLSearchParams();
      let hasParams = false;
      
      if (user.user_id && !user.user_id.startsWith('tenant-') && !user.user_id.startsWith('membership-')) {
        params.append('user_id', user.user_id);
        hasParams = true;
        console.log('✅ Adicionado user_id:', user.user_id);
      }
      
      if (user.tenant_id) {
        params.append('tenant_id', user.tenant_id);
        hasParams = true;
        console.log('✅ Adicionado tenant_id:', user.tenant_id);
      }

      if (!hasParams) {
        throw new Error('Nenhum parâmetro válido para exclusão. Verifique user_id e tenant_id.');
      }

      const url = `/next_api/admin/users?${params.toString()}`;
      console.log('📡 Chamando API:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Resposta não é JSON:', text.substring(0, 500));
        throw new Error('Resposta inválida do servidor (esperado JSON)');
      }

      const result = await response.json();
      console.log('📦 Resultado:', result);

      if (!response.ok || !result.success) {
        const errorMsg = result.error || 'Erro ao excluir usuário';
        console.error('❌ Erro na resposta:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ Usuário excluído com sucesso!');
      toast.success('Usuário excluído com sucesso!');
      setDialogOpen(false);
      setSelectedUser(null);
      
      // Recarregar lista de usuários
      await loadUsers();
    } catch (error: any) {
      console.error('❌ Erro completo ao excluir usuário:', error);
      const errorMessage = error.message || 'Erro desconhecido ao excluir usuário';
      toast.error(errorMessage);
    } finally {
      setDeletingUser(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500 text-white',
      trial: 'bg-blue-500 text-white',
      suspended: 'bg-red-500 text-white',
      cancelled: 'bg-gray-500 text-white',
      pending_approval: 'bg-yellow-500 text-white',
    };
    
    const labels = {
      active: 'Ativo',
      trial: 'Trial',
      suspended: 'Suspenso',
      cancelled: 'Cancelado',
      pending_approval: 'Aguardando Aprovação',
    };

    return (
      <Badge className={styles[status as keyof typeof styles] || styles.trial}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getApprovalStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500 text-white',
      approved: 'bg-green-500 text-white',
      rejected: 'bg-red-500 text-white',
    };
    
    const labels = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
    };

    return (
      <Badge className={styles[status as keyof typeof styles] || styles.pending}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      owner: 'bg-purple-500 text-white',
      admin: 'bg-blue-500 text-white',
      member: 'bg-gray-500 text-white',
    };

    const labels = {
      owner: 'Dono',
      admin: 'Admin',
      member: 'Membro',
    };

    return (
      <Badge className={styles[role as keyof typeof styles] || styles.member}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '-') return '-';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString || dateString === '-') return '-';
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const getExpirationDate = (user: TenantUser): string | null => {
    // Priorizar current_period_end, depois trial_ends_at
    if (user.subscription_current_period_end) {
      return user.subscription_current_period_end;
    }
    if (user.subscription_trial_ends_at) {
      return user.subscription_trial_ends_at;
    }
    return null;
  };

  const isPlanExpired = (user: TenantUser): boolean => {
    const expDate = getExpirationDate(user);
    if (!expDate) return false;
    return new Date(expDate) < new Date();
  };

  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;

    const newStatus = !selectedUser.is_active;
    const action = newStatus ? 'ativar' : 'desativar';

    try {
      // Aqui você pode adicionar a chamada à API para atualizar o status
      // Por enquanto, apenas atualizamos localmente
      toast.success(`Usuário ${action}do com sucesso!`);
      
      // Atualizar o estado local
      setSelectedUser({ ...selectedUser, is_active: newStatus });
      
      // Recarregar lista de usuários
      await loadUsers();
    } catch (error) {
      console.error(`Erro ao ${action} usuário:`, error);
      toast.error(`Erro ao ${action} usuário`);
    }
  };

  const activatePlan = async (user: TenantUser) => {
    if (!selectedPlanId) {
      toast.error('Selecione um plano');
      return;
    }

    if (!expirationDate) {
      toast.error('Defina uma data de vencimento');
      return;
    }

    try {
      setActivatingPlan(true);
      const response = await fetch('/next_api/admin/activate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: user.tenant_id,
          plan_id: selectedPlanId,
          expiration_date: expirationDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao ativar plano');
      }

      toast.success(result.message || 'Plano ativado com sucesso!');
      await loadUsers(); // Recarregar lista
      
      // Log detalhado para debug
      console.log('✅ Plano ativado com sucesso:', {
        tenant_id: user.tenant_id,
        plan_id: selectedPlanId,
        expiration_date: expirationDate,
        response: result
      });
      
      // Resetar campos
      setSelectedPlanId('');
      setExpirationDate('');
      
      // Notificar o cliente para recarregar a página (se estiver logado)
      toast.info('Plano ativado! O cliente precisa recarregar a página para ver as mudanças', {
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Erro ao ativar plano:', error);
      toast.error(error.message || 'Erro ao ativar plano');
    } finally {
      setActivatingPlan(false);
    }
  };

  // Quando abrir o modal, definir data padrão (30 dias a partir de hoje) e carregar planos
  useEffect(() => {
    if (dialogOpen && selectedUser) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setExpirationDate(defaultDate.toISOString().split('T')[0]);
      
      // Garantir que os planos estão carregados
      if (availablePlans.length === 0) {
        console.log('🔄 Carregando planos ao abrir modal...');
        loadPlans();
      }
    }
  }, [dialogOpen, selectedUser, availablePlans.length, loadPlans]);

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-white">Carregando usuários...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-gray-900 border-gray-700 ${
            activeFilter === null ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:bg-gray-800/50'
          }`}
          onClick={() => handleCardClick('all')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Total de Clientes</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-gray-900 border-gray-700 ${
            activeFilter === 'active' ? 'ring-2 ring-green-500 bg-green-500/10' : 'hover:bg-gray-800/50'
          }`}
          onClick={() => handleCardClick('active')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Ativos</p>
                <p className="text-2xl font-bold text-green-400">
                  {users.filter(u => u.tenant_status === 'active').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-gray-900 border-gray-700 ${
            activeFilter === 'trial' ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:bg-gray-800/50'
          }`}
          onClick={() => handleCardClick('trial')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Trial</p>
                <p className="text-2xl font-bold text-blue-400">
                  {users.filter(u => u.tenant_status === 'trial').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-gray-900 border-gray-700 ${
            activeFilter === 'pending' ? 'ring-2 ring-yellow-500 bg-yellow-500/10' : 'hover:bg-gray-800/50'
          }`}
          onClick={() => handleCardClick('pending')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {users.filter(u => u.approval_status === 'pending').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-gray-900 border-gray-700 ${
            activeFilter === 'suspended' ? 'ring-2 ring-red-500 bg-red-500/10' : 'hover:bg-gray-800/50'
          }`}
          onClick={() => handleCardClick('suspended')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Suspensos</p>
                <p className="text-2xl font-bold text-red-400">
                  {users.filter(u => u.tenant_status === 'suspended').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-gray-900 border-gray-700 ${
            activeFilter === 'no_plan' ? 'ring-2 ring-orange-500 bg-orange-500/10' : 'hover:bg-gray-800/50'
          }`}
          onClick={() => handleCardClick('no_plan')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Sem Plano</p>
                <p className="text-2xl font-bold text-orange-400">
                  {users.filter(u => !u.subscription_plan_name).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicador de Filtro Ativo */}
      {activeFilter && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-300">
              Filtro ativo: {activeFilter === 'all' ? 'Todos' : 
                           activeFilter === 'active' ? 'Ativos' :
                           activeFilter === 'trial' ? 'Trial' :
                           activeFilter === 'pending' ? 'Pendentes' :
                           activeFilter === 'suspended' ? 'Suspensos' :
                           activeFilter === 'no_plan' ? 'Sem Plano' : activeFilter}
            </span>
            <span className="text-xs text-gray-400">
              ({filteredUsers.length} de {users.length} usuários)
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="w-full sm:w-auto text-blue-300 border-blue-300 hover:bg-blue-500/20"
          >
            Limpar Filtro
          </Button>
        </div>
      )}

      {/* Tabela de Usuários */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />
              Gerenciar Clientes
            </CardTitle>
            <Button onClick={loadUsers} variant="outline" size="sm" className="w-full sm:w-auto border-gray-700 text-gray-300 hover:bg-gray-800">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="relative w-full sm:w-auto sm:min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por email ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-3">
          {filteredUsers.length === 0 ? (
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                Nenhum usuário encontrado.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto max-h-[62vh] overflow-y-auto rounded-md">
              <Table className="text-xs sm:text-sm w-full min-w-[1000px]">
                <TableHeader className="sticky top-0 z-10 bg-gray-800/90 backdrop-blur supports-[backdrop-filter]:bg-gray-800/60 border-gray-700">
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300 text-[11px] sm:text-xs whitespace-nowrap">Email</TableHead>
                    <TableHead className="text-gray-300 text-[11px] sm:text-xs whitespace-nowrap">Empresa</TableHead>
                    <TableHead className="text-gray-300 text-[11px] sm:text-xs whitespace-nowrap">Responsável</TableHead>
                    <TableHead className="text-gray-300 text-[11px] sm:text-xs whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-gray-300 text-[11px] sm:text-xs whitespace-nowrap">Plano</TableHead>
                    <TableHead className="text-gray-300 text-[11px] sm:text-xs whitespace-nowrap">Expiração</TableHead>
                    <TableHead className="text-gray-300 text-[11px] sm:text-xs whitespace-nowrap">Aprovação</TableHead>
                    <TableHead className="text-gray-300 text-[11px] sm:text-xs whitespace-nowrap">Cadastro</TableHead>
                    <TableHead className="text-gray-300 text-[11px] sm:text-xs whitespace-nowrap">Último Login</TableHead>
                    <TableHead className="text-gray-300 text-[11px] sm:text-xs whitespace-nowrap">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow 
                      key={user.user_id} 
                      className="h-12 cursor-pointer hover:bg-gray-800/50 hover:shadow-md transition-all duration-200 group border-gray-700"
                      onClick={() => {
                        setSelectedUser(user);
                        setDialogOpen(true);
                      }}
                    >
                      <TableCell className="py-2 text-white">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="font-medium truncate max-w-[160px] sm:max-w-[220px]">{user.user_email}</span>
                          <MousePointer className="h-3 w-3 text-gray-500 ml-auto group-hover:text-blue-400 transition-colors" />
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-white">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="truncate max-w-[140px] sm:max-w-[220px]">{user.tenant_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="py-2">{getStatusBadge(user.tenant_status)}</TableCell>
                      <TableCell className="py-2">
                        {user.subscription_plan_name ? (
                          <Badge className="bg-purple-500 text-white">
                            {user.subscription_plan_name}
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Sem plano
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        {(() => {
                          const expDate = getExpirationDate(user);
                          if (!expDate) {
                            return <span className="text-gray-400 text-xs">-</span>;
                          }
                          const isExpired = isPlanExpired(user);
                          return (
                            <div className="flex flex-col gap-1">
                              <span className={`text-xs ${isExpired ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>
                                {formatDateTime(expDate)}
                              </span>
                              {isExpired && (
                                <Badge className="bg-red-500 text-white text-xs w-fit">Expirado</Badge>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="py-2">{getApprovalStatusBadge(user.approval_status || 'pending')}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Calendar className="h-4 w-4" />
                          {formatDate(user.user_created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Clock className="h-4 w-4" />
                          {user.user_last_login === '-' ? 'Nunca' : formatDate(user.user_last_login)}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 w-[1%] whitespace-nowrap">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation(); // Evitar que o clique na linha abra o modal
                            setSelectedUser(user);
                            setDialogOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          <Eye className="h-3 w-3" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Gerenciar Cliente</DialogTitle>
            <DialogDescription className="text-sm">
              Visualize e gerencie os detalhes do cliente
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-3">
              {/* Card Compacto com Botão de Ativar/Desativar */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-3 sm:p-4">
                  {/* Header Responsivo */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-white mb-1 truncate">
                        {selectedUser.user_email}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getRoleBadge(selectedUser.role)}
                        {getStatusBadge(selectedUser.tenant_status)}
                      </div>
                    </div>
                    <Button
                      onClick={handleToggleUserStatus}
                      variant={selectedUser.is_active ? "destructive" : "default"}
                      size="sm"
                      className="w-full sm:w-auto shrink-0"
                    >
                      {selectedUser.is_active ? (
                        <>
                          <X className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Desativar</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Ativar</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Status de Aprovação */}
                  {selectedUser.approval_status && (
                    <div className="mb-3 pb-3 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-400">Status de Aprovação</Label>
                        {getApprovalStatusBadge(selectedUser.approval_status)}
                      </div>
                      {selectedUser.approval_status === 'pending' && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            onClick={() => approveUser(selectedUser)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            onClick={() => {
                              const reason = window.prompt('Motivo da rejeição (opcional):');
                              if (reason !== null) {
                                rejectUser(selectedUser, reason || undefined);
                              }
                            }}
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grid Responsivo: 1 coluna mobile, 2 tablet, 3 desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div>
                      <Label className="text-xs text-gray-400">Empresa</Label>
                      <p className="text-white font-medium truncate">{selectedUser.tenant_name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">Cadastrado</Label>
                      <p className="text-white text-xs sm:text-sm">{formatDate(selectedUser.user_created_at)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">Último Login</Label>
                      <p className="text-white text-xs sm:text-sm">
                        {selectedUser.user_last_login === '-' ? 'Nunca' : formatDate(selectedUser.user_last_login)}
                      </p>
                    </div>
                    {selectedUser.tenant_email && (
                      <div className="sm:col-span-2 lg:col-span-1">
                        <Label className="text-xs text-gray-400">Email Empresa</Label>
                        <p className="text-white text-xs truncate">{selectedUser.tenant_email}</p>
                      </div>
                    )}
                    {selectedUser.tenant_phone && (
                      <div>
                        <Label className="text-xs text-gray-400">Telefone</Label>
                        <p className="text-white text-xs sm:text-sm">{selectedUser.tenant_phone}</p>
                      </div>
                    )}
                    {selectedUser.tenant_document && (
                      <div>
                        <Label className="text-xs text-gray-400">CPF/CNPJ</Label>
                        <p className="text-white text-xs sm:text-sm">{selectedUser.tenant_document}</p>
                      </div>
                    )}
                  </div>

                  {/* Informações do Plano - Responsivo */}
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div>
                        <Label className="text-xs text-gray-400">Plano</Label>
                        <p className="text-white font-medium text-xs sm:text-sm">
                          {selectedUser.subscription_plan_name || 'Trial Gratuito'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400">Status Assinatura</Label>
                        <div className="mt-1">
                          {selectedUser.subscription_status ? (
                            <Badge className={`text-xs ${
                              selectedUser.subscription_status === 'active' ? 'bg-green-500 text-white' :
                              selectedUser.subscription_status === 'trial' ? 'bg-blue-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              {selectedUser.subscription_status === 'active' ? 'Ativo' :
                               selectedUser.subscription_status === 'trial' ? 'Trial' :
                               selectedUser.subscription_status}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">Sem assinatura</span>
                          )}
                        </div>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-1">
                        <Label className="text-xs text-gray-400">
                          {selectedUser.subscription_trial_ends_at ? 'Fim do Trial' : 'Expiração'}
                        </Label>
                        <p className={`text-xs ${isPlanExpired(selectedUser) ? 'text-red-400 font-semibold' : 'text-white'}`}>
                          {selectedUser.subscription_trial_ends_at 
                            ? formatDateTime(selectedUser.subscription_trial_ends_at)
                            : selectedUser.subscription_current_period_end
                            ? formatDateTime(selectedUser.subscription_current_period_end)
                            : 'Nunca'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Seção de Ativação de Plano */}
          {selectedUser && (
            <div className="space-y-3 sm:space-y-4 border-t border-gray-700 pt-3 sm:pt-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Ativar/Renovar Plano</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs sm:text-sm text-gray-300 mb-2 block">Selecione o Plano</Label>
                  <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                    <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white text-sm">
                      <SelectValue placeholder="Escolha um plano" className="text-white" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 z-[100]">
                      {availablePlans.length > 0 ? (
                        availablePlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id} className="text-white text-sm focus:bg-blue-600">
                            {plan.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-gray-400">Carregando planos...</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm text-gray-300 mb-2 block">Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full bg-gray-800 border-gray-700 text-white text-sm"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              {selectedUser && !selectedUser.subscription_plan_name && (
                <Alert className="bg-yellow-500/10 border-yellow-500/30">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
                  <AlertDescription className="text-yellow-300 text-xs sm:text-sm">
                    Este cliente não possui plano ativo. Ative um plano para continuar usando o sistema.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-3 sm:pt-4">
            <Button 
              variant="destructive" 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔴 Botão de excluir clicado!', { selectedUser, deletingUser });
                
                if (!selectedUser) {
                  console.error('❌ Nenhum usuário selecionado');
                  toast.error('Nenhum usuário selecionado');
                  return;
                }
                
                if (deletingUser) {
                  console.warn('⚠️ Exclusão já em andamento');
                  return;
                }
                
                const confirmed = window.confirm(
                  `Tem certeza que deseja excluir o usuário "${selectedUser.user_email}" (${selectedUser.tenant_name})?\n\nEsta ação não pode ser desfeita.`
                );
                
                console.log('📋 Confirmação:', confirmed);
                
                if (confirmed) {
                  console.log('✅ Confirmação recebida, excluindo usuário...');
                  deleteUser(selectedUser).catch((error) => {
                    console.error('❌ Erro ao executar deleteUser:', error);
                    toast.error('Erro ao excluir usuário: ' + (error.message || 'Erro desconhecido'));
                  });
                } else {
                  console.log('❌ Exclusão cancelada pelo usuário');
                }
              }}
              disabled={deletingUser || !selectedUser}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingUser ? (
                <>
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Excluindo...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Excluir Usuário</span>
                  <span className="sm:hidden">Excluir</span>
                </>
              )}
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {selectedUser && (
                <Button
                  onClick={() => activatePlan(selectedUser)}
                  disabled={activatingPlan || !selectedPlanId || !expirationDate}
                  className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto text-sm order-first sm:order-none"
                >
                  {activatingPlan ? (
                    <>
                      <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">Ativando...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Ativar Plano</span>
                      <span className="sm:hidden">Ativar</span>
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedPlanId('');
                  setExpirationDate('');
                }}
                className="w-full sm:w-auto text-sm"
              >
                Fechar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
