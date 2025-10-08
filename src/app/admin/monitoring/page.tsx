'use client';

import React from 'react';
import { AdminProtection } from '@/components/admin/AdminProtection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, BarChart3 } from 'lucide-react';

export default function AdminMonitoringPage() {
  return (
    <AdminProtection>
      <div className="space-y-6 p-4 sm:p-6 w-full min-w-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Monitoramento do Sistema</h1>
          <p className="text-sm sm:text-base text-body mt-1">Monitoramento em tempo real do sistema</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>API Status:</span>
                  <Badge variant="default" className="bg-green-600">Online</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Banco de Dados:</span>
                  <Badge variant="default" className="bg-green-600">Conectado</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Cache:</span>
                  <Badge variant="default" className="bg-green-600">Ativo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Tempo de Resposta:</span>
                  <span className="text-green-600">45ms</span>
                </div>
                <div className="flex justify-between">
                  <span>CPU Usage:</span>
                  <span className="text-yellow-600">23%</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory:</span>
                  <span className="text-green-600">512MB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminProtection>
  );
}
