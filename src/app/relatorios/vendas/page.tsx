'use client';

import React from 'react';
import { 
  ShoppingBag, 
  Package, 
  Undo2, 
  RefreshCw, 
  Wrench, 
  Users, 
  Percent, 
  FileText, 
  TrendingUp, 
  Home, 
  ChevronRight, 
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

import Link from 'next/link';

interface ReportOption {
  title: string;
  description: string;
  gradientClass: string;
  hoverShadow: string;
  icon: React.ComponentType<any>;
  href?: string;
}

const reportOptions: ReportOption[] = [
  {
    title: 'Relatório de vendas',
    description: 'Filtro por loja, tipo, período, cliente, vendedor e situação.',
    gradientClass: 'from-emerald-500 to-emerald-700',
    hoverShadow: 'hover:shadow-emerald-500/20',
    icon: ShoppingBag,
    href: '/relatorios/vendas/relatorio',
  },
  {
    title: 'Produtos vendidos',
    description: 'Filtro por loja, cliente, produto, tipo, período, grupo, vendedor e situação.',
    gradientClass: 'from-amber-500 to-amber-600',
    hoverShadow: 'hover:shadow-amber-500/20',
    icon: Package,
    href: '/relatorios/vendas/produtos-vendidos',
  },
  {
    title: 'Relatório de devoluções',
    description: 'Filtro por loja, venda, período, cliente, e valor.',
    gradientClass: 'from-rose-800 to-rose-950',
    hoverShadow: 'hover:shadow-rose-800/20',
    icon: Undo2,
  },
  {
    title: 'Produtos devolvidos',
    description: 'Filtro por loja, cliente, grupo, produto e período.',
    gradientClass: 'from-purple-600 to-purple-800',
    hoverShadow: 'hover:shadow-purple-500/20',
    icon: Package, // Usando Package/Box como no print original
  },
  {
    title: 'Serviços prestados',
    description: 'Filtro por loja, cliente, serviço, tipo, período, vendedor e situação.',
    gradientClass: 'from-slate-800 to-slate-900',
    hoverShadow: 'hover:shadow-slate-800/20',
    icon: Wrench,
  },
  {
    title: 'Clientes que mais compram',
    description: 'Filtro por loja, tipo, período, cliente, vendedor e situação.',
    gradientClass: 'from-sky-400 to-sky-600',
    hoverShadow: 'hover:shadow-sky-400/20',
    icon: Users,
  },
  {
    title: 'Comissão por venda',
    description: 'Relatório de comissão de vendedores por venda. Filtro por loja, vendedor, período e situação.',
    gradientClass: 'from-violet-600 to-violet-850',
    hoverShadow: 'hover:shadow-violet-600/20',
    icon: Percent,
  },
  {
    title: 'Comissão por produto',
    description: 'Relatório de comissão de vendedores por produto. Filtro por loja, vendedor, período e situação.',
    gradientClass: 'from-orange-500 to-orange-600',
    hoverShadow: 'hover:shadow-orange-500/20',
    icon: Percent,
  },
  {
    title: 'Comissão por serviço',
    description: 'Relatório de comissão de vendedores por serviço. Filtro por loja, vendedor, período e situação.',
    gradientClass: 'from-slate-800 to-slate-900',
    hoverShadow: 'hover:shadow-slate-950/20',
    icon: Percent,
  },
  {
    title: 'Relatório de orçamentos',
    description: 'Filtro por loja, tipo, período, cliente, vendedor e situação.',
    gradientClass: 'from-yellow-500 to-yellow-650',
    hoverShadow: 'hover:shadow-yellow-500/20',
    icon: FileText,
  },
  {
    title: 'Curva ABC de produtos',
    description: 'Relatório de curva ABC de produtos. Filtro por loja, período, tipo, situação, canal e classe ABC.',
    gradientClass: 'from-emerald-500 to-emerald-700',
    hoverShadow: 'hover:shadow-emerald-500/20',
    icon: TrendingUp,
  },
  {
    title: 'Curva ABC de clientes',
    description: 'Relatório de curva ABC de clientes. Filtro por loja, período, clientes, vendedor e classe ABC.',
    gradientClass: 'from-sky-400 to-sky-600',
    hoverShadow: 'hover:shadow-sky-400/20',
    icon: UserCheck,
  },
];

export default function RelatoriosVendasPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Home className="h-3.5 w-3.5" />
        <span>Início</span>
        <ChevronRight className="h-3 w-3" />
        <span>Relatórios de vendas</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-800 dark:text-slate-200 font-medium">Listar</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Relatórios de vendas</h1>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportOptions.map((option, idx) => {
          const IconComponent = option.icon;
          const CardContentBlock = (
            <Card 
              className={`group relative overflow-hidden bg-gradient-to-br ${option.gradientClass} text-white border-none shadow-md ${option.hoverShadow} hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 cursor-pointer h-full`}
            >
              <CardContent className="p-6 flex flex-col h-48 relative z-10">
                {/* Background Giant Icon */}
                <div className="absolute -right-4 -bottom-6 text-white/10 pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <IconComponent className="h-28 w-28" />
                </div>

                <div className="space-y-2 pr-12">
                  <h3 className="text-xl font-bold tracking-tight">{option.title}</h3>
                  <p className="text-sm text-white/80 leading-relaxed font-medium">
                    {option.description}
                  </p>
                </div>

                {/* Footer Section */}
                <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-white/90 text-xs font-bold uppercase tracking-wider">
                  <span>Clique aqui</span>
                  <div className="flex items-center justify-center bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors">
                    <ArrowRight className="h-3.5 w-3.5 transform transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );

          if (option.href) {
            return (
              <Link href={option.href} key={idx} className="block h-full">
                {CardContentBlock}
              </Link>
            );
          }

          return (
            <div key={idx} className="h-full">
              {CardContentBlock}
            </div>
          );
        })}
      </div>
    </div>
  );
}
