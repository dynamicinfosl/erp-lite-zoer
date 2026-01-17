'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';
import { PageLoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Layers, Plus, Search, Trash2, Pencil, RefreshCw, ArrowLeft } from 'lucide-react';

type ProductRow = {
  id: number;
  sku: string;
  name: string;
  sale_price?: number;
  unit?: string;
};

type VariantRow = {
  id: number;
  label: string;
  name?: string | null;
  sale_price?: number | null;
  cost_price?: number | null;
  stock_quantity: number;
  is_active: boolean;
};

function ProdutoVariacoesContent() {
  const { tenant } = useSimpleAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [variantSummaryLoading, setVariantSummaryLoading] = useState(false);
  const [variantCounts, setVariantCounts] = useState<Map<number, number>>(new Map());

  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const [managerOpen, setManagerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const [newVariant, setNewVariant] = useState({
    label: '',
    name: '',
    sale_price: '',
    stock_quantity: '0',
    is_active: true,
  });

  const [editingVariant, setEditingVariant] = useState<VariantRow | null>(null);
  const [editDraft, setEditDraft] = useState({
    label: '',
    name: '',
    sale_price: '',
    stock_quantity: '0',
    is_active: true,
  });

  const tenantId = tenant?.id;

  const loadVariantSummary = async () => {
    if (!tenantId) return;
    setVariantSummaryLoading(true);
    try {
      const res = await fetch(`/next_api/product-variants?tenant_id=${encodeURIComponent(tenantId)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar resumo de variações');
      const rows = Array.isArray(json?.data) ? json.data : [];
      const map = new Map<number, number>();
      for (const r of rows) {
        const pid = Number((r as any)?.product_id);
        const cnt = Number((r as any)?.count);
        if (!Number.isFinite(pid) || pid <= 0) continue;
        map.set(pid, Number.isFinite(cnt) && cnt >= 0 ? cnt : 0);
      }
      setVariantCounts(map);
    } catch (e: any) {
      toast.error('Falha ao carregar resumo de variações', { description: e?.message || '' });
      setVariantCounts(new Map());
    } finally {
      setVariantSummaryLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!tenantId) return;
    setLoadingProducts(true);
    try {
      const res = await fetch(`/next_api/products?tenant_id=${encodeURIComponent(tenantId)}&branch_scope=all`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar produtos');
      const rows = Array.isArray(json?.data) ? json.data : [];
      const mapped: ProductRow[] = rows
        .map((p: any) => ({
          id: Number(p?.id),
          sku: String(p?.sku || '').trim(),
          name: String(p?.name || '').trim(),
          sale_price: Number.isFinite(Number(p?.sale_price)) ? Number(p.sale_price) : undefined,
          unit: p?.unit ? String(p.unit) : undefined,
        }))
        .filter((p: any) => Number.isFinite(p.id) && p.id > 0 && p.sku && p.name);
      setProducts(mapped);
    } catch (e: any) {
      toast.error('Falha ao carregar produtos', { description: e?.message || '' });
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadVariants = async (productId: number) => {
    if (!tenantId) return;
    setLoadingVariants(true);
    try {
      const res = await fetch(
        `/next_api/product-variants?tenant_id=${encodeURIComponent(tenantId)}&product_id=${encodeURIComponent(String(productId))}`
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar variações');
      const rows = Array.isArray(json?.data) ? json.data : [];
      const mapped: VariantRow[] = rows
        .map((v: any) => ({
          id: Number(v?.id),
          label: String(v?.label || '').trim(),
          name: v?.name ?? null,
          sale_price: v?.sale_price ?? null,
          cost_price: v?.cost_price ?? null,
          stock_quantity: Number.isFinite(Number(v?.stock_quantity)) ? Number(v.stock_quantity) : 0,
          is_active: v?.is_active === undefined ? true : Boolean(v.is_active),
        }))
        .filter((v: any) => Number.isFinite(v.id) && v.id > 0 && v.label);
      setVariants(mapped);
    } catch (e: any) {
      toast.error('Falha ao carregar variações', { description: e?.message || '' });
    } finally {
      setLoadingVariants(false);
    }
  };

  const openManager = async (p: ProductRow) => {
    setSelectedProduct(p);
    setManagerOpen(true);
    setNewVariant({ label: '', name: '', sale_price: '', stock_quantity: '0', is_active: true });
    await loadVariants(p.id);
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const productsWithVariants = products.filter((p) => (variantCounts.get(p.id) || 0) > 0);
    if (!q) return productsWithVariants;
    return productsWithVariants.filter((p) => {
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }, [products, productSearch, variantCounts]);

  const pickerResults = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 30);
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 30);
  }, [products, pickerSearch]);

  useEffect(() => {
    loadProducts();
    loadVariantSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  useEffect(() => {
    const pid = searchParams.get('product_id');
    if (!pid || !products.length) return;
    const n = Number(pid);
    if (!Number.isFinite(n) || n <= 0) return;
    const p = products.find((x) => x.id === n);
    if (p) openManager(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, products]);

  const handleCreateVariant = async () => {
    if (!tenantId) return;
    if (!selectedProduct) return;
    const label = newVariant.label.trim();
    if (!label) {
      toast.error('Informe o label da variação (ex.: Limão, Uva, 500ml)');
      return;
    }
    try {
      const res = await fetch('/next_api/product-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          product_id: selectedProduct.id,
          label,
          name: newVariant.name.trim() || null,
          sale_price: newVariant.sale_price.trim() ? Number(newVariant.sale_price) : null,
          stock_quantity: Number(newVariant.stock_quantity || 0),
          is_active: Boolean(newVariant.is_active),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Erro ao salvar variação');
      toast.success('Variação salva');
      setNewVariant({ label: '', name: '', sale_price: '', stock_quantity: '0', is_active: true });
      await loadVariants(selectedProduct.id);
    } catch (e: any) {
      toast.error('Falha ao salvar variação', { description: e?.message || '' });
    }
  };

  const openEdit = (v: VariantRow) => {
    setEditingVariant(v);
    setEditDraft({
      label: v.label,
      name: String(v.name || ''),
      sale_price: v.sale_price === null || v.sale_price === undefined ? '' : String(v.sale_price),
      stock_quantity: String(v.stock_quantity ?? 0),
      is_active: Boolean(v.is_active),
    });
  };

  const handleSaveEdit = async () => {
    if (!tenantId) return;
    if (!editingVariant) return;
    const label = editDraft.label.trim();
    if (!label) {
      toast.error('Label não pode ser vazio');
      return;
    }
    try {
      const res = await fetch('/next_api/product-variants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          id: editingVariant.id,
          label,
          name: editDraft.name.trim() || null,
          sale_price: editDraft.sale_price.trim() ? Number(editDraft.sale_price) : null,
          stock_quantity: Number(editDraft.stock_quantity || 0),
          is_active: Boolean(editDraft.is_active),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Erro ao atualizar variação');
      toast.success('Variação atualizada');
      setEditingVariant(null);
      if (selectedProduct) await loadVariants(selectedProduct.id);
    } catch (e: any) {
      toast.error('Falha ao atualizar variação', { description: e?.message || '' });
    }
  };

  const handleDeleteVariant = async (v: VariantRow) => {
    if (!tenantId) return;
    if (!selectedProduct) return;
    if (!confirm(`Excluir a variação "${v.label}"?`)) return;
    try {
      const res = await fetch(
        `/next_api/product-variants?tenant_id=${encodeURIComponent(tenantId)}&id=${encodeURIComponent(String(v.id))}`,
        { method: 'DELETE' }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Erro ao excluir variação');
      toast.success('Variação excluída');
      await loadVariants(selectedProduct.id);
    } catch (e: any) {
      toast.error('Falha ao excluir variação', { description: e?.message || '' });
    }
  };

  const handleDeleteAllVariants = async () => {
    if (!tenantId || !selectedProduct) return;
    if (variants.length === 0) return;
    if (!confirm(`Excluir TODAS as variações do produto "${selectedProduct.name}"?`)) return;
    try {
      for (const v of variants) {
        // best-effort
        await fetch(
          `/next_api/product-variants?tenant_id=${encodeURIComponent(tenantId)}&id=${encodeURIComponent(String(v.id))}`,
          { method: 'DELETE' }
        ).catch(() => {});
      }
      toast.success('Variações excluídas');
      await loadVariants(selectedProduct.id);
    } catch (e: any) {
      toast.error('Falha ao excluir variações', { description: e?.message || '' });
    }
  };

  return (
    <TenantPageWrapper>
      <Card className="juga-card">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Variações
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie variações (ex.: sabores) vinculadas ao produto base.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/produtos')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await loadProducts();
                await loadVariantSummary();
              }}
              disabled={!tenantId || loadingProducts || variantSummaryLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={() => setProductPickerOpen(true)} disabled={!tenantId || loadingProducts}>
              <Plus className="h-4 w-4 mr-2" />
              Criar variação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos que já têm variações (nome ou SKU)..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="max-w-lg"
            />
            <Badge variant="secondary" className="ml-auto">
              {filteredProducts.length} produtos com variações
            </Badge>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="w-[160px]">SKU</TableHead>
                  <TableHead className="w-[140px] text-center">Variações</TableHead>
                  <TableHead className="w-[170px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProducts ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground py-8 text-center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground py-8 text-center">
                      Nenhum produto com variações encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.slice(0, 200).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.sku}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{variantCounts.get(p.id) || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openManager(p)}>
                          Gerenciar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredProducts.length > 200 && (
            <p className="text-xs text-muted-foreground mt-2">
              Mostrando apenas os primeiros 200 resultados. Refine a busca.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={managerOpen} onOpenChange={(open) => setManagerOpen(open)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gerenciar variações</DialogTitle>
            <DialogDescription>
              {selectedProduct ? (
                <>
                  Produto: <span className="font-medium">{selectedProduct.name}</span> — SKU:{' '}
                  <span className="font-medium">{selectedProduct.sku}</span>
                </>
              ) : (
                'Selecione um produto'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="font-semibold">Nova variação</div>
                <Button variant="outline" size="sm" onClick={handleCreateVariant} disabled={!selectedProduct}>
                  <Plus className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-2">
                  <Label>Label *</Label>
                  <Input value={newVariant.label} onChange={(e) => setNewVariant((p) => ({ ...p, label: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <Label>Nome completo (opcional)</Label>
                  <Input value={newVariant.name} onChange={(e) => setNewVariant((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Preço</Label>
                  <Input
                    inputMode="decimal"
                    value={newVariant.sale_price}
                    onChange={(e) => setNewVariant((p) => ({ ...p, sale_price: e.target.value }))}
                    placeholder="Ex.: 12.50"
                  />
                </div>
                <div>
                  <Label>Estoque</Label>
                  <Input
                    inputMode="numeric"
                    value={newVariant.stock_quantity}
                    onChange={(e) => setNewVariant((p) => ({ ...p, stock_quantity: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="font-semibold">Variações cadastradas</div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{variants.length}</Badge>
                <Button variant="outline" size="sm" onClick={() => selectedProduct && loadVariants(selectedProduct.id)} disabled={!selectedProduct}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar
                </Button>
                <Button variant="outline" size="sm" className="text-red-600" onClick={handleDeleteAllVariants} disabled={!selectedProduct || variants.length === 0}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir todas
                </Button>
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[120px] text-right">Preço</TableHead>
                    <TableHead className="w-[110px] text-right">Estoque</TableHead>
                    <TableHead className="w-[120px] text-center">Status</TableHead>
                    <TableHead className="w-[140px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingVariants ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-muted-foreground py-8 text-center">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : variants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-muted-foreground py-8 text-center">
                        Nenhuma variação cadastrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    variants.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.label}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{v.name || '-'}</TableCell>
                        <TableCell className="text-right">
                          {v.sale_price === null || v.sale_price === undefined ? '-' : `R$ ${Number(v.sale_price).toFixed(2)}`}
                        </TableCell>
                        <TableCell className="text-right">{v.stock_quantity ?? 0}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={v.is_active ? 'default' : 'secondary'}>{v.is_active ? 'Ativa' : 'Inativa'}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(v)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteVariant(v)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManagerOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={productPickerOpen} onOpenChange={setProductPickerOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Escolher produto</DialogTitle>
            <DialogDescription>Pesquise e selecione um produto para criar/gerenciar variações.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou SKU..."
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
            />
          </div>

          <div className="rounded-lg border overflow-hidden max-h-[45vh] overflow-y-auto">
            <Table>
              <TableBody>
                {pickerResults.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-sm text-muted-foreground py-8 text-center">Nenhum produto encontrado.</TableCell>
                  </TableRow>
                ) : (
                  pickerResults.map((p) => (
                    <TableRow key={`pick-${p.id}`} className="cursor-pointer hover:bg-muted/40" onClick={() => {
                      setProductPickerOpen(false);
                      setPickerSearch('');
                      openManager(p);
                    }}>
                      <TableCell>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {p.sku}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        {(variantCounts.get(p.id) || 0) > 0 ? (
                          <Badge variant="secondary">{variantCounts.get(p.id) || 0} var.</Badge>
                        ) : (
                          <Badge variant="outline">sem var.</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProductPickerOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingVariant} onOpenChange={(open) => (!open ? setEditingVariant(null) : null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar variação</DialogTitle>
            <DialogDescription>Atualize os dados da variação.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label>Label *</Label>
              <Input value={editDraft.label} onChange={(e) => setEditDraft((p) => ({ ...p, label: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Label>Nome completo (opcional)</Label>
              <Input value={editDraft.name} onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>Preço</Label>
              <Input value={editDraft.sale_price} onChange={(e) => setEditDraft((p) => ({ ...p, sale_price: e.target.value }))} />
            </div>
            <div>
              <Label>Estoque</Label>
              <Input value={editDraft.stock_quantity} onChange={(e) => setEditDraft((p) => ({ ...p, stock_quantity: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVariant(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TenantPageWrapper>
  );
}

export default function ProdutoVariacoesPage() {
  return (
    <Suspense fallback={<PageLoadingSpinner />}>
      <ProdutoVariacoesContent />
    </Suspense>
  );
}
