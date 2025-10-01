'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { JugaKPICard } from '@/components/dashboard/JugaComponents';
import { Package, AlertTriangle, TrendingDown, TrendingUp, ArrowDownUp, Warehouse, Filter, Plus } from 'lucide-react';
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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header - Responsivo */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Estoque</h1>
          <p className="text-sm sm:text-base text-body">
            Monitore níveis de estoque, produtos críticos e movimentações recentes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtrar Produtos</span>
            <span className="sm:hidden">Filtrar</span>
          </Button>
          <Button className="juga-gradient text-white w-full sm:w-auto gap-2">
            <Warehouse className="h-4 w-4" />
            <span className="hidden sm:inline">Movimentar Estoque</span>
            <span className="sm:hidden">Movimentar</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards - Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <JugaKPICard
          title="Produtos Cadastrados"
          value={`${stockSummary.totalProducts}`}
          description="Itens no catálogo"
          trend="up"
          trendValue="+5.2%"
          icon={<Package className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="primary"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Valor em Estoque"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stockSummary.totalValue)}
          description="Custo total"
          trend="up"
          trendValue="+12.4%"
          icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="success"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Estoque Baixo"
          value={`${stockSummary.lowStock.length}`}
          description="Abaixo do mínimo"
          trend="down"
          trendValue="Requer atenção"
          icon={<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="warning"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Sem Estoque"
          value={`${stockSummary.outOfStock.length}`}
          description="Produtos zerados"
          trend="down"
          trendValue="Urgente"
          icon={<TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="accent"
          className="min-h-[120px] sm:min-h-[140px]"
        />
      </div>

      {/* Main Content - Responsivo */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <Card className="juga-card xl:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl text-heading">Resumo de Produtos</CardTitle>
                <CardDescription className="text-sm">Itens agrupados por categoria e situação de estoque</CardDescription>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Buscar por nome ou SKU" className="w-full sm:w-48" />
                <Button variant="outline" className="gap-2 flex-shrink-0">
                  <ArrowDownUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Ordenar</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[420px]">
              <Table>
                <TableHeader>
                  <TableRow>
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
                      <TableRow key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-heading">{product.name}</span>
                            <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-body">{product.category_id || 'Padrão'}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant as any}>{product.stock_quantity}</Badge>
                        </TableCell>
                        <TableCell className="text-body">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.sale_price)}
                        </TableCell>
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

        <Card className="juga-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base sm:text-lg text-heading">Movimentações Recentes</CardTitle>
            <CardDescription className="text-sm">Entradas e saídas registradas</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px] overflow-y-auto px-6 scrollbar-visible">
              <div className="space-y-3 py-2 pr-2">
                {recentMovements.map((movement) => (
                  <div key={movement.id} className="rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-heading truncate">{movement.name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {movement.sku}</p>
                      </div>
                      <Badge variant={movement.movement === 'entrada' ? 'default' : 'destructive'} className="capitalize flex-shrink-0">
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
                    <div className="mt-2 text-xs text-body">
                      Status: <span className="font-medium text-heading">{movement.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <style jsx>{`
              .scrollbar-visible::-webkit-scrollbar {
                width: 8px;
              }
              .scrollbar-visible::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
              }
              .scrollbar-visible::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 4px;
              }
              .scrollbar-visible::-webkit-scrollbar-thumb:hover {
                background: #555;
              }
              .dark .scrollbar-visible::-webkit-scrollbar-track {
                background: #2d2d2d;
              }
              .dark .scrollbar-visible::-webkit-scrollbar-thumb {
                background: #555;
              }
              .dark .scrollbar-visible::-webkit-scrollbar-thumb:hover {
                background: #777;
              }
            `}</style>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}