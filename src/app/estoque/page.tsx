'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { JugaKPICard } from '@/components/dashboard/JugaComponents';
import { Package, AlertTriangle, TrendingDown, TrendingUp, ArrowDownUp, Warehouse, Filter } from 'lucide-react';
import { mockProducts } from '@/lib/mock-data';

const lowStockThreshold = 10;

export default function EstoquePage() {
  const stockSummary = useMemo(() => {
    const totalProducts = mockProducts.length;
    const lowStock = mockProducts.filter((product) => product.stock_quantity <= lowStockThreshold && product.stock_quantity > 0);
    const outOfStock = mockProducts.filter((product) => product.stock_quantity === 0);
    const totalValue = mockProducts.reduce((sum, product) => sum + product.cost_price * product.stock_quantity, 0);

    return {
      totalProducts,
      lowStock,
      outOfStock,
      totalValue,
    };
  }, []);

  const recentMovements = useMemo(
    () =>
      mockProducts.slice(0, 6).map((product, index) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        movement: index % 2 === 0 ? 'entrada' : 'saída',
        quantity: index % 2 === 0 ? 25 : -8,
        date: new Date(Date.now() - index * 86400000).toLocaleDateString('pt-BR'),
        status: index % 2 === 0 ? 'Concluído' : 'Pendente',
      })),
    [],
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Card className="border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-white">
        <CardContent className="pt-6 pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Badge className="w-fit bg-blue-600">Estoque</Badge>
              <h1 className="text-3xl font-bold text-blue-900">Visão Geral do Estoque</h1>
              <p className="text-blue-900/70 max-w-2xl">
                Monitore níveis de estoque, produtos críticos e movimentações recentes para manter o fluxo de vendas saudável.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2 border-blue-200 hover:bg-blue-50">
                <Filter className="h-4 w-4" />
                Filtrar Produtos
              </Button>
              <Button className="juga-gradient text-white gap-2">
                <Warehouse className="h-4 w-4" />
                Movimentar Estoque
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-4">
        <JugaKPICard
          title="Produtos cadastrados"
          value={`${stockSummary.totalProducts}`}
          description="Itens ativos no catálogo"
          trend="up"
          trendValue="+5,2%"
          icon={<Package className="h-5 w-5" />}
          color="primary"
        />
        <JugaKPICard
          title="Valor total em estoque"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stockSummary.totalValue)}
          description="Custo de reposição"
          trend="up"
          trendValue="+12,4%"
          icon={<TrendingUp className="h-5 w-5" />}
          color="accent"
        />
        <JugaKPICard
          title="Estoque crítico"
          value={`${stockSummary.lowStock.length}`}
          description="Itens abaixo do mínimo"
          trend="down"
          trendValue="Repor urgente"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="warning"
        />
        <JugaKPICard
          title="Sem estoque"
          value={`${stockSummary.outOfStock.length}`}
          description="Produtos zerados"
          trend="down"
          trendValue="Risco de ruptura"
          icon={<TrendingDown className="h-5 w-5" />}
          color="error"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="juga-card lg:col-span-2 border-blue-200 bg-gradient-to-br from-white via-blue-50/40 to-white shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-heading">Resumo de produtos</CardTitle>
              <p className="text-caption text-sm">Itens agrupados por categoria e situação de estoque</p>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Buscar por nome ou SKU" className="w-48" />
              <Button variant="outline" className="gap-2 border-blue-200 hover:bg-blue-50">
                <ArrowDownUp className="h-4 w-4" />
                Ordenar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[420px]">
              <Table className="border border-blue-100 rounded-md overflow-hidden">
                <TableHeader>
                  <TableRow className="border-b-2 border-blue-100">
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Preço venda</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProducts.map((product) => {
                    const statusVariant =
                      product.stock_quantity === 0 ? 'destructive' : product.stock_quantity <= lowStockThreshold ? 'warning' : 'default';

                    const statusLabel =
                      product.stock_quantity === 0 ? 'Sem estoque' : product.stock_quantity <= lowStockThreshold ? 'Baixo' : 'Saudável';

                    return (
                      <TableRow key={product.id} className="hover:bg-blue-50/50 border-b border-blue-50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-heading">{product.name}</span>
                            <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell>{product.category_id || 'Padrão'}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant as any}>{product.stock_quantity}</Badge>
                        </TableCell>
                        <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.sale_price)}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant as any}>{statusLabel}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="juga-card border-blue-200 bg-gradient-to-br from-white via-blue-50/40 to-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-heading">Movimentações recentes</CardTitle>
            <p className="text-caption text-sm">Entradas e saídas registradas</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[420px] space-y-3">
              {recentMovements.map((movement) => (
                <div key={movement.id} className="rounded-lg border border-blue-100 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-heading">{movement.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {movement.sku}</p>
                    </div>
                    <Badge variant={movement.movement === 'entrada' ? 'default' : 'destructive'} className="capitalize">
                      {movement.movement}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{movement.date}</span>
                    <span className={movement.quantity > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {movement.quantity > 0 ? '+' : ''}
                      {movement.quantity} unidades
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Status: <span className="font-medium text-heading">{movement.status}</span>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}