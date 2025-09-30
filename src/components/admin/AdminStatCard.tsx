'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

const cardVariants = {
  default: 'bg-gray-800 border-gray-700',
  primary: 'bg-blue-800 border-blue-700',
  success: 'bg-green-800 border-green-700',
  warning: 'bg-yellow-800 border-yellow-700',
  error: 'bg-red-800 border-red-700',
};

const iconVariants = {
  default: 'bg-blue-600',
  primary: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  error: 'bg-red-600',
};

const textVariants = {
  default: 'text-blue-400',
  primary: 'text-blue-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
};

export function AdminStatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  variant = 'default'
}: AdminStatCardProps) {
  return (
    <Card className={cn(
      'border-2 transition-all duration-200 hover:shadow-lg hover:scale-105',
      cardVariants[variant],
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-300 leading-tight">
            {title}
          </CardTitle>
          {icon && (
            <div className={cn(
              'p-2 rounded-lg',
              iconVariants[variant]
            )}>
              <div className="text-white">
                {icon}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-3xl font-bold text-white">
            {value}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-400">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-xs px-2 py-1 rounded-full',
              textVariants[variant],
              'bg-opacity-20'
            )}>
              <span className={cn(
                'text-xs',
                trend.direction === 'up' ? 'text-green-400' : 
                trend.direction === 'down' ? 'text-red-400' : 'text-gray-400'
              )}>
                {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
              </span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
