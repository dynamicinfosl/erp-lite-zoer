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
  BarChart3,
  DollarSign,
  ArrowUp,
  FileDown,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { useBranch } from '@/contexts/BranchContext';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface SaleRow {
  id: string;
  saleNumber: string;
  customerName: string;
  date: string;
  dateRaw: string;
  deliveryDate: string;
  status: string;
  statusRaw: string | null;
  value: number;
  cost: number;
  discount: number;
  profit: number;
  paymentMethod: string;
  paymentMethodLabel: string;
  saleType: string;
  saleSource: string;
  channel: string;
  sellerName: string;
  carrierName: string;
}

interface PaymentMethodTotal {
  method: string;
  label: string;
  amount: number;
}

interface ReportData {
  totals: {
    value: number;
    cost: number;
    discount: number;
    freight: number;
    profit: number;
    margin: number;
    salesCount: number;
    averageTicket: number;
  };
  paymentMethods: PaymentMethodTotal[];
  sales: SaleRow[];
}

const emptyTotals = {
  value: 0,
  cost: 0,
  discount: 0,
  freight: 0,
  profit: 0,
  margin: 0,
  salesCount: 0,
  averageTicket: 0,
};

const defaultFilters = {
  branchId: 'all',
  saleType: 'all',
  saleSource: 'all',
  customerId: 'all',
  customerName: '',
  productId: 'all',
  serviceName: '',
  userId: 'all',
  situation: 'all',
  paymentMethod: 'all',
  carrierName: '',
  costCenter: 'all',
  deliveryStart: '',
  deliveryEnd: '',
  showDetailed: true,
  considerReturns: false,
  showChannel: false,
};

export default function RelatorioVendasPage() {
  const { tenant } = useSimpleAuth();
  const { branches, enabled: branchesEnabled } = useBranch();

  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    };
  });

  const [filters, setFilters] = useState({ ...defaultFilters });
  const [tempFilters, setTempFilters] = useState({ ...defaultFilters });
  const [tempDateRange, setTempDateRange] = useState(dateRange);

  const [usersList, setUsersList] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData>({
    totals: { ...emptyTotals },
    paymentMethods: [],
    sales: [],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState({
    cliente: true,
    data: true,
    prazoEntrega: true,
    situacao: true,
    valor: true,
    canal: false,
    vendedor: false,
    formaPagamento: false,
  });

  useEffect(() => {
    if (!tenant?.id) return;

    const loadFilterOptions = async () => {
      try {
        const usersRes = await fetch(`/next_api/tenant-users?tenant_id=${encodeURIComponent(tenant.id)}`);
        if (usersRes.ok) {
          const res = await usersRes.json();
          setUsersList(Array.isArray(res.data) ? res.data : []);
        }

        const customersRes = await fetch(`/next_api/customers?tenant_id=${encodeURIComponent(tenant.id)}`);
        if (customersRes.ok) {
          const res = await customersRes.json();
          setCustomersList(Array.isArray(res.data) ? res.data : []);
        }

        const productsRes = await fetch(`/next_api/products?tenant_id=${encodeURIComponent(tenant.id)}`);
        if (productsRes.ok) {
          const res = await productsRes.json();
          setProductsList(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.error('Erro ao carregar opções dos filtros:', err);
      }
    };

    loadFilterOptions();
  }, [tenant?.id]);

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
      if (filters.customerName.trim()) params.append('customer_name', filters.customerName.trim());
      if (filters.productId && filters.productId !== 'all') params.append('product_id', filters.productId);
      if (filters.saleType && filters.saleType !== 'all') params.append('sale_type', filters.saleType);
      if (filters.saleSource && filters.saleSource !== 'all') params.append('sale_source', filters.saleSource);
      if (filters.situation && filters.situation !== 'all') params.append('situation', filters.situation);
      if (filters.paymentMethod && filters.paymentMethod !== 'all') params.append('payment_method', filters.paymentMethod);
      if (filters.carrierName.trim()) params.append('carrier_name', filters.carrierName.trim());
      if (filters.deliveryStart) params.append('delivery_start', filters.deliveryStart);
      if (filters.deliveryEnd) params.append('delivery_end', filters.deliveryEnd);

      const res = await fetch(`/next_api/reports/sales-report?${params.toString()}`);
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

  useEffect(() => {
    setVisibleColumns((v) => ({ ...v, canal: filters.showChannel }));
  }, [filters.showChannel]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatNumber = (val: number) =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const filteredSales = useMemo(() => {
    if (!searchTerm.trim()) return data.sales;
    const term = searchTerm.toLowerCase();
    return data.sales.filter(
      (s) =>
        s.customerName.toLowerCase().includes(term) ||
        s.saleNumber?.toLowerCase().includes(term) ||
        s.paymentMethodLabel.toLowerCase().includes(term) ||
        s.sellerName.toLowerCase().includes(term)
    );
  }, [data.sales, searchTerm]);

  const handleOpenAdvancedSearch = () => {
    setTempFilters({ ...filters });
    setTempDateRange({ ...dateRange });
    setIsAdvancedSearchOpen((open) => !open);
  };

  const handleGenerateReport = () => {
    setFilters({ ...tempFilters });
    setDateRange({ ...tempDateRange });
    setIsAdvancedSearchOpen(false);
  };

  const handleClearFilters = () => {
    const cleared = { ...defaultFilters };
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const range = {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    };
    setTempFilters(cleared);
    setFilters(cleared);
    setTempDateRange(range);
    setDateRange(range);
    setIsAdvancedSearchOpen(false);
  };

  const currentSelectedMonthText = useMemo(() => {
    const startObj = new Date(dateRange.start + 'T12:00:00');
    return startObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [dateRange]);

  const handlePrint = () => window.print();

  const handleExportExcel = () => {
    try {
      const headers = [
        'Cliente',
        'Data',
        'Prazo de entrega',
        'Situação',
        'Valor',
        'Forma de pagamento',
        'Canal',
        'Vendedor',
      ];
      const rows = filteredSales.map((s) => [
        s.customerName,
        s.date,
        s.deliveryDate,
        s.status,
        s.value.toFixed(2).replace('.', ','),
        s.paymentMethodLabel,
        s.channel,
        s.sellerName,
      ]);

      const totalsRow = [
        'TOTAL',
        '',
        '',
        `${data.totals.salesCount} vendas`,
        data.totals.value.toFixed(2).replace('.', ','),
        '',
        '',
        '',
      ];

      const csvContent =
        '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';')), totalsRow.join(';')].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-vendas-${dateRange.start}_a_${dateRange.end}.csv`;
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

  const handleExportPDF = () => {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let y = 15;

      pdf.setFillColor(30, 64, 175);
      pdf.roundedRect(margin, y - 5, 8, 8, 1.8, 1.8, 'F');
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.8);
      pdf.line(margin + 2.5, y + 1, margin + 2.5, y - 1);
      pdf.line(margin + 2.5, y + 1, margin + 5, y + 1);
      pdf.setFillColor(14, 165, 233);
      pdf.circle(margin + 5, y - 2, 0.7, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      pdf.setTextColor(15, 23, 42);
      pdf.text('JUGA', margin + 10.5, y + 1);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Sistemas', margin + 25.5, y + 1);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Relatório de Vendas', pageWidth - margin, y + 1, { align: 'right' });

      y += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(148, 163, 184);
      const periodText = `Período: ${new Date(dateRange.start + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(dateRange.end + 'T12:00:00').toLocaleDateString('pt-BR')}`;
      pdf.text(periodText, margin, y);
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - margin, y, { align: 'right' });

      y += 5;
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);

      y += 8;
      const cardWidth = 56;
      const cardHeight = 28;
      const cardGap = 5;
      const rx = 2.5;

      // Valor total
      pdf.setFillColor(236, 253, 245);
      pdf.roundedRect(margin, y, cardWidth, cardHeight, rx, rx, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(16, 185, 129);
      pdf.text('VALOR TOTAL', margin + 4, y + 5.5);
      pdf.setFontSize(12);
      pdf.setTextColor(5, 150, 105);
      pdf.text(formatNumber(data.totals.value), margin + 4, y + 13);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Qtd. vendas: ${data.totals.salesCount}`, margin + 4, y + 20);

      // Custos
      const c2X = margin + cardWidth + cardGap;
      pdf.setFillColor(254, 242, 242);
      pdf.roundedRect(c2X, y, cardWidth, cardHeight, rx, rx, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(239, 68, 68);
      pdf.text('CUSTOS', c2X + 4, y + 5.5);
      pdf.setFontSize(12);
      pdf.setTextColor(220, 38, 38);
      pdf.text(formatNumber(data.totals.cost), c2X + 4, y + 13);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`${formatNumber(data.totals.discount)} em descontos`, c2X + 4, y + 20);

      // Lucro
      const c3X = c2X + cardWidth + cardGap;
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(c3X, y, cardWidth, cardHeight, rx, rx, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text('LUCRO', c3X + 4, y + 5.5);
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text(formatNumber(data.totals.profit), c3X + 4, y + 13);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`${formatNumber(data.totals.margin)}% margem · Ticket ${formatNumber(data.totals.averageTicket)}`, c3X + 4, y + 20);

      y += cardHeight + 8;

      // Formas de pagamento
      if (data.paymentMethods.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(71, 85, 105);
        pdf.text('FORMAS DE PAGAMENTO', margin, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        data.paymentMethods.forEach((pm) => {
          pdf.setTextColor(15, 23, 42);
          pdf.text(`${formatNumber(pm.amount)}  ${pm.label}`, margin, y);
          y += 4.5;
        });
        y += 4;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text('DETALHAMENTO DE VENDAS', margin, y);

      y += 4;
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, y, pageWidth - 2 * margin, 7.5, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, y, pageWidth - margin, y);
      pdf.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

      y += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Cliente', margin + 3, y);
      pdf.text('Data', margin + 70, y);
      pdf.text('Entrega', margin + 95, y);
      pdf.text('Situação', margin + 125, y);
      pdf.text('Valor', pageWidth - margin - 3, y, { align: 'right' });
      y += 2.5;

      let pageCount = 1;
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

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(51, 65, 85);

      filteredSales.forEach((s, idx) => {
        y += 5.5;
        if (y > pageHeight - 22) {
          drawFooter(pageCount);
          pdf.addPage();
          pageCount++;
          y = 20;
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, y, pageWidth - 2 * margin, 7.5, 'F');
          pdf.setDrawColor(226, 232, 240);
          pdf.line(margin, y, pageWidth - margin, y);
          pdf.line(margin, y + 7.5, pageWidth - margin, y + 7.5);
          y += 5;
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.setTextColor(71, 85, 105);
          pdf.text('Cliente', margin + 3, y);
          pdf.text('Data', margin + 70, y);
          pdf.text('Entrega', margin + 95, y);
          pdf.text('Situação', margin + 125, y);
          pdf.text('Valor', pageWidth - margin - 3, y, { align: 'right' });
          y += 8;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(51, 65, 85);
        }

        if (idx % 2 === 1) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, y - 4, pageWidth - 2 * margin, 5.5, 'F');
        }

        const name = s.customerName.length > 28 ? s.customerName.slice(0, 25) + '...' : s.customerName;
        pdf.text(name, margin + 3, y);
        pdf.text(s.date, margin + 70, y);
        pdf.text(s.deliveryDate, margin + 95, y);
        pdf.text(s.status, margin + 125, y);
        pdf.setTextColor(5, 150, 105);
        pdf.text(formatCurrency(s.value), pageWidth - margin - 3, y, { align: 'right' });
        pdf.setTextColor(51, 65, 85);
      });

      drawFooter(pageCount);
      pdf.save(`relatorio-vendas-${dateRange.start}.pdf`);
      toast.success('Relatório PDF baixado com sucesso.');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar relatório em PDF.');
    }
  };

  const colSpan =
    Object.values(visibleColumns).filter(Boolean).length || 1;

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto print-container">
      {/* Cabeçalho de impressão */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-slate-300 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <img src="/logo-juga.svg" alt="JUGA Logo" className="h-10 w-auto object-contain" />
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold text-slate-900">Relatório de vendas</h1>
          <p className="text-xs text-slate-500 font-medium">
            Período: {new Date(dateRange.start + 'T12:00:00').toLocaleDateString('pt-BR')} até{' '}
            {new Date(dateRange.end + 'T12:00:00').toLocaleDateString('pt-BR')}
          </p>
          <p className="text-[10px] text-slate-400">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Home className="h-3.5 w-3.5" />
          <span>Início</span>
          <ChevronRight className="h-3 w-3" />
          <span>Relatórios de vendas</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-800 dark:text-slate-200 font-medium">Vendas</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-5 gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Relatório de vendas
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end">
          <DropdownMenu open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 px-4 rounded-xl gap-2 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              >
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
                    onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="end">Até</Label>
                  <Input
                    id="end"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleOpenAdvancedSearch}
            className="h-10 px-4 rounded-xl gap-2 font-semibold bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white"
          >
            <Search className="h-4 w-4" />
            Busca avançada
          </Button>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 px-3 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-medium"
              >
                <Columns className="h-4 w-4 mr-2" />
                Gerenciar colunas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-lg">
              <DropdownMenuLabel>Colunas Visíveis</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={visibleColumns.cliente}
                onCheckedChange={(checked) => setVisibleColumns((v) => ({ ...v, cliente: !!checked }))}
              >
                Cliente
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.data}
                onCheckedChange={(checked) => setVisibleColumns((v) => ({ ...v, data: !!checked }))}
              >
                Data
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.prazoEntrega}
                onCheckedChange={(checked) => setVisibleColumns((v) => ({ ...v, prazoEntrega: !!checked }))}
              >
                Prazo de entrega
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.situacao}
                onCheckedChange={(checked) => setVisibleColumns((v) => ({ ...v, situacao: !!checked }))}
              >
                Situação
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.valor}
                onCheckedChange={(checked) => setVisibleColumns((v) => ({ ...v, valor: !!checked }))}
              >
                Valor
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.formaPagamento}
                onCheckedChange={(checked) => setVisibleColumns((v) => ({ ...v, formaPagamento: !!checked }))}
              >
                Forma de pagamento
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.canal}
                onCheckedChange={(checked) => setVisibleColumns((v) => ({ ...v, canal: !!checked }))}
              >
                Canal
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.vendedor}
                onCheckedChange={(checked) => setVisibleColumns((v) => ({ ...v, vendedor: !!checked }))}
              >
                Vendedor
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={handlePrint}
            className="h-9 px-3 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-medium"
          >
            <Printer className="h-4 w-4 mr-2 text-rose-500" />
            Imprimir
          </Button>

          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 px-3 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-medium"
          >
            <Download className="h-4 w-4 mr-2 text-emerald-600" />
            Exportar
          </Button>

          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="h-9 px-3 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-medium"
          >
            <FileDown className="h-4 w-4 mr-2 text-blue-500" />
            Baixar PDF
          </Button>
        </div>

        <div className="relative w-full max-w-xs sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Filtrar na tabela..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 border-slate-200 dark:border-slate-800 rounded-lg focus-visible:ring-slate-400"
          />
        </div>
      </div>

      {/* Painel Busca Avançada (expandível, como no print) */}
      {isAdvancedSearchOpen && (
        <Card className="no-print border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-5 space-y-5">
            {branchesEnabled && (
              <div className="space-y-1 max-w-xs">
                <Label>Loja / Filial</Label>
                <Select
                  value={tempFilters.branchId}
                  onValueChange={(val) => setTempFilters((prev) => ({ ...prev, branchId: val }))}
                >
                  <SelectTrigger className="rounded-lg h-10 border-slate-200">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select
                  value={tempFilters.saleType}
                  onValueChange={(val) => setTempFilters((prev) => ({ ...prev, saleType: val }))}
                >
                  <SelectTrigger className="rounded-lg h-10 border-slate-200">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="balcao">Balcão</SelectItem>
                    <SelectItem value="entrega">Entrega</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Data da venda</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={tempDateRange.start}
                    onChange={(e) => setTempDateRange((prev) => ({ ...prev, start: e.target.value }))}
                    className="rounded-lg h-10 border-slate-200"
                  />
                  <Input
                    type="date"
                    value={tempDateRange.end}
                    onChange={(e) => setTempDateRange((prev) => ({ ...prev, end: e.target.value }))}
                    className="rounded-lg h-10 border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Data de entrega</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={tempFilters.deliveryStart}
                    onChange={(e) => setTempFilters((prev) => ({ ...prev, deliveryStart: e.target.value }))}
                    className="rounded-lg h-10 border-slate-200"
                  />
                  <Input
                    type="date"
                    value={tempFilters.deliveryEnd}
                    onChange={(e) => setTempFilters((prev) => ({ ...prev, deliveryEnd: e.target.value }))}
                    className="rounded-lg h-10 border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Canal</Label>
                <Select
                  value={tempFilters.saleSource}
                  onValueChange={(val) => setTempFilters((prev) => ({ ...prev, saleSource: val }))}
                >
                  <SelectTrigger className="rounded-lg h-10 border-slate-200">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pdv">PDV</SelectItem>
                    <SelectItem value="produtos">Vendas de produtos</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Cliente</Label>
                <Input
                  placeholder="Digite para buscar"
                  value={tempFilters.customerName}
                  onChange={(e) => setTempFilters((prev) => ({ ...prev, customerName: e.target.value, customerId: 'all' }))}
                  className="rounded-lg h-10 border-slate-200"
                  list="customers-datalist"
                />
                <datalist id="customers-datalist">
                  {customersList.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <Label>Produto</Label>
                <Select
                  value={tempFilters.productId}
                  onValueChange={(val) => setTempFilters((prev) => ({ ...prev, productId: val }))}
                >
                  <SelectTrigger className="rounded-lg h-10 border-slate-200">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="all">Todos</SelectItem>
                    {productsList.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Serviço</Label>
                <Input
                  placeholder="Digite para buscar"
                  value={tempFilters.serviceName}
                  onChange={(e) => setTempFilters((prev) => ({ ...prev, serviceName: e.target.value }))}
                  className="rounded-lg h-10 border-slate-200"
                  disabled
                  title="Filtro de serviços em breve"
                />
              </div>

              <div className="space-y-1">
                <Label>Vendedor</Label>
                <Select
                  value={tempFilters.userId}
                  onValueChange={(val) => setTempFilters((prev) => ({ ...prev, userId: val }))}
                >
                  <SelectTrigger className="rounded-lg h-10 border-slate-200">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {usersList.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Situação</Label>
                <Select
                  value={tempFilters.situation}
                  onValueChange={(val) => setTempFilters((prev) => ({ ...prev, situation: val }))}
                >
                  <SelectTrigger className="rounded-lg h-10 border-slate-200">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="concluida">Concretizada</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Forma de pagamento</Label>
                <Select
                  value={tempFilters.paymentMethod}
                  onValueChange={(val) => setTempFilters((prev) => ({ ...prev, paymentMethod: val }))}
                >
                  <SelectTrigger className="rounded-lg h-10 border-slate-200">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro à Vista</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                    <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                    <SelectItem value="a_prazo">A Prazo</SelectItem>
                    <SelectItem value="boleto_bancario">Boleto Bancário</SelectItem>
                    <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Transportadora</Label>
                <Input
                  placeholder="Digite para buscar"
                  value={tempFilters.carrierName}
                  onChange={(e) => setTempFilters((prev) => ({ ...prev, carrierName: e.target.value }))}
                  className="rounded-lg h-10 border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <Label>Centro de custo</Label>
                <Select
                  value={tempFilters.costCenter}
                  onValueChange={(val) => setTempFilters((prev) => ({ ...prev, costCenter: val }))}
                >
                  <SelectTrigger className="rounded-lg h-10 border-slate-200">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-5">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <Checkbox
                    checked={tempFilters.showDetailed}
                    onCheckedChange={(checked) =>
                      setTempFilters((prev) => ({ ...prev, showDetailed: !!checked }))
                    }
                  />
                  Exibir relatório detalhado
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <Checkbox
                    checked={tempFilters.considerReturns}
                    onCheckedChange={(checked) =>
                      setTempFilters((prev) => ({ ...prev, considerReturns: !!checked }))
                    }
                  />
                  Considerar devoluções
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <Checkbox
                    checked={tempFilters.showChannel}
                    onCheckedChange={(checked) =>
                      setTempFilters((prev) => ({ ...prev, showChannel: !!checked }))
                    }
                  />
                  Exibir canal de venda
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleGenerateReport}
                  className="h-9 px-4 rounded-lg gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="h-4 w-4" />
                  Gerar
                </Button>
                <Button
                  onClick={handleClearFilters}
                  className="h-9 px-4 rounded-lg gap-2 font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  <X className="h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards — layout do print */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Valor total */}
        <Card className="print-card border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Valor total
                </span>
                <h2 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-500 tracking-tight print-card-value truncate">
                  {loading ? '...' : formatNumber(data.totals.value)}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">Total vendido no período</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-full text-emerald-500 shrink-0">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
              <span className="text-slate-500">Qtd. vendas</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {loading ? '...' : data.totals.salesCount}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Custos */}
        <Card className="print-card border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Custos
                </span>
                <h2 className="text-3xl font-extrabold text-rose-600 dark:text-rose-500 tracking-tight print-card-value truncate">
                  {loading ? '...' : formatNumber(data.totals.cost)}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {loading ? '...' : `${formatNumber(data.totals.discount)} em descontos`}
                </p>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-full text-rose-500 shrink-0">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
              <span className="text-slate-500">Frete</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {loading ? '...' : formatNumber(data.totals.freight)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Lucro */}
        <Card className="print-card border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Lucro
                </span>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight print-card-value truncate">
                  {loading ? '...' : formatNumber(data.totals.profit)}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {loading ? '...' : `${formatNumber(data.totals.margin)}% de margem`}
                </p>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 shrink-0">
                <ArrowUp className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
              <span className="text-slate-500">Ticket médio</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {loading ? '...' : formatNumber(data.totals.averageTicket)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formas de pagamento */}
      <div className="print-card space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">
          Formas de pagamento
        </h3>
        {loading ? (
          <p className="text-center text-sm text-slate-400 py-4">Carregando...</p>
        ) : data.paymentMethods.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-4">Nenhuma venda no período</p>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-2">
            {data.paymentMethods.map((pm) => (
              <div key={pm.method} className="text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {formatNumber(pm.amount)}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{pm.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabela detalhada */}
      {filters.showDetailed && (
        <Card className="print-card border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="print-table w-full text-left border-collapse">
                <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                  <TableRow>
                    {visibleColumns.cliente && (
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 px-5">
                        Cliente
                      </TableHead>
                    )}
                    {visibleColumns.data && (
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 px-5">
                        Data
                      </TableHead>
                    )}
                    {visibleColumns.prazoEntrega && (
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 px-5">
                        Prazo de entrega
                      </TableHead>
                    )}
                    {visibleColumns.situacao && (
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 px-5">
                        Situação
                      </TableHead>
                    )}
                    {visibleColumns.formaPagamento && (
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 px-5">
                        Forma de pagamento
                      </TableHead>
                    )}
                    {visibleColumns.canal && (
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 px-5">
                        Canal
                      </TableHead>
                    )}
                    {visibleColumns.vendedor && (
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 px-5">
                        Vendedor
                      </TableHead>
                    )}
                    {visibleColumns.valor && (
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right py-3.5 px-5">
                        Valor
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={colSpan} className="text-center py-12 text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400" />
                          <span>Carregando relatório...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={colSpan} className="text-center py-12 text-slate-500">
                        Nenhuma venda encontrada para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSales.map((s, index) => (
                      <TableRow
                        key={s.id || index}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 even:bg-slate-50/40 dark:even:bg-slate-900/20"
                      >
                        {visibleColumns.cliente && (
                          <TableCell className="py-3.5 px-5 font-medium text-slate-800 dark:text-slate-200">
                            {s.customerName}
                          </TableCell>
                        )}
                        {visibleColumns.data && (
                          <TableCell className="py-3.5 px-5 text-slate-600 dark:text-slate-400">
                            {s.date}
                          </TableCell>
                        )}
                        {visibleColumns.prazoEntrega && (
                          <TableCell className="py-3.5 px-5 text-slate-600 dark:text-slate-400">
                            {s.deliveryDate}
                          </TableCell>
                        )}
                        {visibleColumns.situacao && (
                          <TableCell className="py-3.5 px-5">
                            <Badge
                              className={
                                s.status === 'Concretizada'
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 font-medium'
                                  : s.status === 'Cancelada'
                                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-100 border-0 font-medium'
                                    : 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 font-medium'
                              }
                            >
                              {s.status}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.formaPagamento && (
                          <TableCell className="py-3.5 px-5 text-slate-600 dark:text-slate-400">
                            {s.paymentMethodLabel}
                          </TableCell>
                        )}
                        {visibleColumns.canal && (
                          <TableCell className="py-3.5 px-5 text-slate-600 dark:text-slate-400">
                            {s.channel}
                          </TableCell>
                        )}
                        {visibleColumns.vendedor && (
                          <TableCell className="py-3.5 px-5 text-slate-600 dark:text-slate-400">
                            {s.sellerName || '—'}
                          </TableCell>
                        )}
                        {visibleColumns.valor && (
                          <TableCell className="py-3.5 px-5 text-right font-semibold text-emerald-600 dark:text-emerald-500 print:text-black">
                            {formatNumber(s.value)}
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
      )}

      <div className="hidden print:flex items-center justify-between border-t border-slate-200 pt-4 mt-8 text-xs text-slate-400">
        <span>Relatório gerado pelo sistema JUGA Sistemas</span>
        <span>Página 1</span>
      </div>
    </div>
  );
}
