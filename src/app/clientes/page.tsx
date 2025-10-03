'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

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
  });

  // Carregar clientes quando houver tenant
  useEffect(() => {
    if (!tenant?.id) {
      setLoading(false);
      setCustomers([]);
      return;
    }
    loadCustomers();
  }, [tenant?.id]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const url = tenant?.id
        ? `/next_api/customers?tenant_id=${encodeURIComponent(tenant.id)}`
        : '/next_api/customers';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao carregar clientes');
      
      const data = await response.json();
      const rows = Array.isArray(data?.data) ? data.data : (data?.rows || data || []);
      setCustomers(rows);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

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

  // Adicionar cliente
  const handleAddCustomer = async () => {
    try {
      const response = await fetch('/next_api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant?.id,
          ...newCustomer,
        })
      });

      if (!response.ok) throw new Error('Erro ao adicionar cliente');

      await loadCustomers();
      setShowAddDialog(false);
      setNewCustomer({ name: '', email: '', phone: '', document: '', city: '', type: 'PF' });
      toast.success('Cliente adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      toast.error('Erro ao adicionar cliente');
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

  const formatDocument = (doc: string, type: 'PF' | 'PJ') => {
    if (type === 'PF') {
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  };

  // Botão de diagnóstico: cria um cliente simples para validar a rota
  const testCreateCustomer = async () => {
    try {
      console.log('🧪 Teste API: criando cliente de teste...');
      const res = await fetch('/next_api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenant?.id, name: 'Cliente Teste API', email: 'teste@example.com' })
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
                      <TableCell>{formatDocument(customer.document, customer.type)}</TableCell>
                    )}
                    {columnVisibility.phone && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {formatPhone(customer.phone)}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 z-50 bg-white border border-gray-200 shadow-xl rounded-lg">
                          <div className="py-1">
                            <DropdownMenuItem className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center">
                              <Eye className="h-4 w-4 mr-3 text-gray-400" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem className="px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 flex items-center">
                              <Edit className="h-4 w-4 mr-3 text-gray-400" />
                              Editar
                            </DropdownMenuItem>
                          </div>
                          
                          <div className="border-t border-gray-100 pt-1">
                            <DropdownMenuItem className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center">
                              <Trash2 className="h-4 w-4 mr-3 text-red-400" />
                              Excluir
                            </DropdownMenuItem>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Dialog Adicionar Cliente */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Cliente</DialogTitle>
            <DialogDescription>
              Preencha as informações do cliente abaixo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name">Nome *</label>
              <Input
                id="name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="type">Tipo</label>
                <select 
                  className="px-3 py-2 border rounded-md"
                  value={newCustomer.type}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, type: e.target.value as 'PF' | 'PJ' }))}
                >
                  <option value="PF">Pessoa Física</option>
                  <option value="PJ">Pessoa Jurídica</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="document">CPF/CNPJ</label>
                <Input
                  id="document"
                  value={newCustomer.document}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, document: e.target.value }))}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="email">E-mail</label>
              <Input
                id="email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="phone">Telefone</label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="city">Cidade</label>
                <Input
                  id="city"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="São Paulo"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddDialog(false)}
              className="border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddCustomer} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Adicionar Cliente
            </Button>
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
          await handleRegisterSelected(importRows);
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
                is_active: true,
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
  );
}