'use client';

import React from 'react';
import { AdminProtection } from '@/components/admin/AdminProtection';
import { PlanManagement } from '@/components/admin/PlanManagement';

export default function AdminPlansPage() {
  return (
    <AdminProtection>
      <div className="space-y-6 p-4 sm:p-6 w-full min-w-0">
        <div>
          <h1 className="text-3xl font-bold text-heading">Gerenciar Planos</h1>
          <p className="text-body mt-2">Gerenciar planos e assinaturas do sistema</p>
        </div>
        <PlanManagement />
      </div>
    </AdminProtection>
  );
}
