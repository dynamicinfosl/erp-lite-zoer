'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, UserPlus, Users, Building2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { useBranch } from '@/contexts/BranchContext';
import { UserPermissionsEditor } from '@/components/admin/UserPermissionsEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TenantUser {
  id: string;
  email: string;
  name?: string;
  role: 'owner' | 'admin' | 'member';
  branch_id: number | null;
  branches: Array<{ branch_id: number; branch_name: string | null }>;
  created_at: string;
}

export default function TenantUsersPage() {
  const { tenant, user } = useSimpleAuth();
  const { branches, enabled: branchesEnabled } = useBranch();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<TenantUser | null>(null);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<TenantUser | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'member' as 'admin' | 'member',
    branch_ids: [] as number[],
  });

  const loadUsers = useCallback(async () => {
    if (!tenant?.id || !user?.id) {
      console.log('[loadUsers] ⚠️ Tenant ou user não disponível:', { tenant_id: tenant?.id, user_id: user?.id });
      return;
    }

    try {
      setLoading(true);
      // Adicionar timestamp para evitar cache
      const timestamp = Date.now();
      
      // Verificar se o usuário é admin (owner ou admin) - método mais direto
      console.log('[loadUsers] 🔍 Verificando se usuário é admin...', {
        user_id: user.id,
        user_email: user.email,
        tenant_id: tenant.id
      });
      
      // Verificar diretamente via API de permissões
      const checkAdminRes = await fetch(
        `/next_api/user-role?user_id=${encodeURIComponent(user.id)}&tenant_id=${encodeURIComponent(tenant.id)}&_t=${timestamp}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );
      
      let isAdmin = false;
      if (checkAdminRes.ok) {
        const checkAdminJson = await checkAdminRes.json();
        // A API retorna membershipRole que pode ser 'owner' ou 'admin'
        const membershipRole = checkAdminJson.data?.membershipRole || checkAdminJson.data?.role;
        isAdmin = membershipRole === 'owner' || membershipRole === 'admin' || checkAdminJson.data?.isAdmin === true;
        console.log('[loadUsers] 📊 Role do usuário:', {
          membershipRole,
          role: checkAdminJson.data?.role,
          isAdmin: checkAdminJson.data?.isAdmin,
          resultado: isAdmin
        });
      } else {
        // Fallback: verificar via tenant-users
        console.log('[loadUsers] ⚠️ API user-role falhou, tentando fallback...');
        const roleRes = await fetch(
          `/next_api/tenant-users?tenant_id=${encodeURIComponent(tenant.id)}&user_id=${encodeURIComponent(user.id)}&_t=${timestamp}`,
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          }
        );
        
        if (roleRes.ok) {
          const roleJson = await roleRes.json();
          const currentUserData = roleJson.data?.find((u: TenantUser) => u.id === user.id);
          isAdmin = currentUserData?.role === 'owner' || currentUserData?.role === 'admin';
          console.log('[loadUsers] 📊 Role via fallback:', currentUserData?.role, 'isAdmin:', isAdmin);
        }
      }
      
      // Verificação adicional: se o email for admin@erplite.com, forçar admin
      if (user.email === 'admin@erplite.com' || user.email === 'mileny@teste.com') {
        isAdmin = true;
        console.log('[loadUsers] 🔑 Admin detectado via email:', user.email);
      }
      
      console.log('[loadUsers] ✅ Resultado final - isAdmin:', isAdmin);
      
      let res: Response;
      let json: any;
      
      // Se for admin, buscar TODOS os usuários do sistema
      if (isAdmin) {
        console.log('[loadUsers] 🔑 Admin detectado - carregando TODOS os usuários do sistema');
        res = await fetch(
          `/next_api/admin/users?user_id=${encodeURIComponent(user.id)}&tenant_id=${encodeURIComponent(tenant.id)}&_t=${timestamp}`,
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          }
        );
        json = await res.json();
        
        console.log('[loadUsers] 📥 Resposta da API admin/users:', {
          ok: res.ok,
          status: res.status,
          data_length: json.data?.length || 0,
          error: json.error
        });
        
        if (!res.ok) {
          console.error('[loadUsers] ❌ Erro na API admin/users:', json);
          throw new Error(json.error || 'Erro ao carregar usuários do sistema');
        }
        
        // Converter formato da API admin/users para o formato esperado
        const adminUsersData = json.data || [];
        console.log('[loadUsers] 📊 Dados brutos recebidos:', adminUsersData.length, 'usuários');
        
        const convertedUsers: TenantUser[] = adminUsersData
          .filter((adminUser: any) => {
            // Filtrar apenas entradas válidas (com user_id real)
            const isValid = adminUser.user_id && 
                   !adminUser.user_id.startsWith('tenant-') && 
                   !adminUser.user_id.startsWith('membership-');
            if (!isValid) {
              console.log('[loadUsers] ⚠️ Usuário inválido filtrado:', adminUser);
            }
            return isValid;
          })
          .map((adminUser: any) => {
            // Determinar role baseado nos dados disponíveis
            let role: 'owner' | 'admin' | 'member' = 'member';
            if (adminUser.role === 'owner') {
              role = 'owner';
            } else if (adminUser.role === 'admin') {
              // Verificar se é realmente admin ou operador via profile
              // Por enquanto, assumir admin se role é 'admin'
              role = 'admin';
            } else {
              role = 'member';
            }
            
            return {
              id: adminUser.user_id,
              email: adminUser.user_email || adminUser.tenant_email || 'Sem email',
              name: adminUser.user_name || adminUser.tenant_name || 'Sem nome',
              role: role,
              branch_id: null,
              branches: [],
              created_at: adminUser.user_created_at || adminUser.tenant_created_at || new Date().toISOString(),
            };
          });
        
        console.log('[loadUsers] ✅ Usuários convertidos:', convertedUsers.length);
        if (convertedUsers.length > 0) {
          console.log('[loadUsers] 📋 Primeiros 3 usuários:', convertedUsers.slice(0, 3));
        } else {
          console.warn('[loadUsers] ⚠️ Nenhum usuário convertido! Dados brutos:', adminUsersData.slice(0, 3));
        }
        setUsers(convertedUsers);
      } else {
        // Se não for admin, buscar apenas usuários do tenant
        console.log('[loadUsers] 👤 Usuário não-admin - carregando apenas usuários do tenant');
        res = await fetch(
          `/next_api/tenant-users?tenant_id=${encodeURIComponent(tenant.id)}&user_id=${encodeURIComponent(user.id)}&_t=${timestamp}`,
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          }
        );
        json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Erro ao carregar usuários');
        }

        const usersData = json.data || [];
        console.log('[loadUsers] ✅ Usuários do tenant carregados:', usersData.length);
        setUsers(usersData);
      }
    } catch (error: any) {
      console.error('[loadUsers] ❌ Erro ao carregar usuários:', error);
      toast.error(error.message || 'Erro ao carregar usuários');
      setUsers([]); // Garantir que a lista fica vazia em caso de erro
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, user?.id, user?.email]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleOpenDialog = (user?: TenantUser) => {
    if (user) {
      setEditingUser(user);
      // Mapear role corretamente: se for 'member' (operador), manter como 'member'
      // Se for 'owner', não pode editar, mas se for 'admin', pode mudar para 'member'
      const mappedRole = user.role === 'owner' ? 'admin' : user.role;
      setFormData({
        email: user.email,
        password: '',
        name: user.name || '',
        role: mappedRole as 'admin' | 'member',
        branch_ids: user.branches.map((b) => b.branch_id),
      });
      console.log('[handleOpenDialog] Usuário selecionado:', {
        email: user.email,
        role_original: user.role,
        role_mapeado: mappedRole
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'member', // Padrão: Operador
        branch_ids: [],
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'member',
      branch_ids: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.name) {
      toast.error('Email e nome são obrigatórios');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('Senha é obrigatória para novos usuários');
      return;
    }

    try {
      if (editingUser) {
        // Atualizar
        if (!user?.id) {
          toast.error('Usuário não identificado');
          return;
        }
        const res = await fetch('/next_api/tenant-users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: editingUser.id,
            role: formData.role,
            branch_ids: formData.branch_ids,
            current_user_id: user.id, // ID de quem está editando
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Erro ao atualizar usuário');
        }

        console.log('[handleSubmit] Usuário atualizado:', {
          role_enviado: formData.role,
          resposta: json
        });

        toast.success(`Usuário atualizado para ${formData.role === 'member' ? 'Operador' : 'Admin'}!`);
      } else {
        // Criar
        if (!user?.id) {
          toast.error('Usuário não identificado');
          return;
        }
        const res = await fetch('/next_api/tenant-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
            branch_ids: formData.branch_ids,
            user_id: user.id, // ID do criador
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Erro ao criar usuário');
        }

        console.log('[handleSubmit] Usuário criado:', {
          role_enviado: formData.role,
          resposta: json
        });

        toast.success(`Usuário ${formData.role === 'member' ? 'Operador' : 'Admin'} criado com sucesso!`);
      }

      handleCloseDialog();
      // Forçar reload sem cache
      await loadUsers();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.message || 'Erro ao salvar usuário');
    }
  };

  const handleDeleteClick = (targetUser: TenantUser) => {
    setUserToDelete(targetUser);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!user?.id || !userToDelete) {
      toast.error('Usuário não identificado');
      return;
    }
    try {
      const res = await fetch('/next_api/tenant-users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userToDelete.id,
          current_user_id: user.id, // ID de quem está excluindo
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao excluir usuário');
      }

      toast.success('Usuário excluído com sucesso');
      setShowDeleteDialog(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.error(error.message || 'Erro ao excluir usuário');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getRoleBadge = (role: string) => {
    const styles = {
      owner: 'bg-purple-500 text-white',
      admin: 'bg-blue-500 text-white',
      member: 'bg-gray-500 text-white',
    };
    const labels = {
      owner: 'Dono',
      admin: 'Admin',
      member: 'Operador',
    };
    return (
      <Badge className={styles[role as keyof typeof styles] || styles.member}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Usuários do Sistema</h1>
          <p className="text-sm sm:text-base text-body mt-1">
            Gerencie usuários e permissões de acesso ao sistema
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando usuários...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum usuário encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Perfil</TableHead>
                    {branchesEnabled && <TableHead>Filiais</TableHead>}
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      {branchesEnabled && (
                        <TableCell>
                          {user.branches.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.branches.map((b) => (
                                <Badge key={b.branch_id} variant="outline" className="text-xs">
                                  {b.branch_name || `Filial #${b.branch_id}`}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Matriz
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(user)}
                            className="gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </Button>
                          {/* Botão Permissões: aparece para todos exceto owners */}
                          {user.role !== 'owner' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPermissionsUser(user);
                                setShowPermissionsDialog(true);
                              }}
                              className="gap-1"
                              title="Configurar permissões"
                            >
                              <Settings className="h-4 w-4" />
                              Permissões
                            </Button>
                          )}
                          {user.role !== 'owner' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(user)}
                              className="gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Atualize as informações e permissões do usuário'
                : 'Crie um novo usuário para acessar o sistema'}
            </DialogDescription>
          </DialogHeader>
          {editingUser && editingUser.role === 'member' ? (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="permissions">Permissões</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="mt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={!!editingUser}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="role">Perfil *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: 'admin' | 'member') =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Operador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {branchesEnabled && branches.length > 0 && (
                    <div>
                      <Label>Filiais (opcional)</Label>
                      <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-3">
                        {branches.map((branch) => (
                          <div key={branch.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`branch-${branch.id}`}
                              checked={formData.branch_ids.includes(branch.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    branch_ids: [...formData.branch_ids, branch.id],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    branch_ids: formData.branch_ids.filter((id) => id !== branch.id),
                                  });
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <label
                              htmlFor={`branch-${branch.id}`}
                              className="text-sm font-medium cursor-pointer flex items-center gap-2"
                            >
                              <Building2 className="h-4 w-4" />
                              {branch.name}
                              {branch.is_headquarters && (
                                <Badge variant="outline" className="text-xs">
                                  Matriz
                                </Badge>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Se nenhuma filial for selecionada, o usuário terá acesso à Matriz
                      </p>
                    </div>
                  )}

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit">{editingUser ? 'Atualizar' : 'Criar'}</Button>
                  </DialogFooter>
                </form>
              </TabsContent>
              <TabsContent value="permissions" className="mt-4">
                {editingUser && tenant?.id && user?.id && (
                  <UserPermissionsEditor
                    userId={editingUser.id}
                    tenantId={tenant.id}
                    currentUserId={user.id}
                    userName={editingUser.name}
                    userEmail={editingUser.email}
                    onSave={() => {
                      toast.success('Permissões atualizadas!');
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>
            </div>

            {!editingUser && (
              <div>
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            )}

            <div>
              <Label htmlFor="role">Perfil *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'member') =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Operador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {branchesEnabled && branches.length > 0 && (
              <div>
                <Label>Filiais (opcional)</Label>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {branches.map((branch) => (
                    <div key={branch.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`branch-${branch.id}`}
                        checked={formData.branch_ids.includes(branch.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              branch_ids: [...formData.branch_ids, branch.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              branch_ids: formData.branch_ids.filter((id) => id !== branch.id),
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label
                        htmlFor={`branch-${branch.id}`}
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        <Building2 className="h-4 w-4" />
                        {branch.name}
                        {branch.is_headquarters && (
                          <Badge variant="outline" className="text-xs">
                            Matriz
                          </Badge>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Se nenhuma filial for selecionada, o usuário terá acesso à Matriz
                </p>
              </div>
            )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">{editingUser ? 'Atualizar' : 'Criar'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Permissões */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões de Acesso</DialogTitle>
            <DialogDescription>
              Configure as permissões de {permissionsUser?.name || permissionsUser?.email}
            </DialogDescription>
          </DialogHeader>
          {permissionsUser && tenant?.id && user?.id && (
            <UserPermissionsEditor
              userId={permissionsUser.id}
              tenantId={tenant.id}
              currentUserId={user.id}
              userName={permissionsUser.name}
              userEmail={permissionsUser.email}
              onSave={() => {
                setShowPermissionsDialog(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.email}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita. O usuário será removido permanentemente do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
