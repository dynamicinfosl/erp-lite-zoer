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
      'h-full border transition-all duration-200 hover:shadow-md hover:scale-[1.02] flex flex-col',
      cardVariants[variant],
      className
    )}>
      <CardHeader className="pb-1.5 pt-2.5 px-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-1.5">
          <CardTitle className="text-xs font-medium text-gray-300 leading-tight line-clamp-1 flex-1">
            {title}
          </CardTitle>
          {icon && (
            <div className={cn(
              'p-1 rounded-md flex-shrink-0',
              iconVariants[variant]
            )}>
              <div className="text-white">
                {icon}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="text-2xl font-bold text-white break-words leading-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-400 line-clamp-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full w-fit',
              textVariants[variant],
              'bg-opacity-20'
            )}>
              <span className={cn(
                'text-[10px] font-semibold',
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
