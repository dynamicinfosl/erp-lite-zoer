'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Package, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';

interface Product {
  id: string;
  sku: string;
  name: string;
  stock_quantity: number;
}

interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  movement_type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  notes?: string;
  reason?: string; // Mantido para compatibilidade
  created_at: string;
}

export default function DevolucaoEstoquePage() {
  const { tenant, user } = useSimpleAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    product_id: '',
    quantity: '',
    reason: 'Devolução',
  });

  useEffect(() => {
    const storedTenantId = typeof window !== 'undefined' ? localStorage.getItem('lastProductsTenantId') : null;
    const tenantId = tenant?.id || storedTenantId;
    if (tenantId) {
      loadProducts();
      loadMovements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id]);

  const loadProducts = async () => {
    try {
      const storedTenantId = typeof window !== 'undefined' ? localStorage.getItem('lastProductsTenantId') : null;
      const tenantId = tenant?.id || storedTenantId;
      if (!tenantId) return;
      const response = await fetch(`/next_api/products?tenant_id=${encodeURIComponent(tenantId)}`);
      if (!response.ok) throw new Error('Erro ao carregar produtos');
      const data = await response.json();
      setProducts(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      toast.error('Erro ao carregar produtos');
    }
  };

  const loadMovements = async () => {
    try {
      const storedTenantId = typeof window !== 'undefined' ? localStorage.getItem('lastProductsTenantId') : null;
      const tenantId = tenant?.id || storedTenantId;
      if (!tenantId) return;
      const response = await fetch(`/next_api/stock-movements?tenant_id=${encodeURIComponent(tenantId)}`);
      if (!response.ok) return setMovements([]);
      const data = await response.json();
      const rows: StockMovement[] = Array.isArray(data?.data) ? data.data : [];
      setMovements(rows);
    } catch {
      setMovements([]);
    }
  };

  const devolucoes = useMemo(() => {
    return movements.filter((m) => m.movement_type === 'entrada' && ((m.notes || m.reason)?.toLowerCase().includes('devolu') ?? false));
  }, [movements]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const handleSubmit = async () => {
    try {
      if (!form.product_id || !form.quantity) {
        return toast.error('Selecione o produto e a quantidade');
      }

      const qty = parseInt(form.quantity);
      if (isNaN(qty) || qty <= 0) {
        return toast.error('Quantidade deve ser um número positivo');
      }

      setIsSubmitting(true);
      const storedTenantId = typeof window !== 'undefined' ? localStorage.getItem('lastProductsTenantId') : null;
      const tenantId = tenant?.id || storedTenantId;
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';

      console.log('📤 Enviando devolução:', {
        tenant_id: tenantId,
        user_id: userId,
        product_id: form.product_id,
        quantity: qty,
        notes: form.reason || 'Devolução'
      });

      const response = await fetch('/next_api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          user_id: userId,
          product_id: form.product_id,
          movement_type: 'entrada',
          quantity: qty,
          notes: form.reason || 'Devolução',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('❌ Erro na resposta:', errorData);
        throw new Error(errorData.error || errorData.message || `Erro ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Devolução registrada:', result);

      toast.success('Devolução registrada com sucesso!');
      setForm({ product_id: '', quantity: '', reason: 'Devolução' });
      await Promise.all([loadProducts(), loadMovements()]);
    } catch (e: any) {
      console.error('❌ Erro ao registrar devolução:', e);
      toast.error(e?.message || 'Erro ao registrar devolução');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <RotateCcw className="h-5 w-5" />
        <h1 className="text-2xl sm:text-3xl font-bold">Devolução de Produtos</h1>
      </div>
      <p className="text-sm sm:text-base text-body">Registre devoluções de clientes. A devolução incrementa o estoque.</p>

      <Card className="juga-card">
        <CardHeader>
          <CardTitle>Nova Devolução</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Produto *</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm((p) => ({ ...p, product_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white text-slate-900 border border-slate-200 shadow-xl dark:bg-slate-900 dark:text-white dark:border-slate-700">
                  {products.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={p.id}
                      className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {p.name} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <Button onClick={handleSubmit} disabled={isSubmitting || !form.product_id || !form.quantity} className="gap-2 juga-gradient text-white px-8 py-2 text-base font-semibold">
              <RotateCcw className="h-5 w-5" />
              {isSubmitting ? 'Registrando...' : 'Registrar Devolução'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="juga-card">
        <CardHeader>
          <CardTitle>Histórico de Devoluções</CardTitle>
        </CardHeader>
        <CardContent>
          {devolucoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RotateCcw className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div className="text-sm">Nenhuma devolução registrada</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devolucoes.slice(0, 50).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{m.product_name || 'Produto'}</div>
                          <div className="text-xs text-muted-foreground">{m.product_sku}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">+{m.quantity}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-green-500 text-green-700">{m.notes || m.reason || 'Devolução'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(m.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



