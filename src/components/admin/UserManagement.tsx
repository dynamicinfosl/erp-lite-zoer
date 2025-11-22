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
          const err = await response.json();
          errorMessage = err?.error || errorMessage;
        } catch {
          // Se não conseguir parsear JSON, usar mensagem padrão
        }
        throw new Error(errorMessage);
      }

      const json = await response.json().catch((parseError) => {
        console.error('❌ Erro ao parsear resposta JSON:', parseError);
        throw new Error('Resposta inválida do servidor');
      });

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

  useEffect(() => {
    loadUsers();
    loadPlans();
  }, [loadUsers]);

  const loadPlans = async () => {
    try {
      const response = await fetch('/next_api/plans');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setAvailablePlans(result.data.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            slug: plan.slug
          })));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

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


  const deleteUser = async (user: TenantUser) => {
    try {
      console.log('🗑️ Iniciando exclusão do usuário:', user.user_id);
      
      // TODO: Implementar endpoint de exclusão de usuários via API
      // Por enquanto, apenas mostrar mensagem
      toast.info('Funcionalidade de exclusão será implementada em breve via API');
      setDialogOpen(false);
      
      // Removido código antigo que usava supabase diretamente
      // A exclusão será implementada via endpoint /next_api/admin/users no futuro
    } catch (error) {
      console.error('❌ Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
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
      // Resetar campos
      setSelectedPlanId('');
      setExpirationDate('');
      
      // Notificar o cliente para recarregar a página (se estiver logado)
      toast.info('O cliente precisa recarregar a página para ver as mudanças', {
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Erro ao ativar plano:', error);
      toast.error(error.message || 'Erro ao ativar plano');
    } finally {
      setActivatingPlan(false);
    }
  };

  // Quando abrir o modal, definir data padrão (30 dias a partir de hoje)
  useEffect(() => {
    if (dialogOpen && selectedUser) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setExpirationDate(defaultDate.toISOString().split('T')[0]);
    }
  }, [dialogOpen, selectedUser]);

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
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
        <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
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
            className="text-blue-300 border-blue-300 hover:bg-blue-500/20"
          >
            Limpar Filtro
          </Button>
        </div>
      )}

      {/* Tabela de Usuários */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />
              Gerenciar Clientes
            </CardTitle>
            <Button onClick={loadUsers} variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
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
              <Table className="text-sm w-full table-fixed">
                <TableHeader className="sticky top-0 z-10 bg-gray-800/90 backdrop-blur supports-[backdrop-filter]:bg-gray-800/60 border-gray-700">
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Email</TableHead>
                    <TableHead className="text-gray-300">Empresa</TableHead>
                    <TableHead className="text-gray-300">Responsável</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Plano</TableHead>
                    <TableHead className="text-gray-300">Expiração</TableHead>
                    <TableHead className="text-gray-300">Aprovação</TableHead>
                    <TableHead className="text-gray-300">Cadastro</TableHead>
                    <TableHead className="text-gray-300">Último Login</TableHead>
                    <TableHead className="text-gray-300">Ações</TableHead>
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
        <DialogContent className="max-w-2xl bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Gerenciar Cliente</DialogTitle>
            <DialogDescription>
              Visualize e gerencie os detalhes do cliente
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Informações do Usuário */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white">Informações do Usuário</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-300">Email</Label>
                    <p className="font-medium text-white">{selectedUser.user_email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-300">Responsável</Label>
                    <div>{getRoleBadge(selectedUser.role)}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-300">Cadastrado em</Label>
                    <p className="text-white">{formatDate(selectedUser.user_created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-300">Último Login</Label>
                    <p className="text-white">{selectedUser.user_last_login === '-' ? 'Nunca' : formatDate(selectedUser.user_last_login)}</p>
                  </div>
                </div>
              </div>

              {/* Informações da Empresa */}
              <div className="space-y-4 border-t border-gray-700 pt-4">
                <h3 className="font-semibold text-white">Informações da Empresa</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-300">Nome</Label>
                    <p className="font-medium text-white">{selectedUser.tenant_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-300">Status</Label>
                    <div>{getStatusBadge(selectedUser.tenant_status)}</div>
                  </div>
                  {selectedUser.tenant_email && (
                    <div>
                      <Label className="text-sm text-gray-300">Email</Label>
                      <p className="text-white">{selectedUser.tenant_email}</p>
                    </div>
                  )}
                  {selectedUser.tenant_phone && (
                    <div>
                      <Label className="text-sm text-gray-300">Telefone</Label>
                      <p className="text-white">{selectedUser.tenant_phone}</p>
                    </div>
                  )}
                  {selectedUser.tenant_document && (
                    <div>
                      <Label className="text-sm text-gray-300">CPF/CNPJ</Label>
                      <p className="text-white">{selectedUser.tenant_document}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações do Plano */}
              <div className="space-y-4 border-t border-gray-700 pt-4">
                <h3 className="font-semibold text-white">Informações do Plano</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-300">Plano</Label>
                    <p className="font-medium text-white">
                      {selectedUser.subscription_plan_name || 'Sem plano cadastrado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-300">Status da Assinatura</Label>
                    <div>
                      {selectedUser.subscription_status ? (
                        <Badge className={
                          selectedUser.subscription_status === 'active' ? 'bg-green-500 text-white' :
                          selectedUser.subscription_status === 'trial' ? 'bg-blue-500 text-white' :
                          'bg-gray-500 text-white'
                        }>
                          {selectedUser.subscription_status === 'active' ? 'Ativo' :
                           selectedUser.subscription_status === 'trial' ? 'Trial' :
                           selectedUser.subscription_status}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">Sem assinatura</span>
                      )}
                    </div>
                  </div>
                  {selectedUser.subscription_trial_ends_at && (
                    <div>
                      <Label className="text-sm text-gray-300">Fim do Trial</Label>
                      <p className={isPlanExpired(selectedUser) ? 'text-red-400 font-semibold' : 'text-white'}>
                        {formatDateTime(selectedUser.subscription_trial_ends_at)}
                      </p>
                    </div>
                  )}
                  {selectedUser.subscription_current_period_end && (
                    <div>
                      <Label className="text-sm text-gray-300">Expiração do Plano</Label>
                      <p className={isPlanExpired(selectedUser) ? 'text-red-400 font-semibold' : 'text-white'}>
                        {formatDateTime(selectedUser.subscription_current_period_end)}
                      </p>
                    </div>
                  )}
                  {!selectedUser.subscription_trial_ends_at && !selectedUser.subscription_current_period_end && (
                    <div className="col-span-2">
                      <Label className="text-sm text-gray-300">Data de Expiração</Label>
                      <p className="text-gray-400 text-sm">Não informada</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Seção de Ativação de Plano */}
          {selectedUser && (
            <div className="space-y-4 border-t border-gray-700 pt-4">
              <h3 className="font-semibold text-white">Ativar/Renovar Plano</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-300 mb-2 block">Selecione o Plano</Label>
                  <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                    <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Escolha um plano" className="text-white" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {availablePlans.length > 0 ? (
                        availablePlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id} className="text-white focus:bg-blue-600">
                            {plan.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled className="text-gray-400">Carregando planos...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-gray-300 mb-2 block">Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full bg-gray-800 border-gray-700 text-white"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              {selectedUser && !selectedUser.subscription_plan_name && (
                <Alert className="bg-yellow-500/10 border-yellow-500/30">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-300">
                    Este cliente não possui plano ativo. Ative um plano para continuar usando o sistema.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (selectedUser && confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
                    deleteUser(selectedUser);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                <X className="h-4 w-4 mr-2" />
                Excluir Usuário
              </Button>
            </div>
            <div className="flex gap-2">
              {selectedUser && (
                <Button
                  onClick={() => activatePlan(selectedUser)}
                  disabled={activatingPlan || !selectedPlanId || !expirationDate}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {activatingPlan ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ativando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Ativar Plano
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" onClick={() => {
                setDialogOpen(false);
                setSelectedPlanId('');
                setExpirationDate('');
              }}>
                Fechar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
