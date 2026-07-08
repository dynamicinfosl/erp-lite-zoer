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
  Database,
  ClipboardList,
  ShoppingBag,
  Scroll,
  Activity,
  Layers,
  Wallet,
} from 'lucide-react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { ENABLE_AUTH } from '@/constants/auth';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BranchSelector } from '@/components/branches/BranchSelector';
import { useBranch } from '@/contexts/BranchContext';

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
      { title: 'Entregas', url: '/entregas', icon: Truck, roles: ['admin', 'vendedor'] },
      { title: 'Entregadores', url: '/entregadores', icon: UsersRound, roles: ['admin', 'vendedor'] },
    ],
  },
  {
    title: 'Operações',
    items: [
      { title: 'Estoque', url: '/estoque', icon: Warehouse, roles: ['admin', 'vendedor'] },
      { title: 'Ordem de Serviços', url: '/ordem-servicos', icon: Wrench, roles: ['admin', 'vendedor'] },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { title: 'Financeiro', url: '/financeiro', icon: DollarSign, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Filiais', url: '/filiais', icon: Building2, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Perfil Empresa', url: '/perfil-empresa', icon: Store, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Notas Fiscais', url: '/notas-fiscais', icon: Receipt, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Configurações', url: '/configuracoes', icon: Settings, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Usuários', url: '/configuracoes/usuarios', icon: Users, roles: ['admin'] },
      { title: 'Assinatura', url: '/assinatura', icon: CreditCard, roles: ['admin', 'vendedor', 'financeiro'] },
      { title: 'Migrar Dados', url: '/migrar', icon: Database, roles: ['admin'] },
      { title: 'Perfil Usuário', url: '/perfil-usuario', icon: UserCog, roles: ['admin', 'vendedor', 'financeiro'] },
    ],
  },
  {
    title: 'Relatórios',
    items: [
      { 
        title: 'Relatórios', 
        url: '/relatorios', 
        icon: BarChart3, 
        roles: ['admin', 'vendedor', 'financeiro'],
        subItems: [
          { title: 'Cadastros', url: '/relatorios/cadastros', icon: ClipboardList },
          { title: 'Vendas', url: '/relatorios/vendas', icon: ShoppingBag },
          { title: 'Ordens de serviços', url: '/relatorios/ordem-servicos', icon: Wrench },
          { title: 'Estoque', url: '/relatorios/estoque', icon: Package },
          { title: 'Financeiro', url: '/relatorios/financeiro', icon: DollarSign },
          { title: 'Contratos', url: '/relatorios/contratos', icon: Scroll },
          { title: 'Fiscal', url: '/relatorios/fiscal', icon: Receipt },
          { title: 'Logs do sistema', url: '/relatorios/logs', icon: Activity },
        ]
      },
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
      if (!user || !tenant) {
        setUserRole('vendedor');
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
        <SheetContent side="left" className="w-80 p-0 juga-sidebar-gradient text-white border-r border-white/10">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-6 border-b border-white/10 bg-white/5 text-white flex items-center justify-center">
              <div className="w-full flex items-center justify-center h-16">
                <img 
                  src="/logo-juga.png" 
                  alt="JUGA Logo" 
                  className="max-h-12 w-auto object-contain" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = document.getElementById('mobile-logo-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }} 
                />
                <div id="mobile-logo-fallback" className="hidden h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white gap-2">
                  <Store className="h-5 w-5" />
                  <span className="text-sm font-semibold text-white">JUGA</span>
                </div>
              </div>
            </div>

            <div className="px-4 py-4 border-b border-white/10 bg-white/5">
              <BranchSelector />
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-3 py-5 space-y-4">
              {menuGroups.map((group, groupIdx) => (
                <React.Fragment key={group.title}>
                  {groupIdx > 0 && <div className="border-t border-white/10 my-2 mx-1" />}
                  <Collapsible
                    open={openGroups.includes(group.title)}
                    onOpenChange={() => toggleGroup(group.title)}
                    className="space-y-3"
                  >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-left font-bold text-white/60 dark:text-white/60 hover:bg-white/10 hover:text-white"
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
                      .map((item: any) => {
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        if (hasSubItems) {
                          return (
                            <div key={item.title} className="space-y-1">
                              <div className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-white/50 dark:text-white/50">
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </div>
                              <div className="pl-4 space-y-1 border-l border-white/10 ml-5">
                                {item.subItems.map((subItem: any) => (
                                  <Link
                                    key={subItem.title}
                                    href={subItem.url}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                      pathname === subItem.url
                                        ? 'bg-white/20 dark:bg-[#2e539e] text-white font-semibold'
                                        : 'text-white/70 dark:text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                                  >
                                    <subItem.icon className="h-3.5 w-3.5" />
                                    {subItem.title}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={item.title}
                            href={item.url}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                              pathname === item.url
                                ? 'bg-white/20 dark:bg-[#2e539e] text-white font-semibold'
                                : 'text-white/70 dark:text-white/80 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                          </Link>
                        );
                      })}
                  </CollapsibleContent>
                </Collapsible>
              </React.Fragment>
            ))}
            </div>

            {/* Footer */}
            <div className="px-3 py-4 border-t border-white/10 bg-white/5">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full justify-center gap-2 text-white border-white/30 hover:bg-white/10"
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
