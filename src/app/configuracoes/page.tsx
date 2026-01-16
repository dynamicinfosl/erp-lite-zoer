
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Edit, Trash2, User, Settings, Shield, Key } from 'lucide-react';
import { UserProfile, Category } from '@/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useCouponSettings } from '@/hooks/useCouponSettings';

export default function ConfiguracoesPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_type: 'vendedor' as 'admin' | 'vendedor' | 'financeiro' | 'entregador',
    phone: '',
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    color: '#2c3e50',
  });

  // Hook para configurações de cupom
  const { settings: couponSettings, updateSettings: updateCouponSettings, saveSettings } = useCouponSettings();

  useEffect(() => {
    fetchUsers();
    fetchCategories();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get<UserProfile[]>('/user-profiles');
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.get<Category[]>('/categories');
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleSaveCouponSettings = async () => {
    try {
      const success = saveSettings(couponSettings);
      if (success) {
        toast.success('Configurações do cupom salvas com sucesso!');
      } else {
        toast.error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userFormData.name || !userFormData.email) {
      toast.error('Nome e e-mail são obrigatórios');
      return;
    }

    try {
      if (editingUser) {
        await api.put(`/user-profiles?id=${editingUser.id}`, userFormData);
        toast.success('Usuário atualizado com sucesso');
      } else {
        await api.post('/user-profiles', userFormData);
        toast.success('Usuário criado com sucesso');
      }

      setShowUserDialog(false);
      setEditingUser(null);
      resetUserForm();
      fetchUsers();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error('Erro ao salvar usuário');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryFormData.name) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    try {
      if (editingCategory) {
        await api.put(`/categories?id=${editingCategory.id}`, categoryFormData);
        toast.success('Categoria atualizada com sucesso');
      } else {
        await api.post('/categories', categoryFormData);
        toast.success('Categoria criada com sucesso');
      }

      setShowCategoryDialog(false);
      setEditingCategory(null);
      resetCategoryForm();
      fetchCategories();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: '', // Não temos email no UserProfile, seria necessário buscar do users
      password: '',
      role_type: user.role_type,
      phone: user.phone || '',
    });
    setShowUserDialog(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
    });
    setShowCategoryDialog(true);
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      await api.delete(`/user-profiles?id=${id}`);
      toast.success('Usuário excluído com sucesso');
      fetchUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      await api.delete(`/categories?id=${id}`);
      toast.success('Categoria excluída com sucesso');
      fetchCategories();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  const resetUserForm = () => {
    setUserFormData({
      name: '',
      email: '',
      password: '',
      role_type: 'vendedor',
      phone: '',
    });
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: '',
      color: '#2c3e50',
    });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Administrador', variant: 'destructive' as const },
      vendedor: { label: 'Vendedor', variant: 'default' as const },
      financeiro: { label: 'Financeiro', variant: 'secondary' as const },
      entregador: { label: 'Entregador', variant: 'outline' as const },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, variant: 'outline' as const };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, categorias e configurações do sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="usuarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="cupom">Cupom</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Gestão de Usuários</h2>
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetUserForm(); setEditingUser(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha {!editingUser && '*'}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                      required={!editingUser}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role_type">Perfil *</Label>
                      <Select
                        value={userFormData.role_type}
                        onValueChange={(value: 'admin' | 'vendedor' | 'financeiro' | 'entregador') => 
                          setUserFormData(prev => ({ ...prev, role_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="vendedor">Vendedor</SelectItem>
                          <SelectItem value="financeiro">Financeiro</SelectItem>
                          <SelectItem value="entregador">Entregador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={userFormData.phone}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowUserDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingUser ? 'Atualizar' : 'Criar'} Usuário
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role_type)}
                      </TableCell>
                      <TableCell>
                        {user.phone && (
                          <div className="text-sm">{user.phone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum usuário cadastrado.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Categorias de Produtos</h2>
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetCategoryForm(); setEditingCategory(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Nome *</Label>
                    <Input
                      id="category-name"
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category-description">Descrição</Label>
                    <Input
                      id="category-description"
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category-color">Cor</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="category-color"
                        type="color"
                        value={categoryFormData.color}
                        onChange={(e) => setCategoryFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={categoryFormData.color}
                        onChange={(e) => setCategoryFormData(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="#2c3e50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCategoryDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingCategory ? 'Atualizar' : 'Criar'} Categoria
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Categorias ({categories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="font-medium">{category.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {category.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-mono">{category.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.is_active ? 'default' : 'secondary'}>
                          {category.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {categories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma categoria cadastrada.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cupom" className="space-y-4">
          <h2 className="text-xl font-semibold">Configurações do Cupom</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={couponSettings.companyName}
                    onChange={(e) => updateCouponSettings({companyName: e.target.value})}
                    placeholder="Nome da sua empresa"
                  />
                </div>
                
                <div>
                  <Label htmlFor="companyAddress">Endereço</Label>
                  <Input
                    id="companyAddress"
                    value={couponSettings.companyAddress}
                    onChange={(e) => updateCouponSettings({companyAddress: e.target.value})}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                
                <div>
                  <Label htmlFor="companyCity">Cidade - Estado</Label>
                  <Input
                    id="companyCity"
                    value={couponSettings.companyCity}
                    onChange={(e) => updateCouponSettings({companyCity: e.target.value})}
                    placeholder="Cidade - Estado"
                  />
                </div>
                
                <div>
                  <Label htmlFor="companyPhone">Telefone</Label>
                  <Input
                    id="companyPhone"
                    value={couponSettings.companyPhone}
                    onChange={(e) => updateCouponSettings({companyPhone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div>
                  <Label htmlFor="companyEmail">E-mail</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={couponSettings.companyEmail}
                    onChange={(e) => updateCouponSettings({companyEmail: e.target.value})}
                    placeholder="contato@empresa.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações de Exibição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fontSize">Tamanho da Fonte</Label>
                  <Select
                    value={couponSettings.fontSize.toString()}
                    onValueChange={(value) => updateCouponSettings({fontSize: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10px - Pequena</SelectItem>
                      <SelectItem value="12">12px - Normal</SelectItem>
                      <SelectItem value="14">14px - Grande</SelectItem>
                      <SelectItem value="16">16px - Muito Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Mostrar Endereço</Label>
                    <Switch
                      checked={couponSettings.showAddress}
                      onCheckedChange={(checked) => updateCouponSettings({showAddress: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Mostrar Telefone</Label>
                    <Switch
                      checked={couponSettings.showPhone}
                      onCheckedChange={(checked) => updateCouponSettings({showPhone: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Mostrar E-mail</Label>
                    <Switch
                      checked={couponSettings.showEmail}
                      onCheckedChange={(checked) => updateCouponSettings({showEmail: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Mostrar Data</Label>
                    <Switch
                      checked={couponSettings.showDate}
                      onCheckedChange={(checked) => updateCouponSettings({showDate: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Mostrar Horário</Label>
                    <Switch
                      checked={couponSettings.showTime}
                      onCheckedChange={(checked) => updateCouponSettings({showTime: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Mostrar Caixa</Label>
                    <Switch
                      checked={couponSettings.showCashier}
                      onCheckedChange={(checked) => updateCouponSettings({showCashier: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Mostrar Cliente</Label>
                    <Switch
                      checked={couponSettings.showCustomer}
                      onCheckedChange={(checked) => updateCouponSettings({showCustomer: checked})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Texto do Rodapé</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="footerText">Mensagem do Rodapé</Label>
                <Input
                  id="footerText"
                  value={couponSettings.footerText}
                    onChange={(e) => updateCouponSettings({footerText: e.target.value})}
                  placeholder="Obrigado pela preferência!"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações do Romaneio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="manifestFontSize">Tamanho da Fonte do Romaneio</Label>
                <Select
                  value={couponSettings.manifestFontSize?.toString() || '13'}
                  onValueChange={(value) => updateCouponSettings({manifestFontSize: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="11">11px - Pequena</SelectItem>
                    <SelectItem value="12">12px - Normal</SelectItem>
                    <SelectItem value="13">13px - Grande (Recomendado)</SelectItem>
                    <SelectItem value="14">14px - Muito Grande</SelectItem>
                    <SelectItem value="15">15px - Extra Grande</SelectItem>
                    <SelectItem value="16">16px - Máximo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  A fonte maior facilita a leitura durante a entrega. Recomendamos 13px ou maior.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button variant="outline">Cancelar</Button>
            <Button onClick={handleSaveCouponSettings}>Salvar Configurações</Button>
          </div>
        </TabsContent>

        <TabsContent value="sistema" className="space-y-4">
          <h2 className="text-xl font-semibold">Configurações do Sistema</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificações por E-mail</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações de vendas e estoque
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Backup Automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Backup diário dos dados
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modo Escuro</Label>
                    <p className="text-sm text-muted-foreground">
                      Tema escuro da interface
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Autenticação de Dois Fatores</Label>
                    <p className="text-sm text-muted-foreground">
                      Segurança adicional para login
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sessão Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Logout automático após inatividade
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="space-y-2">
                  <Label>Tempo de Sessão (minutos)</Label>
                  <Input type="number" defaultValue="30" min="5" max="480" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Informações do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Versão:</span>
                  <span className="text-sm font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Última Atualização:</span>
                  <span className="text-sm font-medium">
                    {new Date().toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Banco de Dados:</span>
                  <span className="text-sm font-medium">PostgreSQL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant="default" className="bg-green-600">Online</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="default" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Fazer Backup Manual
                </Button>
                <Button variant="default" className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Exportar Dados
                </Button>
                <Button variant="destructive" className="w-full">
                  Resetar Configurações
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
