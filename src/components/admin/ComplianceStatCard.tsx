'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ComplianceStatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  showProgress?: boolean;
  progressValue?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

const VARIANT_COLORS = {
  default: {
    card: 'border-gray-700 bg-gray-800',
    icon: 'bg-blue-600 text-white',
    value: 'text-blue-400',
    title: 'text-gray-300',
    subtitle: 'text-gray-400'
  },
  success: {
    card: 'border-green-700 bg-green-900/20',
    icon: 'bg-green-600 text-white',
    value: 'text-green-400',
    title: 'text-gray-300',
    subtitle: 'text-gray-400'
  },
  warning: {
    card: 'border-yellow-700 bg-yellow-900/20',
    icon: 'bg-yellow-600 text-white',
    value: 'text-yellow-400',
    title: 'text-gray-300',
    subtitle: 'text-gray-400'
  },
  error: {
    card: 'border-red-700 bg-red-900/20',
    icon: 'bg-red-600 text-white',
    value: 'text-red-400',
    title: 'text-gray-300',
    subtitle: 'text-gray-400'
  }
};

export function ComplianceStatCard({
  title,
  value,
  subtitle,
  icon,
  showProgress = false,
  progressValue = 0,
  variant = 'default',
  className
}: ComplianceStatCardProps) {
  const colors = VARIANT_COLORS[variant];
  const displayValue = typeof value === 'number' ? value.toLocaleString('pt-BR') : value;

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-lg hover:scale-105',
      colors.card,
      className
    )}>
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            'text-xs sm:text-sm font-medium leading-tight truncate',
            colors.title
          )}>
            {title}
          </CardTitle>
          <div className={cn(
            'p-1.5 sm:p-2 rounded-lg flex-shrink-0',
            colors.icon
          )}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="space-y-1 sm:space-y-2">
          {/* Valor principal */}
          <div className={cn(
            'text-lg sm:text-xl lg:text-2xl font-bold',
            colors.value
          )}>
            {displayValue}
          </div>
          
          {/* Progress bar (se necessário) */}
          {showProgress && (
            <Progress 
              value={progressValue} 
              className="h-1.5 sm:h-2" 
            />
          )}
          
          {/* Subtítulo */}
          <p className={cn(
            'text-xs sm:text-sm leading-tight truncate',
            colors.subtitle
          )}>
            {subtitle}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
