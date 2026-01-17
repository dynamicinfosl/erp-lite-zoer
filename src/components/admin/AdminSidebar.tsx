'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  Shield,
  Users,
  BarChart3,
  Activity,
  Settings,
  FileText,
  CreditCard,
  Package,
  Home,
  LogOut,
  Database,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const menuGroups = [
  {
    title: 'Principal',
    items: [
      { title: 'Visão Geral', url: '/admin', icon: Home },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { title: 'Usuários', url: '/admin/users', icon: Users },
      { title: 'Planos', url: '/admin/plans', icon: CreditCard },
      { title: 'API Keys', url: '/admin/api-keys', icon: Key },
    ],
  },
  {
    title: 'Monitoramento',
    items: [
      { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
      { title: 'Monitoramento', url: '/admin/monitoring', icon: Activity },
      { title: 'Inventário', url: '/admin/inventory', icon: Package },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { title: 'Auditoria', url: '/admin/audit', icon: FileText },
      { title: 'Configurações', url: '/admin/settings', icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    toast.info('Saindo do painel administrativo...');
    router.push('/admin/login');
  };

  return (
    <Sidebar className="flex w-60 flex-col juga-sidebar-gradient text-white">
      <SidebarHeader className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold tracking-wide">ADMIN</span>
            <span className="text-xs text-white/60">Painel Administrativo</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 px-3 py-5">
        {menuGroups.map(group => (
          <SidebarGroup key={group.title} className="space-y-3">
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60 px-3">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => (
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
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white">
              <Database className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                Super Admin
              </span>
              <span className="text-xs text-white/60">
                Sistema ERP Lite
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
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
