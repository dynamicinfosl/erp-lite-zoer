'use client';

import React from 'react';
import { AdminProtection } from '@/components/admin/AdminProtection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AdminInventoryPage() {
  interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    stock: number;
    minStock: number;
  }

  // Dados mockados para demonstrar a funcionalidade
  const products: Product[] = [
    { id: '1', name: 'Cerveja Pilsen 350ml', sku: 'BEV-001', category: 'Cervejas', stock: 18, minStock: 24 },
    { id: '2', name: 'Refrigerante Cola 2L', sku: 'BEV-042', category: 'Refrigerantes', stock: 52, minStock: 20 },
    { id: '3', name: 'Água Mineral 500ml', sku: 'BEV-010', category: 'Águas', stock: 8, minStock: 30 },
    { id: '4', name: 'Energético 269ml', sku: 'BEV-077', category: 'Energéticos', stock: 40, minStock: 25 },
    { id: '5', name: 'Suco Laranja 1L', sku: 'BEV-021', category: 'Sucos', stock: 12, minStock: 15 },
    { id: '6', name: 'Cerveja IPA 600ml', sku: 'BEV-099', category: 'Cervejas', stock: 5, minStock: 18 },
  ];

  const needsRestock = products.filter((p) => p.stock < p.minStock);
  const inStock = products.filter((p) => p.stock >= p.minStock);

  return (
    <AdminProtection>
      <div className="space-y-6 p-4 sm:p-6 w-full min-w-0">
        <div>
          <h1 className="text-3xl font-bold text-heading">Controle de Inventário</h1>
          <p className="text-body mt-2">Controle de estoque e produtos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos em Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{inStock.length}</div>
              <p className="text-sm text-body">Produtos disponíveis</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Estoque Baixo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{needsRestock.length}</div>
              <p className="text-sm text-body">Produtos precisam reabastecer</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de produtos que precisam reabastecer */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos que precisam reabastecer</CardTitle>
          </CardHeader>
          <CardContent>
            {needsRestock.length === 0 ? (
              <div className="text-sm text-body">Nenhum produto abaixo do mínimo.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Mínimo</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {needsRestock.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.sku}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell>{p.stock}</TableCell>
                      <TableCell>{p.minStock}</TableCell>
                      <TableCell>
                        <Badge className="bg-orange-500 text-white">Abaixo do mínimo</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Lista de produtos em estoque */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos em estoque</CardTitle>
          </CardHeader>
          <CardContent>
            {inStock.length === 0 ? (
              <div className="text-sm text-body">Sem produtos disponíveis.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Mínimo</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inStock.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.sku}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell>{p.stock}</TableCell>
                      <TableCell>{p.minStock}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">OK</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminProtection>
  );
}
