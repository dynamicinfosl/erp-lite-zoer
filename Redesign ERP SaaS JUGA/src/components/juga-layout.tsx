import React from 'react';
import { 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  Menu,
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  Archive,
  Truck,
  Wrench,
  CreditCard,
  Star,
  Shield
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

const navigationSections = [
  {
    title: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3, href: '/dashboard' },
    ]
  },
  {
    title: 'Vendas',
    items: [
      { id: 'clientes', label: 'Clientes', icon: Users, href: '/clientes' },
      { id: 'produtos', label: 'Produtos', icon: Package, href: '/produtos' },
      { id: 'vendas', label: 'Vendas / PDV', icon: ShoppingCart, href: '/vendas' },
    ]
  },
  {
    title: 'Operações',
    items: [
      { id: 'estoque', label: 'Estoque', icon: Archive, href: '/estoque' },
      { id: 'entregas', label: 'Entregas', icon: Truck, href: '/entregas' },
      { id: 'servicos', label: 'Ordem de Serviços', icon: Wrench, href: '/servicos' },
    ]
  },
  {
    title: 'Gestão',
    items: [
      { id: 'financeiro', label: 'Financeiro', icon: CreditCard, href: '/financeiro' },
      { id: 'assinatura', label: 'Assinatura', icon: Star, href: '/assinatura' },
      { id: 'admin', label: 'Administração', icon: Shield, href: '/admin' },
    ]
  },
];

const Sidebar = ({ currentPage }: { currentPage?: string }) => (
  <div className="h-full juga-sidebar-gradient border-r border-sidebar-border flex flex-col relative overflow-hidden">
    {/* Background Decorative Elements */}
    <div className="absolute inset-0 opacity-[0.05]">
      <div className="absolute top-20 -left-10 w-40 h-40 border border-white/20 rounded-full"></div>
      <div className="absolute top-60 -right-16 w-32 h-32 border border-white/20 rounded-full"></div>
      <div className="absolute bottom-40 -left-8 w-24 h-24 border border-white/20 rounded-full"></div>
      <div className="absolute bottom-20 right-4 w-16 h-16 border border-white/20 rounded-full"></div>
      <div className="absolute top-40 left-8 w-2 h-2 bg-white/30 rounded-full"></div>
      <div className="absolute top-80 right-8 w-1.5 h-1.5 bg-white/40 rounded-full"></div>
      <div className="absolute bottom-60 left-12 w-1 h-1 bg-white/50 rounded-full"></div>
    </div>

    {/* Logo */}
    <div className="relative z-10 p-6 border-b border-sidebar-border/20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-xl">J</span>
        </div>
        <div>
          <h1 className="text-sidebar-foreground font-bold text-xl">JUGA</h1>
          <p className="text-sidebar-foreground/70 text-xs">ERP SaaS</p>
        </div>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 p-4 space-y-6 relative z-10">
      {navigationSections.map((section) => (
        <div key={section.title}>
          <div className="px-3 py-2 mb-3">
            <h3 className="text-sidebar-foreground/60 font-semibold text-xs uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="mt-1 w-8 h-px bg-white/20"></div>
          </div>
          <div className="space-y-1">
            {section.items.map((item) => {
              const IconComponent = item.icon;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    currentPage === item.id
                      ? 'bg-white/15 text-white backdrop-blur-sm shadow-lg'
                      : 'text-sidebar-foreground/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <IconComponent className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                  {currentPage === item.id && (
                    <div className="ml-auto w-1 h-4 bg-white rounded-full opacity-60"></div>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </nav>

    {/* Upgrade Banner */}
    <div className="relative z-10 p-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Star className="h-4 w-4 text-white" />
        </div>
        <div className="text-white/90 text-xs mb-1 font-medium">
          Plano Trial
        </div>
        <div className="text-white font-semibold text-sm mb-3">
          7 dias restantes
        </div>
        <div className="w-full bg-white/20 rounded-full h-1.5 mb-3">
          <div className="bg-white h-1.5 rounded-full" style={{ width: '50%' }}></div>
        </div>
        <Button size="sm" className="w-full bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm transition-all">
          Fazer Upgrade
        </Button>
      </div>
    </div>
  </div>
);

export function AppLayout({ children, currentPage }: AppLayoutProps) {
  return (
    <div className="h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64">
        <Sidebar currentPage={currentPage} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <Sidebar currentPage={currentPage} />
                </SheetContent>
              </Sheet>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar..."
                  className="pl-9 w-64 bg-muted/30 border-0 focus:bg-background"
                />
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-destructive text-destructive-foreground text-xs">
                  3
                </Badge>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium">João Silva</div>
                      <div className="text-xs text-muted-foreground">Administrador</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-full p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}