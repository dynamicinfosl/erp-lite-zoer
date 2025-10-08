'use client';

import React, { useEffect, useState } from 'react';
import { AdminProtection } from '@/components/admin/AdminProtection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getMonthlySales, getActiveUsers, getTopProducts, MonthlySalesPoint, ActiveUserRow, TopProductRow } from '@/lib/analytics';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

export default function AdminAnalyticsPage() {
  const [salesSeries, setSalesSeries] = useState<MonthlySalesPoint[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUserRow[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sales, users, products] = await Promise.all([
          getMonthlySales(),
          getActiveUsers(10),
          getTopProducts(10),
        ]);
        setSalesSeries(sales);
        setActiveUsers(users);
        setTopProducts(products);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AdminProtection>
      <div className="space-y-6 p-4 sm:p-6 w-full min-w-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Analytics e Relatórios</h1>
          <p className="text-sm sm:text-base text-body mt-2">Análises e relatórios detalhados do sistema</p>
        </div>

        {/* Métricas - carrossel no mobile, grid em telas maiores */}
        <div className="sm:hidden -mx-4 px-4">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [-ms-overflow-style:none]">
            <style jsx>{`
              div::-webkit-scrollbar { display: none; }
            `}</style>
            <Card className="min-w-[220px] snap-start">
              <CardHeader>
                <CardTitle>Usuários Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">142</div>
                <p className="text-xs text-body">+12% este mês</p>
              </CardContent>
            </Card>
            <Card className="min-w-[220px] snap-start">
              <CardHeader>
                <CardTitle>Vendas Totais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-600">R$ 89.500</div>
                <p className="text-xs text-body">+8% este mês</p>
              </CardContent>
            </Card>
            <Card className="min-w-[220px] snap-start">
              <CardHeader>
                <CardTitle>Produtos Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-purple-600">234</div>
                <p className="text-xs text-body">+15% este mês</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuários Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">142</div>
              <p className="text-xs sm:text-sm text-body">+12% este mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vendas Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">R$ 89.500</div>
              <p className="text-xs sm:text-sm text-body">+8% este mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Produtos Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-purple-600">234</div>
              <p className="text-xs sm:text-sm text-body">+15% este mês</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico: Vendas por mês */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por mês</CardTitle>
          </CardHeader>
          <CardContent className="h-64 sm:h-72 lg:h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="month" stroke="currentColor" opacity={0.6} />
                <YAxis stroke="currentColor" opacity={0.6} />
                <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')} mil`, 'Vendas']} />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Tabela: Usuários ativos recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Usuários ativos recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Última atividade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                      </TableCell>
                      <TableCell>{u.lastActive}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Tabela: Top produtos vendidos */}
          <Card>
            <CardHeader>
              <CardTitle>Top produtos vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Vendidos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((p) => (
                    <TableRow key={p.sku}>
                      <TableCell>{p.sku}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">{p.sold.toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminProtection>
  );
}
