'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';

export type Branch = {
  id: number;
  tenant_id: string;
  name: string;
  code?: string | null;
  is_headquarters: boolean;
  is_active: boolean;
};

type BranchScope = 'all' | 'branch';

type BranchContextValue = {
  branches: Branch[];
  loading: boolean;
  error: string | null;
  scope: BranchScope;
  branchId: number | null; // quando scope='branch'
  currentBranch: Branch | null;
  setScope: (scope: BranchScope) => void;
  setBranchId: (branchId: number | null) => void;
  refresh: () => Promise<void>;
};

const BranchContext = createContext<BranchContextValue | undefined>(undefined);

const STORAGE_SCOPE_KEY = 'juga.branch.scope';
const STORAGE_BRANCH_ID_KEY = 'juga.branch.id';

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useSimpleAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scope, setScopeState] = useState<BranchScope>('branch');
  const [branchId, setBranchIdState] = useState<number | null>(null);

  // carregar preferências
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedScope = (localStorage.getItem(STORAGE_SCOPE_KEY) as BranchScope | null) || null;
    const savedBranchIdRaw = localStorage.getItem(STORAGE_BRANCH_ID_KEY);
    const savedBranchId = savedBranchIdRaw ? Number(savedBranchIdRaw) : null;
    if (savedScope === 'all' || savedScope === 'branch') setScopeState(savedScope);
    if (Number.isFinite(savedBranchId as any) && savedBranchId && savedBranchId > 0) setBranchIdState(savedBranchId);
  }, []);

  const refresh = useCallback(async () => {
    if (!tenant?.id) {
      setBranches([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/next_api/branches?tenant_id=${encodeURIComponent(tenant.id)}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : [];
      setBranches(rows);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Erro ao carregar filiais');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  // carregar filiais quando tenant muda
  useEffect(() => {
    refresh();
  }, [refresh]);

  // default: se não tem branchId selecionado, usar Matriz
  useEffect(() => {
    if (!tenant?.id) return;
    if (branches.length === 0) return;
    if (scope === 'all') return;
    if (branchId) {
      const exists = branches.some((b) => b.id === branchId);
      if (exists) return;
    }
    const hq = branches.find((b) => b.is_headquarters) || branches[0];
    if (hq) setBranchIdState(hq.id);
  }, [tenant?.id, branches, scope, branchId]);

  const setScope = useCallback((next: BranchScope) => {
    setScopeState(next);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_SCOPE_KEY, next);
  }, []);

  const setBranchId = useCallback((next: number | null) => {
    setBranchIdState(next);
    if (typeof window !== 'undefined') {
      if (!next) localStorage.removeItem(STORAGE_BRANCH_ID_KEY);
      else localStorage.setItem(STORAGE_BRANCH_ID_KEY, String(next));
    }
  }, []);

  const currentBranch = useMemo(() => {
    if (scope !== 'branch') return null;
    if (!branchId) return null;
    return branches.find((b) => b.id === branchId) || null;
  }, [branches, branchId, scope]);

  const value: BranchContextValue = useMemo(
    () => ({
      branches,
      loading,
      error,
      scope,
      branchId,
      currentBranch,
      setScope,
      setBranchId,
      refresh,
    }),
    [branches, loading, error, scope, branchId, currentBranch, setScope, setBranchId, refresh],
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch deve ser usado dentro de <BranchProvider>');
  return ctx;
}

