
'use client';

import React from 'react';
import JugaDashboard from '@/components/dashboard/JugaDashboard';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';

export default function DashboardPage() {
  return (
    <TenantPageWrapper>
      <JugaDashboard />
    </TenantPageWrapper>
  );
}
