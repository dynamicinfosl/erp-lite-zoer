'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { ENABLE_AUTH } from '@/constants/auth';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const menuGroups = [
  {
    title: 'Principal',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
      { title: 'PDV', url: '/pdv', icon: ShoppingCart },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { title: 'Financeiro', url: '/financeiro', icon: DollarSign },
      { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
      { title: 'Estoque', url: '/estoque', icon: Warehouse },
    ],
  },
  {
    title: 'Vendas',
    items: [
      { title: 'Vendas', url: '/vendas', icon: Receipt },
      { title: 'Clientes', url: '/clientes', icon: Users },
      { title: 'Produtos', url: '/produtos', icon: Package },
      { title: 'Entregas', url: '/entregas', icon: Truck },
      { title: 'Entregador', url: '/entregador', icon: Truck },
    ],
  },
  {
    title: 'Configurações',
    items: [
      { title: 'Fornecedores', url: '/fornecedores', icon: Building2 },
      { title: 'Ordem de Serviços', url: '/ordem-servicos', icon: Wrench },
      { title: 'Assinatura', url: '/assinatura', icon: CreditCard },
      { title: 'Configurações', url: '/configuracoes', icon: Settings },
      { title: 'Perfil Empresa', url: '/perfil-empresa', icon: Store },
      { title: 'Perfil Usuário', url: '/perfil-usuario', icon: UserCog },
    ],
  },
];

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const pathname = usePathname();
  const { signOut } = useSimpleAuth();

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
            <div className="px-4 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                  <Store className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold tracking-wide">JUGA</span>
                  <span className="text-xs text-white/60">ERP v1.0.0</span>
                </div>
              </div>
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
                      className="w-full justify-between text-left font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      <span className="text-sm uppercase tracking-wide">{group.title}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${
                        openGroups.includes(group.title) ? 'rotate-180' : ''
                      }`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1">
                    {group.items.map((item: any) => (
                      <Link
                        key={item.title}
                        href={item.url}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          pathname === item.url
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
            <div className="px-3 py-4 border-t border-gray-200">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
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
