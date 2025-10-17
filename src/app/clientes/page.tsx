'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  Users,
  Trash2,
  Edit,
  Eye,
  Phone,
  Mail,
  UserPlus,
  TrendingUp,
  Building,
  UserCheck,
  Activity,
  User,
  CreditCard,
  MapPin,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { ImportPreviewModal } from '@/components/ui/ImportPreviewModal';
import * as XLSX from 'xlsx';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  city: string;
  type: 'PF' | 'PJ';
  status: 'active' | 'inactive';
  created_at: string;
}

interface ColumnVisibility {
  type: boolean;
  phone: boolean;
  document: boolean;
  email: boolean;
  city: boolean;
  status: boolean;
}

export default function ClientesPage() {
  const { tenant } = useSimpleAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState<null | Customer>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);

  // Normalização de cabeçalhos para chaves previsíveis
  const normalizeHeader = (raw: string): string => {
    return String(raw || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s\/]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    type: true,
    phone: true,
    document: true,
    email: true,
    city: true,
    status: true,
  });

  // Filtros avançados
  const [advancedFilters, setAdvancedFilters] = useState({
    phone: '',
    email: '',
    city: '',
    type: '',
    status: ''
  });

  // Estados para formulário
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    city: '',
    type: 'PF' as 'PF' | 'PJ',
    status: 'active' as 'active' | 'inactive',
  });

  // Estados para validação
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Funções de máscara
  const formatPhone = (value: string) => {
    if (!value || typeof value !== 'string') return '';
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCPF = (value: string) => {
    if (!value || typeof value !== 'string') return '';
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatCNPJ = (value: string) => {
    if (!value || typeof value !== 'string') return '';
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  const formatDocument = (value: string, type: 'PF' | 'PJ') => {
    if (!value || typeof value !== 'string') return '';
    return type === 'PF' ? formatCPF(value) : formatCNPJ(value);
  };

  // Função de validação
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!newCustomer.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (newCustomer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email)) {
      errors.email = 'E-mail inválido';
    }

    if (newCustomer.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(newCustomer.phone)) {
      errors.phone = 'Telefone deve estar no formato (11) 99999-9999';
    }

    if (newCustomer.document) {
      if (newCustomer.type === 'PF' && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(newCustomer.document)) {
        errors.document = 'CPF deve estar no formato 000.000.000-00';
      } else if (newCustomer.type === 'PJ' && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(newCustomer.document)) {
        errors.document = 'CNPJ deve estar no formato 00.000.000/0000-00';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Limpar documento quando tipo mudar
  useEffect(() => {
    setNewCustomer(prev => ({ ...prev, document: '' }));
  }, [newCustomer.type]);

  // Carregar clientes quando houver tenant (fallback para ID neutro)
  useEffect(() => {
    const fetchNow = async () => {
      await loadCustomers();
    };
    fetchNow();
  }, [tenant?.id, loadCustomers]);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Sempre usar tenant do contexto, nunca fallback
      if (!tenant?.id) {
        console.log('⚠️ Nenhum tenant disponível, limpando clientes');
        setCustomers([]);
        setLoading(false);
        return;
      }
      
      const url = `/next_api/customers?tenant_id=${encodeURIComponent(tenant.id)}`;
      console.log('🔍 Debug - Carregando clientes para tenant:', tenant.id);
      
      // ✅ CORREÇÃO: Adicionar timeout para evitar loading infinito
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
      
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const txt = await response.text();
        throw new Error('Erro ao carregar clientes: ' + txt);
      }
      
      const data = await response.json();
      const rows = Array.isArray(data?.data) ? data.data : (data?.rows || data || []);
      console.log('🔍 Debug - Clientes carregados:', rows.length, 'clientes');
      setCustomers(rows);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      
      // ✅ CORREÇÃO: Se for timeout ou erro de rede, mostrar lista vazia em vez de erro
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⏰ Timeout ao carregar clientes, mostrando lista vazia');
        setCustomers([]);
      } else {
        toast.error('Erro ao carregar clientes');
        setCustomers([]); // Garantir que sempre para o loading
      }
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  // Filtrar clientes
  const filteredCustomers = Array.isArray(customers) ? customers.filter(customer => {
    const name = (customer.name || '').toString();
    const email = (customer.email || '').toString();
    const document = (customer.document || '').toString();
    const phone = (customer.phone || '').toString();
    const city = (customer.city || '').toString();
    const type = (customer.type || '').toString();
    const status = (customer.status || '').toString();

    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.includes(searchTerm);

    const matchesAdvanced = (!advancedFilters.phone || phone.includes(advancedFilters.phone)) &&
                           (!advancedFilters.email || email.toLowerCase().includes(advancedFilters.email.toLowerCase())) &&
                           (!advancedFilters.city || city.toLowerCase().includes(advancedFilters.city.toLowerCase())) &&
                           (!advancedFilters.type || type === advancedFilters.type) &&
                           (!advancedFilters.status || status === advancedFilters.status);

    return matchesSearch && matchesAdvanced;
  }) : [];

  // Excluir cliente
  const handleDeleteCustomer = async (id: string, name?: string) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir ${name ? name : 'este cliente'}?`);
    if (!confirmed) return;
    try {
      const res = await fetch(`/next_api/customers?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const txt = await res.text();
        console.error('DELETE /next_api/customers falhou', res.status, txt);
        throw new Error(txt || 'Falha ao excluir');
      }
      // Remoção otimista da UI
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success('Cliente excluído com sucesso');
      // Revalida em background
      loadCustomers();
    } catch (err: any) {
      console.error('Erro ao excluir cliente:', err);
      toast.error('Erro ao excluir cliente: ' + (err?.message || ''));
    }
  };

  // Adicionar cliente
  const handleAddCustomer = async () => {
    // Limpar erros anteriores
    setValidationErrors({});
    
    // Validar formulário
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const tenantId = tenant?.id || '00000000-0000-0000-0000-000000000000';
      console.log('🔍 Debug - Tenant ID:', tenantId, 'Tenant object:', tenant);
      
      const response = await fetch('/next_api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          ...newCustomer,
        })
      });

      if (!response.ok) throw new Error('Erro ao adicionar cliente');

      await loadCustomers();
      setShowAddDialog(false);
      setNewCustomer({ name: '', email: '', phone: '', document: '', city: '', type: 'PF', status: 'active' });
      setValidationErrors({});
      toast.success('Cliente adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      toast.error('Erro ao adicionar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir modal para edição
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const openEdit = (customer: Customer) => {
    setNewCustomer({
      name: customer.name || '',
      email: customer.email || '',
      phone: formatPhone(customer.phone || ''),
      document: customer.document || '',
      city: customer.city || '',
      type: (customer.type || 'PF') as 'PF' | 'PJ',
      status: (customer.status || 'active') as 'active' | 'inactive',
    });
    setValidationErrors({});
    setEditingCustomerId(customer.id);
    setShowAddDialog(true);
  };

  // Salvar edição
  const handleSaveEdit = async () => {
    if (!editingCustomerId) return;
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/next_api/customers?id=${encodeURIComponent(editingCustomerId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Cliente atualizado com sucesso');
      setShowAddDialog(false);
      setEditingCustomerId(null);
      setNewCustomer({ name: '', email: '', phone: '', document: '', city: '', type: 'PF', status: 'active' });
      await loadCustomers();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle import
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
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
          return;
        }
        headers = (json[0] as any[]).map(h => String(h || '').trim());
        rows = json.slice(1);
      } else if (ext === 'csv') {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
          toast.error('CSV inválido');
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
              if (quoted && line[i+1] === '"') { cur += '"'; i++; }
              else { quoted = !quoted; }
            } else if (ch === delimiter && !quoted) { values.push(cur); cur = ''; }
            else { cur += ch; }
          }
          values.push(cur);
          return values;
        });
      } else {
        toast.error('Envie um arquivo .xlsx, .xls ou .csv');
        return;
      }

      setImportFileName(file.name);
      setImportHeaders(headers);
      setImportRows(rows);
      setImportErrors([]);
      setShowImportPreview(true);
      setShowImportDialog(false);
    } catch (err) {
      console.error(err);
      toast.error('Falha ao ler arquivo');
    }
  };



  // Botão de diagnóstico: cria um cliente simples para validar a rota
  const testCreateCustomer = async () => {
    try {
      console.log('🧪 Teste API: criando cliente de teste...');
      const res = await fetch('/next_api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenant?.id || '00000000-0000-0000-0000-000000000000', name: 'Cliente Teste API', email: 'teste@example.com' })
      });
      const text = await res.text();
      console.log('🧪 Teste API status:', res.status, 'body:', text);
      if (res.ok) {
        toast.success('API OK: cliente de teste criado');
        await loadCustomers();
      } else {
        toast.error(`API erro ${res.status}: ${text}`);
      }
    } catch (err: any) {
      console.error('🧪 Teste API falhou:', err);
      toast.error('Falha ao chamar API: ' + (err?.message || err));
    }
  };

  // Calcular estatísticas dos clientes
  const customerStats = {
    total: Array.isArray(customers) ? customers.length : 0,
    active: Array.isArray(customers) ? customers.filter(c => c.status === 'active').length : 0,
    inactive: Array.isArray(customers) ? customers.filter(c => c.status === 'inactive').length : 0,
    pf: Array.isArray(customers) ? customers.filter(c => c.type === 'PF').length : 0,
    pj: Array.isArray(customers) ? customers.filter(c => c.type === 'PJ').length : 0,
    newThisMonth: Array.isArray(customers) ? customers.filter(c => {
      const created = new Date(c.created_at);
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
          <h1 className="text-3xl font-bold tracking-tight text-heading">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e informações de contato
          </p>
        </div>
        <Button 
          className="juga-gradient text-white"
          onClick={() => setShowAddDialog(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Cliente
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <JugaKPICard
          title="Total Clientes"
          value={customerStats.total.toLocaleString('pt-BR')}
          description="Clientes cadastrados"
          icon={<Users className="h-4 w-4" />}
          color="primary"
        />
        
        <JugaKPICard
          title="Clientes Ativos"
          value={customerStats.active.toLocaleString('pt-BR')}
          description="Status ativo"
          icon={<UserCheck className="h-4 w-4" />}
          color="success"
          trend="up"
          trendValue="+12%"
        />
        
        <JugaKPICard
          title="Pessoa Física"
          value={customerStats.pf.toLocaleString('pt-BR')}
          description="Clientes PF"
          icon={<Users className="h-4 w-4" />}
          color="accent"
        />
        
        <JugaKPICard
          title="Pessoa Jurídica"
          value={customerStats.pj.toLocaleString('pt-BR')}
          description="Clientes PJ"
          icon={<Building className="h-4 w-4" />}
          color="warning"
        />
        
        <JugaKPICard
          title="Novos Este Mês"
          value={customerStats.newThisMonth.toLocaleString('pt-BR')}
          description="Cadastros recentes"
          icon={<TrendingUp className="h-4 w-4" />}
          color="success"
          trend="up"
          trendValue="+8%"
        />
        
        <JugaKPICard
          title="Taxa Ativação"
          value={`${customerStats.total > 0 ? Math.round((customerStats.active / customerStats.total) * 100) : 0}%`}
          description="Clientes ativos"
          icon={<Activity className="h-4 w-4" />}
          color="primary"
        />
      </div>

      {/* Progress Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <JugaProgressCard
          title="Distribuição por Tipo"
          description="PF vs PJ"
          progress={customerStats.total > 0 ? Math.round((customerStats.pf / customerStats.total) * 100) : 0}
          total={customerStats.total}
          current={customerStats.pf}
          color="accent"
        />
        
        <JugaProgressCard
          title="Status dos Clientes"
          description="Ativos vs Inativos"
          progress={customerStats.total > 0 ? Math.round((customerStats.active / customerStats.total) * 100) : 0}
          total={customerStats.total}
          current={customerStats.active}
          color="success"
        />
        
        <JugaProgressCard
          title="Crescimento Mensal"
          description="Novos clientes"
          progress={customerStats.total > 0 ? Math.round((customerStats.newThisMonth / customerStats.total) * 100) : 0}
          total={customerStats.total}
          current={customerStats.newThisMonth}
          color="primary"
        />
      </div>

      {/* Toolbar */}
      <Card className="juga-card">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Lado esquerdo - Botões de ação */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={testCreateCustomer} 
                title="Diagnóstico: testar POST /next_api/customers"
                className="border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
              >
                Teste API
              </Button>

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
                      Importar Clientes
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
                <DropdownMenuContent className="w-64 z-50 bg-white border border-gray-200 shadow-xl rounded-lg">
                  <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-gray-900 bg-gray-50 border-b border-gray-100">
                    <Settings2 className="h-4 w-4 inline mr-2" />
                    Mostrar Colunas
                  </DropdownMenuLabel>
                  
                  <div className="py-1">
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.type}
                      onCheckedChange={(checked) => 
                        setColumnVisibility(prev => ({ ...prev, type: checked || false }))
                      }
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center"
                    >
                      <User className="h-4 w-4 mr-3 text-gray-400" />
                      Tipo de Pessoa
                    </DropdownMenuCheckboxItem>
                    
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.phone}
                      onCheckedChange={(checked) => 
                        setColumnVisibility(prev => ({ ...prev, phone: checked || false }))
                      }
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center"
                    >
                      <Phone className="h-4 w-4 mr-3 text-gray-400" />
                      Telefone
                    </DropdownMenuCheckboxItem>
                    
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.document}
                      onCheckedChange={(checked) => 
                        setColumnVisibility(prev => ({ ...prev, document: checked || false }))
                      }
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center"
                    >
                      <CreditCard className="h-4 w-4 mr-3 text-gray-400" />
                      CPF/CNPJ
                    </DropdownMenuCheckboxItem>
                    
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.email}
                      onCheckedChange={(checked) => 
                        setColumnVisibility(prev => ({ ...prev, email: checked || false }))
                      }
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center"
                    >
                      <Mail className="h-4 w-4 mr-3 text-gray-400" />
                      E-mail
                    </DropdownMenuCheckboxItem>
                    
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.city}
                      onCheckedChange={(checked) => 
                        setColumnVisibility(prev => ({ ...prev, city: checked || false }))
                      }
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center"
                    >
                      <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                      Cidade
                    </DropdownMenuCheckboxItem>
                    
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.status}
                      onCheckedChange={(checked) => 
                        setColumnVisibility(prev => ({ ...prev, status: checked || false }))
                      }
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-3 text-gray-400" />
                      Status
                    </DropdownMenuCheckboxItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Lado direito - Busca */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar clientes..."
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
                  placeholder="Telefone..."
                  value={advancedFilters.phone}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, phone: e.target.value }))}
                />
                <Input
                  placeholder="E-mail..."
                  value={advancedFilters.email}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  placeholder="Cidade..."
                  value={advancedFilters.city}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, city: e.target.value }))}
                />
                <select 
                  className="px-3 py-2 border rounded-md"
                  value={advancedFilters.type}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="">Todos os tipos</option>
                  <option value="PF">Pessoa Física</option>
                  <option value="PJ">Pessoa Jurídica</option>
                </select>
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
          <CardTitle className="flex items-center gap-2 text-heading">
            <Users className="h-5 w-5" />
            Lista de Clientes ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando clientes...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  {columnVisibility.type && <TableHead>Tipo</TableHead>}
                  {columnVisibility.document && <TableHead>CPF/CNPJ</TableHead>}
                  {columnVisibility.phone && <TableHead>Telefone</TableHead>}
                  {columnVisibility.email && <TableHead>E-mail</TableHead>}
                  {columnVisibility.city && <TableHead>Cidade</TableHead>}
                  {columnVisibility.status && <TableHead>Status</TableHead>}
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    {columnVisibility.type && (
                      <TableCell>
                        <Badge variant={customer.type === 'PF' ? 'default' : 'secondary'}>
                          {customer.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                        </Badge>
                      </TableCell>
                    )}
                    {columnVisibility.document && (
                      <TableCell>{formatDocument(customer.document || '', customer.type || 'PF')}</TableCell>
                    )}
                    {columnVisibility.phone && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {formatPhone(customer.phone || '')}
                        </div>
                      </TableCell>
                    )}
                    {columnVisibility.email && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {customer.email}
                        </div>
                      </TableCell>
                    )}
                    {columnVisibility.city && <TableCell>{customer.city}</TableCell>}
                    {columnVisibility.status && (
                      <TableCell>
                        <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                          {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center justify-start gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowDetailsDialog(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEdit(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteCustomer(customer.id, customer.name)}
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

          {filteredCustomers.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Adicionar/Editar Cliente */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { 
        if (!open) { 
          setShowAddDialog(false); 
          setEditingCustomerId(null); 
          setValidationErrors({}); 
          setNewCustomer({ name: '', email: '', phone: '', document: '', city: '', type: 'PF', status: 'active' });
        } else { 
          setShowAddDialog(true); 
        } 
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          <div className="relative">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">{editingCustomerId ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</DialogTitle>
                  <DialogDescription className="text-blue-100 mt-1">
                    {editingCustomerId ? 'Atualize as informações do cliente.' : 'Preencha as informações do cliente abaixo. Os campos marcados com * são obrigatórios.'}
                  </DialogDescription>
                </div>
              </div>
            </div>
            
            {/* Conteúdo principal */}
            <div className="p-6 bg-slate-800/50 backdrop-blur-sm">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-200">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome completo do cliente"
                    className={`h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400 ${validationErrors.name ? 'border-red-400 focus:border-red-400' : ''}`}
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-red-400">{validationErrors.name}</p>
                  )}
                </div>
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="type" className="text-sm font-medium text-slate-200">Tipo de Cliente</Label>
                    <Select 
                      value={newCustomer.type}
                      onValueChange={(value) => setNewCustomer(prev => ({ ...prev, type: value as 'PF' | 'PJ' }))}
                    >
                      <SelectTrigger className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600 shadow-xl">
                        <SelectItem value="PF" className="hover:bg-slate-600 text-white">Pessoa Física</SelectItem>
                        <SelectItem value="PJ" className="hover:bg-slate-600 text-white">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="document" className="text-sm font-medium text-slate-200">CPF/CNPJ</Label>
                    <Input
                      id="document"
                      value={newCustomer.document}
                      onChange={(e) => {
                        const formatted = formatDocument(e.target.value, newCustomer.type);
                        setNewCustomer(prev => ({ ...prev, document: formatted }));
                      }}
                      placeholder={newCustomer.type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                      className={`h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400 ${validationErrors.document ? 'border-red-400 focus:border-red-400' : ''}`}
                    />
                    {validationErrors.document && (
                      <p className="text-sm text-red-400">{validationErrors.document}</p>
                    )}
                  </div>
                </div>

                {/* Campo de Status */}
                <div className="grid gap-3">
                  <Label htmlFor="status" className="text-sm font-medium text-slate-200">Status do Cliente</Label>
                  <Select 
                    value={newCustomer.status}
                    onValueChange={(value) => setNewCustomer(prev => ({ ...prev, status: value as 'active' | 'inactive' }))}
                  >
                    <SelectTrigger className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600 shadow-xl">
                      <SelectItem value="active" className="hover:bg-slate-600 text-white">Ativo</SelectItem>
                      <SelectItem value="inactive" className="hover:bg-slate-600 text-white">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            
                <div className="grid gap-3">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-200">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    className={`h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400 ${validationErrors.email ? 'border-red-400 focus:border-red-400' : ''}`}
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-400">{validationErrors.email}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="phone" className="text-sm font-medium text-slate-200">Telefone</Label>
                    <Input
                      id="phone"
                      value={newCustomer.phone}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        setNewCustomer(prev => ({ ...prev, phone: formatted }));
                      }}
                      placeholder="(11) 99999-9999"
                      className={`h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400 ${validationErrors.phone ? 'border-red-400 focus:border-red-400' : ''}`}
                    />
                    {validationErrors.phone && (
                      <p className="text-sm text-red-400">{validationErrors.phone}</p>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="city" className="text-sm font-medium text-slate-200">Cidade</Label>
                    <Input
                      id="city"
                      value={newCustomer.city}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="São Paulo"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
            {/* Rodapé com gradiente */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-b-lg border-t border-slate-600/50">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => { setShowAddDialog(false); setEditingCustomerId(null); }}
                  className="w-full sm:w-auto border-slate-500 bg-slate-700/50 hover:bg-slate-600 text-slate-200 hover:text-white h-11 font-medium transition-all duration-200 hover:shadow-md"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={editingCustomerId ? handleSaveEdit : handleAddCustomer} 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-11 font-medium disabled:opacity-50 transition-all duration-200 hover:shadow-lg"
                >
                  {isSubmitting ? (editingCustomerId ? 'Salvando...' : 'Adicionando...') : (editingCustomerId ? 'Salvar Alterações' : 'Adicionar Cliente')}
                </Button>
              </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes do Cliente */}
      <Dialog open={!!showDetailsDialog} onOpenChange={(open) => !open && setShowDetailsDialog(null)}>
        <DialogContent className="text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Detalhes do Cliente</DialogTitle>
            <DialogDescription className="text-slate-600">Informações básicas do cliente selecionado</DialogDescription>
          </DialogHeader>
          {showDetailsDialog && (
            <div className="space-y-2">
              <div><span className="font-medium">Nome:</span> {showDetailsDialog.name}</div>
              <div><span className="font-medium">Tipo:</span> {showDetailsDialog.type}</div>
              <div><span className="font-medium">Documento:</span> {showDetailsDialog.document}</div>
              <div><span className="font-medium">Telefone:</span> {formatPhone(showDetailsDialog.phone || '')}</div>
              <div><span className="font-medium">E-mail:</span> {showDetailsDialog.email}</div>
              <div><span className="font-medium">Cidade:</span> {showDetailsDialog.city}</div>
              <div><span className="font-medium">Status:</span> {showDetailsDialog.status === 'active' ? 'Ativo' : 'Inativo'}</div>
              <div className="text-xs text-slate-500"><span className="font-medium">Criado em:</span> {new Date(showDetailsDialog.created_at).toLocaleString('pt-BR')}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Importar */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Clientes</DialogTitle>
            <DialogDescription>
              Selecione um arquivo CSV ou Excel com os dados dos clientes
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
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>O arquivo deve conter as colunas:</p>
              <ul className="list-disc pl-4 mt-2">
                <li>nome (obrigatório)</li>
                <li>email</li>
                <li>telefone</li>
                <li>documento (CPF/CNPJ)</li>
                <li>cidade</li>
                <li>tipo (PF ou PJ)</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowImportDialog(false)}
              className="border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
            >
              Cancelar
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white" 
              onClick={() => document.getElementById('file')?.click()}
            >
              Selecionar Arquivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Preview da Importação */}
      <ImportPreviewModal
        isOpen={showImportPreview}
        onClose={() => setShowImportPreview(false)}
        onConfirm={async () => {
          // Importação direta simples
          try {
            setIsRegistering(true);
            let success = 0, fail = 0;
            for (const row of importRows) {
              try {
                const response = await fetch('/next_api/customers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tenant_id: tenant?.id || '00000000-0000-0000-0000-000000000000',
                    name: row.nome || '',
                    email: row.email || '',
                    phone: row.telefone || '',
                    document: row.documento || '',
                    city: row.cidade || '',
                    type: row.tipo || 'PF',
                  })
                });
                if (response.ok) success++;
                else fail++;
              } catch (err) {
                fail++;
              }
            }
            toast.success(`Importação concluída: ${success} sucessos, ${fail} falhas`);
            setShowImportPreview(false);
            await loadCustomers();
          } finally {
            setIsRegistering(false);
          }
        }}
        onRegister={async (selected) => {
          try {
            setIsRegistering(true);
            let success = 0, fail = 0;
            const errors: string[] = [];
            for (const row of selected) {
              const obj: any = Array.isArray(row)
                ? (() => {
                    const keys = importHeaders.map(normalizeHeader);
                    return Object.fromEntries(keys.map((h, i) => [h, row[i]]));
                  })()
                : (() => {
                    const out: Record<string, any> = {};
                    Object.entries(row as Record<string, any>).forEach(([k, v]) => {
                      out[normalizeHeader(k)] = v;
                    });
                    return out;
                  })();
              const pick = (cands: string[]): string => {
                for (const key of cands) {
                  const val = obj[key];
                  if (val !== undefined && val !== null && String(val).trim() !== '') return String(val);
                }
                for (const [k, v] of Object.entries(obj)) {
                  if (cands.some((c) => k.includes(c))) {
                    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
                  }
                }
                return '';
              };
              const customerData = {
                name: pick(['nome', 'name', 'fantasia']),
                email: pick(['email', 'e mail']),
                phone: pick(['telefone', 'celular', 'phone']),
                document: pick(['cpf/cnpj', 'cpf', 'cnpj', 'documento']).replace(/\D/g, ''),
                address: pick(['endereco', 'endereco completo', 'address', 'logradouro', 'rua']),
                neighborhood: pick(['bairro']),
                city: pick(['cidade', 'city']),
                state: (pick(['estado', 'uf']).slice(0,2).toUpperCase() || null) as any,
                zipcode: pick(['cep', 'zip']).replace(/\D/g, ''),
                notes: pick(['observacoes', 'observacoes adicionais', 'notes']),
                status: 'active',
              } as any;

              if (!customerData.name) { fail++; errors.push('Nome ausente'); continue; }

              const res = await fetch('/next_api/customers', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(customerData) 
              });

              if (res.ok) {
                success++;
              } else {
                fail++;
                let txt = await res.text();
                console.error('Falha ao cadastrar cliente:', txt);
                errors.push(txt);
              }
            }
            if (success > 0) toast.success(`${success} clientes cadastrados`);
            if (fail > 0) toast.error(`${fail} falhas no cadastro`);
            setShowImportPreview(false);
            await loadCustomers();
          } finally {
            setIsRegistering(false);
          }
        }}
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