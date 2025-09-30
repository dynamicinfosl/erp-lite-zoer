'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminNavigation } from './AdminNavigation';
import { 
  Menu, 
  Shield, 
  CheckCircle,
  X
} from 'lucide-react';

interface AdminMobileHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  getTabTitle: (tab: string) => string;
  getTabDescription: (tab: string) => string;
}

export function AdminMobileHeader({ 
  activeTab, 
  onTabChange, 
  getTabTitle, 
  getTabDescription 
}: AdminMobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-3 py-3">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="h-full">
                  <AdminNavigation 
                    activeTab={activeTab} 
                    onTabChange={(tab) => {
                      onTabChange(tab);
                      setIsOpen(false);
                    }} 
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo/Title */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-600 rounded-lg">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  Admin
                </h1>
              </div>
            </div>

            {/* Status */}
            <Badge variant="default" className="bg-green-600 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Online
            </Badge>
          </div>

          {/* Page Title */}
          <div className="mt-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {getTabTitle(activeTab)}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {getTabDescription(activeTab)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
