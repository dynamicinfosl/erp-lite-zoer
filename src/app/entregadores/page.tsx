'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Truck, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Driver = {
  id: number;
  tenant_id?: string;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

type DriverForm = {
  id?: number;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate?: string;
};

export default function EntregadoresPage() {
  const { tenant } = useSimpleAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DriverForm>({
    name: '',
    phone: '',
    vehicle_type: 'moto',
    vehicle_plate: '',
  });

  const resetForm = useCallback(() => {
    setForm({ name: '', phone: '', vehicle_type: 'moto', vehicle_plate: '' });
  }, []);

  const loadDrivers = useCallback(async () => {
    if (!tenant?.id) {
      setDrivers([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/next_api/delivery-drivers?tenant_id=${encodeURIComponent(tenant.id)}`);
      if (!res.ok) {
        let payload: any = null;
        try {
          payload = await res.json();
        } catch {
          payload = await res.text();
        }

        // Sessão expirada / não autenticado
        if (res.status === 401 && payload?.errorCode === 'TOKEN_MISSING') {
          toast.error('Sua sessão expirou. Faça login novamente.');
          router.push(`/login?redirect=${encodeURIComponent('/entregadores')}`);
          setDrivers([]);
          return;
        }

        throw new Error(
          typeof payload === 'string'
            ? payload
            : payload?.errorMessage || payload?.error || `HTTP ${res.status}`,
        );
      }
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
      setDrivers(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar entregadores');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, router]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return drivers;
    return drivers.filter((d) =>
      `${d.name} ${d.phone} ${d.vehicle_type} ${d.vehicle_plate || ''}`.toLowerCase().includes(s),
    );
  }, [drivers, search]);

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (d: Driver) => {
    setForm({
      id: d.id,
      name: d.name || '',
      phone: d.phone || '',
      vehicle_type: d.vehicle_type || 'moto',
      vehicle_plate: d.vehicle_plate || '',
    });
    setModalOpen(true);
  };

  const saveDriver = async () => {
    if (!tenant?.id) {
      toast.error('Tenant não disponível');
      return;
    }
    if (!form.name?.trim() || !form.phone?.trim() || !form.vehicle_type?.trim()) {
      toast.error('Preencha nome, telefone e tipo de veículo');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        tenant_id: tenant.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        vehicle_type: form.vehicle_type.trim(),
        vehicle_plate: form.vehicle_plate?.trim() || null,
        is_active: true,
      };

      const isEdit = Boolean(form.id);
      const url = isEdit ? `/next_api/delivery-drivers?id=${form.id}` : `/next_api/delivery-drivers`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      toast.success(isEdit ? 'Entregador atualizado' : 'Entregador criado');
      setModalOpen(false);
      resetForm();
      await loadDrivers();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar entregador');
    } finally {
      setSaving(false);
    }
  };

  const deactivateDriver = async (d: Driver) => {
    if (!confirm(`Desativar entregador "${d.name}"?`)) return;
    try {
      const res = await fetch(`/next_api/delivery-drivers?id=${d.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      toast.success('Entregador desativado');
      await loadDrivers();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao desativar entregador');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-heading flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Entregadores
          </h1>
          <p className="text-sm sm:text-base text-body">
            Cadastre e gerencie os entregadores do seu negócio
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={loadDrivers}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button className="juga-gradient text-white gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo Entregador
          </Button>
        </div>
      </div>

      <Card className="juga-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl text-heading">Lista</CardTitle>
          <CardDescription>Gerencie os entregadores ativos</CardDescription>
          <div className="pt-3">
            <Input
              placeholder="Buscar por nome, telefone, veículo..."
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
                  <TableHead>Telefone</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading &&
                  filtered.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-heading">{d.name}</TableCell>
                      <TableCell className="text-body">{d.phone}</TableCell>
                      <TableCell className="text-body">
                        {d.vehicle_type}
                        {d.vehicle_plate ? ` • ${d.vehicle_plate}` : ''}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Ativo</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(d)} className="gap-2">
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deactivateDriver(d)}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Desativar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {loading && (
            <div className="text-center py-10 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-3" />
              <p>Carregando entregadores...</p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Truck className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Nenhum entregador encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={(v) => setModalOpen(v)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar Entregador' : 'Novo Entregador'}</DialogTitle>
            <DialogDescription>
              Informe os dados do entregador. Você poderá vincular vendas a ele no PDV.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Tipo de veículo</Label>
              <Input
                value={form.vehicle_type}
                onChange={(e) => setForm((p) => ({ ...p, vehicle_type: e.target.value }))}
                placeholder="moto, carro, van..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Placa (opcional)</Label>
              <Input
                value={form.vehicle_plate || ''}
                onChange={(e) => setForm((p) => ({ ...p, vehicle_plate: e.target.value }))}
                placeholder="ABC-1234"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button className="juga-gradient text-white" onClick={saveDriver} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

