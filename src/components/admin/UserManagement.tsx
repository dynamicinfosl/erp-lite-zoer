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
}

export function UserManagement() {
  
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

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
  }, [loadUsers]);

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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-300">Carregando usuários...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === null ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:bg-gray-800/50'
          }`}
          onClick={() => handleCardClick('all')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Total de Clientes</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'active' ? 'ring-2 ring-green-500 bg-green-500/10' : 'hover:bg-gray-800/50'
          }`}
          onClick={() => handleCardClick('active')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.tenant_status === 'active').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'trial' ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:bg-gray-800/50'
          }`}
          onClick={() => handleCardClick('trial')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Trial</p>
                <p className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.tenant_status === 'trial').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'pending' ? 'ring-2 ring-yellow-500 bg-yellow-500/10' : 'hover:bg-gray-800/50'
          }`}
          onClick={() => handleCardClick('pending')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {users.filter(u => u.approval_status === 'pending').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'suspended' ? 'ring-2 ring-red-500 bg-red-500/10' : 'hover:bg-gray-800/50'
          }`}
          onClick={() => handleCardClick('suspended')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Suspensos</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.tenant_status === 'suspended').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
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
                           activeFilter === 'suspended' ? 'Suspensos' : activeFilter}
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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Clientes
            </CardTitle>
            <Button onClick={loadUsers} variant="outline" size="sm">
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
                className="pl-10 w-full"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-3">
          {filteredUsers.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nenhum usuário encontrado.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto max-h-[62vh] overflow-y-auto rounded-md">
              <Table className="text-sm w-full table-fixed">
                <TableHeader className="sticky top-0 z-10 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aprovação</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow 
                      key={user.user_id} 
                      className="h-12 cursor-pointer hover:bg-gray-800/50 hover:shadow-md transition-all duration-200 group"
                      onClick={() => {
                        setSelectedUser(user);
                        setDialogOpen(true);
                      }}
                    >
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="font-medium truncate max-w-[160px] sm:max-w-[220px]">{user.user_email}</span>
                          <MousePointer className="h-3 w-3 text-gray-500 ml-auto group-hover:text-blue-400 transition-colors" />
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="truncate max-w-[140px] sm:max-w-[220px]">{user.tenant_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="py-2">{getStatusBadge(user.tenant_status)}</TableCell>
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
                          className="flex items-center gap-1"
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
                    <p className="font-medium">{selectedUser.user_email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-300">Responsável</Label>
                    <div>{getRoleBadge(selectedUser.role)}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-300">Cadastrado em</Label>
                    <p>{formatDate(selectedUser.user_created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-300">Último Login</Label>
                    <p>{selectedUser.user_last_login === '-' ? 'Nunca' : formatDate(selectedUser.user_last_login)}</p>
                  </div>
                </div>
              </div>

              {/* Informações da Empresa */}
              <div className="space-y-4 border-t border-gray-700 pt-4">
                <h3 className="font-semibold text-white">Informações da Empresa</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-300">Nome</Label>
                    <p className="font-medium">{selectedUser.tenant_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-300">Status</Label>
                    <div>{getStatusBadge(selectedUser.tenant_status)}</div>
                  </div>
                  {selectedUser.tenant_email && (
                    <div>
                      <Label className="text-sm text-gray-300">Email</Label>
                      <p>{selectedUser.tenant_email}</p>
                    </div>
                  )}
                  {selectedUser.tenant_phone && (
                    <div>
                      <Label className="text-sm text-gray-300">Telefone</Label>
                      <p>{selectedUser.tenant_phone}</p>
                    </div>
                  )}
                  {selectedUser.tenant_document && (
                    <div>
                      <Label className="text-sm text-gray-300">CPF/CNPJ</Label>
                      <p>{selectedUser.tenant_document}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          <DialogFooter className="flex justify-between">
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
