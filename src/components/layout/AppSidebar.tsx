

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
  Store,
  Warehouse,
  Receipt,
  Shield,
  Wrench,
  ChevronDown,
  Tag,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import { ENABLE_AUTH } from '@/constants/auth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { mockUserProfile } from '@/lib/mock-data';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'vendedor', 'financeiro'],
  },
  {
    title: 'Cadastros',
    icon: Users,
    roles: ['admin', 'vendedor', 'financeiro'],
    children: [
      { title: 'Clientes', url: '/clientes', icon: Users, roles: ['admin', 'vendedor'] },
      { title: 'Fornecedores', url: '/fornecedores', icon: Truck, roles: ['admin', 'financeiro', 'vendedor'] },
    ],
  },
  {
    title: 'PDV',
    url: '/pdv',
    icon: ShoppingCart,
    roles: ['admin', 'vendedor'],
  },
  {
    title: 'Vendas',
    url: '/vendas',
    icon: Receipt,
    roles: ['admin', 'vendedor', 'financeiro'],
  },
  {
    title: 'Produtos',
    icon: Package,
    roles: ['admin', 'vendedor'],
    children: [
      { title: 'Gerenciar Produtos', url: '/produtos', icon: Package, roles: ['admin', 'vendedor'] },
      { title: 'Valores de Venda', url: '/produtos/valores', icon: DollarSign, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Etiquetas', url: '/produtos/etiquetas', icon: Tag, roles: ['admin', 'vendedor'] },
    ],
  },
  {
    title: 'Estoque',
    url: '/estoque',
    icon: Warehouse,
    roles: ['admin', 'vendedor'],
  },
  {
    title: 'Entregas',
    url: '/entregas',
    icon: Truck,
    roles: ['admin', 'vendedor'],
  },
  {
    title: 'Ordem de Serviços',
    url: '/ordem-servicos',
    icon: Wrench,
    roles: ['admin', 'vendedor'],
  },
  {
    title: 'Portal Entregador',
    url: '/entregador',
    icon: Truck,
    roles: ['entregador'],
  },
  {
    title: 'Financeiro',
    url: '/financeiro',
    icon: DollarSign,
    roles: ['admin', 'financeiro'],
  },
  {
    title: 'Relatórios',
    url: '/relatorios',
    icon: BarChart3,
    roles: ['admin', 'financeiro'],
  },
  {
    title: 'Configurações',
    url: '/configuracoes',
    icon: Settings,
    roles: ['admin'],
  },
  {
    title: 'Admin',
    url: '/admin',
    icon: Shield,
    roles: ['admin'],
  },
];

// Componente interno do sidebar que será renderizado apenas no cliente
function SidebarContentInternal() {
  const pathname = usePathname();
  
  // Usar autenticação do Supabase quando habilitada
  let user = mockUserProfile;
  let logout = () => {};
  
  if (ENABLE_AUTH) {
    try {
      const supabaseAuth = useSupabaseAuth();
      // Corrige os tipos conforme o tipo User do Supabase
      user = {
        ...mockUserProfile,
        ...supabaseAuth?.user,
        // Apenas sobrescreve propriedades que existem em mockUserProfile
        role: (supabaseAuth?.user as any)?.role ?? mockUserProfile.role,
        email: supabaseAuth?.user?.email ?? mockUserProfile.email,
        id: typeof supabaseAuth?.user?.id === 'number'
          ? supabaseAuth?.user?.id
          : mockUserProfile.id,
        // Propriedades customizadas (isAdmin, name, avatar, created_at, updated_at) só se existirem
        ...(typeof (supabaseAuth?.user as any)?.isAdmin !== 'undefined' && { isAdmin: (supabaseAuth?.user as any).isAdmin }),
        ...(typeof (supabaseAuth?.user as any)?.name !== 'undefined' && { name: (supabaseAuth?.user as any).name }),
        ...(typeof (supabaseAuth?.user as any)?.avatar !== 'undefined' && { avatar: (supabaseAuth?.user as any).avatar }),
        ...(typeof (supabaseAuth?.user as any)?.created_at !== 'undefined' && { created_at: (supabaseAuth?.user as any).created_at }),
        ...(typeof (supabaseAuth?.user as any)?.updated_at !== 'undefined' && { updated_at: (supabaseAuth?.user as any).updated_at }),
      };
      logout = supabaseAuth?.signOut || (() => {});
    } catch (error) {
      console.error('Erro na autenticação do sidebar:', error);
      user = mockUserProfile;
      logout = () => {};
    }
  }

  // Simular perfil do usuário baseado no role ou usar um perfil padrão se auth estiver desabilitado
  const userRole = ENABLE_AUTH ? (user?.isAdmin ? 'admin' : user?.role || 'vendedor') : mockUserProfile.role;

  const filteredMenuItems = menuItems
    .filter(item => item.roles.includes(userRole))
    .map(item => {
      if (item.children) {
        const children = item.children.filter((c: any) => c.roles.includes(userRole));
        return { ...item, children };
      }
      return item;
    });

  return (
    <Sidebar className="w-48">
      <SidebarHeader className="border-b p-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-3 w-3" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold truncate">ERP Lite</span>
            <span className="text-xs text-muted-foreground hidden">Gestão de Bebidas</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs px-2">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {filteredMenuItems.map((item: any) => (
                <React.Fragment key={item.title}>
                  {!item.children ? (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        className="h-7 text-xs px-2"
                      >
                        <Link href={item.url}>
                          <item.icon className="h-3 w-3" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : (
                    <Collapsible defaultOpen={item.children.some((c: any) => pathname.startsWith(c.url))}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuItem>
                          <SidebarMenuButton className="h-7 text-xs px-2 justify-between">
                            <span className="flex items-center gap-2">
                              <item.icon className="h-3 w-3" />
                              <span className="truncate">{item.title}</span>
                            </span>
                            <ChevronDown className="h-3 w-3 transition-transform duration-200 data-[state=open]:rotate-180" />
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-4 py-1">
                          {item.children.map((child: any) => (
                            <SidebarMenuItem key={child.title}>
                              <SidebarMenuButton
                                asChild
                                isActive={pathname === child.url}
                                className="h-7 text-xs px-2"
                              >
                                <Link href={child.url}>
                                  <child.icon className="h-3 w-3" />
                                  <span className="truncate">{child.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </React.Fragment>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <div className="flex flex-col gap-1">
          {/* Seção do Perfil do Usuário */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground truncate">
                {user?.email || mockUserProfile.email}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {userRole === 'admin' ? 'Admin' : userRole === 'vendedor' ? 'Vendedor' : userRole === 'financeiro' ? 'Financeiro' : userRole === 'entregador' ? 'Entregador' : 'Usuário'}
              </span>
            </div>
            <ThemeToggle />
          </div>
          
          {/* Botão Sair */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('Deseja sair do sistema?')) {
                if (ENABLE_AUTH) {
                  // Se autenticação estiver habilitada, fazer logout
                  logout();
                }
                // Sempre redirecionar para login
                window.location.href = '/login';
              }
            }}
            className="w-full justify-start gap-1 h-7 text-xs px-2"
          >
            <LogOut className="h-3 w-3" />
            Sair
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

// Componente principal que usa dynamic para renderizar apenas no cliente
const DynamicSidebarContent = dynamic(() => Promise.resolve(SidebarContentInternal), {
  ssr: false,
  loading: () => (
    <Sidebar className="w-48">
      <SidebarHeader className="border-b p-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-3 w-3" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold truncate">ERP Lite</span>
          </div>
        </div>
      </SidebarHeader>
      <div className="px-1">
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    </Sidebar>
  )
});

export function AppSidebar() {
  return <DynamicSidebarContent />;
}

