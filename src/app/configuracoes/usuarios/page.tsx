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
import { Plus, Search, Edit, Trash2, UserPlus, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { useBranch } from '@/contexts/BranchContext';
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
  const [userToDelete, setUserToDelete] = useState<TenantUser | null>(null);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'member' as 'admin' | 'member',
    branch_ids: [] as number[],
  });

  const loadUsers = useCallback(async () => {
    if (!tenant?.id || !user?.id) return;

    try {
      setLoading(true);
      const res = await fetch(
        `/next_api/tenant-users?tenant_id=${encodeURIComponent(tenant.id)}&user_id=${encodeURIComponent(user.id)}`,
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao carregar usuários');
      }

      setUsers(json.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast.error(error.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, user?.id]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleOpenDialog = (user?: TenantUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        name: user.name || '',
        role: user.role === 'owner' ? 'admin' : user.role,
        branch_ids: user.branches.map((b) => b.branch_id),
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'member',
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

        toast.success('Usuário atualizado com sucesso');
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

        toast.success('Usuário criado com sucesso');
      }

      handleCloseDialog();
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Atualize as informações e permissões do usuário'
                : 'Crie um novo usuário para acessar o sistema'}
            </DialogDescription>
          </DialogHeader>
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
