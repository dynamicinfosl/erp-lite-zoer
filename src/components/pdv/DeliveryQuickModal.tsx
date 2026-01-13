'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ClipboardList, Printer, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type DeliveryRow = {
  id: number;
  driver_id?: number | null;
  manifest_id?: string | null;
  customer_name: string;
  delivery_address: string;
  status: string;
  created_at: string;
};

export function DeliveryQuickModal({
  open,
  onOpenChange,
  tenantId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId: string | null | undefined;
}) {
  const [loading, setLoading] = useState(false);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [drivers, setDrivers] = useState<Array<{ id: number; name: string }>>([]);
  const [manifests, setManifests] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const loadAll = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const [delRes, drvRes, manRes] = await Promise.all([
        fetch(`/next_api/deliveries?tenant_id=${encodeURIComponent(tenantId)}&limit=200`),
        fetch(`/next_api/delivery-drivers?tenant_id=${encodeURIComponent(tenantId)}&limit=200`),
        fetch(`/next_api/delivery-manifests?tenant_id=${encodeURIComponent(tenantId)}&status=aberta&limit=50`),
      ]);

      if (delRes.ok) {
        const json = await delRes.json();
        const rows = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
        setDeliveries(Array.isArray(rows) ? rows : []);
      }

      if (drvRes.ok) {
        const json = await drvRes.json();
        const rows = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
        const list = Array.isArray(rows) ? rows : [];
        setDrivers(list.map((d: any) => ({ id: Number(d.id), name: d.name })));
      }

      if (manRes.ok) {
        const json = await manRes.json();
        const rows = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
        setManifests(Array.isArray(rows) ? rows : []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar entregas');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!open) return;
    loadAll();
  }, [open, loadAll]);

  const driverNameById = useMemo(() => {
    const m = new Map<number, string>();
    drivers.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [drivers]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const base = deliveries.filter((d) => d.status === 'aguardando' || d.status === 'em_rota');
    if (!s) return base;
    return base.filter((d) => `${d.customer_name} ${d.delivery_address} ${d.id}`.toLowerCase().includes(s));
  }, [deliveries, search]);

  const markDelivered = async (deliveryId: number) => {
    try {
      const res = await fetch(`/next_api/deliveries?id=${encodeURIComponent(String(deliveryId))}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'entregue' }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Marcado como entregue');
      await loadAll();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao marcar entregue');
    }
  };

  const openA4 = (manifestId: string) => {
    window.open(`/entregas/romaneio/${manifestId}/a4`, '_blank');
  };

  const finalizeManifest = async (manifestId: string) => {
    if (!confirm('Finalizar este romaneio?')) return;
    try {
      const res = await fetch(`/next_api/delivery-manifests?id=${encodeURIComponent(manifestId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'finalizada' }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Romaneio finalizado');
      await loadAll();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao finalizar romaneio');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Entregas (Acesso Rápido)
          </DialogTitle>
          <DialogDescription>
            Visualize entregas pendentes/em rota, imprima romaneios e marque como entregue sem sair do PDV.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Buscar por cliente/endereço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outline" onClick={loadAll} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <div className="space-y-3">
          {manifests.length > 0 && (
            <div className="rounded-lg border p-3">
              <div className="font-semibold mb-2">Romaneios abertos</div>
              <div className="flex flex-col gap-2">
                {manifests.map((m: any) => (
                  <div key={m.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-sm">
                      <Badge variant="default" className="mr-2">Aberto</Badge>
                      <strong>{m.manifest_number || m.id}</strong> •{' '}
                      {driverNameById.get(Number(m.driver_id)) || `#${m.driver_id}`}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openA4(String(m.id))} className="gap-2">
                        <Printer className="h-4 w-4" />
                        A4
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-2" onClick={() => finalizeManifest(String(m.id))}>
                        <CheckCircle2 className="h-4 w-4" />
                        Finalizar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Entregador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.id}</TableCell>
                    <TableCell className="font-medium">{d.customer_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.delivery_address}</TableCell>
                    <TableCell className="text-sm">
                      {d.driver_id ? (driverNameById.get(Number(d.driver_id)) || `#${d.driver_id}`) : '—'}
                    </TableCell>
                    <TableCell>
                      {d.status === 'aguardando' && <Badge variant="outline">Aguardando</Badge>}
                      {d.status === 'em_rota' && <Badge variant="default">Em rota</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => markDelivered(d.id)}
                      >
                        Marcar Entregue
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!loading && filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma entrega pendente/em rota encontrada.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

