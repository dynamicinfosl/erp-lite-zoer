'use client';

import React, { useState, useEffect } from 'react';
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
  Check,
  X,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  const supabase = createClientComponentClient();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.tenant_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando usuários do Supabase...');

      // Buscar todos os usuários com seus tenants
      const { data, error } = await supabase
        .from('user_memberships')
        .select(`
          user_id,
          role,
          is_active,
          tenant:tenants (
            id,
            name,
            status,
            email,
            phone,
            document,
            created_at
          )
        `);

      if (error) {
        console.error('❌ Erro ao buscar usuários:', error);
        toast.error('Erro ao carregar usuários');
        return;
      }

      console.log('📡 Dados recebidos:', data);

      // Buscar emails dos usuários da tabela auth.users via RPC
      const { data: authData, error: authError } = await supabase.rpc('get_all_system_users');

      console.log('📡 Dados auth:', authData, authError);

      // Mapear dados
      const mappedUsers: TenantUser[] = (data || []).map((item: any) => {
        const authUser = authData?.find((au: any) => au.user_id === item.user_id);
        
        return {
          user_id: item.user_id,
          user_email: authUser?.email || 'Desconhecido',
          user_created_at: authUser?.created_at || item.tenant?.created_at,
          user_last_login: authUser?.last_sign_in_at || '-',
          tenant_id: item.tenant?.id || '',
          tenant_name: item.tenant?.name || 'Sem empresa',
          tenant_status: item.tenant?.status || 'trial',
          role: item.role,
          is_active: item.is_active,
          tenant_email: item.tenant?.email,
          tenant_phone: item.tenant?.phone,
          tenant_document: item.tenant?.document,
        };
      });

      console.log('✅ Usuários mapeados:', mappedUsers);
      setUsers(mappedUsers);
      setFilteredUsers(mappedUsers);
    } catch (error) {
      console.error('❌ Erro geral:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const toggleTenantStatus = async (user: TenantUser) => {
    try {
      const newStatus = user.tenant_status === 'active' ? 'suspended' : 'active';

      const { error } = await supabase
        .from('tenants')
        .update({ status: newStatus })
        .eq('id', user.tenant_id);

      if (error) throw error;

      toast.success(`Conta ${newStatus === 'active' ? 'ativada' : 'suspensa'} com sucesso!`);
      await loadUsers();
      setDialogOpen(false);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const approveClient = async (user: TenantUser) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ 
          status: 'active',
          approval_status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', user.tenant_id);

      if (error) throw error;

      toast.success('Cliente aprovado com sucesso!');
      await loadUsers();
      setApprovalDialogOpen(false);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao aprovar cliente');
    }
  };

  const rejectClient = async (user: TenantUser) => {
    if (!rejectionReason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .update({ 
          status: 'cancelled',
          approval_status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', user.tenant_id);

      if (error) throw error;

      toast.success('Cliente rejeitado com sucesso!');
      await loadUsers();
      setApprovalDialogOpen(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao rejeitar cliente');
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
        <Card>
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.tenant_status === 'active').length}
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
                <p className="text-sm text-gray-300">Trial</p>
                <p className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.tenant_status === 'trial').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {users.filter(u => u.tenant_status === 'pending_approval').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Suspensos</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.tenant_status === 'suspended').length}
                </p>
              </div>
              <X className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

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
          
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por email ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
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
                    <TableHead>Papel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id} className="h-12">
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="font-medium truncate max-w-[160px] sm:max-w-[220px]">{user.user_email}</span>
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
                      <TableCell className="py-2 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Calendar className="h-4 w-4" />
                          {formatDate(user.user_created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 w-[1%] whitespace-nowrap">
                        <Button
                          onClick={() => {
                            setSelectedUser(user);
                            setDialogOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Gerenciar
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
                    <Label className="text-sm text-gray-300">Papel</Label>
                    <div>{getRoleBadge(selectedUser.role)}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-300">Cadastrado em</Label>
                    <p>{formatDate(selectedUser.user_created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-300">Último login</Label>
                    <p>{formatDate(selectedUser.user_last_login)}</p>
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

              {/* Ações */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 text-white">Ações</h3>
                <div className="flex gap-2 flex-wrap">
                  {selectedUser.tenant_status === 'pending_approval' && (
                    <>
                      <Button
                        onClick={() => {
                          setSelectedUser(selectedUser);
                          setApprovalDialogOpen(true);
                        }}
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Aprovar Cliente
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedUser(selectedUser);
                          setApprovalDialogOpen(true);
                        }}
                        variant="destructive"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Rejeitar Cliente
                      </Button>
                    </>
                  )}
                  
                  {selectedUser.tenant_status === 'active' && (
                    <Button
                      onClick={() => toggleTenantStatus(selectedUser)}
                      variant="destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Suspender Conta
                    </Button>
                  )}
                  
                  {(selectedUser.tenant_status === 'suspended' || selectedUser.tenant_status === 'trial') && (
                    <Button
                      onClick={() => toggleTenantStatus(selectedUser)}
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Ativar Conta
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Aprovação/Rejeição */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Gerenciar Aprovação</DialogTitle>
            <DialogDescription>
              {selectedUser?.tenant_status === 'pending_approval' 
                ? 'Aprovar ou rejeitar este cliente'
                : 'Ações disponíveis para este cliente'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Cliente: {selectedUser.tenant_name}</h4>
                <p className="text-sm text-gray-300">Email: {selectedUser.user_email}</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => approveClient(selectedUser)}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprovar Cliente
                  </Button>
                  <Button
                    onClick={() => {
                      const reason = prompt('Motivo da rejeição:');
                      if (reason) {
                        setRejectionReason(reason);
                        rejectClient(selectedUser);
                      }
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rejeitar Cliente
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rejection_reason">Motivo da rejeição (opcional)</Label>
                  <textarea
                    id="rejection_reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Informe o motivo da rejeição..."
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
