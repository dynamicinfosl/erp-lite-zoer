'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UserRoleResult {
  isAdmin: boolean;
  role: 'admin' | 'vendedor';
  loading: boolean;
  refetch: () => void;
}

/**
 * Retorna se o usuário é admin do tenant (owner/admin) ou operador (vendedor).
 * Operadores devem ver apenas suas próprias vendas em PDV, relatórios e fechamento de caixa.
 */
export function useUserRole(tenantId: string | undefined, userId: string | undefined): UserRoleResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<'admin' | 'vendedor'>('vendedor');
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!tenantId || !userId) {
      setRole('vendedor');
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/next_api/user-role?user_id=${encodeURIComponent(userId)}&tenant_id=${encodeURIComponent(tenantId)}&_t=${Date.now()}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.data) {
          const r = data.data.role === 'admin' ? 'admin' : 'vendedor';
          setRole(r);
          setIsAdmin(!!data.data.isAdmin);
        } else {
          setRole('vendedor');
          setIsAdmin(false);
        }
      } else {
        setRole('vendedor');
        setIsAdmin(false);
      }
    } catch {
      setRole('vendedor');
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [tenantId, userId]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  return { isAdmin, role, loading, refetch: fetchRole };
}
