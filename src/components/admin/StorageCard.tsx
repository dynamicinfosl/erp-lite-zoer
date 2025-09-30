'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StorageCardProps {
  used: number; // GB
  total: number; // GB
  className?: string;
}

export function StorageCard({ used, total, className }: StorageCardProps) {
  const percentage = Math.round((used / total) * 100);
  const usedFormatted = used.toFixed(2);
  const totalFormatted = total.toFixed(0);

  return (
    <Card className={cn(
      'border-2 border-gray-700 bg-gray-800 transition-all duration-200 hover:shadow-lg hover:scale-105',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-300">
            Armazenamento
          </CardTitle>
          <div className="p-2 rounded-lg bg-blue-600">
            <HardDrive className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Valor principal - porcentagem */}
          <div className="text-3xl font-bold text-white">
            {percentage}%
          </div>
          
          {/* Informações de uso */}
          <div className="space-y-1">
            <div className="text-sm text-gray-400">
              {usedFormatted} GB
            </div>
            <div className="text-sm text-gray-400">
              / {totalFormatted} GB
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
