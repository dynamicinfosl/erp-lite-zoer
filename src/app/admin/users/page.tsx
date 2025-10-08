'use client';

import React from 'react';
import { AdminProtection } from '@/components/admin/AdminProtection';
import { UserManagement } from '@/components/admin/UserManagement';

export default function AdminUsersPage() {
  return (
    <AdminProtection>
      <div className="space-y-6 p-4 sm:p-6 w-full min-w-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Gerenciar Usuários</h1>
          <p className="text-sm sm:text-base text-body mt-1">Gerenciar usuários e permissões do sistema</p>
        </div>
        <UserManagement />
      </div>
    </AdminProtection>
  );
}
