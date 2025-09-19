
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, FileSpreadsheet, ChevronDown, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Product, Category } from '@/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { ENABLE_AUTH } from '@/constants/auth';
import { mockProducts } from '@/lib/mock-data';
import { ImportPreviewModal } from '@/components/ui/ImportPreviewModal';
import { getErrorMessage } from '@/lib/error-handler';

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRowsData, setImportRowsData] = useState<any[][]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importData, setImportData] = useState<any[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    category_id: '',
    cost_price: '',
    sale_price: '',
    stock_quantity: '',
    min_stock: '',
    unit: 'UN',
    internal_code: '',
    product_group: '',
    has_variations: false,
    fiscal_note: '',
    unit_conversion: '',
    moves_stock: true,
    width_cm: '',
    height_cm: '',
    length_cm: '',
    weight_kg: '',
  });

  type ProductSettings = {
    unitDefault: string;
    minStockDefault: number;
    lowStockAlert: boolean;
    blockSaleWithoutStock: boolean;
    defaultMarkupPercent: number;
  };

  const defaultSettings: ProductSettings = {
    unitDefault: 'UN',
    minStockDefault: 0,
    lowStockAlert: true,
    blockSaleWithoutStock: false,
    defaultMarkupPercent: 0,
  };

  const [settings, setSettings] = useState<ProductSettings>(defaultSettings);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // carregar configurações do localStorage
    try {
      const raw = localStorage.getItem('products_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch {}
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      if (ENABLE_AUTH) {
        const data = await api.get<Product[]>('/products');
        setProducts(data);
      } else {
        setProducts(mockProducts);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      if (ENABLE_AUTH) {
        toast.error('Erro ao carregar produtos');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      if (ENABLE_AUTH) {
        const data = await api.get<Category[]>('/categories');
        setCategories(data);
      } else {
        // Categorias mockadas
        const mockCategories: Category[] = [
          { id: 1, name: 'Refrigerantes', description: 'Bebidas gaseificadas', color: '#e74c3c', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 2, name: 'Cervejas', description: 'Cervejas nacionais e importadas', color: '#f39c12', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 3, name: 'Águas', description: 'Águas minerais', color: '#3498db', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 4, name: 'Energéticos', description: 'Bebidas energéticas', color: '#9b59b6', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ];
        setCategories(mockCategories);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      if (ENABLE_AUTH) {
        toast.error('Erro ao carregar categorias');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sale_price) {
      toast.error('Nome e preço de venda são obrigatórios');
      return;
    }

    try {
      const productData = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        cost_price: parseFloat(formData.cost_price) || 0,
        sale_price: parseFloat(formData.sale_price),
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        width_cm: formData.width_cm ? parseFloat(formData.width_cm) : null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        length_cm: formData.length_cm ? parseFloat(formData.length_cm) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
      };

      if (editingProduct) {
        await api.put(`/products?id=${editingProduct.id}`, productData);
        toast.success('Produto atualizado com sucesso');
      } else {
        await api.post('/products', productData);
        toast.success('Produto criado com sucesso');
      }

      setShowDialog(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      barcode: product.barcode || '',
      description: product.description || '',
      category_id: product.category_id?.toString() || '',
      cost_price: product.cost_price.toString(),
      sale_price: product.sale_price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      min_stock: product.min_stock.toString(),
      unit: product.unit,
      internal_code: product.internal_code || '',
      product_group: product.product_group || '',
      has_variations: product.has_variations || false,
      fiscal_note: product.fiscal_note || '',
      unit_conversion: product.unit_conversion || '',
      moves_stock: product.moves_stock !== false,
      width_cm: product.width_cm?.toString() || '',
      height_cm: product.height_cm?.toString() || '',
      length_cm: product.length_cm?.toString() || '',
      weight_kg: product.weight_kg?.toString() || '',
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      await api.delete(`/products?id=${id}`);
      toast.success('Produto excluído com sucesso');
      fetchProducts();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      description: '',
      category_id: '',
      cost_price: '',
      sale_price: '',
      stock_quantity: '',
      min_stock: settings.minStockDefault ? String(settings.minStockDefault) : '',
      unit: settings.unitDefault || 'UN',
      internal_code: '',
      product_group: '',
      has_variations: false,
      fiscal_note: '',
      unit_conversion: '',
      moves_stock: true,
      width_cm: '',
      height_cm: '',
      length_cm: '',
      weight_kg: '',
    });
  };

  const exportCSV = () => {
    try {
      const rows = [
        ['ID', 'Nome', 'Valor', 'Estoque'],
        ...filteredProducts.map((p) => [
          p.id,
          p.name || '',
          p.sale_price ?? 0,
          `${p.stock_quantity} ${p.unit}`,
        ]),
      ];
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `produtos_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('CSV exportado com sucesso');
    } catch (e) {
      console.error('Erro ao exportar CSV:', e);
      toast.error('Erro ao exportar CSV');
    }
  };

  const exportXLSX = async () => {
    try {
      // @ts-ignore dependência opcional
      const XLSX = await import('xlsx');
      const rows = [
        ['ID', 'Nome', 'Valor', 'Estoque'],
        ...filteredProducts.map((p) => [
          p.id,
          p.name || '',
          p.sale_price ?? 0,
          `${p.stock_quantity} ${p.unit}`,
        ]),
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
      XLSX.writeFile(wb, `produtos_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success('XLSX exportado com sucesso');
    } catch (e) {
      console.error('Erro ao exportar XLSX:', e);
      toast.error('Erro ao exportar XLSX');
    }
  };

  const onClickImport = () => {
    fileInputRef.current?.click();
  };

  const handleImportConfirm = async () => {
    setShowImportPreview(false);
    await importRows(importRowsData);
  };

  const handleImportCancel = () => {
    setShowImportPreview(false);
    setImportData([]);
    setImportHeaders([]);
    setImportRowsData([]);
    setImportErrors([]);
  };

  const handleSaveImportData = () => {
    console.log('💾 Salvando dados de importação de produtos no localStorage...');
    try {
      const importDataToSave = {
        fileName: importFileName,
        headers: importHeaders,
        data: importRowsData,
        totalRows: importRowsData.length,
        validRows: importRowsData.length - importErrors.length,
        invalidRows: importErrors.length,
        errors: importErrors,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('produtos_import_data', JSON.stringify(importDataToSave));
      toast.success('Dados de importação de produtos salvos no localStorage!');
      console.log('✅ Dados salvos:', importDataToSave);
    } catch (error) {
      console.error('❌ Erro ao salvar no localStorage:', error);
      toast.error('Erro ao salvar dados no localStorage');
    }
  };

  const handleExtractData = async () => {
    try {
      setIsExtracting(true);
      
      // Processar e salvar os dados extraídos diretamente no sistema
      let successCount = 0;
      let errorCount = 0;
      
      for (const row of importData) {
        try {
          const productData = {
            name: row['nome'] || row['name'] || '',
            sku: row['sku'] || row['código'] || '',
            barcode: row['barcode'] || row['código de barras'] || '',
            description: row['descrição'] || row['description'] || '',
            category_id: row['categoria'] || row['category'] || null,
            cost_price: parseFloat(String(row['preço de custo'] || row['cost_price'] || '0').replace(',', '.')) || 0,
            sale_price: parseFloat(String(row['preço de venda'] || row['sale_price'] || '0').replace(',', '.')) || 0,
            stock_quantity: parseInt(String(row['estoque'] || row['stock'] || '0')) || 0,
            min_stock: parseInt(String(row['estoque mínimo'] || row['min_stock'] || '0')) || 0,
            unit: row['unidade'] || row['unit'] || 'UN',
            is_active: (String(row['ativo'] || row['active'] || 'Sim')).toLowerCase() === 'sim',
            internal_code: row['código interno'] || row['internal_code'] || '',
            product_group: row['grupo'] || row['group'] || '',
            has_variations: (String(row['variações'] || row['variations'] || 'Não')).toLowerCase() === 'sim',
            fiscal_note: row['ncm'] || row['fiscal_note'] || '',
            unit_conversion: row['conversão'] || row['conversion'] || '',
            moves_stock: (String(row['movimenta estoque'] || row['moves_stock'] || 'Sim')).toLowerCase() === 'sim',
            width_cm: parseFloat(String(row['largura'] || row['width'] || '0')) || null,
            height_cm: parseFloat(String(row['altura'] || row['height'] || '0')) || null,
            length_cm: parseFloat(String(row['comprimento'] || row['length'] || '0')) || null,
            weight_kg: parseFloat(String(row['peso'] || row['weight'] || '0')) || null
          };

          if (productData.name.trim()) {
            await api.post('/products', productData);
            successCount++;
          }
        } catch (error) {
          console.error('Erro ao extrair produto:', error);
          errorCount++;
        }
      }
      
      // Atualizar a lista de produtos
      await fetchProducts();
      
      toast.success(`${successCount} produtos extraídos com sucesso!${errorCount > 0 ? ` (${errorCount} erros)` : ''}`);
      
    } catch (error) {
      console.error('Erro ao extrair dados:', getErrorMessage(error));
      toast.error('Erro ao extrair dados');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConsumeData = async () => {
    try {
      setIsConsuming(true);
      
      // Consumir dados de uma sessão anterior (simular dados em memória)
      const mockConsumeData = [
        {
          name: 'Produto Consumido 1',
          sku: 'PC001',
          barcode: '7891234567890',
          description: 'Produto de exemplo consumido 1',
          cost_price: 10.50,
          sale_price: 15.00,
          stock_quantity: 100,
          min_stock: 10,
          unit: 'UN',
          is_active: true
        },
        {
          name: 'Produto Consumido 2',
          sku: 'PC002',
          barcode: '7891234567891',
          description: 'Produto de exemplo consumido 2',
          cost_price: 25.00,
          sale_price: 35.00,
          stock_quantity: 50,
          min_stock: 5,
          unit: 'UN',
          is_active: true
        }
      ];
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const productData of mockConsumeData) {
        try {
          await api.post('/products', productData);
          successCount++;
        } catch (error) {
          console.error('Erro ao consumir produto:', error);
          errorCount++;
        }
      }
      
      // Atualizar a lista de produtos
      await fetchProducts();
      
      toast.success(`${successCount} produtos consumidos com sucesso!${errorCount > 0 ? ` (${errorCount} erros)` : ''}`);
      
    } catch (error) {
      console.error('Erro ao consumir dados:', getErrorMessage(error));
      toast.error('Erro ao consumir dados');
    } finally {
      setIsConsuming(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let rows: any[][] = [];
      let headers: string[] = [];

      if (ext === 'xlsx' || ext === 'xls') {
        // @ts-ignore dependência opcional
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data);
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (rows.length < 2) {
          toast.error('Planilha deve conter cabeçalho e pelo menos uma linha');
          return;
        }
        headers = rows[0].map((h: any) => String(h || '').trim());
      } else if (ext === 'csv') {
        rows = parseCSV(await file.text());
        if (rows.length < 2) {
          toast.error('Arquivo CSV deve conter cabeçalho e pelo menos uma linha');
          return;
        }
        headers = rows[0];
      } else {
        toast.error('Formato não suportado. Use CSV ou XLSX.');
        return;
      }

      // Preparar dados para o modal de preview
      const dataRows = rows.slice(1).map(r => {
        const obj: any = {};
        headers.forEach((h: string, idx: number) => { 
          obj[h] = (r[idx] ?? '').toString().trim(); 
        });
        return obj;
      });

      // Validar dados e contar erros
      const errors: string[] = [];
      let validCount = 0;
      let invalidCount = 0;

      dataRows.forEach((row, index) => {
        if (!row['Nome'] && !row['nome']) {
          errors.push(`Linha ${index + 2}: Nome é obrigatório`);
          invalidCount++;
        } else {
          validCount++;
        }
      });

      // Configurar estado para o modal de preview
      setImportFileName(file.name);
      setImportHeaders(headers);
      setImportRowsData(rows.slice(1));
      setImportData(dataRows);
      setImportErrors(errors);
      setShowImportPreview(true);

      toast.success(`${rows.length - 1} registros carregados com sucesso!`);
    } catch (err) {
      console.error('Erro ao importar arquivo:', err);
      toast.error('Erro ao importar arquivo');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    const first = lines[0];
    const delimiter = (first.split(';').length - 1) > (first.split(',').length - 1) ? ';' : ',';
    return lines.map(line => {
      const result: string[] = [];
      let cur = '';
      let quoted = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (quoted && line[i + 1] === '"') { cur += '"'; i++; }
          else { quoted = !quoted; }
        } else if (ch === delimiter && !quoted) {
          result.push(cur); cur = '';
        } else {
          cur += ch;
        }
      }
      result.push(cur);
      return result.map(v => v.trim());
    });
  };

  const normalizeNumber = (raw: any): number => {
    if (raw === null || raw === undefined) return 0;
    let s = String(raw).trim();
    if (s === '') return 0;
    if (s.includes(',')) {
      s = s.replace(/\./g, '').replace(/,/g, '.');
    }
    s = s.replace(/[^0-9.+-]/g, '');
    const n = Number(s);
    return isNaN(n) ? 0 : n;
  };

  const importRows = async (rows: any[][]) => {
    if (!rows.length) return;
    const header = rows[0].map((h: any) => String(h || '').toLowerCase());
    const idxNome = header.findIndex((h: string) => ['nome','name','produto','product'].includes(h));
    const idxValor = header.findIndex((h: string) => ['valor','preco','preço','sale_price','preco_venda','preço_venda','valor_unit','valor unit','vr. unit.'].includes(h));
    const idxEstoque = header.findIndex((h: string) => ['estoque','quantidade','qtd','stock','stock_quantity','qtd.','qtd'].includes(h));
    const idxSku = header.findIndex((h: string) => ['sku','codigo','código'].includes(h));

    if (idxNome === -1) {
      toast.error('Cabeçalho "nome" não encontrado');
      return;
    }

    let imported = 0;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0) continue;
      const name = (r[idxNome] || '').toString().trim();
      if (!name) continue;
      const sale_price = idxValor !== -1 ? normalizeNumber(r[idxValor]) : 0;
      const stock_quantity = idxEstoque !== -1 ? Math.round(normalizeNumber(r[idxEstoque])) : 0;
      const sku = idxSku !== -1 ? (r[idxSku] || '').toString().trim() : '';

      try {
        await api.post('/products', {
          name,
          sku,
          sale_price,
          stock_quantity,
          unit: settings.unitDefault || 'UN',
          min_stock: settings.minStockDefault || 0,
          cost_price: 0,
        });
        imported++;
      } catch (err) {
        console.error('Falha ao importar linha', i + 1, err);
      }
    }

    toast.success(`Importação concluída: ${imported} produto(s).`);
    fetchProducts();
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getCategoryName = (categoryId?: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sem categoria';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Modal Gerenciar Produtos */}
      <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Produtos</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, SKU ou código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <input ref={fileInputRef} onChange={handleImportFile} type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" />
              <Button size="sm" variant="outline" onClick={onClickImport}>Importar</Button>
              <Button size="sm" variant="outline" onClick={exportCSV}>Exportar CSV</Button>
              <Button size="sm" onClick={exportXLSX}>Exportar XLSX</Button>
              <Button onClick={() => { resetForm(); setEditingProduct(null); setShowDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="flex items-center justify-center py-6">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.id}</TableCell>
                        <TableCell className="max-w-[280px] truncate">{product.name}</TableCell>
                        <TableCell>{formatCurrency(product.sale_price)}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            product.stock_quantity <= product.min_stock ? 'text-red-600' : ''
                          }`}>
                            {product.stock_quantity} {product.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {!loading && filteredProducts.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">Nenhum produto encontrado.</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Configurações de Produtos */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurações de Produtos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidade padrão</Label>
                <Select
                  value={settings.unitDefault}
                  onValueChange={(value) => setSettings((prev) => ({ ...prev, unitDefault: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UN">Unidade</SelectItem>
                    <SelectItem value="KG">Quilograma</SelectItem>
                    <SelectItem value="L">Litro</SelectItem>
                    <SelectItem value="ML">Mililitro</SelectItem>
                    <SelectItem value="CX">Caixa</SelectItem>
                    <SelectItem value="PC">Peça</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estoque mínimo padrão</Label>
                <Input
                  type="number"
                  value={settings.minStockDefault}
                  onChange={(e) => setSettings((prev) => ({ ...prev, minStockDefault: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between gap-4 p-3 border rounded-md">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Alerta de baixo estoque</div>
                  <div className="text-xs text-muted-foreground">Destacar quando estoque ≤ mínimo</div>
                </div>
                <Switch
                  checked={settings.lowStockAlert}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, lowStockAlert: checked }))}
                />
              </div>
              <div className="flex items-center justify-between gap-4 p-3 border rounded-md">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Bloquear venda sem estoque</div>
                  <div className="text-xs text-muted-foreground">Impede finalizar com estoque negativo</div>
                </div>
                <Switch
                  checked={settings.blockSaleWithoutStock}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, blockSaleWithoutStock: checked }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Markup padrão (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.defaultMarkupPercent}
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultMarkupPercent: Number(e.target.value) || 0 }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSettings(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  try {
                    localStorage.setItem('products_settings', JSON.stringify(settings));
                    toast.success('Configurações salvas');
                    setShowSettings(false);
                  } catch {
                    toast.error('Falha ao salvar configurações');
                  }
                }}
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie o catálogo de produtos da sua loja
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Gerenciar Produtos
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer" onClick={() => setShowManageModal(true)}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Abrir Planilha
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingProduct(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="dados">
                <TabsList>
                  <TabsTrigger value="dados">Dados</TabsTrigger>
                  <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                  <TabsTrigger value="valores">Valores</TabsTrigger>
                  <TabsTrigger value="estoque">Estoque/Variações</TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                      <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                      <Label htmlFor="category">Grupo/Categoria</Label>
                      <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                    <SelectTrigger>
                          <SelectValue placeholder="Selecione um grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                      <Label htmlFor="sku">Código Interno (SKU)</Label>
                      <Input id="sku" value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Código de Barras</Label>
                      <Input id="barcode" value={formData.barcode} onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade</Label>
                      <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UN">Unidade</SelectItem>
                      <SelectItem value="KG">Quilograma</SelectItem>
                      <SelectItem value="L">Litro</SelectItem>
                      <SelectItem value="ML">Mililitro</SelectItem>
                      <SelectItem value="CX">Caixa</SelectItem>
                      <SelectItem value="PC">Peça</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="product_group">Grupo do Produto</Label>
                      <Input id="product_group" value={formData.product_group} onChange={(e) => setFormData(prev => ({ ...prev, product_group: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fiscal_note">Nota Fiscal (NCM/CFOP)</Label>
                      <Input id="fiscal_note" value={formData.fiscal_note} onChange={(e) => setFormData(prev => ({ ...prev, fiscal_note: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit_conversion">Conversão de Unidade</Label>
                      <Input id="unit_conversion" placeholder="Ex.: 1 CX = 12 UN" value={formData.unit_conversion} onChange={(e) => setFormData(prev => ({ ...prev, unit_conversion: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={formData.has_variations} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_variations: checked }))} />
                      <Label>Possui variações</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={formData.moves_stock} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, moves_stock: checked }))} />
                      <Label>Movimenta estoque</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="internal_code">Código Interno</Label>
                      <Input id="internal_code" value={formData.internal_code} onChange={(e) => setFormData(prev => ({ ...prev, internal_code: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={3} />
                  </div>
                </TabsContent>

                <TabsContent value="detalhes" className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="width_cm">Largura (cm)</Label>
                      <Input id="width_cm" type="number" step="0.01" value={formData.width_cm} onChange={(e) => setFormData(prev => ({ ...prev, width_cm: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height_cm">Altura (cm)</Label>
                      <Input id="height_cm" type="number" step="0.01" value={formData.height_cm} onChange={(e) => setFormData(prev => ({ ...prev, height_cm: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="length_cm">Comprimento (cm)</Label>
                      <Input id="length_cm" type="number" step="0.01" value={formData.length_cm} onChange={(e) => setFormData(prev => ({ ...prev, length_cm: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight_kg">Peso (kg)</Label>
                      <Input id="weight_kg" type="number" step="0.001" value={formData.weight_kg} onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição detalhada</Label>
                    <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={6} />
              </div>
                </TabsContent>

                <TabsContent value="valores" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Preço de Custo</Label>
                      <Input id="cost_price" type="number" step="0.01" value={formData.cost_price} onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale_price">Preço de Venda *</Label>
                      <Input id="sale_price" type="number" step="0.01" value={formData.sale_price} onChange={(e) => setFormData(prev => ({ ...prev, sale_price: e.target.value }))} required />
                </div>
              </div>
                </TabsContent>

                <TabsContent value="estoque" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Quantidade em Estoque</Label>
                      <Input id="stock_quantity" type="number" value={formData.stock_quantity} onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stock">Estoque Mínimo</Label>
                      <Input id="min_stock" type="number" value={formData.min_stock} onChange={(e) => setFormData(prev => ({ ...prev, min_stock: e.target.value }))} />
                </div>
              </div>
                  {formData.has_variations && (
                    <div className="text-sm text-muted-foreground">Configuração de variações pode ser adicionada aqui (atributos, combinações, preços e estoque por variação).</div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
                <Button type="submit">{editingProduct ? 'Atualizar' : 'Criar'} Produto</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, SKU ou código de barras..."
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
          <CardTitle>Lista de Produtos ({filteredProducts.length})</CardTitle>
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
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preços</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
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
                            {product.sku && product.barcode && ' • '}
                            {product.barcode && `Código: ${product.barcode}`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryName(product.category_id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Custo:</span> {formatCurrency(product.cost_price)}
                        </div>
                        <div className="font-medium">
                          <span className="text-muted-foreground">Venda:</span> {formatCurrency(product.sale_price)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          product.stock_quantity <= product.min_stock ? 'text-red-600' : ''
                        }`}>
                          {product.stock_quantity} {product.unit}
                        </span>
                        {product.stock_quantity <= product.min_stock && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mín: {product.min_stock} {product.unit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum produto encontrado com os filtros aplicados.' : 'Nenhum produto cadastrado.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Preview da Importação */}
      <ImportPreviewModal
        isOpen={showImportPreview}
        onClose={handleImportCancel}
        onConfirm={handleImportConfirm}
        onSave={handleSaveImportData}
        onExtract={handleExtractData}
        onConsume={handleConsumeData}
        fileName={importFileName}
        headers={importHeaders}
        data={importRowsData}
        totalRows={importRowsData.length}
        validRows={importRowsData.length - importErrors.length}
        invalidRows={importErrors.length}
        errors={importErrors}
        isExtracting={isExtracting}
        isConsuming={isConsuming}
      />
    </div>
  );
}
