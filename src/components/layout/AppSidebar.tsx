

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
  Layers,
  CreditCard,
  Building2,
  RotateCcw,
  FileText,
  UsersRound,
  Wallet,
} from 'lucide-react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { ENABLE_AUTH } from '@/constants/auth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { mockUserProfile } from '@/lib/mock-data';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BranchSelector } from '@/components/branches/BranchSelector';
import { useBranch } from '@/contexts/BranchContext';
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
      { 
        title: 'Produtos', 
        url: '/produtos', 
        icon: Package, 
        roles: ['admin', 'vendedor'],
        subItems: [
          { title: 'Lista de Produtos', url: '/produtos', icon: Package },
          { title: 'Valores de Venda', url: '/produtos/valores-venda', icon: Tag },
          { title: 'Variações', url: '/produtos/variacoes', icon: Layers },
        ]
      },
      { 
        title: 'Vendas', 
        url: '/vendas', 
        icon: Receipt, 
        roles: ['admin', 'vendedor'],
        subItems: [
          { title: 'Vendas de Balcão', url: '/vendas', icon: ShoppingCart },
          { title: 'Vendas de Produtos', url: '/vendas-produtos', icon: Package },
        ]
      },
      {
        title: 'PDV',
        url: '/pdv',
        icon: ShoppingCart,
        roles: ['admin', 'vendedor'],
        subItems: [
          { title: 'Ponto de Venda', url: '/pdv', icon: ShoppingCart },
          { title: 'Caixas', url: '/pdv/caixas', icon: Wallet },
        ],
      },
    ],
  },
  {
    title: 'Operações',
    items: [
      { title: 'Estoque', url: '/estoque', icon: Warehouse, roles: ['admin', 'vendedor'] },
      { title: 'Devolução', url: '/estoque/devolucao', icon: RotateCcw, roles: ['admin', 'vendedor'] },
      { title: 'Entregas', url: '/entregas', icon: Truck, roles: ['admin', 'vendedor'] },
      { title: 'Entregadores', url: '/entregadores', icon: UsersRound, roles: ['admin', 'vendedor'] },
      { title: 'Ordem de Serviços', url: '/ordem-servicos', icon: Wrench, roles: ['admin', 'vendedor'] },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { title: 'Financeiro', url: '/financeiro', icon: DollarSign, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Relatórios', url: '/relatorios', icon: BarChart3, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Filiais', url: '/filiais', icon: Building2, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Perfil da Empresa', url: '/perfil-empresa', icon: Building2, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Configuração Fiscal', url: '/configuracao-fiscal', icon: FileText, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Perfil do Usuário', url: '/perfil-usuario', icon: UserCog, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Usuários', url: '/configuracoes/usuarios', icon: Users, roles: ['admin'] },
      { title: 'Assinatura', url: '/assinatura', icon: CreditCard, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Configurações', url: '/configuracoes', icon: Settings, roles: ['admin', 'vendedor', 'financeiro'] },
      // Botão Administração oculto - acesso restrito apenas para usuário "julga"
      // { title: 'Administração', url: '/admin', icon: Shield, roles: ['admin'] },
    ],
  },
];

// Componente interno do sidebar que será renderizado apenas no cliente
function SidebarContentInternal() {
  const pathname = usePathname();
  const { user, tenant, signOut } = useSimpleAuth();
  const { enabled: isBranchesEnabled } = useBranch();
  
  
  // Simular perfil do usuário baseado no role ou usar um perfil padrão se auth estiver desabilitado
  const userRole = ENABLE_AUTH && user ? 'admin' : mockUserProfile.role;

  // Nome para exibir (sempre tem algo)
  const displayName = tenant?.name || 
    (user?.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ') : 'Meu Negócio');
  

  const filteredGroups = menuGroups.map(group => ({
    title: group.title,
    items: group.items
      .filter(item => item.roles.includes(userRole))
      .filter(item => (item.url === '/filiais' ? isBranchesEnabled : true)),
  })).filter(group => group.items.length > 0);


  return (
    <Sidebar className="hidden lg:flex w-60 flex-col juga-sidebar-gradient text-white">
      <SidebarHeader className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
            <Store className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold tracking-wide text-white">JUGA</span>
            <span className="text-xs text-white/60 dark:text-white font-medium">ERP v1.0.0</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 px-3 py-5">
        {filteredGroups.map(group => (
          <SidebarGroup key={group.title} className="space-y-3">
            <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/60 dark:text-white px-3">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item: any) => {
                  // Se o item tem subitens, renderizar como collapsible
                  if (item.subItems && item.subItems.length > 0) {
                    const isActive = item.subItems.some((subItem: any) => pathname === subItem.url) || pathname === item.url;
                    const isOpen = item.subItems.some((subItem: any) => pathname === subItem.url);
                    
                    return (
                      <Collapsible key={item.title} defaultOpen={isOpen} asChild>
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={isActive}
                              className="group h-9 rounded-xl px-3 text-sm text-white/80 dark:text-white transition data-[active=true]:bg-white/20 data-[active=true]:text-white hover:bg-white/15 w-full"
                            >
                              <item.icon className="h-4 w-4 text-white/60 dark:text-white/90 transition group-data-[active=true]:text-white group-hover:text-white" />
                              <span className="truncate font-semibold dark:font-semibold flex-1 text-left">{item.title}</span>
                              <ChevronDown className="h-4 w-4 text-white/60 dark:text-white/90 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenu className="ml-4 mt-1 space-y-1">
                              {item.subItems.map((subItem: any) => (
                                <SidebarMenuItem key={subItem.title}>
                                  <SidebarMenuButton
                                    asChild
                                    isActive={pathname === subItem.url}
                                    className="group h-8 rounded-lg px-3 text-sm text-white/70 dark:text-white/80 transition data-[active=true]:bg-white/20 data-[active=true]:text-white hover:bg-white/10"
                                  >
                                    <Link href={subItem.url}>
                                      <subItem.icon className="h-3.5 w-3.5 text-white/50 dark:text-white/70 transition group-data-[active=true]:text-white group-hover:text-white" />
                                      <span className="truncate font-medium">{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              ))}
                            </SidebarMenu>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }
                  
                  // Item normal sem subitens
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        className="group h-9 rounded-xl px-3 text-sm text-white/80 dark:text-white transition data-[active=true]:bg-white/20 data-[active=true]:text-white hover:bg-white/15"
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4 text-white/60 dark:text-white/90 transition group-data-[active=true]:text-white group-hover:text-white" />
                          <span className="truncate font-semibold dark:font-semibold">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-4 py-5 border-t border-white/10">
        <div className="flex flex-col gap-4">
          <BranchSelector />
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white dark:text-white truncate">
                {user?.email || mockUserProfile.email}
              </span>
              <span className="text-xs text-white/60 dark:text-white font-medium capitalize">
                {displayName}
              </span>
            </div>
            <ThemeToggle />
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
            className="w-full justify-center gap-2 rounded-xl border border-white/30 dark:border-white/50 bg-white/10 dark:bg-white/20 text-xs text-white dark:text-white hover:bg-white/20 dark:hover:bg-white/30"
          >
            <LogOut className="h-3 w-3" />
            Finalizar sessão
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
    <Sidebar className="hidden lg:flex w-60 flex-col juga-sidebar-gradient text-white">
      <SidebarHeader className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
            <Store className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold text-white">JUGA</span>
        </div>
      </SidebarHeader>
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white dark:border-white"></div>
      </div>
    </Sidebar>
  )
});

export function AppSidebar() {
  return <DynamicSidebarContent />;
}

