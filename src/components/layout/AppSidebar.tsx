

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import { ENABLE_AUTH } from '@/constants/auth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { mockUserProfile } from '@/lib/mock-data';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'vendedor', 'financeiro'],
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
    url: '/produtos',
    icon: Package,
    roles: ['admin', 'vendedor'],
  },
  {
    title: 'Estoque',
    url: '/estoque',
    icon: Warehouse,
    roles: ['admin', 'vendedor'],
  },
  {
    title: 'Clientes',
    url: '/clientes',
    icon: Users,
    roles: ['admin', 'vendedor'],
  },
  {
    title: 'Entregas',
    url: '/entregas',
    icon: Truck,
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

export function AppSidebar() {
  const pathname = usePathname();
  
  // Usar autenticação do Supabase quando habilitada
  let user = mockUserProfile;
  let logout = () => {};
  
  if (ENABLE_AUTH) {
    try {
      const supabaseAuth = useSupabaseAuth();
      user = supabaseAuth?.user || mockUserProfile;
      logout = supabaseAuth?.signOut || (() => {});
    } catch (error) {
      console.error('Erro na autenticação do sidebar:', error);
      user = mockUserProfile;
      logout = () => {};
    }
  }

  // Simular perfil do usuário baseado no role ou usar um perfil padrão se auth estiver desabilitado
  const userRole = ENABLE_AUTH ? (user?.isAdmin ? 'admin' : user?.role || 'vendedor') : mockUserProfile.role;

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(userRole)
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">ERP Lite</span>
            <span className="text-xs text-muted-foreground">Gestão de Bebidas</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex flex-col gap-3">
          {/* Seção do Perfil do Usuário */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {user?.email || mockUserProfile.email}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {userRole === 'admin' ? 'Administrador' : userRole === 'vendedor' ? 'Vendedor' : userRole === 'financeiro' ? 'Financeiro' : userRole === 'entregador' ? 'Entregador' : 'Usuário'}
              </span>
            </div>
            <ThemeToggle />
          </div>
          
          {/* Botão Sair */}
          {ENABLE_AUTH && (
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full justify-start gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

