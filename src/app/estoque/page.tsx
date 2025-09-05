
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Package, AlertTriangle, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { Product, StockMovement } from '@/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export default function EstoquePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    product_id: '',
    movement_type: 'entrada' as 'entrada' | 'saida' | 'ajuste',
    quantity: '',
    unit_cost: '',
    notes: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchMovements();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.get<Product[]>('/products');
      setProducts(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const data = await api.get<StockMovement[]>('/stock-movements');
      setMovements(data);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.quantity) {
      toast.error('Produto e quantidade são obrigatórios');
      return;
    }

    try {
      const movementData = {
        product_id: parseInt(formData.product_id),
        movement_type: formData.movement_type,
        quantity: parseInt(formData.quantity),
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : undefined,
        reference_type: 'ajuste',
        notes: formData.notes || undefined,
      };

      await api.post('/stock-movements', movementData);
      toast.success('Movimentação registrada com sucesso');
      
      setShowDialog(false);
      resetForm();
      fetchProducts();
      fetchMovements();
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast.error('Erro ao registrar movimentação');
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      movement_type: 'entrada',
      quantity: '',
      unit_cost: '',
      notes: '',
    });
    setSelectedProduct(null);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(product => 
    product.stock_quantity <= product.min_stock
  );

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Produto não encontrado';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entrada':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'saida':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'ajuste':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Controle de Estoque</h1>
          <p className="text-muted-foreground">
            Gerencie o estoque e movimentações dos produtos
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Movimentação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Produto *</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, product_id: value }));
                    const product = products.find(p => p.id === parseInt(value));
                    setSelectedProduct(product || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - Estoque: {product.stock_quantity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="movement_type">Tipo de Movimentação *</Label>
                <Select
                  value={formData.movement_type}
                  onValueChange={(value: 'entrada' | 'saida' | 'ajuste') => 
                    setFormData(prev => ({ ...prev, movement_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="ajuste">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_cost">Custo Unitário</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              {selectedProduct && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">Estoque Atual: {selectedProduct.stock_quantity} {selectedProduct.unit}</div>
                  <div className="text-sm text-muted-foreground">
                    Estoque após movimentação: {
                      formData.movement_type === 'entrada' 
                        ? selectedProduct.stock_quantity + (parseInt(formData.quantity) || 0)
                        : formData.movement_type === 'saida'
                        ? selectedProduct.stock_quantity - (parseInt(formData.quantity) || 0)
                        : parseInt(formData.quantity) || selectedProduct.stock_quantity
                    } {selectedProduct.unit}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar Movimentação
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alertas de Estoque Baixo */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Produtos com Estoque Baixo ({lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {lowStockProducts.slice(0, 5).map(product => (
                <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded">
                  <span className="font-medium">{product.name}</span>
                  <Badge variant="destructive">
                    {product.stock_quantity} / {product.min_stock} {product.unit}
                  </Badge>
                </div>
              ))}
              {lowStockProducts.length > 5 && (
                <div className="text-sm text-muted-foreground">
                  E mais {lowStockProducts.length - 5} produtos...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="produtos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="produtos">Produtos em Estoque</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={fetchProducts}>
                  Atualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Produtos */}
          <Card>
            <CardHeader>
              <CardTitle>Produtos em Estoque ({filteredProducts.length})</CardTitle>
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
                      <TableHead>Produto</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                      <TableHead>Estoque Mínimo</TableHead>
                      <TableHead>Valor em Estoque</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {product.sku && `SKU: ${product.sku}`}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {product.stock_quantity} {product.unit}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-muted-foreground">
                            {product.min_stock} {product.unit}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(product.stock_quantity * product.cost_price)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(product.cost_price)} / {product.unit}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.stock_quantity <= product.min_stock ? (
                              <>
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <Badge variant="destructive">Estoque Baixo</Badge>
                              </>
                            ) : product.stock_quantity === 0 ? (
                              <Badge variant="secondary">Sem Estoque</Badge>
                            ) : (
                              <Badge variant="default">Normal</Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {!loading && filteredProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimentacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.slice(0, 20).map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(movement.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(movement.created_at).toLocaleTimeString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {getProductName(movement.product_id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.movement_type)}
                          <Badge variant={
                            movement.movement_type === 'entrada' ? 'default' :
                            movement.movement_type === 'saida' ? 'destructive' : 'secondary'
                          }>
                            {movement.movement_type.charAt(0).toUpperCase() + movement.movement_type.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          movement.movement_type === 'entrada' ? 'text-green-600' :
                          movement.movement_type === 'saida' ? 'text-red-600' : ''
                        }`}>
                          {movement.movement_type === 'saida' ? '-' : '+'}
                          {movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {movement.notes || '-'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {movements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma movimentação registrada.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
