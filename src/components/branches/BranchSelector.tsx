'use client';

import React from 'react';
import { useBranch } from '@/contexts/BranchContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const STORAGE_SCOPE_KEY = 'juga.branch.scope';
const STORAGE_BRANCH_ID_KEY = 'juga.branch.id';

export function BranchSelector() {
  const { enabled, branches, loading, error, scope, branchId, setScope, setBranchId, currentBranch, isMatrixAdmin, userBranchId } = useBranch();

  console.log('[BranchSelector] enabled:', enabled, 'isMatrixAdmin:', isMatrixAdmin, 'userBranchId:', userBranchId, 'branches:', branches.length, 'branchId:', branchId);

  if (!enabled) {
    console.log('[BranchSelector] Feature não habilitada, retornando null');
    return null;
  }

  // PRIORIDADE 1: Se tem userBranchId, é admin de filial - NÃO mostrar seletor, apenas badge
  // Verificar userBranchId primeiro, mesmo que ainda não tenha carregado as branches
  if (userBranchId !== null && userBranchId !== undefined) {
    const userBranch = branches.find((b) => b.id === userBranchId);
    console.log('[BranchSelector] Admin de filial detectado (userBranchId existe):', userBranchId, 'branch:', userBranch);
    
    // Se ainda não carregou as branches, mostrar badge genérico
    if (!userBranch && branches.length === 0) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/70">Filial</span>
            <Badge variant="outline" className="border-white/30 text-white/80">
              Carregando...
            </Badge>
          </div>
        </div>
      );
    }
    
    if (userBranch) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/70">Filial</span>
            <Badge variant="outline" className="border-white/30 text-white/80">
              {userBranch.name}
            </Badge>
          </div>
        </div>
      );
    }
    // Se não encontrou a branch mas tem userBranchId, ainda não mostrar seletor
    return null;
  }

  // PRIORIDADE 2: Se não é admin da matriz, não mostrar seletor
  if (!isMatrixAdmin) {
    console.log('[BranchSelector] Não é admin matriz (isMatrixAdmin=false), retornando null');
    return null;
  }

  // Apenas admin da matriz (isMatrixAdmin=true E userBranchId=null) pode ver o seletor

  console.log('[BranchSelector] Renderizando seletor completo para admin matriz');

  const activeBranches = branches.filter((b) => b.is_active);
  const matrizBranch = activeBranches.find((b) => b.is_headquarters);
  
  // Valor atual: se não tem branchId selecionado, usar matriz; senão usar branchId
  const currentValue = branchId ? String(branchId) : (matrizBranch ? String(matrizBranch.id) : '');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/70">Filial</span>
        {currentBranch && (
          <Badge variant="outline" className="border-white/30 text-white/80">
            {currentBranch.name}
          </Badge>
        )}
        {!currentBranch && matrizBranch && (
          <Badge variant="outline" className="border-white/30 text-white/80">
            {matrizBranch.name}
          </Badge>
        )}
      </div>

      <Select
        value={currentValue}
        onValueChange={(val) => {
          const id = Number(val);
          if (!Number.isFinite(id) || id <= 0) return;
          
          // Salvar no localStorage ANTES do reload
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_SCOPE_KEY, 'branch');
            localStorage.setItem(STORAGE_BRANCH_ID_KEY, String(id));
          }
          
          // Atualizar estado
          setScope('branch');
          setBranchId(id);
          
          // Recarregar página após garantir que localStorage foi salvo
          setTimeout(() => {
            window.location.reload();
          }, 200);
        }}
        disabled={loading || activeBranches.length === 0}
      >
        <SelectTrigger className="h-9 bg-white/10 border-white/20 text-white">
          <SelectValue placeholder={loading ? 'Carregando...' : 'Selecionar filial'} />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700 text-white">
          {activeBranches.map((b) => (
            <SelectItem key={b.id} value={String(b.id)} className="text-white hover:bg-slate-800 focus:bg-slate-800">
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && <div className="text-[11px] text-red-200">Erro: {error}</div>}
    </div>
  );
}

