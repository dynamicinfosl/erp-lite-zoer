

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Eye, Receipt, Calendar, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { Sale, SaleItem } from '@/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export default function VendasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await api.get<Sale[]>('/sales');
      setSales(data);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (sale: Sale) => {
    try {
      setSelectedSale(sale);
      // Em um sistema real, você buscaria os itens da venda
      // const items = await api.get<SaleItem[]>(`/sale-items?sale_id=${sale.id}`);
      // setSaleItems(items);
      setSaleItems([]); // Por enquanto, array vazio
      setShowDetailsDialog(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes da venda:', error);
      toast.error('Erro ao carregar detalhes da venda');
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      dinheiro: 'Dinheiro',
      pix: 'PIX',
      cartao_debito: 'Cartão Débito',
      cartao_credito: 'Cartão Crédito',
      fiado: 'Fiado',
    };
    return methods[method as keyof typeof methods] || method;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finalizada':
        return <Badge variant="default">Finalizada</Badge>;
      case 'cancelada':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Estatísticas
  const todaySales = sales.filter(sale => 
    sale.sold_at.startsWith(new Date().toISOString().split('T')[0])
  );

  const stats = {
    totalSales: sales.length,
    todaySales: todaySales.length,
    totalAmount: sales.reduce((sum, sale) => sum + sale.final_amount, 0),
    todayAmount: todaySales.reduce((sum, sale) => sum + sale.final_amount, 0),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Vendas</h1>
          <p className="text-muted-foreground">
            Consulte e gerencie todas as vendas realizadas
          </p>
        </div>
        <Button onClick={fetchSales}>
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Todas as vendas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaySales}</div>
            <p className="text-xs text-muted-foreground">
              Vendas do dia
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.todayAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Valor do dia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número da venda ou observações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendas ({filteredSales.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{sale.sale_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {new Date(sale.sold_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(sale.sold_at).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold">
                          {formatCurrency(sale.final_amount)}
                        </div>
                        {sale.discount_amount > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Desc: {formatCurrency(sale.discount_amount)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getPaymentMethodLabel(sale.payment_method)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sale.sale_type === 'entrega' ? 'secondary' : 'default'}>
                        {sale.sale_type === 'entrega' ? 'Entrega' : 'Balcão'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(sale.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(sale)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredSales.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhuma venda encontrada com os filtros aplicados.' : 'Nenhuma venda registrada.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Venda - {selectedSale?.sale_number}
            </DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Informações da Venda</h3>
                  <div className="space-y-1 text-sm">
                    <div><strong>Data:</strong> {new Date(selectedSale.sold_at).toLocaleString('pt-BR')}</div>
                    <div><strong>Tipo:</strong> {selectedSale.sale_type === 'entrega' ? 'Entrega' : 'Balcão'}</div>
                    <div><strong>Pagamento:</strong> {getPaymentMethodLabel(selectedSale.payment_method)}</div>
                    <div><strong>Status:</strong> {selectedSale.status}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Valores</h3>
                  <div className="space-y-1 text-sm">
                    <div><strong>Subtotal:</strong> {formatCurrency(selectedSale.total_amount)}</div>
                    <div><strong>Desconto:</strong> {formatCurrency(selectedSale.discount_amount)}</div>
                    <div><strong>Total Final:</strong> {formatCurrency(selectedSale.final_amount)}</div>
                  </div>
                </div>
              </div>

              {selectedSale.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Observações</h3>
                  <p className="text-sm text-muted-foreground">{selectedSale.notes}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Itens da Venda</h3>
                {saleItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saleItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>Produto ID: {item.product_id}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell>{formatCurrency(item.total_price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Detalhes dos itens não disponíveis.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

