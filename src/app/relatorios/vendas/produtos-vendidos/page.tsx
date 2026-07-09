'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Home, 
  ChevronRight, 
  ShoppingBag, 
  Download, 
  Printer, 
  Columns, 
  Calendar, 
  Search, 
  ShoppingCart, 
  BarChart3, 
  DollarSign, 
  ArrowUp,
  FileDown,
  X,
  SlidersHorizontal,
  ChevronDown,
  Percent
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { useBranch } from '@/contexts/BranchContext';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface SoldProduct {
  productId: string;
  name: string;
  quantity: number;
  costPrice: number;
  totalCost: number;
  totalValue: number;
  totalDiscount: number;
  profit: number;
}

interface ReportData {
  totals: {
    quantity: number;
    cost: number;
    value: number;
    discount: number;
    profit: number;
  };
  products: SoldProduct[];
}

export default function RelatorioProdutosVendidosPage() {
  const { tenant, user } = useSimpleAuth();
  const { branches, enabled: branchesEnabled } = useBranch();

  // Estados dos filtros
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    };
  });

  const [filters, setFilters] = useState({
    branchId: 'all',
    userId: 'all',
    customerId: 'all',
    productId: 'all',
    category: 'all',
    situation: 'concluida', // padrão: apenas concluídas
  });

  // Auxiliares para o modal de busca avançada
  const [tempFilters, setTempFilters] = useState({ ...filters });

  // Listas para preencher filtros
  const [usersList, setUsersList] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);

  // Estados da tabela e controle
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData>({
    totals: { quantity: 0, cost: 0, value: 0, discount: 0, profit: 0 },
    products: []
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Colunas visíveis
  const [visibleColumns, setVisibleColumns] = useState({
    produto: true,
    quantidade: true,
    custoMedio: true,
    custoTotal: true,
    valorTotal: true,
    desconto: true,
    lucro: true,
  });

  // Buscar opções dos filtros (vendedores, clientes, produtos)
  useEffect(() => {
    if (!tenant?.id) return;

    const loadFilterOptions = async () => {
      try {
        // Usuários/Vendedores
        const usersRes = await fetch(`/next_api/tenant-users?tenant_id=${encodeURIComponent(tenant.id)}`);
        if (usersRes.ok) {
          const res = await usersRes.json();
          setUsersList(Array.isArray(res.data) ? res.data : []);
        }

        // Clientes
        const customersRes = await fetch(`/next_api/customers?tenant_id=${encodeURIComponent(tenant.id)}`);
        if (customersRes.ok) {
          const res = await customersRes.json();
          setCustomersList(Array.isArray(res.data) ? res.data : []);
        }

        // Produtos
        const productsRes = await fetch(`/next_api/products?tenant_id=${encodeURIComponent(tenant.id)}`);
        if (productsRes.ok) {
          const res = await productsRes.json();
          const items = Array.isArray(res.data) ? res.data : [];
          setProductsList(items);

          // Extrair categorias únicas
          const cats = items
            .map((p: any) => p.category)
            .filter((c: any) => c && c.trim() !== '') as string[];
          setCategoriesList(cats.filter((value, index, self) => self.indexOf(value) === index));
        }
      } catch (err) {
        console.error('Erro ao carregar opções dos filtros:', err);
      }
    };

    loadFilterOptions();
  }, [tenant?.id]);

  // Carregar dados agregados do relatório
  const loadData = useCallback(async () => {
    if (!tenant?.id) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        tenant_id: tenant.id,
        start: dateRange.start,
        end: dateRange.end,
      });

      if (filters.branchId && filters.branchId !== 'all') params.append('branch_id', filters.branchId);
      if (filters.userId && filters.userId !== 'all') params.append('user_id', filters.userId);
      if (filters.customerId && filters.customerId !== 'all') params.append('customer_id', filters.customerId);
      if (filters.productId && filters.productId !== 'all') params.append('product_id', filters.productId);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.situation && filters.situation !== 'all') params.append('situation', filters.situation);

      const res = await fetch(`/next_api/reports/sold-products?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error('Erro ao buscar dados do relatório.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Ocorreu um erro ao carregar o relatório.');
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, dateRange, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Formatação de Dinheiro BRL
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Formatação de Número Decimal (ex: 2.498,00)
  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Filtragem da tabela local por texto de busca
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return data.products;
    const term = searchTerm.toLowerCase();
    return data.products.filter(p => p.name.toLowerCase().includes(term));
  }, [data.products, searchTerm]);

  // Aplicar busca avançada
  const handleApplyAdvancedFilters = () => {
    setFilters({ ...tempFilters });
    setIsAdvancedSearchOpen(false);
  };

  // Limpar busca avançada
  const handleResetAdvancedFilters = () => {
    const cleared = {
      branchId: 'all',
      userId: 'all',
      customerId: 'all',
      productId: 'all',
      category: 'all',
      situation: 'concluida',
    };
    setTempFilters(cleared);
    setFilters(cleared);
    setIsAdvancedSearchOpen(false);
  };

  // Formatar mês para exibição na barra de filtros
  const currentSelectedMonthText = useMemo(() => {
    const startObj = new Date(dateRange.start + 'T12:00:00');
    return startObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [dateRange]);

  // Imprimir Relatório
  const handlePrint = () => {
    window.print();
  };

  // Exportar Excel (CSV compatível com delimitador ;)
  const handleExportExcel = () => {
    try {
      const headers = ['Produto', 'Quantidade', 'Custo Médio', 'Custo Total', 'Valor Total', 'Desconto', 'Lucro'];
      const rows = filteredProducts.map(p => [
        p.name,
        p.quantity.toString().replace('.', ','),
        p.costPrice.toFixed(2).replace('.', ','),
        p.totalCost.toFixed(2).replace('.', ','),
        p.totalValue.toFixed(2).replace('.', ','),
        (p.totalDiscount || 0).toFixed(2).replace('.', ','),
        p.profit.toFixed(2).replace('.', ','),
      ]);

      const totalsRow = [
        'TOTAL',
        data.totals.quantity.toString().replace('.', ','),
        '-',
        data.totals.cost.toFixed(2).replace('.', ','),
        data.totals.value.toFixed(2).replace('.', ','),
        (data.totals.discount || 0).toFixed(2).replace('.', ','),
        data.totals.profit.toFixed(2).replace('.', ','),
      ];

      const csvContent = "\uFEFF" + 
        [headers.join(';'), ...rows.map(e => e.join(';')), totalsRow.join(';')].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-produtos-vendidos-${dateRange.start}_a_${dateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Arquivo excel exportado com sucesso.');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao exportar arquivo.');
    }
  };

  // Exportar PDF usando jsPDF com design de alta fidelidade (similares aos cards e tabelas do ERP)
  const handleExportPDF = () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let y = 15;

      // 1. Cabeçalho Principal (Logo Vetorial JUGA Sistemas)
      // Desenhar Emblema da Logo (Quadrado arredondado azul)
      pdf.setFillColor(30, 64, 175); // Azul Primário (#1e40af)
      pdf.roundedRect(margin, y - 5, 8, 8, 1.8, 1.8, 'F');

      // Desenhar o caminho branco interno
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.8);
      pdf.line(margin + 2.5, y + 1, margin + 2.5, y - 1); // linha vertical
      pdf.line(margin + 2.5, y + 1, margin + 5, y + 1);   // linha horizontal

      // Desenhar a bolinha cyan
      pdf.setFillColor(14, 165, 233); // Cyan (#0ea5e9)
      pdf.circle(margin + 5, y - 2, 0.7, 'F');

      // Nome do Sistema "JUGA Sistemas" ao lado do emblema
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      pdf.setTextColor(15, 23, 42); // Dark slate (#0f172a)
      pdf.text('JUGA', margin + 10.5, y + 1);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139); // Slate Gray (#64748b)
      pdf.text('Sistemas', margin + 25.5, y + 1);

      // Título do Relatório alinhado à direita
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.setTextColor(71, 85, 105); // Cinza Escuro
      pdf.text('Relatório de Produtos Vendidos', pageWidth - margin, y + 1, { align: 'right' });

      y += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(148, 163, 184); // Cinza Claro
      const periodText = `Período: ${new Date(dateRange.start + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(dateRange.end + 'T12:00:00').toLocaleDateString('pt-BR')}`;
      pdf.text(periodText, margin, y);
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - margin, y, { align: 'right' });

      y += 5;
      pdf.setDrawColor(226, 232, 240); // Linha divisória fina (#e2e8f0)
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);

      // 2. Renderizar os 5 Cards de KPI
      y += 8;
      const cardWidth = 33.2;
      const cardHeight = 22;
      const cardGap = 3.5;
      const rx = 2.5;
      const ry = 2.5;

      // Card 1: Quantidade (Cinza/Slate)
      const c1X = margin;
      pdf.setFillColor(241, 245, 249); // #f1f5f9
      pdf.roundedRect(c1X, y, cardWidth, cardHeight, rx, ry, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139); // #64748b
      pdf.text('QUANTIDADE', c1X + 4, y + 5.5);
      pdf.setFontSize(11.5);
      pdf.setTextColor(15, 23, 42); // #0f172a
      pdf.text(formatNumber(data.totals.quantity), c1X + 4, y + 12);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Itens vendidos', c1X + 4, y + 17.5);

      // Card 2: Custo Total (Vermelho)
      const c2X = c1X + cardWidth + cardGap;
      pdf.setFillColor(254, 242, 242); // #fef2f2
      pdf.roundedRect(c2X, y, cardWidth, cardHeight, rx, ry, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(239, 68, 68); // #ef4444
      pdf.text('CUSTO TOTAL', c2X + 4, y + 5.5);
      pdf.setFontSize(11.5);
      pdf.setTextColor(220, 38, 38);
      pdf.text(formatNumber(data.totals.cost), c2X + 4, y + 12);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(239, 68, 68);
      pdf.text('Custo das mercadorias', c2X + 4, y + 17.5);

      // Card 3: Valor Total (Verde)
      const c3X = c2X + cardWidth + cardGap;
      pdf.setFillColor(236, 253, 245); // #ecfdf5
      pdf.roundedRect(c3X, y, cardWidth, cardHeight, rx, ry, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(16, 185, 129); // #10b981
      pdf.text('VALOR TOTAL', c3X + 4, y + 5.5);
      pdf.setFontSize(11.5);
      pdf.setTextColor(5, 150, 105);
      pdf.text(formatNumber(data.totals.value), c3X + 4, y + 12);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(5, 150, 105);
      pdf.text('Faturamento bruto', c3X + 4, y + 17.5);

      // Card 4: Desconto (Azul/Blue)
      const c4X = c3X + cardWidth + cardGap;
      pdf.setFillColor(239, 246, 255); // #eff6ff
      pdf.roundedRect(c4X, y, cardWidth, cardHeight, rx, ry, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(59, 130, 246); // #3b82f6
      pdf.text('DESCONTO', c4X + 4, y + 5.5);
      pdf.setFontSize(11.5);
      pdf.setTextColor(29, 78, 216);
      pdf.text(formatNumber(data.totals.discount || 0), c4X + 4, y + 12);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(59, 130, 246);
      pdf.text('Descontos aplicados', c4X + 4, y + 17.5);

      // Card 5: Lucro (Dourado/Âmbar)
      const c5X = c4X + cardWidth + cardGap;
      pdf.setFillColor(255, 251, 235); // #fffbeb
      pdf.roundedRect(c5X, y, cardWidth, cardHeight, rx, ry, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(245, 158, 11); // #f59e0b
      pdf.text('LUCRO LÍQUIDO', c5X + 4, y + 5.5);
      pdf.setFontSize(11.5);
      pdf.setTextColor(217, 119, 6);
      pdf.text(formatNumber(data.totals.profit), c5X + 4, y + 12);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(217, 119, 6);
      pdf.text('Lucro das vendas', c5X + 4, y + 17.5);

      y += cardHeight + 8;

      // 3. Tabela de Produtos Vendidos
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text('DETALHAMENTO DE PRODUTOS', margin, y);

      // Cabeçalho da Tabela
      y += 4;
      pdf.setFillColor(248, 250, 252); // #f8fafc
      pdf.rect(margin, y, pageWidth - 2 * margin, 7.5, 'F');
      
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, y, pageWidth - margin, y);
      pdf.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

      y += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Produto', margin + 3, y);
      pdf.text('Quantidade', margin + 65, y, { align: 'right' });
      pdf.text('Custo Médio', margin + 90, y, { align: 'right' });
      pdf.text('Custo Total', margin + 115, y, { align: 'right' });
      pdf.text('Valor Total', margin + 140, y, { align: 'right' });
      pdf.text('Desconto', margin + 160, y, { align: 'right' });
      pdf.text('Lucro', margin + 177, y, { align: 'right' });

      y += 2.5;

      // Linhas da Tabela com fundo alternado
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(51, 65, 85);

      let pageCount = 1;

      // Rodapé da primeira página (declarado como função interna para reuso)
      const drawFooter = (pageNum: number) => {
        pdf.setDrawColor(241, 245, 249);
        pdf.setLineWidth(0.3);
        pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(148, 163, 184);
        pdf.text('Relatório gerado pelo sistema JUGA Sistemas', margin, pageHeight - 10);
        pdf.text(`Página ${pageNum}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      };

      filteredProducts.forEach((p, idx) => {
        y += 5.5;

        // Limite da página A4 com rodapé
        if (y > pageHeight - 22) {
          drawFooter(pageCount);
          pdf.addPage();
          pageCount++;
          y = 20;

          // Re-renderizar cabeçalho da tabela na nova página
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, y, pageWidth - 2 * margin, 7.5, 'F');
          pdf.setDrawColor(226, 232, 240);
          pdf.line(margin, y, pageWidth - margin, y);
          pdf.line(margin, y + 7.5, pageWidth - margin, y + 7.5);
          
          y += 5;
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.setTextColor(71, 85, 105);
          pdf.text('Produto', margin + 3, y);
          pdf.text('Quantidade', margin + 65, y, { align: 'right' });
          pdf.text('Custo Médio', margin + 90, y, { align: 'right' });
          pdf.text('Custo Total', margin + 115, y, { align: 'right' });
          pdf.text('Valor Total', margin + 140, y, { align: 'right' });
          pdf.text('Desconto', margin + 160, y, { align: 'right' });
          pdf.text('Lucro', margin + 177, y, { align: 'right' });
          
          y += 8;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(51, 65, 85);
        }

        // Fundo alternado
        if (idx % 2 === 1) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, y - 4, pageWidth - 2 * margin, 5.5, 'F');
        }

        const truncatedName = p.name.length > 30 ? p.name.slice(0, 27) + '...' : p.name;
        pdf.text(truncatedName, margin + 3, y);
        pdf.text(formatNumber(p.quantity), margin + 65, y, { align: 'right' });
        pdf.text(formatCurrency(p.costPrice), margin + 90, y, { align: 'right' });
        pdf.text(formatCurrency(p.totalCost), margin + 115, y, { align: 'right' });
        pdf.text(formatCurrency(p.totalValue), margin + 140, y, { align: 'right' });
        pdf.text(formatCurrency(p.totalDiscount || 0), margin + 160, y, { align: 'right' });
        
        // Lucro em verde ou vermelho
        if (p.profit >= 0) {
          pdf.setTextColor(5, 150, 105);
        } else {
          pdf.setTextColor(220, 38, 38);
        }
        pdf.text(formatCurrency(p.profit), margin + 177, y, { align: 'right' });
        pdf.setTextColor(51, 65, 85); // Resetar
      });

      // Linha de Totais da Tabela
      y += 5.5;
      if (y > pageHeight - 22) {
        drawFooter(pageCount);
        pdf.addPage();
        pageCount++;
        y = 20;
      }

      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin, y - 4, pageWidth - 2 * margin, 6.5, 'F');
      pdf.setDrawColor(203, 213, 225);
      pdf.line(margin, y - 4, pageWidth - margin, y - 4);
      pdf.line(margin, y + 2.5, pageWidth - margin, y + 2.5);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text('TOTAL', margin + 3, y);
      pdf.text(formatNumber(data.totals.quantity), margin + 65, y, { align: 'right' });
      pdf.text('-', margin + 90, y, { align: 'right' });
      pdf.text(formatCurrency(data.totals.cost), margin + 115, y, { align: 'right' });
      pdf.text(formatCurrency(data.totals.value), margin + 140, y, { align: 'right' });
      pdf.text(formatCurrency(data.totals.discount || 0), margin + 160, y, { align: 'right' });
      
      if (data.totals.profit >= 0) {
        pdf.setTextColor(5, 150, 105);
      } else {
        pdf.setTextColor(220, 38, 38);
      }
      pdf.text(formatCurrency(data.totals.profit), margin + 177, y, { align: 'right' });

      // Desenhar rodapé da última página
      drawFooter(pageCount);

      pdf.save(`relatorio-produtos-vendidos-${dateRange.start}.pdf`);
      toast.success('Relatório PDF baixado com sucesso.');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar relatório em PDF.');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto print-container">

      {/* Cabeçalho Exclusivo para Impressão Física */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-slate-300 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <img src="/logo-juga.svg" alt="JUGA Logo" className="h-10 w-auto object-contain" />
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold text-slate-900">Relatório de produtos vendidos</h1>
          <p className="text-xs text-slate-500 font-medium">
            Período: {new Date(dateRange.start + 'T12:00:00').toLocaleDateString('pt-BR')} até {new Date(dateRange.end + 'T12:00:00').toLocaleDateString('pt-BR')}
          </p>
          <p className="text-[10px] text-slate-400">
            Gerado em: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Breadcrumbs (no-print) */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 no-print">
        <Home className="h-3.5 w-3.5" />
        <span>Início</span>
        <ChevronRight className="h-3 w-3" />
        <span>Relatórios de vendas</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-800 dark:text-slate-200 font-medium">Produtos vendidos</span>
      </div>

      {/* Title Header (no-print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-5 gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200 no-print">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Relatório de produtos vendidos</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:hidden print:block">
              Período: {new Date(dateRange.start + 'T12:00:00').toLocaleDateString('pt-BR')} a {new Date(dateRange.end + 'T12:00:00').toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Date Filter Quick Selector (no-print) */}
        <div className="flex items-center gap-2 no-print self-end">
          <DropdownMenu open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 px-4 rounded-xl gap-2 font-medium bg-slate-900 dark:bg-slate-800 text-white border-none hover:bg-slate-800">
                <Calendar className="h-4 w-4" />
                <span className="capitalize">{currentSelectedMonthText}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-4 w-72 space-y-4 rounded-xl">
              <DropdownMenuLabel>Filtrar Período</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="start">De</Label>
                  <Input 
                    id="start" 
                    type="date" 
                    value={dateRange.start} 
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="end">Até</Label>
                  <Input 
                    id="end" 
                    type="date" 
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={() => setIsAdvancedSearchOpen(true)}
            className="h-10 px-4 rounded-xl gap-2 font-semibold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white"
          >
            <Search className="h-4 w-4" />
            Busca avançada
          </Button>
        </div>
      </div>

      {/* Action Button Bar (no-print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          {/* Gerenciar Colunas Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 px-3 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                <Columns className="h-4 w-4 mr-2" />
                Gerenciar colunas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-lg">
              <DropdownMenuLabel>Colunas Visíveis</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem 
                checked={visibleColumns.produto}
                onCheckedChange={(checked) => setVisibleColumns(v => ({ ...v, produto: checked }))}
              >
                Produto
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={visibleColumns.quantidade}
                onCheckedChange={(checked) => setVisibleColumns(v => ({ ...v, quantidade: checked }))}
              >
                Quantidade
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={visibleColumns.custoMedio}
                onCheckedChange={(checked) => setVisibleColumns(v => ({ ...v, custoMedio: checked }))}
              >
                Custo médio
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={visibleColumns.custoTotal}
                onCheckedChange={(checked) => setVisibleColumns(v => ({ ...v, custoTotal: checked }))}
              >
                Custo total
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={visibleColumns.valorTotal}
                onCheckedChange={(checked) => setVisibleColumns(v => ({ ...v, valorTotal: checked }))}
              >
                Valor total
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={visibleColumns.desconto}
                onCheckedChange={(checked) => setVisibleColumns(v => ({ ...v, desconto: checked }))}
              >
                Desconto
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={visibleColumns.lucro}
                onCheckedChange={(checked) => setVisibleColumns(v => ({ ...v, lucro: checked }))}
              >
                Lucro
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Imprimir Button */}
          <Button 
            variant="outline" 
            onClick={handlePrint}
            className="h-9 px-3 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-medium"
          >
            <Printer className="h-4 w-4 mr-2 text-rose-500" />
            Imprimir
          </Button>

          {/* Exportar Excel/CSV Button */}
          <Button 
            variant="outline" 
            onClick={handleExportExcel}
            className="h-9 px-3 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-medium"
          >
            <Download className="h-4 w-4 mr-2 text-emerald-600" />
            Exportar Excel
          </Button>

          {/* Baixar PDF Button */}
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            className="h-9 px-3 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-medium"
          >
            <FileDown className="h-4 w-4 mr-2 text-blue-500" />
            Baixar PDF
          </Button>
        </div>

        {/* Local Table Search Input */}
        <div className="relative w-full max-w-xs sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Filtrar por produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 border-slate-200 dark:border-slate-800 rounded-lg focus-visible:ring-slate-400"
          />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* KPI 1 - Quantidade */}
        <Card className="print-card border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quantidade</span>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {loading ? '...' : formatNumber(data.totals.quantity)}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Produtos vendidos no período</p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 shrink-0">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 - Custo Total */}
        <Card className="print-card border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Custo total</span>
              <h2 className="text-3xl font-extrabold text-red-600 dark:text-red-500 tracking-tight print-card-value">
                {loading ? '...' : formatNumber(data.totals.cost)}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Custo dos produtos vendidos</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-full text-red-500 shrink-0">
              <BarChart3 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 - Valor Total */}
        <Card className="print-card border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Valor total</span>
              <h2 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-500 tracking-tight print-card-value">
                {loading ? '...' : formatNumber(data.totals.value)}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Valor total das vendas</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-full text-emerald-500 shrink-0">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI: Desconto */}
        <Card className="print-card border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Desconto</span>
              <h2 className="text-3xl font-extrabold text-blue-600 dark:text-blue-500 tracking-tight print-card-value">
                {loading ? '...' : formatNumber(data.totals.discount || 0)}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Descontos dados no período</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-full text-blue-500 shrink-0">
              <Percent className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4 - Lucro */}
        <Card className="print-card border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lucro</span>
              <h2 className="text-3xl font-extrabold text-amber-600 dark:text-amber-500 tracking-tight print-card-value">
                {loading ? '...' : formatNumber(data.totals.profit)}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Valores já confirmados</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-full text-amber-500 shrink-0">
              <ArrowUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="print-card border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="print-table w-full text-left border-collapse">
              <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <TableRow>
                  {visibleColumns.produto && <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 px-5">Produto</TableHead>}
                  {visibleColumns.quantidade && <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right py-3.5 px-5">Quantidade</TableHead>}
                  {visibleColumns.custoMedio && <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right py-3.5 px-5">Custo médio</TableHead>}
                  {visibleColumns.custoTotal && <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right py-3.5 px-5">Custo total</TableHead>}
                  {visibleColumns.valorTotal && <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right py-3.5 px-5">Valor total</TableHead>}
                  {visibleColumns.desconto && <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right py-3.5 px-5">Desconto</TableHead>}
                  {visibleColumns.lucro && <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right py-3.5 px-5">Lucro</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400"></div>
                        <span>Carregando relatório...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      Nenhum produto vendido encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((p, index) => (
                    <TableRow key={p.productId || index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      {visibleColumns.produto && (
                        <TableCell className="py-3.5 px-5 font-medium text-slate-800 dark:text-slate-200">
                          {p.name}
                        </TableCell>
                      )}
                      {visibleColumns.quantidade && (
                        <TableCell className="py-3.5 px-5 text-right font-medium text-slate-600 dark:text-slate-400">
                          {formatNumber(p.quantity)}
                        </TableCell>
                      )}
                      {visibleColumns.custoMedio && (
                        <TableCell className="py-3.5 px-5 text-right text-slate-600 dark:text-slate-400">
                          {formatCurrency(p.costPrice)}
                        </TableCell>
                      )}
                      {visibleColumns.custoTotal && (
                        <TableCell className="py-3.5 px-5 text-right text-slate-600 dark:text-slate-400">
                          {formatCurrency(p.totalCost)}
                        </TableCell>
                      )}
                      {visibleColumns.valorTotal && (
                        <TableCell className="py-3.5 px-5 text-right font-semibold text-emerald-600 dark:text-emerald-500 print:text-black">
                          {formatCurrency(p.totalValue)}
                        </TableCell>
                      )}
                      {visibleColumns.desconto && (
                        <TableCell className="py-3.5 px-5 text-right font-medium text-blue-600 dark:text-blue-400 print:text-black">
                          {formatCurrency(p.totalDiscount || 0)}
                        </TableCell>
                      )}
                      {visibleColumns.lucro && (
                        <TableCell className="py-3.5 px-5 text-right font-semibold text-emerald-600 dark:text-emerald-500 print:text-black">
                          {formatCurrency(p.profit)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Search Modal */}
      <Dialog open={isAdvancedSearchOpen} onOpenChange={setIsAdvancedSearchOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <SlidersHorizontal className="h-5 w-5 text-slate-700" />
              Busca Avançada
            </DialogTitle>
            <DialogDescription>
              Ajuste filtros adicionais para detalhar o relatório de produtos vendidos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Filtro Filial/Loja */}
            {branchesEnabled && (
              <div className="space-y-1">
                <Label htmlFor="branch">Loja / Filial</Label>
                <Select 
                  value={tempFilters.branchId} 
                  onValueChange={(val) => setTempFilters(prev => ({ ...prev, branchId: val }))}
                >
                  <SelectTrigger id="branch" className="rounded-xl h-10 border-slate-200">
                    <SelectValue placeholder="Todas as Lojas" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Todas as Lojas</SelectItem>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Filtro Vendedor/Operador */}
            <div className="space-y-1">
              <Label htmlFor="seller">Vendedor / Operador</Label>
              <Select 
                value={tempFilters.userId} 
                onValueChange={(val) => setTempFilters(prev => ({ ...prev, userId: val }))}
              >
                <SelectTrigger id="seller" className="rounded-xl h-10 border-slate-200">
                  <SelectValue placeholder="Todos os Vendedores" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todos os Vendedores</SelectItem>
                  {usersList.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Cliente */}
            <div className="space-y-1">
              <Label htmlFor="customer">Cliente</Label>
              <Select 
                value={tempFilters.customerId} 
                onValueChange={(val) => setTempFilters(prev => ({ ...prev, customerId: val }))}
              >
                <SelectTrigger id="customer" className="rounded-xl h-10 border-slate-200">
                  <SelectValue placeholder="Todos os Clientes" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todos os Clientes</SelectItem>
                  {customersList.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Produto Específico */}
            <div className="space-y-1">
              <Label htmlFor="product">Produto</Label>
              <Select 
                value={tempFilters.productId} 
                onValueChange={(val) => setTempFilters(prev => ({ ...prev, productId: val }))}
              >
                <SelectTrigger id="product" className="rounded-xl h-10 border-slate-200">
                  <SelectValue placeholder="Todos os Produtos" />
                </SelectTrigger>
                <SelectContent className="rounded-xl animate-none max-h-56">
                  <SelectItem value="all">Todos os Produtos</SelectItem>
                  {productsList.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Grupo/Categoria */}
            <div className="space-y-1">
              <Label htmlFor="category">Categoria / Grupo</Label>
              <Select 
                value={tempFilters.category} 
                onValueChange={(val) => setTempFilters(prev => ({ ...prev, category: val }))}
              >
                <SelectTrigger id="category" className="rounded-xl h-10 border-slate-200">
                  <SelectValue placeholder="Todas as Categorias" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categoriesList.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Situação/Status */}
            <div className="space-y-1">
              <Label htmlFor="situation">Situação da Venda</Label>
              <Select 
                value={tempFilters.situation} 
                onValueChange={(val) => setTempFilters(prev => ({ ...prev, situation: val }))}
              >
                <SelectTrigger id="situation" className="rounded-xl h-10 border-slate-200">
                  <SelectValue placeholder="Concluídas" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todas as Situações</SelectItem>
                  <SelectItem value="concluida">Apenas Concluídas</SelectItem>
                  <SelectItem value="cancelada">Apenas Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button 
              variant="outline" 
              onClick={handleResetAdvancedFilters}
              className="rounded-xl"
            >
              Limpar Filtros
            </Button>
            <Button 
              onClick={handleApplyAdvancedFilters}
              className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            >
              Aplicar Filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rodapé Exclusivo para Impressão Física */}
      <div className="hidden print:flex items-center justify-between border-t border-slate-200 pt-4 mt-8 text-xs text-slate-400">
        <span>Relatório gerado pelo sistema JUGA Sistemas</span>
        <span>Página 1</span>
      </div>
    </div>
  );
}
