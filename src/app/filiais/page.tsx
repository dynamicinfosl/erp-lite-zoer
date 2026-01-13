'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useBranch } from '@/contexts/BranchContext';

type BranchRow = {
  id: number;
  tenant_id: string;
  name: string;
  code?: string | null;
  is_headquarters: boolean;
  is_active: boolean;
};

type BranchForm = {
  id?: number;
  name: string;
  code?: string;
  is_active?: boolean;
};

export default function FiliaisPage() {
  const { tenant } = useSimpleAuth();
  const { refresh: refreshBranchContext } = useBranch();

  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BranchForm>({ name: '', code: '' });

  const resetForm = useCallback(() => {
    setForm({ name: '', code: '' });
  }, []);

  const loadBranches = useCallback(async () => {
    if (!tenant?.id) {
      setBranches([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/next_api/branches?tenant_id=${encodeURIComponent(tenant.id)}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : [];
      setBranches(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar filiais');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return branches;
    return branches.filter((b) =>
      `${b.name} ${b.code || ''}`.toLowerCase().includes(s),
    );
  }, [branches, search]);

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (b: BranchRow) => {
    setForm({
      id: b.id,
      name: b.name || '',
      code: b.code || '',
      is_active: b.is_active,
    });
    setModalOpen(true);
  };

  const saveBranch = async () => {
    if (!tenant?.id) {
      toast.error('Tenant não disponível');
      return;
    }
    if (!form.name?.trim()) {
      toast.error('Preencha o nome da filial');
      return;
    }

    try {
      setSaving(true);
      const isEdit = Boolean(form.id);
      const url = isEdit ? `/next_api/branches?id=${form.id}` : `/next_api/branches`;
      const method = isEdit ? 'PUT' : 'POST';
      const payload: any = {
        tenant_id: tenant.id,
        name: form.name.trim(),
        code: form.code?.trim() || null,
      };
      if (isEdit && typeof form.is_active === 'boolean') payload.is_active = form.is_active;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = '';
        try {
          const j = await res.json();
          msg = j?.error || j?.errorMessage || '';
        } catch {
          msg = await res.text();
        }
        throw new Error(msg || `HTTP ${res.status}`);
      }

      toast.success(isEdit ? 'Filial atualizada' : 'Filial criada');
      setModalOpen(false);
      resetForm();
      await loadBranches();
      await refreshBranchContext();
    } catch (e: any) {
      console.error(e);
      if (String(e?.message || '').includes('FEATURE_NOT_AVAILABLE')) {
        toast.error('Recurso de filiais não está ativo no seu plano (pago).');
      } else {
        toast.error('Erro ao salvar filial');
      }
    } finally {
      setSaving(false);
    }
  };

  const deactivateBranch = async (b: BranchRow) => {
    if (b.is_headquarters) {
      toast.error('Não é permitido desativar a Matriz');
      return;
    }
    if (!confirm(`Desativar filial "${b.name}"?`)) return;
    try {
      const res = await fetch(`/next_api/branches?id=${b.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      toast.success('Filial desativada');
      await loadBranches();
      await refreshBranchContext();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao desativar filial');
    }
  };

  return (
    <TenantPageWrapper>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-heading flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Filiais
            </h1>
            <p className="text-sm sm:text-base text-body">
              Crie filiais e permita que a matriz acompanhe tudo em tempo real
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="gap-2" onClick={loadBranches} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button className="juga-gradient text-white gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nova Filial
            </Button>
          </div>
        </div>

        <Card className="juga-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl text-heading">Lista</CardTitle>
            <CardDescription>Gerencie suas filiais (Matriz + unidades)</CardDescription>
            <div className="pt-3">
              <Input
                placeholder="Buscar por nome ou código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:max-w-md"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loading &&
                    filtered.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium text-heading">{b.name}</TableCell>
                        <TableCell className="font-mono text-sm text-body">{b.code || '—'}</TableCell>
                        <TableCell>
                          {b.is_headquarters ? (
                            <Badge variant="outline">Matriz</Badge>
                          ) : (
                            <Badge variant="secondary">Filial</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {b.is_active ? <Badge variant="outline">Ativa</Badge> : <Badge variant="secondary">Inativa</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(b)} className="gap-1">
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                            {!b.is_headquarters && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deactivateBranch(b)}
                                className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Desativar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{form.id ? 'Editar Filial' : 'Nova Filial'}</DialogTitle>
              <DialogDescription>
                {form.id ? 'Atualize os dados da filial' : 'Crie uma nova unidade (recurso pago preparado)'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Código (opcional)</Label>
                <Input value={form.code || ''} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
              </div>
              {form.id && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input
                    value={form.is_active ? 'Ativa' : 'Inativa'}
                    disabled
                    className="bg-gray-50 dark:bg-gray-900"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button className="juga-gradient text-white" onClick={saveBranch} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TenantPageWrapper>
  );
}

