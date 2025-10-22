'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { JugaKPICard, JugaProgressCard } from '@/components/dashboard/JugaComponents';
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
  Trash2 as Trash,
  BarChart3,
  PackagePlus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  Warehouse,
  Hash,
  Tag,
  Building2,
  CreditCard,
  TrendingUp as TrendingUpIcon,
  Package2,
  Barcode,
  FileText,
  Ruler,
  Activity,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { ImportPreviewModal } from '@/components/ui/ImportPreviewModal';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';
import { Label } from '@/components/ui/label';

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
  const { tenant, user, refreshTenant } = useSimpleAuth();
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isCheckingSku, setIsCheckingSku] = useState(false);
  const [skuValidationTimeout, setSkuValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Função para limpar erro de um campo específico
  const clearFieldError = (fieldName: string) => {
    if (formErrors[fieldName]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Função para validar SKU em tempo real com debounce
  const validateSkuRealTime = (sku: string) => {
    // Limpar timeout anterior se existir
    if (skuValidationTimeout) {
      clearTimeout(skuValidationTimeout);
    }

    // Limpar erro atual do SKU
    clearFieldError('sku');

    // Se SKU está vazio, não validar
    if (!sku.trim()) {
      return;
    }

    // Se não há tenant válido, não validar
    if (!tenant?.id || tenant.id === '00000000-0000-0000-0000-000000000000') {
      console.log('⚠️ Tenant não configurado, não validando SKU em tempo real');
      return;
    }

    // Criar novo timeout para validar após 500ms de inatividade
    const timeout = setTimeout(async () => {
      console.log(`🔍 Validação em tempo real do SKU "${sku.trim()}"`);
      const skuExists = await checkSkuExists(sku.trim(), false); // Não mostrar loading
      
      if (skuExists) {
        setFormErrors(prev => ({
          ...prev,
          sku: 'Este código SKU já está cadastrado nesta conta. Escolha outro código.'
        }));
        console.log(`❌ SKU "${sku.trim()}" já existe - aviso mostrado`);
      } else {
        console.log(`✅ SKU "${sku.trim()}" disponível`);
      }
    }, 500); // 500ms de delay

    setSkuValidationTimeout(timeout);
  };

  // Cleanup do timeout quando componente desmonta
  useEffect(() => {
    return () => {
      if (skuValidationTimeout) {
        clearTimeout(skuValidationTimeout);
      }
    };
  }, [skuValidationTimeout]);

  // Carregar produtos quando houver tenant
  useEffect(() => {
    console.log(`🔄 useEffect carregar produtos - tenant atual:`, tenant?.id);
    
    const loadWithRetry = async () => {
      // Aguardar tenant estar disponível (máximo 2 segundos)
      let attempts = 0;
      while (!tenant?.id && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!tenant?.id) {
        console.log(`⚠️ Nenhum tenant disponível após 2 segundos, limpando produtos`);
        setLoading(false);
        setProducts([]);
        return;
      }
      
      console.log(`📦 Carregando produtos para tenant: ${tenant.id}`);
      loadProducts();
    };
    
    loadWithRetry();
  }, [tenant?.id]);

  const loadProducts = async (overrideTenantId?: string) => {
    try {
      setLoading(true);
      const currentTenantId = overrideTenantId || tenant?.id;
      const url = currentTenantId
        ? `/next_api/products?tenant_id=${encodeURIComponent(currentTenantId)}`
        : `/next_api/products`;
      
      console.log(`🔄 Carregando produtos para tenant: ${currentTenantId}`);
      console.log(`📡 URL da requisição: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`❌ Erro na resposta: ${response.status} ${response.statusText}`);
        throw new Error('Erro ao carregar produtos');
      }
      
      const data = await response.json();
      console.log(`📊 Dados recebidos:`, data);
      
      const rows = Array.isArray(data?.data) ? data.data : (data?.rows || data || []);
      console.log(`📦 Produtos encontrados: ${rows.length}`);
      
      setProducts(rows);
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
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
  // Função para verificar se SKU já existe APENAS no tenant atual
  const checkSkuExists = async (sku: string, showLoading = false) => {
    const trimmedSku = sku.trim();
    if (!trimmedSku) {
      console.log('⚠️ SKU vazio, não verificando duplicação');
      return false;
    }
    
    if (showLoading) {
      setIsCheckingSku(true);
    }
    
    try {
      const tenantId = tenant?.id || '00000000-0000-0000-0000-000000000000';
      
      // Verificar se o tenant é válido
      if (!tenantId || tenantId === '00000000-0000-0000-0000-000000000000') {
        console.log('⚠️ Tenant não configurado, não verificando SKU duplicado');
        return false;
      }
      
      console.log(`🔍 Verificando SKU "${trimmedSku}" no tenant ${tenantId}`);
      
      const response = await fetch(`/next_api/products?tenant_id=${tenantId}&sku=${encodeURIComponent(trimmedSku)}`);
      
      if (response.ok) {
        const data = await response.json();
        const exists = data.data && data.data.length > 0;
        console.log(`📊 Resultado: SKU "${trimmedSku}" no tenant ${tenantId}: ${exists ? 'EXISTE' : 'NÃO EXISTE'}`);
        if (exists) {
          console.log('📋 Produtos encontrados:', data.data);
        }
        return exists;
      } else {
        console.error('❌ Erro na resposta da API:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar SKU:', error);
      return false;
    } finally {
      if (showLoading) {
        setIsCheckingSku(false);
      }
    }
  };

  // Função para validar formulário
  const validateForm = async () => {
    const errors: Record<string, string> = {};

    // Validar campos obrigatórios
    if (!newProduct.name.trim()) {
      errors.name = 'Nome do produto é obrigatório';
    }

    if (!newProduct.sale_price || parseFloat(newProduct.sale_price) <= 0) {
      errors.sale_price = 'Preço de venda é obrigatório e deve ser maior que zero';
    }

    // Validar SKU se preenchido E se há tenant válido
    if (newProduct.sku.trim() && tenant?.id && tenant.id !== '00000000-0000-0000-0000-000000000000') {
      console.log(`🔍 Validando SKU "${newProduct.sku.trim()}" para tenant ${tenant.id}`);
      const skuExists = await checkSkuExists(newProduct.sku.trim(), true); // Mostrar loading na validação final
      if (skuExists) {
        errors.sku = 'Este código SKU já está cadastrado nesta conta. Escolha outro código.';
        console.log(`❌ SKU "${newProduct.sku.trim()}" já existe no tenant ${tenant.id}`);
      } else {
        console.log(`✅ SKU "${newProduct.sku.trim()}" disponível no tenant ${tenant.id}`);
      }
    } else if (newProduct.sku.trim()) {
      console.log(`⚠️ SKU "${newProduct.sku.trim()}" fornecido mas tenant inválido, pulando validação`);
    } else {
      console.log(`ℹ️ SKU vazio, pulando validação de duplicação`);
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProduct = async () => {
    console.log('[Produtos] handleAddProduct: start', { tenantId: tenant?.id, newProduct });
    
    // Validar formulário antes de prosseguir
    const isValid = await validateForm();
    if (!isValid) {
      toast.error('Por favor, corrija os erros no formulário antes de continuar.');
      return;
    }

    try {
      let tenantId = tenant?.id || (typeof window !== 'undefined' ? localStorage.getItem('lastProductsTenantId') || undefined : undefined);
      if (!tenantId) {
        // tentar recuperar
        await refreshTenant();
        tenantId = tenant?.id || (typeof window !== 'undefined' ? localStorage.getItem('lastProductsTenantId') || undefined : undefined);
      }
      if (!tenantId) {
        tenantId = '00000000-0000-0000-0000-000000000000';
        toast.message('Prosseguindo com tenant de teste (trial).');
      }
      toast.info('Enviando cadastro do produto...');
      const productData = {
        tenant_id: tenantId,
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        sku: newProduct.sku || '',
        name: newProduct.name,
        description: newProduct.description || null,
        category: newProduct.category || null,
        brand: newProduct.brand || null,
        price: parseFloat(newProduct.sale_price) || 0,
        cost_price: parseFloat(newProduct.cost_price) || 0,
        stock: parseInt(newProduct.stock_quantity) || 0,
        barcode: newProduct.barcode || null,
        ncm: newProduct.ncm || null,
        unit: newProduct.unit || 'UN',
      } as any;

      const response = await fetch('/next_api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      console.log('[Produtos] handleAddProduct: response status', response.status);

      if (!response.ok) {
        let message = 'Erro ao adicionar produto';
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const j = await response.json();
            message = j?.error || message;
          } else {
            const text = await response.text();
            try { message = JSON.parse(text).error || message; } catch { message = text || message; }
          }
        } catch {}
        throw new Error(message);
      }

      const json = await response.json().catch(() => ({}));
      console.log('[Produtos] handleAddProduct: success payload', json);
      const created = (json && (json.data || json)) as any;
      if (created && created.id) {
        // Atualiza lista de imediato
        setProducts((prev) => [created, ...prev]);
        // Se o tenant foi resolvido/gerado no backend, tentar sincronizar e recarregar
        if (created.tenant_id && !tenant?.id) {
          try { localStorage.setItem('lastProductsTenantId', created.tenant_id); } catch {}
          try { localStorage.setItem('lastProductsTenantId', created.tenant_id); } catch {}
          await refreshTenant();
          await loadProducts(created.tenant_id);
        } else {
          const tid = created.tenant_id || tenant?.id;
          if (tid) { try { localStorage.setItem('lastProductsTenantId', tid); } catch {} }
          await loadProducts(tid);
        }
      } else {
        await refreshTenant();
        await loadProducts();
      }
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
      setFormErrors({}); // Limpar erros
      toast.success('Produto adicionado com sucesso!');
    } catch (error: any) {
      console.error('[Produtos] handleAddProduct: error', error);
      toast.error(`Erro ao adicionar produto: ${error?.message || 'erro desconhecido'}`);
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

  // ✅ Função para converter preços do formato brasileiro
  const parseBrazilianPrice = (value: string | number): number => {
    if (!value) return 0;
    
    const str = value.toString().trim();
    if (!str || str === '0') return 0;
    
    // Remover caracteres não numéricos exceto vírgula e ponto
    const clean = str.replace(/[^\d.,]/g, '');
    
    // Se tem vírgula, tratar como separador decimal brasileiro
    if (clean.includes(',')) {
      // Se tem ponto também, ponto é milhares e vírgula é decimal
      if (clean.includes('.')) {
        const parts = clean.split(',');
        const integerPart = parts[0].replace(/\./g, '');
        const decimalPart = parts[1] || '00';
        return parseFloat(`${integerPart}.${decimalPart}`);
      } else {
        // Só vírgula, tratar como decimal
        return parseFloat(clean.replace(',', '.'));
      }
    } else {
      // Só números, tratar como inteiro
      return parseFloat(clean);
    }
  };

  const handleRegisterSelected = async (selected: any[]) => {
    try {
      setIsRegistering(true);
      let success = 0;
      let fail = 0;
      const errors: string[] = [];

      // ✅ DEBUG: Verificar tenant antes de processar
      console.log('🔍 DEBUG - Tenant atual:', tenant);
      console.log('🔍 DEBUG - Tenant ID:', tenant?.id);
      
      if (!tenant?.id) {
        console.error('❌ Tenant não disponível para importação');
        console.log('🔄 Tentando recarregar tenant...');
        
        // Tentar recarregar o tenant
        try {
          await refreshTenant();
          console.log('🔄 Tenant após refresh:', tenant);
          
          if (!tenant?.id) {
            toast.error('Erro: Tenant não disponível. Recarregue a página.');
            setIsRegistering(false);
            return;
          }
        } catch (error) {
          console.error('❌ Erro ao recarregar tenant:', error);
          toast.error('Erro: Tenant não disponível. Recarregue a página.');
          setIsRegistering(false);
          return;
        }
      }

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
          cost_price: parseBrazilianPrice(obj['valor de custo'] || obj['custo'] || obj['preco de custo'] || '0'),
          sale_price: parseBrazilianPrice(obj['valor de venda'] || obj['preco'] || obj['preco de venda'] || '0'),
          stock_quantity: parseInt((obj['estoque'] || obj['quantidade'] || '0').toString(), 10) || 0,
          barcode: (obj['codigo de barra'] || obj['codigo de barras'] || obj['barcode'] || '').toString().trim() || null,
          ncm: (obj['ncm'] || '').toString().trim() || null,
          unit: (obj['unidade'] || obj['und'] || 'UN').toString().trim().toUpperCase() || 'UN',
          imported_at: new Date().toISOString(),
        };

        if (!productData.sku || !productData.name || productData.sale_price <= 0) {
          fail++;
          errors.push(`Produto com dados inválidos (SKU: ${productData.sku}, Nome: ${productData.name}, Preço: ${productData.sale_price}), pulado.`);
          continue;
        }

        // ✅ DEBUG: Log dos dados antes do envio
        const requestData = { tenant_id: tenant?.id, ...productData };
        console.log('📤 Enviando dados do produto:', {
          tenant_id: requestData.tenant_id,
          name: requestData.name,
          sale_price: requestData.sale_price,
          sku: requestData.sku
        });

        const response = await fetch('/next_api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
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

  // Ações CRUD
  const [showProductDetails, setShowProductDetails] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setShowAddDialog(true);
    setNewProduct({
      sku: p.sku || '',
      name: p.name || '',
      description: p.description || '',
      category: p.category || '',
      brand: p.brand || '',
      cost_price: String(p.cost_price ?? ''),
      sale_price: String(p.sale_price ?? ''),
      stock_quantity: String(p.stock_quantity ?? '0'),
      barcode: p.barcode || '',
      ncm: p.ncm || '',
      unit: p.unit || 'UN',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('/next_api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct.id,
          name: newProduct.name,
          description: newProduct.description,
          price: parseFloat(newProduct.sale_price) || 0,
          stock: parseInt(newProduct.stock_quantity) || 0,
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const updated = json?.data || {};
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...updated } : p)));
      setShowAddDialog(false);
      setEditingProduct(null);
      toast.success('Produto atualizado');
    } catch (e: any) {
      toast.error(`Erro ao salvar: ${e?.message || 'erro'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Excluir o produto "${name}"?`)) return;
    try {
      const res = await fetch(`/next_api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Produto excluído');
    } catch (e: any) {
      toast.error(`Erro ao excluir: ${e?.message || 'erro'}`);
    }
  };

  // Função para obter ícone específico de cada coluna
  const getColumnIcon = (key: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      sku: <Hash className="h-3 w-3 mr-2 text-gray-400" />,
      category: <Tag className="h-3 w-3 mr-2 text-gray-400" />,
      brand: <Building2 className="h-3 w-3 mr-2 text-gray-400" />,
      cost_price: <DollarSign className="h-3 w-3 mr-2 text-gray-400" />,
      sale_price: <TrendingUpIcon className="h-3 w-3 mr-2 text-gray-400" />,
      stock_quantity: <Package2 className="h-3 w-3 mr-2 text-gray-400" />,
      barcode: <Barcode className="h-3 w-3 mr-2 text-gray-400" />,
      ncm: <FileText className="h-3 w-3 mr-2 text-gray-400" />,
      unit: <Ruler className="h-3 w-3 mr-2 text-gray-400" />,
      status: <Activity className="h-3 w-3 mr-2 text-gray-400" />
    };
    return iconMap[key] || <Settings2 className="h-4 w-4 mr-3 text-gray-400" />;
  };

  // Calcular estatísticas dos produtos
  const productStats = {
    total: Array.isArray(products) ? products.length : 0,
    active: Array.isArray(products) ? products.filter(p => p.status === 'active').length : 0,
    inactive: Array.isArray(products) ? products.filter(p => p.status === 'inactive').length : 0,
    lowStock: Array.isArray(products) ? products.filter(p => p.stock_quantity <= 10).length : 0,
    outOfStock: Array.isArray(products) ? products.filter(p => p.stock_quantity === 0).length : 0,
    totalValue: Array.isArray(products) ? products.reduce((acc, p) => acc + (p.sale_price * p.stock_quantity), 0) : 0,
    avgPrice: Array.isArray(products) && products.length > 0 ? products.reduce((acc, p) => acc + p.sale_price, 0) / products.length : 0,
    newThisMonth: Array.isArray(products) ? products.filter(p => {
      const created = new Date(p.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length : 0
  };

  return (
    <TenantPageWrapper>
      <div className="space-y-6">
      {/* Header com Título */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-heading">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie seu catálogo de produtos e controle de estoque
          </p>
        </div>
        <Button 
          className="juga-gradient text-white"
          onClick={() => setShowAddDialog(true)}
        >
          <PackagePlus className="h-4 w-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <JugaKPICard
          title="Total Produtos"
          value={productStats.total.toLocaleString('pt-BR')}
          description="Produtos cadastrados"
          icon={<Package className="h-4 w-4" />}
          color="primary"
        />
        
        <JugaKPICard
          title="Produtos Ativos"
          value={productStats.active.toLocaleString('pt-BR')}
          description="Status ativo"
          icon={<CheckCircle className="h-4 w-4" />}
          color="success"
          trend="up"
          trendValue="+8%"
        />
        
        <JugaKPICard
          title="Estoque Baixo"
          value={productStats.lowStock.toLocaleString('pt-BR')}
          description="≤ 10 unidades"
          icon={<AlertTriangle className="h-4 w-4" />}
          color="warning"
          trend={productStats.lowStock > 0 ? "down" : "up"}
          trendValue={productStats.lowStock > 0 ? "Atenção" : "OK"}
        />
        
        <JugaKPICard
          title="Sem Estoque"
          value={productStats.outOfStock.toLocaleString('pt-BR')}
          description="0 unidades"
          icon={<TrendingDown className="h-4 w-4" />}
          color="error"
          trend={productStats.outOfStock > 0 ? "down" : "up"}
          trendValue={productStats.outOfStock > 0 ? "Crítico" : "OK"}
        />
        
        <JugaKPICard
          title="Valor Total"
          value={formatCurrency(productStats.totalValue)}
          description="Estoque total"
          icon={<DollarSign className="h-4 w-4" />}
          color="accent"
          trend="up"
          trendValue="+12%"
        />
        
        <JugaKPICard
          title="Novos Este Mês"
          value={productStats.newThisMonth.toLocaleString('pt-BR')}
          description="Cadastros recentes"
          icon={<TrendingUp className="h-4 w-4" />}
          color="success"
          trend="up"
          trendValue="+15%"
        />
      </div>

      {/* Progress Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <JugaProgressCard
          title="Status dos Produtos"
          description="Ativos vs Inativos"
          progress={productStats.total > 0 ? Math.round((productStats.active / productStats.total) * 100) : 0}
          total={productStats.total}
          current={productStats.active}
          color="success"
        />
        
        <JugaProgressCard
          title="Controle de Estoque"
          description="Em estoque vs Baixo"
          progress={productStats.total > 0 ? Math.round(((productStats.total - productStats.lowStock - productStats.outOfStock) / productStats.total) * 100) : 0}
          total={productStats.total}
          current={productStats.total - productStats.lowStock - productStats.outOfStock}
          color="primary"
        />
        
        <JugaProgressCard
          title="Crescimento Mensal"
          description="Novos produtos"
          progress={productStats.total > 0 ? Math.round((productStats.newThisMonth / productStats.total) * 100) : 0}
          total={productStats.total}
          current={productStats.newThisMonth}
          color="accent"
        />
      </div>

      {/* Toolbar */}
      <Card className="juga-card">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Lado esquerdo - Botões de ação */}
            <div className="flex items-center gap-2">

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                  >
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Mais Ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52 z-50 bg-white border border-gray-200 shadow-xl rounded-lg">
                  <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-gray-900 bg-gray-50 border-b border-gray-100">
                    <MoreHorizontal className="h-4 w-4 inline mr-2" />
                    Ações
                  </DropdownMenuLabel>
                  
                  <div className="py-1">
                    <DropdownMenuItem 
                      onClick={() => setShowImportDialog(true)} 
                      className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center"
                    >
                      <Upload className="h-4 w-4 mr-3 text-gray-400" />
                      Importar Produtos
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center">
                      <Download className="h-4 w-4 mr-3 text-gray-400" />
                      Exportar Lista
                    </DropdownMenuItem>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-1">
                    <DropdownMenuItem className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center">
                      <Trash2 className="h-4 w-4 mr-3 text-red-400" />
                      Excluir Selecionados
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                  >
                    <Settings2 className="h-4 w-4 mr-2" />
                    Colunas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-44 z-50 bg-white border border-gray-200 shadow-xl rounded-lg">
                  <DropdownMenuLabel className="px-2 py-1.5 text-[13px] font-semibold text-gray-900 bg-gray-50 border-b border-gray-100">
                    <Settings2 className="h-4 w-4 inline mr-2" />
                    Mostrar Colunas
                  </DropdownMenuLabel>
                  
                  <div className="py-1">
                    {/* Seção: Identificação */}
                    <div className="px-2 py-1">
                      <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                        Identificação
                      </div>
                      <div className="space-y-0.5">
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.sku}
                          onCheckedChange={(checked) => 
                            setColumnVisibility(prev => ({ ...prev, sku: checked || false }))
                          }
                          className="px-2 py-0.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center rounded-md"
                        >
                          {getColumnIcon('sku')}
                          SKU
                        </DropdownMenuCheckboxItem>
                        
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.category}
                          onCheckedChange={(checked) => 
                            setColumnVisibility(prev => ({ ...prev, category: checked || false }))
                          }
                          className="px-2 py-0.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center rounded-md"
                        >
                          {getColumnIcon('category')}
                          Categoria
                        </DropdownMenuCheckboxItem>
                        
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.brand}
                          onCheckedChange={(checked) => 
                            setColumnVisibility(prev => ({ ...prev, brand: checked || false }))
                          }
                          className="px-2 py-0.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center rounded-md"
                        >
                          {getColumnIcon('brand')}
                          Marca
                        </DropdownMenuCheckboxItem>
                      </div>
                    </div>
                    
                    {/* Separador */}
                    <div className="border-t border-gray-100 my-0.5"></div>
                    
                    {/* Seção: Preços */}
                    <div className="px-2 py-1">
                      <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                        Preços
                      </div>
                      <div className="space-y-0.5">
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.cost_price}
                          onCheckedChange={(checked) => 
                            setColumnVisibility(prev => ({ ...prev, cost_price: checked || false }))
                          }
                          className="px-2 py-0.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center rounded-md"
                        >
                          {getColumnIcon('cost_price')}
                          Preço Custo
                        </DropdownMenuCheckboxItem>
                        
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.sale_price}
                          onCheckedChange={(checked) => 
                            setColumnVisibility(prev => ({ ...prev, sale_price: checked || false }))
                          }
                          className="px-2 py-0.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center rounded-md"
                        >
                          {getColumnIcon('sale_price')}
                          Preço Venda
                        </DropdownMenuCheckboxItem>
                      </div>
                    </div>
                    
                    {/* Separador */}
                    <div className="border-t border-gray-100 my-0.5"></div>
                    
                    {/* Seção: Estoque */}
                    <div className="px-2 py-1">
                      <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                        Estoque
                      </div>
                      <div className="space-y-0.5">
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.stock_quantity}
                          onCheckedChange={(checked) => 
                            setColumnVisibility(prev => ({ ...prev, stock_quantity: checked || false }))
                          }
                          className="px-2 py-0.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center rounded-md"
                        >
                          {getColumnIcon('stock_quantity')}
                          Estoque
                        </DropdownMenuCheckboxItem>
                        
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.unit}
                          onCheckedChange={(checked) => 
                            setColumnVisibility(prev => ({ ...prev, unit: checked || false }))
                          }
                          className="px-2 py-0.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center rounded-md"
                        >
                          {getColumnIcon('unit')}
                          Unidade
                        </DropdownMenuCheckboxItem>
                      </div>
                    </div>
                    
                    {/* Separador */}
                    <div className="border-t border-gray-100 my-0.5"></div>
                    
                    {/* Seção: Documentos */}
                    <div className="px-2 py-1">
                      <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                        Documentos
                      </div>
                      <div className="space-y-0.5">
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.barcode}
                          onCheckedChange={(checked) => 
                            setColumnVisibility(prev => ({ ...prev, barcode: checked || false }))
                          }
                          className="px-2 py-0.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center rounded-md"
                        >
                          {getColumnIcon('barcode')}
                          Código de Barras
                        </DropdownMenuCheckboxItem>
                        
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.ncm}
                          onCheckedChange={(checked) => 
                            setColumnVisibility(prev => ({ ...prev, ncm: checked || false }))
                          }
                          className="px-2 py-0.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center rounded-md"
                        >
                          {getColumnIcon('ncm')}
                          NCM
                        </DropdownMenuCheckboxItem>
                      </div>
                    </div>
                    
                    {/* Separador */}
                    <div className="border-t border-gray-100 my-0.5"></div>
                    
                    {/* Seção: Status */}
                    <div className="px-2 py-1">
                      <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                        Status
                      </div>
                      <div className="space-y-0.5">
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.status}
                          onCheckedChange={(checked) => 
                            setColumnVisibility(prev => ({ ...prev, status: checked || false }))
                          }
                          className="px-2 py-0.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center rounded-md"
                        >
                          {getColumnIcon('status')}
                          Status
                        </DropdownMenuCheckboxItem>
                      </div>
                    </div>
                  </div>
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
                className="border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
              >
                <Filter className="h-4 w-4 mr-2" />
                Busca Avançada
              </Button>
            </div>
          </div>

          {/* Busca Avançada */}
          {showAdvancedSearch && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
      <Card className="juga-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lista de Produtos ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Carregando produtos...
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                        <div className="flex items-center justify-start gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowProductDetails(product)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              </Table>
            </div>
          )}

          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
              <p className="text-sm">
                {searchTerm || Object.values(advancedFilters).some(v => v) 
                  ? "Tente ajustar os filtros de busca"
                  : "Adicione produtos para começar"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Adicionar/Editar Produto - layout alinhado ao de clientes */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          <div className="relative">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <PackagePlus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">{editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
                  <DialogDescription className="text-blue-100 mt-1">
                    {editingProduct ? 'Atualize as informações do produto.' : 'Preencha as informações do produto abaixo. Os campos marcados com * são obrigatórios.'}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Conteúdo principal */}
            <div className="p-6 bg-slate-800/50 backdrop-blur-sm">
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="sku" className="text-sm font-medium text-slate-200">SKU</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-slate-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Código interno único do produto.<br/>Deve ser único apenas nesta conta.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="space-y-1">
                      <Input
                        id="sku"
                        value={newProduct.sku}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewProduct(prev => ({ ...prev, sku: value }));
                          // Validar SKU em tempo real
                          validateSkuRealTime(value);
                        }}
                        placeholder="Código interno do produto (opcional)"
                        className={`h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400 ${
                          formErrors.sku ? 'border-red-500 focus:border-red-400' : ''
                        }`}
                      />
                      {formErrors.sku && (
                        <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                          <p className="text-xs text-red-400">{formErrors.sku}</p>
                        </div>
                      )}
                      {isCheckingSku && (
                        <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                          <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-xs text-blue-400">Verificando código SKU...</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-slate-200">Nome *</Label>
                    <div className="space-y-1">
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => {
                          setNewProduct(prev => ({ ...prev, name: e.target.value }));
                          clearFieldError('name');
                        }}
                        placeholder="Nome do produto"
                        className={`h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400 ${
                          formErrors.name ? 'border-red-500 focus:border-red-400' : ''
                        }`}
                      />
                      {formErrors.name && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {formErrors.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-slate-200">Descrição</Label>
                  <Input
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do produto"
                    className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium text-slate-200">Categoria</Label>
                    <Input
                      id="category"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Categoria"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand" className="text-sm font-medium text-slate-200">Marca</Label>
                    <Input
                      id="brand"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Marca"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost_price" className="text-sm font-medium text-slate-200">Preço de Custo</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      value={newProduct.cost_price}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, cost_price: e.target.value }))}
                      placeholder="0.00"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sale_price" className="text-sm font-medium text-slate-200">Preço de Venda *</Label>
                    <div className="space-y-1">
                      <Input
                        id="sale_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newProduct.sale_price}
                        onChange={(e) => {
                          setNewProduct(prev => ({ ...prev, sale_price: e.target.value }));
                          clearFieldError('sale_price');
                        }}
                        placeholder="0.00"
                        className={`h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400 ${
                          formErrors.sale_price ? 'border-red-500 focus:border-red-400' : ''
                        }`}
                      />
                      {formErrors.sale_price && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {formErrors.sale_price}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity" className="text-sm font-medium text-slate-200">Estoque</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      value={newProduct.stock_quantity}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, stock_quantity: e.target.value }))}
                      placeholder="0"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit" className="text-sm font-medium text-slate-200">Unidade</Label>
                    <select 
                      id="unit"
                      className="h-11 bg-slate-700/50 border border-slate-600 rounded-md text-white px-3 focus:border-blue-400 focus:ring-blue-400/20"
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
                  <div className="space-y-2">
                    <Label htmlFor="barcode" className="text-sm font-medium text-slate-200">Código de Barras</Label>
                    <Input
                      id="barcode"
                      value={newProduct.barcode}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, barcode: e.target.value }))}
                      placeholder="7891234567890"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ncm" className="text-sm font-medium text-slate-200">NCM</Label>
                    <Input
                      id="ncm"
                      value={newProduct.ncm}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, ncm: e.target.value }))}
                      placeholder="12345678"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé com gradiente */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-b-lg border-t border-slate-600/50">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => { 
                    setShowAddDialog(false); 
                    setEditingProduct(null); 
                    setFormErrors({});
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
                  }}
                  className="w-full sm:w-auto border-slate-500 bg-slate-700/50 hover:bg-slate-600 text-slate-200 hover:text-white h-11 font-medium transition-all duration-200 hover:shadow-md"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={editingProduct ? handleSaveEdit : handleAddProduct}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-11 font-medium transition-all duration-200 hover:shadow-lg"
                >
                  {isSubmitting ? (editingProduct ? 'Salvando...' : 'Adicionando...') : (editingProduct ? 'Salvar Alterações' : 'Adicionar Produto')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes do Produto */}
      <Dialog open={!!showProductDetails} onOpenChange={(open) => !open && setShowProductDetails(null)}>
        <DialogContent className="text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Detalhes do Produto</DialogTitle>
            <DialogDescription className="text-slate-600">Informações básicas do produto selecionado</DialogDescription>
          </DialogHeader>
          {showProductDetails && (
            <div className="space-y-2">
              <div><span className="font-medium">Nome:</span> {showProductDetails.name}</div>
              <div><span className="font-medium">SKU:</span> {showProductDetails.sku}</div>
              <div><span className="font-medium">Preço:</span> {formatCurrency(showProductDetails.sale_price)}</div>
              <div><span className="font-medium">Estoque:</span> {showProductDetails.stock_quantity} {showProductDetails.unit}</div>
              {showProductDetails.description && (
                <div><span className="font-medium">Descrição:</span> {showProductDetails.description}</div>
              )}
              <div className="text-xs text-slate-500"><span className="font-medium">Criado em:</span> {new Date(showProductDetails.created_at).toLocaleString('pt-BR')}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDetails(null)}>Fechar</Button>
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
    </TenantPageWrapper>
  );
}