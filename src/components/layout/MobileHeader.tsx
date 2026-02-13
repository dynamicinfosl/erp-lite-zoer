'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu,
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
  UsersRound,
} from 'lucide-react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { ENABLE_AUTH } from '@/constants/auth';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BranchSelector } from '@/components/branches/BranchSelector';
import { useBranch } from '@/contexts/BranchContext';
import { mockUserProfile } from '@/lib/mock-data';

const menuGroups = [
  {
    title: 'Principal',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'PDV', url: '/pdv', icon: ShoppingCart, roles: ['admin', 'vendedor'] },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { title: 'Financeiro', url: '/financeiro', icon: DollarSign, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Relatórios', url: '/relatorios', icon: BarChart3, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Estoque', url: '/estoque', icon: Warehouse, roles: ['admin', 'vendedor'] },
      { title: 'Filiais', url: '/filiais', icon: Building2, roles: ['admin', 'vendedor', 'financeiro'] },
    ],
  },
  {
    title: 'Vendas',
    items: [
      { title: 'Vendas', url: '/vendas', icon: Receipt, roles: ['admin', 'vendedor'] },
      { title: 'Clientes', url: '/clientes', icon: Users, roles: ['admin', 'vendedor'] },
      { title: 'Produtos', url: '/produtos', icon: Package, roles: ['admin', 'vendedor'] },
      { title: 'Entregas', url: '/entregas', icon: Truck, roles: ['admin', 'vendedor'] },
      { title: 'Entregadores', url: '/entregadores', icon: UsersRound, roles: ['admin', 'vendedor'] },
      { title: 'Entregador', url: '/entregador', icon: Truck, roles: ['admin', 'vendedor'] },
    ],
  },
  {
    title: 'Configurações',
    items: [
      { title: 'Fornecedores', url: '/fornecedores', icon: Building2, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Ordem de Serviços', url: '/ordem-servicos', icon: Wrench, roles: ['admin', 'vendedor'] },
      { title: 'Assinatura', url: '/assinatura', icon: CreditCard, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Usuários', url: '/configuracoes/usuarios', icon: Users, roles: ['admin'] },
      { title: 'Configurações', url: '/configuracoes', icon: Settings, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Perfil Empresa', url: '/perfil-empresa', icon: Store, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Perfil Usuário', url: '/perfil-usuario', icon: UserCog, roles: ['admin', 'vendedor', 'financeiro'] },
    ],
  },
];

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const pathname = usePathname();
  const { signOut, user, tenant } = useSimpleAuth();
  const { enabled: isBranchesEnabled } = useBranch();
  const [userRole, setUserRole] = useState<string>('vendedor');

  // Buscar role real do usuário
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!ENABLE_AUTH || !user || !tenant) {
        setUserRole(mockUserProfile.role);
        return;
      }

      try {
        // Tentar API user-role
        try {
          const roleRes = await fetch(
            `/next_api/user-role?user_id=${encodeURIComponent(user.id)}&tenant_id=${encodeURIComponent(tenant.id)}&_t=${Date.now()}`,
            { 
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              }
            }
          );
          
          if (roleRes.ok) {
            const roleData = await roleRes.json();
            if (roleData.success && roleData.data) {
              const role = roleData.data.role;
              if (role === 'admin') {
                setUserRole('admin');
                return;
              }
            }
          }
        } catch (roleError) {
          console.warn('[MobileHeader] Erro ao buscar via user-role:', roleError);
        }

        // Fallback para user-branch-info
        try {
          const branchRes = await fetch(
            `/next_api/user-branch-info?user_id=${encodeURIComponent(user.id)}&_t=${Date.now()}`,
            { 
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              }
            }
          );
          
          if (branchRes.ok) {
            const branchData = await branchRes.json();
            if (branchData.success && branchData.data) {
              const role = branchData.data.role;
              const isMatrixAdmin = branchData.data.isMatrixAdmin;
              if (role === 'owner' || role === 'admin' || isMatrixAdmin) {
                setUserRole('admin');
                return;
              }
            }
          }
        } catch (branchError) {
          console.warn('[MobileHeader] Erro ao buscar via user-branch-info:', branchError);
        }

        // Fallback final: tenant-users
        const timestamp = Date.now();
        const res = await fetch(
          `/next_api/tenant-users?tenant_id=${encodeURIComponent(tenant.id)}&user_id=${encodeURIComponent(user.id)}&_t=${timestamp}`,
          { 
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          }
        );
        
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            const currentUser = data.data.find((u: any) => u.id === user.id);
            if (currentUser) {
              if (currentUser.role === 'owner' || currentUser.role === 'admin') {
                setUserRole('admin');
                return;
              }
            }
          }
        }

        // Padrão: vendedor/operador
        setUserRole('vendedor');
      } catch (error) {
        console.error('[MobileHeader] Erro ao buscar role do usuário:', error);
        setUserRole('vendedor');
      }
    };

    fetchUserRole();
  }, [user, tenant]);

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(title => title !== groupTitle)
        : [...prev, groupTitle]
    );
  };

  const handleLogout = async () => {
    if (confirm('Deseja sair do sistema?')) {
      if (ENABLE_AUTH) {
        await signOut();
      } else {
        window.location.href = '/login';
      }
    }
  };

  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-slate-800 dark:to-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                  <Store className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold tracking-wide text-white">JUGA</span>
                  <span className="text-xs text-white/70 dark:text-white font-medium">ERP v1.0.0</span>
                </div>
              </div>
            </div>

            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <BranchSelector />
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-3 py-5">
              {menuGroups.map(group => (
                <Collapsible
                  key={group.title}
                  open={openGroups.includes(group.title)}
                  onOpenChange={() => toggleGroup(group.title)}
                  className="space-y-3"
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-left font-bold text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <span className="text-sm uppercase tracking-wide">{group.title}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${
                        openGroups.includes(group.title) ? 'rotate-180' : ''
                      }`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1">
                    {group.items
                      .filter((item: any) => {
                        // Verificar role do usuário
                        const hasRole = item.roles ? item.roles.includes(userRole) : true;
                        const isFiliaisItem = item.url === '/filiais';
                        const shouldShowFiliais = isFiliaisItem ? isBranchesEnabled : true;
                        return hasRole && shouldShowFiliais;
                      })
                      .map((item: any) => (
                      <Link
                        key={item.title}
                        href={item.url}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          pathname === item.url
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-100 font-semibold'
                            : 'text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>

            {/* Footer */}
            <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full justify-center gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
                Finalizar sessão
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
