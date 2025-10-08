'use client';

import React from 'react';
import { AdminProtection } from '@/components/admin/AdminProtection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminAuditPage() {
  return (
    <AdminProtection>
      <div className="space-y-6 p-4 sm:p-6 w-full min-w-0">
        <div>
          <h1 className="text-3xl font-bold text-heading">Logs de Auditoria</h1>
          <p className="text-body mt-2">Histórico de atividades e eventos do sistema</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Login de Administrador</p>
                  <p className="text-sm text-body">IP: 192.168.1.100</p>
                </div>
                <span className="text-sm text-body">2 min atrás</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Novo usuário criado</p>
                  <p className="text-sm text-body">joao@empresa.com</p>
                </div>
                <span className="text-sm text-body">15 min atrás</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Plano atualizado</p>
                  <p className="text-sm text-body">Plano Premium</p>
                </div>
                <span className="text-sm text-body">1 hora atrás</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminProtection>
  );
}
