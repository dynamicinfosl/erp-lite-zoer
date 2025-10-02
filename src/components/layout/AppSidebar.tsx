

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
  CreditCard,
  Building2,
} from 'lucide-react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { ENABLE_AUTH } from '@/constants/auth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { mockUserProfile } from '@/lib/mock-data';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  
  // Simular perfil do usuário baseado no role ou usar um perfil padrão se auth estiver desabilitado
  const userRole = ENABLE_AUTH && user ? 'admin' : mockUserProfile.role;

  // Nome para exibir (sempre tem algo)
  const displayName = tenant?.name || 
    (user?.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ') : 'Meu Negócio');

  const filteredGroups = menuGroups.map(group => ({
    title: group.title,
    items: group.items.filter(item => item.roles.includes(userRole)),
  })).filter(group => group.items.length > 0);

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
            className="w-full justify-center gap-2 rounded-xl border border-white/30 bg-white/10 text-xs text-white hover:bg-white/20"
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

