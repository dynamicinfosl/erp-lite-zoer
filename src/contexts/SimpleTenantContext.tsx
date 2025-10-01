'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  refreshTenant: () => Promise<void>;
  updateTenant: (data: Partial<Tenant>) => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  refreshTenant: async () => {},
  updateTenant: async () => {},
});

export const useTenant = () => useContext(TenantContext);

export function SimpleTenantProvider({ children, user }: { children: React.ReactNode; user: User | null }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  const loadTenant = async () => {
    if (!user) {
      setTenant(null);
      setLoading(false);
      return;
    }

    try {
      console.log('📍 Buscando tenant para:', user.email);

      // Query SIMPLES - pega membership do usuário
      const { data: membership, error: memberError } = await supabase
        .from('user_memberships')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (memberError || !membership) {
        console.error('Erro ao buscar membership:', memberError);
        setLoading(false);
        return;
      }

      // Agora busca o tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', membership.tenant_id)
        .single();

      if (tenantError || !tenantData) {
        console.error('Erro ao buscar tenant:', tenantError);
        setLoading(false);
        return;
      }

      console.log('✅ Tenant carregado:', tenantData.name);
      setTenant(tenantData);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar tenant:', error);
      setLoading(false);
    }
  };

  const refreshTenant = async () => {
    await loadTenant();
  };

  const updateTenant = async (data: Partial<Tenant>) => {
    if (!tenant) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .update(data)
        .eq('id', tenant.id);

      if (error) throw error;

      // Atualizar estado local
      setTenant({ ...tenant, ...data });
      console.log('✅ Tenant atualizado');
    } catch (error) {
      console.error('Erro ao atualizar tenant:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadTenant();
  }, [user?.id]);

  return (
    <TenantContext.Provider value={{ tenant, loading, refreshTenant, updateTenant }}>
      {children}
    </TenantContext.Provider>
  );
}


