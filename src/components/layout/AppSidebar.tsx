

'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  UserCog,
  Store,
  Warehouse,
  Receipt,
  Shield,
  Wrench,
  ChevronDown,
  Tag,
  CreditCard,
  Building2,
} from 'lucide-react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { ENABLE_AUTH } from '@/constants/auth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { mockUserProfile } from '@/lib/mock-data';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User } from 'lucide-react';

const menuGroups = [
  {
    title: 'Principal',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'vendedor', 'financeiro'] },
    ],
  },
  {
    title: 'Vendas',
    items: [
      { title: 'Clientes', url: '/clientes', icon: Users, roles: ['admin', 'vendedor'] },
      { title: 'Produtos', url: '/produtos', icon: Package, roles: ['admin', 'vendedor'] },
      { title: 'Vendas / PDV', url: '/pdv', icon: ShoppingCart, roles: ['admin', 'vendedor'] },
    ],
  },
  {
    title: 'Operações',
    items: [
      { title: 'Estoque', url: '/estoque', icon: Warehouse, roles: ['admin', 'vendedor'] },
      { title: 'Entregas', url: '/entregas', icon: Truck, roles: ['admin', 'vendedor'] },
      { title: 'Ordem de Serviços', url: '/ordem-servicos', icon: Wrench, roles: ['admin', 'vendedor'] },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { title: 'Financeiro', url: '/financeiro', icon: DollarSign, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Relatórios', url: '/relatorios', icon: BarChart3, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Perfil da Empresa', url: '/perfil-empresa', icon: Building2, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Assinatura', url: '/assinatura', icon: CreditCard, roles: ['admin', 'vendedor', 'financeiro'] },
      // Botão Administração oculto - acesso restrito apenas para usuário "julga"
      // { title: 'Administração', url: '/admin', icon: Shield, roles: ['admin'] },
    ],
  },
];

// Componente interno do sidebar que será renderizado apenas no cliente
function SidebarContentInternal() {
  const pathname = usePathname();
  const { user, tenant, signOut } = useSimpleAuth();
  
  // Estados do modal de perfil
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    cpf: '',
    rg: '',
    birthDate: '',
    gender: '',
    email: '',
    password: '••••••••••••',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Simular perfil do usuário baseado no role ou usar um perfil padrão se auth estiver desabilitado
  const userRole = ENABLE_AUTH && user ? 'admin' : mockUserProfile.role;

  // Nome para exibir (sempre tem algo)
  const displayName = tenant?.name || 
    (user?.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ') : 'Meu Negócio');
  
  // Carregar dados do perfil quando o modal abrir
  useEffect(() => {
    if (isProfileModalOpen) {
      setProfileData({
        name: user?.user_metadata?.name || displayName,
        cpf: user?.user_metadata?.cpf || '',
        rg: user?.user_metadata?.rg || '',
        birthDate: user?.user_metadata?.birthDate || '',
        gender: user?.user_metadata?.gender || '',
        email: user?.email || 'usuario@empresa.com',
        password: '••••••••••••',
      });
    }
  }, [isProfileModalOpen, user, displayName]);

  const filteredGroups = menuGroups.map(group => ({
    title: group.title,
    items: group.items.filter(item => item.roles.includes(userRole)),
  })).filter(group => group.items.length > 0);

  // Função para salvar perfil do usuário
  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      
      // TODO: Implementar chamada à API para atualizar perfil
      // await fetch('/next_api/user-profiles', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(profileData),
      // });
      
      // Simular delay de salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Perfil atualizado com sucesso!');
      setIsProfileModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <Sidebar className="hidden lg:flex w-60 flex-col juga-sidebar-gradient text-white">
      <SidebarHeader className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
            <Store className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold tracking-wide">JUGA</span>
            <span className="text-xs text-white/60">ERP v1.0.0</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 px-3 py-5">
        {filteredGroups.map(group => (
          <SidebarGroup key={group.title} className="space-y-3">
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60 px-3">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item: any) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      className="group h-9 rounded-xl px-3 text-sm text-white/80 transition data-[active=true]:bg-white/20 data-[active=true]:text-white hover:bg-white/15"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4 text-white/60 transition group-data-[active=true]:text-white group-hover:text-white" />
                        <span className="truncate font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-4 py-5 border-t border-white/10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                {user?.email || mockUserProfile.email}
              </span>
              <span className="text-xs text-white/60 capitalize">
                {displayName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsProfileModalOpen(true)}
                title="Editar perfil"
                className="hover:bg-white/10"
              >
                <UserCog className="h-[1.2rem] w-[1.2rem] text-white" />
                <span className="sr-only">Perfil do usuário</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('Deseja sair do sistema?')) {
                if (ENABLE_AUTH) {
                  signOut();
                } else {
                  window.location.href = '/login';
                }
              }
            }}
            className="w-full justify-center gap-2 rounded-xl border border-white/30 bg-white/10 text-xs text-white hover:bg-white/20"
          >
            <LogOut className="h-3 w-3" />
            Finalizar sessão
          </Button>
        </div>
      </SidebarFooter>

      {/* Modal de Edição de Perfil */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Meus dados</DialogTitle>
              </div>
            </div>
          </DialogHeader>
          
          <Tabs defaultValue="dados-gerais" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="dados-gerais">Dados gerais</TabsTrigger>
              <TabsTrigger value="foto">Foto</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dados-gerais" className="space-y-6">
              {/* Primeira linha: Nome, CPF, RG */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Nome<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Cláudio Alves"
                    className="w-full h-10 border border-gray-300 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="w-full md:w-48 space-y-2">
                  <Label htmlFor="cpf" className="text-sm font-medium text-gray-700">
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    value={profileData.cpf}
                    onChange={(e) => setProfileData({ ...profileData, cpf: e.target.value })}
                    placeholder=""
                    className="w-full h-10 border border-gray-300 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="w-full md:w-48 space-y-2">
                  <Label htmlFor="rg" className="text-sm font-medium text-gray-700">
                    RG
                  </Label>
                  <Input
                    id="rg"
                    value={profileData.rg}
                    onChange={(e) => setProfileData({ ...profileData, rg: e.target.value })}
                    placeholder=""
                    className="w-full h-10 border border-gray-300 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Segunda linha: Data de nascimento, Sexo */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-56 space-y-2">
                  <Label htmlFor="birthDate" className="text-sm font-medium text-gray-700">
                    Data de nascimento
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={profileData.birthDate}
                    onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex-1 space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                    Sexo
                  </Label>
                  <select
                    id="gender"
                    value={profileData.gender}
                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>

              {/* Seção: Dados de acesso */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="p-1 bg-gray-100 rounded">🔒</span>
                  Dados de acesso
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700">E-mail</Label>
                      <p className="text-sm text-gray-600 mt-1">{profileData.email}</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-4">
                      ✉️ Alterar e-mail
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700">Senha</Label>
                      <p className="text-sm text-gray-600 mt-1">{profileData.password}</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-4">
                      🔑 Alterar senha
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700">Autenticação em duas etapas</Label>
                      <p className="text-sm text-gray-500 mt-1">Adicione mais segurança à sua conta</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-4">
                      🛡️ Habilitar autenticação
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700">Dispositivos autorizados</Label>
                      <p className="text-sm text-gray-500 mt-1">Gerencie os dispositivos conectados</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-4">
                      💻 Gerenciar dispositivos
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="foto" className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-16 w-16 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">Nenhuma foto selecionada</p>
                <Button variant="outline" className="mt-4">
                  📷 Escolher foto
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProfileModalOpen(false)}
              disabled={isSavingProfile}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              ✕ Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSavingProfile ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Salvando...
                </>
              ) : (
                <>
                  ✓ Atualizar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}

// Componente principal que usa dynamic para renderizar apenas no cliente
const DynamicSidebarContent = dynamic(() => Promise.resolve(SidebarContentInternal), {
  ssr: false,
  loading: () => (
    <Sidebar className="hidden lg:flex w-60 flex-col juga-sidebar-gradient text-white">
      <SidebarHeader className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
            <Store className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold">JUGA</span>
        </div>
      </SidebarHeader>
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
      </div>
    </Sidebar>
  )
});

export function AppSidebar() {
  return <DynamicSidebarContent />;
}

