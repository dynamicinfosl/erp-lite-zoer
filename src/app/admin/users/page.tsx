'use client';

import React from 'react';
import { AdminProtection } from '@/components/admin/AdminProtection';
import { UserManagement } from '@/components/admin/UserManagement';

export default function AdminUsersPage() {
  return (
    <AdminProtection>
      <div className="flex flex-col h-full w-full min-w-0">
        <div className="flex-shrink-0 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Gerenciar Usuários</h1>
          <p className="text-sm sm:text-base text-body mt-1">Gerenciar usuários e permissões do sistema</p>
        </div>
        <div className="flex-1 min-h-0">
          <UserManagement />
        </div>
      </div>
    </AdminProtection>
  );
}
