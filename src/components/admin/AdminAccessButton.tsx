'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { AdminPopup } from './AdminPopup';
import { useAdminPopup } from '@/hooks/useAdminPopup';

interface AdminAccessButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export function AdminAccessButton({ 
  variant = 'outline',
  size = 'default',
  className = '',
  children,
  showIcon = true
}: AdminAccessButtonProps) {
  const { isOpen, open, close } = useAdminPopup();

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={open}
        className={`text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 ${className}`}
      >
        {showIcon && <Shield className="h-4 w-4 mr-2" />}
        {children || 'Admin'}
      </Button>

      {isOpen && <AdminPopup onClose={close} />}
    </>
  );
}
