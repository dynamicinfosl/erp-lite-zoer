'use client';

import React from 'react';
import { AdminProtection } from '@/components/admin/AdminProtection';
import { ApiKeyManagement } from '@/components/admin/ApiKeyManagement';

export default function AdminApiKeysPage() {
  return (
    <AdminProtection>
      <div className="space-y-6 p-4 sm:p-6 w-full min-w-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Gerenciar API Keys</h1>
          <p className="text-sm sm:text-base text-body mt-1">Criar e gerenciar chaves de API para acesso externo ao sistema</p>
        </div>
        <ApiKeyManagement />
      </div>
    </AdminProtection>
  );
}
