'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  UserX,
  Download,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  phone?: string;
  department?: string;
  permissions: string[];
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin do Sistema',
    email: 'admin@erplite.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    phone: '(11) 99999-9999',
    department: 'TI',
    permissions: ['all']
  },
  {
    id: '2',
    name: 'João Silva',
    email: 'joao@erplite.com',
    role: 'manager',
    status: 'active',
    lastLogin: '2024-01-15T09:15:00Z',
    createdAt: '2024-01-05T00:00:00Z',
    phone: '(11) 98888-8888',
    department: 'Vendas',
    permissions: ['sales', 'customers', 'reports']
  },
  {
    id: '3',
    name: 'Maria Santos',
    email: 'maria@erplite.com',
    role: 'operator',
    status: 'active',
    lastLogin: '2024-01-14T16:45:00Z',
    createdAt: '2024-01-10T00:00:00Z',
    phone: '(11) 97777-7777',
    department: 'Estoque',
    permissions: ['inventory', 'products']
  },
  {
    id: '4',
    name: 'Carlos Oliveira',
    email: 'carlos@erplite.com',
    role: 'viewer',
    status: 'inactive',
    lastLogin: '2024-01-10T14:20:00Z',
    createdAt: '2024-01-08T00:00:00Z',
    phone: '(11) 96666-6666',
    department: 'Financeiro',
    permissions: ['reports_view']
  }
];

const roles = [
  { value: 'admin', label: 'Administrador', icon: ShieldCheck, color: 'bg-juga-primary/10 text-juga-primary' },
  { value: 'manager', label: 'Gerente', icon: Shield, color: 'bg-juga-primary/10 text-juga-primary' },
  { value: 'operator', label: 'Operador', icon: UserCheck, color: 'bg-juga-primary/10 text-juga-primary' },
  { value: 'viewer', label: 'Visualizador', icon: UserX, color: 'bg-gray-100 text-gray-800' }
];

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user: currentUser } = useAuth();

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    if (!roleConfig) return UserCheck;
    return roleConfig.icon;
  };

  const getRoleColor = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-juga-primary/10 text-juga-primary';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateUser = async (userData: Partial<User>) => {
    setLoading(true);
    try {
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'viewer',
        status: 'active',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        phone: userData.phone || '',
        department: userData.department || '',
        permissions: getDefaultPermissions(userData.role || 'viewer')
      };
      
      setUsers(prev => [...prev, newUser]);
      toast.success('Usuário criado com sucesso!');
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userData: Partial<User>) => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const updatedUser = { ...selectedUser, ...userData };
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
      toast.success('Usuário atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    setLoading(true);
    try {
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('Usuário excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    setLoading(true);
    try {
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' as 'active' | 'inactive' | 'suspended' }
          : u
      ));
      toast.success('Status do usuário atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case 'admin': return ['all'];
      case 'manager': return ['sales', 'customers', 'reports', 'inventory'];
      case 'operator': return ['sales', 'customers'];
      case 'viewer': return ['reports_view'];
      default: return [];
    }
  };

  const exportUsers = () => {
    const dataStr = JSON.stringify(users, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'usuarios-erp-lite.json';
    link.click();
    toast.success('Dados exportados com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestão de Usuários
          </h2>
          <p className="text-muted-foreground">Gerencie usuários, permissões e acessos do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo usuário
                </DialogDescription>
              </DialogHeader>
              <UserForm 
                onSubmit={handleCreateUser}
                loading={loading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Total de Usuários</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-heading">{users.length}</div>
              <p className="text-sm text-caption">
                +2 novos este mês
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Usuários Ativos</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-juga-primary">
                {users.filter(u => u.status === 'active').length}
              </div>
              <p className="text-sm text-caption">
                {Math.round((users.filter(u => u.status === 'active').length / users.length) * 100)}% do total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Administradores</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-juga-primary">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <p className="text-sm text-caption">
                Acesso completo
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Últimos Logins</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-heading">
                {users.filter(u => {
                  const lastLogin = new Date(u.lastLogin);
                  const today = new Date();
                  const diffTime = Math.abs(today.getTime() - lastLogin.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays <= 7;
                }).length}
              </div>
              <p className="text-sm text-caption">
                Nos últimos 7 dias
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-lg text-juga-text-secondary">Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Buscar usuário</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-juga-primary" />
                <Input
                  id="search"
                  placeholder="Nome ou email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="min-w-[150px]">
              <Label>Função</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as funções" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-juga-text-secondary">Lista de Usuários ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getRoleColor(user.role)}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roles.find(r => r.value === user.role)?.label || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(user.status)}>
                          {user.status === 'active' ? 'Ativo' : 
                           user.status === 'inactive' ? 'Inativo' : 'Suspenso'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(user.lastLogin).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(user.lastLogin).toLocaleTimeString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>{user.department || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={user.status === 'active'}
                            onCheckedChange={() => handleToggleStatus(user.id)}
                            disabled={loading}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUser?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize os dados do usuário
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserForm
              initialData={selectedUser}
              onSubmit={handleUpdateUser}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de formulário de usuário
interface UserFormProps {
  initialData?: User;
  onSubmit: (data: Partial<User>) => void;
  loading: boolean;
}

function UserForm({ initialData, onSubmit, loading }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: initialData?.role || 'viewer',
    phone: initialData?.phone || '',
    department: initialData?.department || '',
    status: initialData?.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome completo</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="(11) 99999-9999"
        />
      </div>

      <div>
        <Label htmlFor="department">Departamento</Label>
        <Input
          id="department"
          value={formData.department}
          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
          placeholder="Ex: Vendas, TI, Financeiro"
        />
      </div>

      <div>
        <Label>Função</Label>
        <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as User['role'] }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map(role => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {initialData && (
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as User['status'] }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="suspended">Suspenso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar'}
        </Button>
      </DialogFooter>
    </form>
  );
}
