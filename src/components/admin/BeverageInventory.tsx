'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Thermometer,
  Calendar,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
  Plus,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface BeverageProduct {
  id: string;
  name: string;
  category: 'cerveja' | 'destilado' | 'vinho' | 'refrigerante';
  brand: string;
  volume: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  batchNumber: string;
  expirationDate: string;
  temperature: number;
  location: string;
  status: 'ok' | 'low' | 'expired' | 'critical';
}

const mockBeverageProducts: BeverageProduct[] = [
  {
    id: '1',
    name: 'Cerveja Skol 350ml',
    category: 'cerveja',
    brand: 'Skol',
    volume: '350ml',
    currentStock: 1200,
    minStock: 500,
    maxStock: 2000,
    unitPrice: 2.50,
    batchNumber: 'SKL2024001',
    expirationDate: '2024-12-15',
    temperature: 2,
    location: 'Geladeira A1',
    status: 'ok'
  },
  {
    id: '2',
    name: 'Vodka Smirnoff 1L',
    category: 'destilado',
    brand: 'Smirnoff',
    volume: '1L',
    currentStock: 45,
    minStock: 100,
    maxStock: 500,
    unitPrice: 45.90,
    batchNumber: 'SMF2024002',
    expirationDate: '2026-08-20',
    temperature: 18,
    location: 'Estoque B2',
    status: 'low'
  },
  {
    id: '3',
    name: 'Vinho Tinto Cabernet 750ml',
    category: 'vinho',
    brand: 'Casa Perini',
    volume: '750ml',
    currentStock: 80,
    minStock: 50,
    maxStock: 200,
    unitPrice: 28.50,
    batchNumber: 'CPR2024003',
    expirationDate: '2025-06-10',
    temperature: 12,
    location: 'Adega C1',
    status: 'ok'
  },
  {
    id: '4',
    name: 'Coca-Cola 2L',
    category: 'refrigerante',
    brand: 'Coca-Cola',
    volume: '2L',
    currentStock: 300,
    minStock: 200,
    maxStock: 800,
    unitPrice: 6.90,
    batchNumber: 'CCL2024004',
    expirationDate: '2024-11-30',
    temperature: 8,
    location: 'Estoque D1',
    status: 'ok'
  },
  {
    id: '5',
    name: 'Cerveja Heineken 350ml',
    category: 'cerveja',
    brand: 'Heineken',
    volume: '350ml',
    currentStock: 25,
    minStock: 100,
    maxStock: 500,
    unitPrice: 4.20,
    batchNumber: 'HNK2024005',
    expirationDate: '2024-10-05',
    temperature: 2,
    location: 'Geladeira A2',
    status: 'critical'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ok': return 'bg-juga-primary/10 text-juga-primary';
    case 'low': return 'bg-yellow-100 text-yellow-800';
    case 'expired': return 'bg-red-100 text-red-800';
    case 'critical': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'ok': return 'OK';
    case 'low': return 'Estoque Baixo';
    case 'expired': return 'Vencido';
    case 'critical': return 'Crítico';
    default: return 'Desconhecido';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'cerveja': return <ShoppingCart className="h-4 w-4" />;
    case 'destilado': return <DollarSign className="h-4 w-4" />;
    case 'vinho': return <Activity className="h-4 w-4" />;
    case 'refrigerante': return <Package className="h-4 w-4" />;
    default: return <Package className="h-4 w-4" />;
  }
};

export function BeverageInventory() {
  const [products, setProducts] = useState<BeverageProduct[]>(mockBeverageProducts);
  const [filteredProducts, setFilteredProducts] = useState<BeverageProduct[]>(mockBeverageProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'all', label: 'Todas as categorias' },
    { value: 'cerveja', label: 'Cervejas' },
    { value: 'destilado', label: 'Destilados' },
    { value: 'vinho', label: 'Vinhos' },
    { value: 'refrigerante', label: 'Refrigerantes' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'ok', label: 'OK' },
    { value: 'low', label: 'Estoque Baixo' },
    { value: 'critical', label: 'Crítico' },
    { value: 'expired', label: 'Vencido' }
  ];

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const getStockPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  const getTotalValue = () => {
    return products.reduce((total, product) => total + (product.currentStock * product.unitPrice), 0);
  };

  const getLowStockCount = () => {
    return products.filter(product => product.status === 'low' || product.status === 'critical').length;
  };

  const getExpiringSoonCount = () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    return products.filter(product => {
      const expirationDate = new Date(product.expirationDate);
      return expirationDate <= thirtyDaysFromNow && expirationDate > today;
    }).length;
  };

  const getCategoryStats = () => {
    const stats = {
      cerveja: 0,
      destilado: 0,
      vinho: 0,
      refrigerante: 0
    };

    products.forEach(product => {
      stats[product.category]++;
    });

    return stats;
  };

  const exportInventory = (format: 'csv' | 'pdf') => {
    toast.success(`Inventário exportado em formato ${format.toUpperCase()}`);
  };

  const refreshInventory = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Inventário atualizado');
    }, 1000);
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-juga-primary" />
            Estoque de Bebidas
          </h2>
          <p className="text-muted-foreground">Gerencie o inventário de bebidas e controle de validade</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportInventory('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => exportInventory('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button onClick={refreshInventory} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Total de Produtos</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Package className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-juga-primary">{products.length}</div>
              <p className="text-sm text-caption">
                {filteredProducts.length} filtrados
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Valor Total</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-juga-primary">R$ {getTotalValue().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-sm text-caption">
                Em estoque
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Estoque Baixo</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-juga-primary">{getLowStockCount()}</div>
              <p className="text-sm text-caption">
                Produtos críticos
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Vencendo em 30 dias</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-juga-primary">{getExpiringSoonCount()}</div>
              <p className="text-sm text-caption">
                Produtos próximos do vencimento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventário</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Filters */}
          <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                  <Filter className="h-5 w-5 text-juga-primary" />
                  Filtros
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}>
                  Limpar Filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-juga-primary" />
                    <Input
                      id="search"
                      placeholder="Nome, marca, lote..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Categoria</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-juga-text-secondary">Produtos ({filteredProducts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Temperatura</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.brand} - {product.volume}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(product.category)}
                            <span className="capitalize">{product.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{product.currentStock} unidades</div>
                            <Progress 
                              value={getStockPercentage(product.currentStock, product.maxStock)} 
                              className="h-2"
                            />
                            <div className="text-xs text-muted-foreground">
                              Min: {product.minStock} | Max: {product.maxStock}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">R$ {product.unitPrice.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            Total: R$ {(product.currentStock * product.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.batchNumber}</TableCell>
                        <TableCell>
                          <div className="text-sm">{new Date(product.expirationDate).toLocaleDateString('pt-BR')}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Thermometer className="h-3 w-3 text-juga-primary" />
                            <span className="text-sm">{product.temperature}°C</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(product.status)}>
                            {getStatusText(product.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 text-juga-primary" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4 text-juga-primary" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                  <PieChart className="h-5 w-5 text-juga-primary" />
                  Distribuição por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categoryStats).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(category)}
                        <span className="capitalize">{category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{count}</span>
                        <Badge variant="secondary">{Math.round((count / products.length) * 100)}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                  <BarChart3 className="h-5 w-5 text-juga-primary" />
                  Valor por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categoryStats).map(([category, count]) => {
                    const categoryProducts = products.filter(p => p.category === category);
                    const categoryValue = categoryProducts.reduce((total, product) => 
                      total + (product.currentStock * product.unitPrice), 0
                    );
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(category)}
                          <span className="capitalize">{category}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">R$ {categoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                          <div className="text-sm text-muted-foreground">{count} produtos</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                  <AlertTriangle className="h-5 w-5 text-juga-primary" />
                  Estoque Baixo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {products.filter(p => p.status === 'low' || p.status === 'critical').map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.currentStock} / {product.minStock} unidades
                        </div>
                      </div>
                      <Badge className={getStatusColor(product.status)}>
                        {getStatusText(product.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                  <Calendar className="h-5 w-5 text-juga-primary" />
                  Próximos do Vencimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {products.filter(product => {
                    const expirationDate = new Date(product.expirationDate);
                    const thirtyDaysFromNow = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));
                    return expirationDate <= thirtyDaysFromNow && expirationDate > new Date();
                  }).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Vence em: {new Date(product.expirationDate).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Vencendo
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
