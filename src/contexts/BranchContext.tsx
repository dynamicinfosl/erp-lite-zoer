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
  enabled: boolean;
  branches: Branch[];
  loading: boolean;
  error: string | null;
  scope: BranchScope;
  branchId: number | null; // quando scope='branch'
  currentBranch: Branch | null;
  isMatrixAdmin: boolean; // true se usuário é admin da matriz
  userBranchId: number | null; // branch_id do usuário (null = matriz)
  setScope: (scope: BranchScope) => void;
  setBranchId: (branchId: number | null) => void;
  refresh: () => Promise<void>;
};

const BranchContext = createContext<BranchContextValue | undefined>(undefined);

const STORAGE_SCOPE_KEY = 'juga.branch.scope';
const STORAGE_BRANCH_ID_KEY = 'juga.branch.id';

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { tenant, user } = useSimpleAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [isMatrixAdmin, setIsMatrixAdmin] = useState(false);
  const [userBranchId, setUserBranchId] = useState<number | null>(null);

  const [scope, setScopeState] = useState<BranchScope>('branch'); // Sempre usar 'branch' agora
  const [branchId, setBranchIdState] = useState<number | null>(null);

  // carregar preferências do localStorage (apenas para admin matriz)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedBranchIdRaw = localStorage.getItem(STORAGE_BRANCH_ID_KEY);
    const savedBranchId = savedBranchIdRaw ? Number(savedBranchIdRaw) : null;
    
    // Se tem branchId salvo, usar ele
    if (Number.isFinite(savedBranchId as any) && savedBranchId && savedBranchId > 0) {
      setScopeState('branch');
      setBranchIdState(savedBranchId);
    }
    // Se não tem, será definido depois quando checkUserBranchInfo executar ou quando encontrar a matriz
  }, []);

  // Verificar se usuário é admin da matriz ou de filial
  const checkUserBranchInfo = useCallback(async () => {
    if (!user?.id || !tenant?.id) {
      console.log('[BranchContext] Sem user ou tenant, resetando');
      setIsMatrixAdmin(false);
      setUserBranchId(null);
      return;
    }

    try {
      console.log('[BranchContext] Verificando branch info para user:', user.id);
      const res = await fetch(`/next_api/user-branch-info?user_id=${encodeURIComponent(user.id)}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.warn('[BranchContext] Erro ao buscar branch info:', res.status, errorText);
        setIsMatrixAdmin(false);
        setUserBranchId(null);
        return;
      }

      const json = await res.json();
      console.log('[BranchContext] Branch info recebido:', json);
      
      if (json.success && json.data) {
        const isMatrix = json.data.isMatrixAdmin || false;
        const branchId = json.data.branch_id || null;
        
        console.log('[BranchContext] isMatrixAdmin:', isMatrix, 'branch_id:', branchId);
        
        setIsMatrixAdmin(isMatrix);
        setUserBranchId(branchId);

        // Se for admin de filial, fixar scope e branchId e garantir que não pode mudar
        if (json.data.isBranchAdmin && json.data.branch_id) {
          console.log('[BranchContext] Fixando scope para filial:', json.data.branch_id);
          setScopeState('branch');
          setBranchIdState(Number(json.data.branch_id));
          // Salvar no localStorage para persistência
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_SCOPE_KEY, 'branch');
            localStorage.setItem(STORAGE_BRANCH_ID_KEY, String(json.data.branch_id));
          }
          // Garantir que isMatrixAdmin seja false
          setIsMatrixAdmin(false);
        } else if (isMatrix) {
          // Admin matriz: buscar matriz branch_id ou usar o salvo
          console.log('[BranchContext] Admin matriz detectado');
          setUserBranchId(null); // Garantir que userBranchId seja null para matriz
          
          // Buscar branch_id da matriz ou usar o salvo
          const savedBranchIdRaw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_BRANCH_ID_KEY) : null;
          const savedBranchId = savedBranchIdRaw ? Number(savedBranchIdRaw) : null;
          
          if (savedBranchId && Number.isFinite(savedBranchId) && savedBranchId > 0) {
            // Usar branch_id salvo
            setScopeState('branch');
            setBranchIdState(savedBranchId);
          } else {
            // Será definido quando branches carregarem (ver useEffect abaixo)
            setScopeState('branch');
          }
        } else {
          // Caso não seja nem admin matriz nem admin filial, garantir que não tenha acesso
          setIsMatrixAdmin(false);
          setUserBranchId(null);
        }
      } else {
        console.warn('[BranchContext] Resposta sem success ou data:', json);
        setIsMatrixAdmin(false);
        setUserBranchId(null);
      }
    } catch (e) {
      console.error('[BranchContext] Erro ao verificar branch do usuário:', e);
      setIsMatrixAdmin(false);
      setUserBranchId(null);
    }
  }, [user?.id, tenant?.id]);

  const refresh = useCallback(async () => {
    if (!tenant?.id) {
      setBranches([]);
      setEnabled(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // Feature gate: só habilita Filiais se o SuperAdmin ativou para o tenant
      const featRes = await fetch(`/next_api/tenant-features?tenant_id=${encodeURIComponent(tenant.id)}`);
      const featJson = featRes.ok ? await featRes.json() : null;
      const flags = featJson?.data?.features || {};
      const isEnabled = flags?.branches === true;
      setEnabled(isEnabled);

      if (!isEnabled) {
        setBranches([]);
        return;
      }

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
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  // Verificar branch do usuário quando user/tenant muda (executar PRIMEIRO)
  useEffect(() => {
    // Executar imediatamente quando user/tenant mudar
    if (user?.id && tenant?.id) {
      checkUserBranchInfo();
    }
  }, [user?.id, tenant?.id, checkUserBranchInfo]); // Incluir checkUserBranchInfo nas dependências

  // carregar filiais quando tenant muda
  useEffect(() => {
    refresh();
  }, [refresh]);

  // default: se não tem branchId selecionado e é admin matriz, usar Matriz
  useEffect(() => {
    if (!tenant?.id) return;
    if (!enabled) return;
    if (branches.length === 0) return;
    if (!isMatrixAdmin) return; // Só aplicar para admin matriz
    if (branchId) {
      const exists = branches.some((b) => b.id === branchId);
      if (exists) return;
    }
    // Se não tem branchId, usar a matriz
    const hq = branches.find((b) => b.is_headquarters);
    if (hq) {
      setBranchIdState(hq.id);
      setScopeState('branch');
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_SCOPE_KEY, 'branch');
        localStorage.setItem(STORAGE_BRANCH_ID_KEY, String(hq.id));
      }
    }
  }, [tenant?.id, enabled, branches, branchId, isMatrixAdmin]);

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
      enabled,
      branches,
      loading,
      error,
      scope,
      branchId,
      currentBranch,
      isMatrixAdmin,
      userBranchId,
      setScope,
      setBranchId,
      refresh,
    }),
    [enabled, branches, loading, error, scope, branchId, currentBranch, isMatrixAdmin, userBranchId, setScope, setBranchId, refresh],
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch deve ser usado dentro de <BranchProvider>');
  return ctx;
}

