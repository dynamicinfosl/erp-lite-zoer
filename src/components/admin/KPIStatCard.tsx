'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, TrendingUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPIStatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  className?: string;
}

const VARIANT_COLORS = {
  default: {
    card: 'border-gray-700 bg-gray-800',
    icon: 'bg-gray-600 text-white',
    value: 'text-white',
    title: 'text-gray-300',
    subtitle: 'text-gray-400'
  },
  primary: {
    card: 'border-blue-700 bg-blue-900/20',
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
  },
  info: {
    card: 'border-cyan-700 bg-cyan-900/20',
    icon: 'bg-cyan-600 text-white',
    value: 'text-cyan-400',
    title: 'text-gray-300',
    subtitle: 'text-gray-400'
  }
};

const TREND_COLORS = {
  up: 'text-green-400',
  down: 'text-red-400',
  neutral: 'text-gray-400',
};

export function KPIStatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className
}: KPIStatCardProps) {
  const colors = VARIANT_COLORS[variant];
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

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
          
          {/* Trend e subtítulo */}
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              'text-xs sm:text-sm leading-tight truncate flex-1',
              colors.subtitle
            )}>
              {subtitle}
            </p>
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0',
                trend.direction === "up" ? "bg-green-900/20" :
                trend.direction === "down" ? "bg-red-900/20" :
                "bg-gray-900/20"
              )}>
                {trend.direction === "up" && <TrendingUp className={cn("h-3 w-3", TREND_COLORS[trend.direction])} />}
                {trend.direction === "down" && <TrendingDown className={cn("h-3 w-3", TREND_COLORS[trend.direction])} />}
                {trend.direction === "neutral" && <TrendingUpIcon className={cn("h-3 w-3 rotate-45", TREND_COLORS[trend.direction])} />}
                <span className={cn("text-gray-300", TREND_COLORS[trend.direction])}>{trend.value}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
