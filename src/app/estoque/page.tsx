'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { JugaKPICard } from '@/components/dashboard/JugaComponents';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Warehouse,
  Plus,
  ArrowDownUp,
  Search,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';

interface Product {
  id: string;
  sku: string;
  name: string;
  stock_quantity: number;
  unit: string;
  cost_price: number;
  sale_price: number;
}

interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  movement_type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  reason?: string;
  created_at: string;
}

const lowStockThreshold = 10;

export default function EstoquePage() {
  const { tenant } = useSimpleAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [showMovementsHistory, setShowMovementsHistory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [movementForm, setMovementForm] = useState({
    product_id: '',
    movement_type: 'entrada' as 'entrada' | 'saida' | 'ajuste',
    quantity: '',
    reason: '',
  });

  useEffect(() => {
    // Mover verificação de window para dentro do useEffect
    const storedTenantId = typeof window !== 'undefined' ? localStorage.getItem('lastProductsTenantId') : null;
    const tenantId = tenant?.id || storedTenantId;
    if (tenantId) {
      loadProducts();
      loadMovements();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const storedTenantId = typeof window !== 'undefined' ? localStorage.getItem('lastProductsTenantId') : null;
      const tenantId = tenant?.id || storedTenantId;
      if (!tenantId) return;

      const response = await fetch(`/next_api/products?tenant_id=${encodeURIComponent(tenantId)}`);
      if (!response.ok) throw new Error('Erro ao carregar produtos');

      const data = await response.json();
      const rows = Array.isArray(data?.data) ? data.data : [];
      setProducts(rows);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      const storedTenantId = typeof window !== 'undefined' ? localStorage.getItem('lastProductsTenantId') : null;
      const tenantId = tenant?.id || storedTenantId;
      if (!tenantId) return;

      const response = await fetch(`/next_api/stock-movements?tenant_id=${encodeURIComponent(tenantId)}`);
      if (!response.ok) {
        console.warn('Movimentações não disponíveis');
        setMovements([]);
        return;
      }

      const data = await response.json();
      const rows = Array.isArray(data?.data) ? data.data : [];
      setMovements(rows);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      setMovements([]);
    }
  };

  const handleMovementSubmit = async () => {
    try {
      setIsSubmitting(true);
      const storedTenantId = typeof window !== 'undefined' ? localStorage.getItem('lastProductsTenantId') : null;
      const tenantId = tenant?.id || storedTenantId;

      const response = await fetch('/next_api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          product_id: movementForm.product_id,
          movement_type: movementForm.movement_type,
          quantity: parseInt(movementForm.quantity) || 0,
          reason: movementForm.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success('Movimentação registrada');
      setShowMovementDialog(false);
      setMovementForm({
        product_id: '',
        movement_type: 'entrada',
        quantity: '',
        reason: '',
      });
      await loadProducts();
      await loadMovements();
    } catch (error: any) {
      toast.error(`Erro: ${error?.message || 'erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stockSummary = useMemo(() => {
    const totalProducts = products.length;
    const lowStock = products.filter((p) => p.stock_quantity <= lowStockThreshold && p.stock_quantity > 0);
    const outOfStock = products.filter((p) => p.stock_quantity === 0);
    const totalValue = products.reduce((sum, p) => sum + p.cost_price * p.stock_quantity, 0);

    return {
      totalProducts,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      totalValue,
    };
  }, [products]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Estoque</h1>
          <p className="text-sm sm:text-base text-body">
            Monitore níveis de estoque, produtos críticos e movimentações recentes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto gap-2"
            onClick={() => setShowMovementsHistory(true)}
          >
            <Eye className="h-4 w-4" />
            Ver Movimentações
          </Button>
          <Button
            className="juga-gradient text-white w-full sm:w-auto gap-2"
            onClick={() => setShowMovementDialog(true)}
          >
            <Warehouse className="h-4 w-4" />
            Movimentar Estoque
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <JugaKPICard
          title="Produtos Cadastrados"
          value={stockSummary.totalProducts.toString()}
          description="Total de produtos"
          icon={<Package className="h-4 w-4" />}
          color="primary"
        />
        <JugaKPICard
          title="Estoque Baixo"
          value={stockSummary.lowStock.toString()}
          description={`≤ ${lowStockThreshold} unidades`}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="warning"
        />
        <JugaKPICard
          title="Sem Estoque"
          value={stockSummary.outOfStock.toString()}
          description="Produtos zerados"
          icon={<TrendingDown className="h-4 w-4" />}
          color="error"
        />
        <JugaKPICard
          title="Valor Total"
          value={formatCurrency(stockSummary.totalValue)}
          description="Estoque em R$"
          icon={<TrendingUp className="h-4 w-4" />}
          color="success"
        />
      </div>

      {/* Busca */}
      <Card className="juga-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Produtos */}
      <Card className="juga-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos em Estoque ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isLow = product.stock_quantity <= lowStockThreshold && product.stock_quantity > 0;
                  const isOut = product.stock_quantity === 0;
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell className="font-semibold">
                        {product.stock_quantity} {product.unit || 'UN'}
                      </TableCell>
                      <TableCell>{product.unit || 'UN'}</TableCell>
                      <TableCell>
                        {isOut && <Badge variant="destructive">Sem estoque</Badge>}
                        {isLow && <Badge variant="outline" className="border-yellow-500 text-yellow-700">Estoque baixo</Badge>}
                        {!isLow && !isOut && <Badge variant="default">Disponível</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
              <p className="text-sm">
                {searchTerm ? 'Tente ajustar os filtros de busca' : 'Adicione produtos para começar'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Movimentar Estoque */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent className="sm:max-w-[500px] p-0 border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          <div className="relative">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <ArrowDownUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">Movimentar Estoque</DialogTitle>
                  <DialogDescription className="text-blue-100 mt-1">
                    Registre entradas, saídas ou ajustes de estoque
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-800/50 backdrop-blur-sm space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-200">Produto *</Label>
                <Select
                  value={movementForm.product_id}
                  onValueChange={(value) => setMovementForm((prev) => ({ ...prev, product_id: value }))}
                >
                  <SelectTrigger className="h-11 bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-white hover:bg-slate-600">
                        {p.name} ({p.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-200">Tipo de Movimentação *</Label>
                <Select
                  value={movementForm.movement_type}
                  onValueChange={(value: any) => setMovementForm((prev) => ({ ...prev, movement_type: value }))}
                >
                  <SelectTrigger className="h-11 bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="entrada" className="text-white hover:bg-slate-600">Entrada</SelectItem>
                    <SelectItem value="saida" className="text-white hover:bg-slate-600">Saída</SelectItem>
                    <SelectItem value="ajuste" className="text-white hover:bg-slate-600">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-200">Quantidade *</Label>
                <Input
                  type="number"
                  min="1"
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  placeholder="0"
                  className="h-11 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-200">Motivo</Label>
                <Input
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ex: Compra, Venda, Ajuste de inventário..."
                  className="h-11 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-b-lg border-t border-slate-600/50">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowMovementDialog(false)}
                  className="w-full sm:w-auto border-slate-500 bg-slate-700/50 hover:bg-slate-600 text-slate-200"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleMovementSubmit}
                  disabled={isSubmitting || !movementForm.product_id || !movementForm.quantity}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  {isSubmitting ? 'Registrando...' : 'Registrar Movimentação'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico de Movimentações */}
      <Dialog open={showMovementsHistory} onOpenChange={setShowMovementsHistory}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Histórico de Movimentações</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Últimas movimentações de estoque registradas
            </DialogDescription>
          </DialogHeader>
          
          {movements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ArrowDownUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Nenhuma movimentação registrada</h3>
              <p className="text-sm">
                As movimentações de estoque aparecerão aqui quando você registrar entradas, saídas ou ajustes
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-900 dark:text-white">Produto</TableHead>
                    <TableHead className="text-slate-900 dark:text-white">Tipo</TableHead>
                    <TableHead className="text-slate-900 dark:text-white">Quantidade</TableHead>
                    <TableHead className="text-slate-900 dark:text-white">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.slice(0, 20).map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{mov.product_name || 'Produto'}</div>
                          <div className="text-xs text-muted-foreground">{mov.product_sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={mov.movement_type === 'entrada' ? 'default' : mov.movement_type === 'saida' ? 'destructive' : 'outline'}
                        >
                          {mov.movement_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-white">
                        {mov.movement_type === 'saida' ? '-' : '+'}{mov.quantity}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(mov.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowMovementsHistory(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
