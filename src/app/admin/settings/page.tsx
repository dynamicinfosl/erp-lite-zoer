'use client';

import React from 'react';
import { AdminProtection } from '@/components/admin/AdminProtection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminSettingsPage() {
  return (
    <AdminProtection>
      <div className="space-y-6 p-4 sm:p-6 w-full min-w-0">
        <div>
          <h1 className="text-3xl font-bold text-heading">Configurações do Sistema</h1>
          <p className="text-body mt-2">Configurações gerais do sistema</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Manutenção Automática</span>
                <Badge variant="outline">Ativada</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Backup Automático</span>
                <Badge variant="outline">Diário</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Notificações por Email</span>
                <Badge variant="outline">Ativadas</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminProtection>
  );
}
