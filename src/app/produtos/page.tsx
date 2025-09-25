'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  MoreHorizontal, 
  Search, 
  Settings2, 
  Upload, 
  Download, 
  Filter,
  Package,
  Trash2,
  Edit,
  Eye,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { ImportPreviewModal } from '@/components/ui/ImportPreviewModal';

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  barcode?: string;
  ncm?: string;
  unit: string;
  status: 'active' | 'inactive';
  created_at: string;
  imported_at?: string;
}

interface ColumnVisibility {
  sku: boolean;
  category: boolean;
  brand: boolean;
  cost_price: boolean;
  sale_price: boolean;
  stock_quantity: boolean;
  barcode: boolean;
  ncm: boolean;
  unit: boolean;
  status: boolean;
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    sku: true,
    category: true,
    brand: true,
    cost_price: true,
    sale_price: true,
    stock_quantity: true,
    barcode: false,
    ncm: false,
    unit: true,
    status: true,
  });

  // Filtros avançados
  const [advancedFilters, setAdvancedFilters] = useState({
    category: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    status: ''
  });

  // Estados para formulário
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    brand: '',
    cost_price: '',
    sale_price: '',
    stock_quantity: '0',
    barcode: '',
    ncm: '',
    unit: 'UN',
  });

  // Estados para preview de importação
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);

  // Carregar produtos
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/next_api/products');
      if (!response.ok) throw new Error('Erro ao carregar produtos');
      
      const data = await response.json();
      setProducts(data.rows || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAdvanced = (!advancedFilters.category || product.category?.toLowerCase().includes(advancedFilters.category.toLowerCase())) &&
                           (!advancedFilters.brand || product.brand?.toLowerCase().includes(advancedFilters.brand.toLowerCase())) &&
                           (!advancedFilters.minPrice || product.sale_price >= parseFloat(advancedFilters.minPrice)) &&
                           (!advancedFilters.maxPrice || product.sale_price <= parseFloat(advancedFilters.maxPrice)) &&
                           (!advancedFilters.status || product.status === advancedFilters.status);

    return matchesSearch && matchesAdvanced;
  });

  // Adicionar produto
  const handleAddProduct = async () => {
    try {
      const productData = {
        ...newProduct,
        cost_price: parseFloat(newProduct.cost_price) || 0,
        sale_price: parseFloat(newProduct.sale_price) || 0,
        stock_quantity: parseInt(newProduct.stock_quantity) || 0,
      };

      const response = await fetch('/next_api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (!response.ok) throw new Error('Erro ao adicionar produto');

      await loadProducts();
      setShowAddDialog(false);
      setNewProduct({
        sku: '',
        name: '',
        description: '',
        category: '',
        brand: '',
        cost_price: '',
        sale_price: '',
        stock_quantity: '0',
        barcode: '',
        ncm: '',
        unit: 'UN',
      });
      toast.success('Produto adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast.error('Erro ao adicionar produto');
    }
  };

  // Handle import
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);

      const ext = file.name.split('.').pop()?.toLowerCase();
      let headers: string[] = [];
      let rows: any[] = [];

      if (ext === 'xlsx' || ext === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];
        if (json.length < 2) {
          toast.error('Planilha precisa de cabeçalho e ao menos uma linha');
          setImporting(false);
          return;
        }
        headers = (json[0] as any[]).map(h => String(h || '').trim());
        rows = json.slice(1);
      } else if (ext === 'csv') {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
          toast.error('CSV inválido');
          setImporting(false);
          return;
        }
        const delimiter = (lines[0].split(';').length - 1) > (lines[0].split(',').length - 1) ? ';' : ',';
        headers = lines[0].split(delimiter).map(h => h.replace(/"/g, '').trim());
        rows = lines.slice(1).map(line => {
          const values: string[] = [];
          let cur = '';
          let quoted = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
              if (quoted && line[i + 1] === '"') {
                cur += '"';
                i++;
              } else {
                quoted = !quoted;
              }
            } else if (ch === delimiter && !quoted) {
              values.push(cur);
              cur = '';
            } else {
              cur += ch;
            }
          }
          values.push(cur);
          return values;
        });
      } else {
        toast.error('Envie um arquivo .xlsx, .xls ou .csv');
        setImporting(false);
        return;
      }

      setImportFileName(file.name);
      setImportHeaders(headers);
      setImportRows(rows);
      setImportErrors([]);
      setShowImportPreview(true);
      setShowImportDialog(false);
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      toast.error('Erro ao importar arquivo');
    } finally {
      setImporting(false);
    }
  };

  const normalizeHeader = (raw: string): string => {
    return String(raw || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s\/]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleRegisterSelected = async (selected: any[]) => {
    try {
      setIsRegistering(true);
      let success = 0;
      let fail = 0;
      const errors: string[] = [];

      for (const row of selected) {
        const obj: Record<string, any> = Array.isArray(row)
          ? (() => {
              const keys = importHeaders.map(normalizeHeader);
              const out: Record<string, any> = {};
              keys.forEach((key, index) => {
                out[key] = row[index];
              });
              return out;
            })()
          : (() => {
              const out: Record<string, any> = {};
              Object.entries(row as Record<string, any>).forEach(([key, value]) => {
                out[normalizeHeader(key)] = value;
              });
              return out;
            })();

        const productData = {
          sku: (obj['codigo'] || obj['sku'] || '').toString().trim(),
          name: (obj['nome'] || obj['produto'] || '').toString().trim(),
          description: (obj['descricao'] || obj['descrição'] || '').toString().trim() || null,
          category: (obj['categoria'] || '').toString().trim() || null,
          brand: (obj['marca'] || '').toString().trim() || null,
          cost_price: parseFloat((obj['valor de custo'] || obj['custo'] || obj['preco de custo'] || '0').toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          sale_price: parseFloat((obj['valor de venda'] || obj['preco'] || obj['preco de venda'] || '0').toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          stock_quantity: parseInt((obj['quantidade'] || obj['estoque'] || '0').toString(), 10) || 0,
          barcode: (obj['codigo de barras'] || obj['barcode'] || '').toString().trim() || null,
          ncm: (obj['ncm'] || '').toString().trim() || null,
          unit: (obj['unidade'] || obj['und'] || 'UN').toString().trim().toUpperCase() || 'UN',
          imported_at: new Date().toISOString(),
        };

        if (!productData.sku || !productData.name) {
          fail++;
          errors.push('Produto com código ou nome vazio, pulado.');
          continue;
        }

        const response = await fetch('/next_api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });

        if (response.ok) {
          success++;
        } else {
          fail++;
          const text = await response.text();
          console.error('Erro ao cadastrar produto:', text);
          errors.push(text);
        }
      }

      if (success > 0) toast.success(`${success} produtos cadastrados`);
      if (fail > 0) toast.error(`${fail} produtos não cadastrados`);
      await loadProducts();
      setShowImportPreview(false);
      setImportErrors(errors);
    } catch (error) {
      console.error('Erro ao cadastrar produtos:', error);
      toast.error('Erro ao cadastrar produtos');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleImportConfirm = async () => {
    await handleRegisterSelected(importRows);
  };

  const handleImportCancel = () => {
    setShowImportPreview(false);
    setImportRows([]);
    setImportHeaders([]);
    setImportErrors([]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Sem estoque', variant: 'destructive' as const };
    if (quantity <= 10) return { label: 'Estoque baixo', variant: 'outline' as const };
    return { label: 'Em estoque', variant: 'default' as const };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-white">
        <CardContent className="pt-6 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-blue-900">Produtos</h1>
              <p className="text-sm text-blue-900/70">
                Gerencie seu catálogo de produtos e controle de estoque
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="px-3 py-1 bg-blue-600 text-white">
                <Package className="h-3 w-3 mr-1" />
                {products.length} produtos
              </Badge>
              <Badge variant="outline" className="px-3 py-1 border-blue-200">
                <BarChart3 className="h-3 w-3 mr-1" />
                {products.filter(p => p.stock_quantity <= 10).length} estoque baixo
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <Card className="border-blue-100">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Lado esquerdo - Botões de ação */}
            <div className="flex items-center gap-2">
              <Button 
                className="juga-gradient text-white"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-blue-200 hover:bg-blue-50">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Mais Ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowImportDialog(true)} className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Produtos
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Lista
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Selecionados
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-blue-200 hover:bg-blue-50">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Colunas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Mostrar Colunas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(columnVisibility).map(([key, value]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={value}
                      onCheckedChange={(checked) => 
                        setColumnVisibility(prev => ({ ...prev, [key]: checked || false }))
                      }
                    >
                      {key === 'sku' ? 'SKU' : 
                       key === 'cost_price' ? 'Preço Custo' :
                       key === 'sale_price' ? 'Preço Venda' :
                       key === 'stock_quantity' ? 'Estoque' :
                       key === 'barcode' ? 'Código de Barras' :
                       key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Lado direito - Busca */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Busca Avançada
              </Button>
            </div>
          </div>

          {/* Busca Avançada */}
          {showAdvancedSearch && (
            <div className="mt-4 p-4 bg-blue-50/40 rounded-lg border border-blue-100">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Input
                  placeholder="Categoria..."
                  value={advancedFilters.category}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, category: e.target.value }))}
                />
                <Input
                  placeholder="Marca..."
                  value={advancedFilters.brand}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, brand: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Preço mín..."
                  value={advancedFilters.minPrice}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Preço máx..."
                  value={advancedFilters.maxPrice}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                />
                <select 
                  className="px-3 py-2 border rounded-md"
                  value={advancedFilters.status}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">Todos os status</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lista de Produtos ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando produtos...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  {columnVisibility.sku && <TableHead>SKU</TableHead>}
                  {columnVisibility.category && <TableHead>Categoria</TableHead>}
                  {columnVisibility.brand && <TableHead>Marca</TableHead>}
                  {columnVisibility.cost_price && <TableHead>Preço Custo</TableHead>}
                  {columnVisibility.sale_price && <TableHead>Preço Venda</TableHead>}
                  {columnVisibility.stock_quantity && <TableHead>Estoque</TableHead>}
                  {columnVisibility.unit && <TableHead>Unidade</TableHead>}
                  {columnVisibility.barcode && <TableHead>Código Barras</TableHead>}
                  {columnVisibility.ncm && <TableHead>NCM</TableHead>}
                  {columnVisibility.status && <TableHead>Status</TableHead>}
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock_quantity);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground">{product.description}</div>
                          )}
                        </div>
                      </TableCell>
                      {columnVisibility.sku && <TableCell className="font-mono text-sm">{product.sku}</TableCell>}
                      {columnVisibility.category && <TableCell>{product.category || '-'}</TableCell>}
                      {columnVisibility.brand && <TableCell>{product.brand || '-'}</TableCell>}
                      {columnVisibility.cost_price && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-gray-400" />
                            {formatCurrency(product.cost_price)}
                          </div>
                        </TableCell>
                      )}
                      {columnVisibility.sale_price && (
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-green-600" />
                            {formatCurrency(product.sale_price)}
                          </div>
                        </TableCell>
                      )}
                      {columnVisibility.stock_quantity && (
                        <TableCell>
                          <Badge variant={stockStatus.variant}>
                            {product.stock_quantity} {product.unit}
                          </Badge>
                        </TableCell>
                      )}
                      {columnVisibility.unit && <TableCell>{product.unit}</TableCell>}
                      {columnVisibility.barcode && <TableCell className="font-mono text-sm">{product.barcode || '-'}</TableCell>}
                      {columnVisibility.ncm && <TableCell className="font-mono text-sm">{product.ncm || '-'}</TableCell>}
                      {columnVisibility.status && (
                        <TableCell>
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum produto encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Adicionar Produto */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha as informações do produto abaixo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="sku">SKU *</label>
                <Input
                  id="sku"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Código do produto"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="name">Nome *</label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do produto"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="description">Descrição</label>
              <Input
                id="description"
                value={newProduct.description}
                onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do produto"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="category">Categoria</label>
                <Input
                  id="category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Categoria"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="brand">Marca</label>
                <Input
                  id="brand"
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="Marca"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <label htmlFor="cost_price">Preço de Custo</label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  value={newProduct.cost_price}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, cost_price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="sale_price">Preço de Venda</label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  value={newProduct.sale_price}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, sale_price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="stock_quantity">Estoque</label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={newProduct.stock_quantity}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, stock_quantity: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <label htmlFor="unit">Unidade</label>
                <select 
                  id="unit"
                  className="px-3 py-2 border rounded-md"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}
                >
                  <option value="UN">UN - Unidade</option>
                  <option value="CX">CX - Caixa</option>
                  <option value="KG">KG - Quilograma</option>
                  <option value="L">L - Litro</option>
                  <option value="M">M - Metro</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="barcode">Código de Barras</label>
                <Input
                  id="barcode"
                  value={newProduct.barcode}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, barcode: e.target.value }))}
                  placeholder="7891234567890"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="ncm">NCM</label>
                <Input
                  id="ncm"
                  value={newProduct.ncm}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, ncm: e.target.value }))}
                  placeholder="12345678"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddProduct} className="bg-emerald-600 hover:bg-emerald-700">
              Adicionar Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Importar */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Produtos</DialogTitle>
            <DialogDescription>
              Selecione um arquivo CSV ou Excel com os dados dos produtos
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="file">Arquivo</label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={importing}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>O arquivo deve conter as colunas:</p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li><strong>Código</strong> ou <strong>SKU</strong> (obrigatório)</li>
                <li><strong>Nome</strong> ou <strong>Produto</strong> (obrigatório)</li>
                <li><strong>Descrição</strong> ou <strong>Descricao</strong></li>
                <li><strong>Categoria</strong></li>
                <li><strong>Marca</strong></li>
                <li><strong>Valor de custo</strong> ou <strong>Custo</strong></li>
                <li><strong>Valor de venda</strong> ou <strong>Preço</strong></li>
                <li><strong>Quantidade</strong> ou <strong>Estoque</strong></li>
                <li><strong>Código de barras</strong> ou <strong>Barcode</strong></li>
                <li><strong>NCM</strong></li>
                <li><strong>Unidade</strong></li>
              </ul>
            </div>
            {importing && (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">Importando produtos...</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)} disabled={importing}>
              Cancelar
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700" 
              disabled={importing}
              onClick={() => {
                const input = document.getElementById('file') as HTMLInputElement;
                if (input?.files?.[0]) {
                  handleFileUpload({ target: input } as any);
                } else {
                  toast.error('Selecione um arquivo para importar');
                }
              }}
            >
              {importing ? 'Importando...' : 'Importar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportPreviewModal
        isOpen={showImportPreview}
        onClose={handleImportCancel}
        onConfirm={handleImportConfirm}
        onRegister={handleRegisterSelected}
        fileName={importFileName}
        headers={importHeaders}
        data={importRows}
        totalRows={importRows.length}
        validRows={importRows.length}
        invalidRows={importErrors.length}
        errors={importErrors}
        isRegistering={isRegistering}
      />
    </div>
  );
}