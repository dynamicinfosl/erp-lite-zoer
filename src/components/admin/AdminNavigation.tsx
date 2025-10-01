'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  Activity, 
  Database,
  FileText,
  Monitor,
  LogOut,
  User,
  Home,
  CreditCard
} from 'lucide-react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { toast } from 'sonner';

interface AdminNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function AdminNavigation({ activeTab = 'overview', onTabChange }: AdminNavigationProps) {
  const { user, signOut } = useSimpleAuth();

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair do painel administrativo?')) {
      try {
        await signOut();
        toast.success('Logout realizado com sucesso');
        // Fechar a janela do admin
        window.close();
      } catch (error) {
        toast.error('Erro ao fazer logout');
      }
    }
  };

  const navigationItems = [
    { id: 'overview', label: 'Visão Geral', icon: Activity },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'plans', label: 'Planos', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'monitoring', label: 'Monitoramento', icon: Monitor },
    { id: 'inventory', label: 'Estoque', icon: Database },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'logs', label: 'Logs', icon: FileText },
  ];

  return (
    <Card className="h-full border-r-0 rounded-none bg-white dark:bg-gray-800 shadow-sm">
      <div className="p-3 sm:p-4 lg:p-6 h-full flex flex-col">
        {/* Header - Responsivo */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 lg:mb-8">
          <div className="p-1.5 sm:p-2 bg-red-600 rounded-lg">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-white leading-tight">
              <span className="hidden sm:inline">Painel Admin</span>
              <span className="sm:hidden">Admin</span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              <span className="hidden sm:inline">ERP Lite JUGA</span>
              <span className="sm:hidden">JUGA</span>
            </p>
          </div>
        </div>

        {/* Status - Responsivo */}
        <div className="mb-4 sm:mb-6">
          <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-1.5 sm:mr-2"></div>
            <span className="hidden sm:inline">Sistema Online</span>
            <span className="sm:hidden">Online</span>
          </Badge>
        </div>

        {/* Navigation - Responsivo */}
        <nav className="flex-1">
          <div className="space-y-0.5 sm:space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`w-full justify-start h-8 sm:h-9 lg:h-10 text-xs sm:text-sm ${
                    isActive 
                      ? "bg-red-600 hover:bg-red-700 text-white" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => onTabChange?.(item.id)}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="truncate">
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                  </span>
                </Button>
              );
            })}
          </div>
        </nav>

        {/* User Info & Actions - Responsivo */}
        <div className="mt-auto space-y-3 sm:space-y-4">
          {/* User Info */}
          <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.email || 'Administrador'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Admin
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-1.5 sm:space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs sm:text-sm h-7 sm:h-8"
              onClick={() => window.open('/', '_blank')}
            >
              <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Ir para Sistema</span>
              <span className="sm:hidden">Sistema</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 text-xs sm:text-sm h-7 sm:h-8"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Sair
            </Button>
          </div>

        </div>
      </div>
    </Card>
  );
}
