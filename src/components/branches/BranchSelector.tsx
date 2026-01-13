'use client';

import React from 'react';
import { useBranch } from '@/contexts/BranchContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export function BranchSelector() {
  const { branches, loading, error, scope, branchId, setScope, setBranchId, currentBranch } = useBranch();

  const activeBranches = branches.filter((b) => b.is_active);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/70">Filial</span>
        {currentBranch?.is_headquarters && <Badge variant="outline" className="border-white/30 text-white/80">Matriz</Badge>}
      </div>

      <Select
        value={scope === 'all' ? 'all' : branchId ? String(branchId) : ''}
        onValueChange={(val) => {
          if (val === 'all') {
            setScope('all');
            return;
          }
          const id = Number(val);
          if (!Number.isFinite(id) || id <= 0) return;
          setScope('branch');
          setBranchId(id);
        }}
        disabled={loading || activeBranches.length === 0}
      >
        <SelectTrigger className="h-9 bg-white/10 border-white/20 text-white">
          <SelectValue placeholder={loading ? 'Carregando...' : 'Selecionar filial'} />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700 text-white">
          <SelectItem value="all" className="text-white hover:bg-slate-800 focus:bg-slate-800">
            Visão Matriz (todas)
          </SelectItem>
          {activeBranches.map((b) => (
            <SelectItem key={b.id} value={String(b.id)} className="text-white hover:bg-slate-800 focus:bg-slate-800">
              {b.name}{b.is_headquarters ? ' (Matriz)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && <div className="text-[11px] text-red-200">Erro: {error}</div>}
    </div>
  );
}

