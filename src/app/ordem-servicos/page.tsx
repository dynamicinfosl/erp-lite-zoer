'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JugaKPICard } from '@/components/dashboard/JugaComponents';
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
  FileText,
  Trash2,
  Edit,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Wrench,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';

interface OrdemServico {
  id: string;
  numero: string;
  cliente: string;
  tipo: string;
  descricao: string;
  status: 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta';
  tecnico?: string;
  valor_estimado: number;
  valor_final?: number;
  data_abertura: string;
  data_prazo?: string;
  data_conclusao?: string;
}

interface ColumnVisibility {
  numero: boolean;
  cliente: boolean;
  tipo: boolean;
  status: boolean;
  prioridade: boolean;
  tecnico: boolean;
  valor_estimado: boolean;
  data_abertura: boolean;
  data_prazo: boolean;
}

export default function OrdemServicosPage() {
  const { user, tenant } = useSimpleAuth();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  // Armazenar ordens temporariamente no localStorage
  const getStoredOrders = useCallback((): OrdemServico[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(`ordens_${tenant?.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [tenant?.id]);

  const setStoredOrders = useCallback((orders: OrdemServico[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`ordens_${tenant?.id}`, JSON.stringify(orders));
    } catch {
      // Ignorar erros de localStorage
    }
  }, [tenant?.id]);

  // Funções para gerenciar preferências de colunas no localStorage
  const getStoredColumnVisibility = (): ColumnVisibility => {
    if (typeof window === 'undefined') return {
      numero: true,
      cliente: true,
      tipo: true,
      status: true,
      prioridade: true,
      tecnico: true,
      valor_estimado: true,
      data_abertura: true,
      data_prazo: true,
    };
    try {
      const stored = localStorage.getItem(`ordem_servico_columns_${tenant?.id}`);
      return stored ? JSON.parse(stored) : {
        numero: true,
        cliente: true,
        tipo: true,
        status: true,
        prioridade: true,
        tecnico: true,
        valor_estimado: true,
        data_abertura: true,
        data_prazo: true,
      };
    } catch {
      return {
        numero: true,
        cliente: true,
        tipo: true,
        status: true,
        prioridade: true,
        tecnico: true,
        valor_estimado: true,
        data_abertura: true,
        data_prazo: true,
      };
    }
  };

  const setStoredColumnVisibility = (columns: ColumnVisibility) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`ordem_servico_columns_${tenant?.id}`, JSON.stringify(columns));
    } catch {
      // Ignorar erros de localStorage
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState<OrdemServico | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<OrdemServico | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => getStoredColumnVisibility());

  // Filtros avançados
  const [advancedFilters, setAdvancedFilters] = useState({
    status: '',
    prioridade: '',
    tecnico: '',
    data_inicio: '',
    data_fim: ''
  });

  // Estados para formulário
  const [newOrdem, setNewOrdem] = useState({
    cliente: '',
    tipo: '',
    descricao: '',
    prioridade: 'media' as 'baixa' | 'media' | 'alta',
    valor_estimado: '',
    data_prazo: '',
    tecnico: ''
  });

  // Estados para edição
  const [editOrdem, setEditOrdem] = useState({
    cliente: '',
    tipo: '',
    descricao: '',
    prioridade: 'media' as 'baixa' | 'media' | 'alta',
    valor_estimado: '',
    data_prazo: '',
    tecnico: ''
  });

  const mockOrdens = useMemo<OrdemServico[]>(() => [
    {
      id: '1',
      numero: 'OS-2024-001',
      cliente: 'João Silva',
      tipo: 'Reparo Equipamento',
      descricao: 'Reparo no sistema de refrigeração',
      status: 'aberta',
      prioridade: 'alta',
      tecnico: 'Carlos Santos',
      valor_estimado: 350.00,
      data_abertura: '2024-01-15T10:00:00Z',
      data_prazo: '2024-01-20T18:00:00Z'
    },
    {
      id: '2',
      numero: 'OS-2024-002',
      cliente: 'Maria Oliveira',
      tipo: 'Manutenção Preventiva',
      descricao: 'Limpeza e verificação geral',
      status: 'em_andamento',
      prioridade: 'media',
      tecnico: 'Pedro Costa',
      valor_estimado: 150.00,
      data_abertura: '2024-01-14T09:30:00Z',
      data_prazo: '2024-01-18T17:00:00Z'
    }
  ], []);

  const loadOrdens = useCallback(async () => {
    // Usar tenant padrão se não estiver disponível
    const tenantId = tenant?.id || '00000000-0000-0000-0000-000000000000';
    
    try {
      setLoading(true);
      const res = await fetch(`/next_api/orders?tenant_id=${tenantId}`);
      if (!res.ok) {
        console.error('Falha na API /next_api/orders:', res.status);
        // Se a API falhar, usar dados do localStorage
        const storedOrders = getStoredOrders();
        setOrdens(storedOrders);
      } else {
        const data = await res.json();
        const rows = Array.isArray(data?.data) ? data.data : (data?.rows || data || []);
        const orders = Array.isArray(rows) ? rows : [];
        setOrdens(orders);
        setStoredOrders(orders);
      }
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
      // Se der erro, usar dados do localStorage
      const storedOrders = getStoredOrders();
      setOrdens(storedOrders);
      if (storedOrders.length === 0) {
      toast.error('Erro ao carregar ordens de serviço');
      }
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, getStoredOrders, setStoredOrders]);

  useEffect(() => {
    loadOrdens();
  }, [loadOrdens]);

  // Filtrar ordens
  const filteredOrdens = ordens.filter(ordem => {
    const matchesSearch = ordem.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ordem.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ordem.descricao.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAdvanced = (!advancedFilters.status || ordem.status === advancedFilters.status) &&
                           (!advancedFilters.prioridade || ordem.prioridade === advancedFilters.prioridade) &&
                           (!advancedFilters.tecnico || ordem.tecnico?.toLowerCase().includes(advancedFilters.tecnico.toLowerCase()));

    return matchesSearch && matchesAdvanced;
  });

  // Adicionar ordem de serviço
  const handleAddOrdem = async () => {
    console.log('🔍 handleAddOrdem - INÍCIO');
    console.log('📊 tenant:', tenant);
    console.log('📝 newOrdem:', newOrdem);
    
    // Se tenant não estiver disponível, usar tenant padrão temporariamente
    const tenantId = tenant?.id || '00000000-0000-0000-0000-000000000000';
    
    if (!tenantId) {
      console.log('❌ Tenant não encontrado');
      toast.error('Tenant não encontrado');
      return;
    }

    if (!newOrdem.cliente || !newOrdem.tipo || !newOrdem.descricao) {
      console.log('❌ Campos obrigatórios não preenchidos');
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    console.log('✅ Validações passaram, fazendo POST...');
    try {
      const requestBody = {
        tenant_id: tenantId,
        cliente: newOrdem.cliente,
        tipo: newOrdem.tipo,
        descricao: newOrdem.descricao,
        prioridade: newOrdem.prioridade,
        valor_estimado: parseFloat(newOrdem.valor_estimado) || 0,
        data_prazo: newOrdem.data_prazo || null,
        tecnico: newOrdem.tecnico || null,
      };
      
      console.log('📤 Enviando request:', JSON.stringify(requestBody, null, 2));
      
      const res = await fetch('/next_api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('📥 Response status:', res.status);
      console.log('📥 Response ok:', res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('❌ Erro na resposta:', res.status, errorText);
        throw new Error(`Erro ao criar ordem de serviço: ${res.status}`);
      }

      const responseData = await res.json();
      console.log('📦 Response data:', JSON.stringify(responseData, null, 2));
      
      const newOrder = responseData.data || responseData;
      console.log('🆕 Nova ordem:', newOrder);
      
      // Adicionar à lista local e salvar no localStorage
      const updatedOrders = [newOrder, ...ordens];
      console.log('📋 Lista atualizada:', updatedOrders.length, 'ordens');
      
      setOrdens(updatedOrders);
      setStoredOrders(updatedOrders);

      setShowAddDialog(false);
      setNewOrdem({
        cliente: '',
        tipo: '',
        descricao: '',
        prioridade: 'media',
        valor_estimado: '',
        data_prazo: '',
        tecnico: ''
      });
      console.log('✅ Ordem criada com sucesso!');
      toast.success('Ordem de serviço criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar ordem de serviço:', error);
      toast.error('Erro ao criar ordem de serviço');
    }
  };

  const handleViewDetails = (ordem: OrdemServico) => {
    setShowDetailsDialog(ordem);
  };

  const handleEdit = (ordem: OrdemServico) => {
    setEditOrdem({
      cliente: ordem.cliente,
      tipo: ordem.tipo,
      descricao: ordem.descricao,
      prioridade: ordem.prioridade,
      valor_estimado: ordem.valor_estimado.toString(),
      data_prazo: ordem.data_prazo || '',
      tecnico: ordem.tecnico || ''
    });
    setShowEditDialog(ordem);
  };

  const handleUpdateOrdem = async () => {
    const tenantId = tenant?.id || '00000000-0000-0000-0000-000000000000';
    if (!showEditDialog || !tenantId) return;

    try {
      const res = await fetch(`/next_api/orders?id=${showEditDialog.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          cliente: editOrdem.cliente,
          tipo: editOrdem.tipo,
          descricao: editOrdem.descricao,
          prioridade: editOrdem.prioridade,
          valor_estimado: parseFloat(editOrdem.valor_estimado) || 0,
          data_prazo: editOrdem.data_prazo || null,
          tecnico: editOrdem.tecnico || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Erro ao atualizar ordem de serviço');
      }

      const responseData = await res.json();
      const updatedOrder = responseData.data || responseData;
      
      // Atualizar lista local e salvar no localStorage
      const updatedOrders = ordens.map(ordem => 
        ordem.id === showEditDialog.id ? updatedOrder : ordem
      );
      setOrdens(updatedOrders);
      setStoredOrders(updatedOrders);

      setShowEditDialog(null);
      toast.success('Ordem de serviço atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar ordem de serviço:', error);
      toast.error('Erro ao atualizar ordem de serviço');
    }
  };

  const handleDelete = async (ordem: OrdemServico) => {
    if (!confirm(`Tem certeza que deseja excluir a ordem de serviço ${ordem.numero}?`)) {
      return;
    }

    try {
      const res = await fetch(`/next_api/orders?id=${ordem.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Erro ao excluir ordem de serviço');
      }

      // Remover da lista local e salvar no localStorage
      const updatedOrders = ordens.filter(o => o.id !== ordem.id);
      setOrdens(updatedOrders);
      setStoredOrders(updatedOrders);

      toast.success(`Ordem de serviço ${ordem.numero} excluída com sucesso!`);
    } catch (error) {
      console.error('Erro ao excluir ordem de serviço:', error);
      toast.error('Erro ao excluir ordem de serviço');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: OrdemServico['status']) => {
    const statusMap = {
      'aberta': { label: 'Aberta', variant: 'outline' as const, icon: Clock },
      'em_andamento': { label: 'Em Andamento', variant: 'default' as const, icon: AlertCircle },
      'concluida': { label: 'Concluída', variant: 'secondary' as const, icon: CheckCircle },
      'cancelada': { label: 'Cancelada', variant: 'destructive' as const, icon: Clock }
    };
    
    const statusInfo = statusMap[status];
    const Icon = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  const getPrioridadeBadge = (prioridade: OrdemServico['prioridade']) => {
    const prioridadeMap = {
      'baixa': { label: 'Baixa', variant: 'outline' as const },
      'media': { label: 'Média', variant: 'default' as const },
      'alta': { label: 'Alta', variant: 'destructive' as const }
    };
    
    return (
      <Badge variant={prioridadeMap[prioridade].variant}>
        {prioridadeMap[prioridade].label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header - Responsivo */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Ordens de Serviço</h1>
          <p className="text-sm sm:text-base text-body">
            Gerencie ordens de serviço e manutenções de forma eficiente
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button 
            className="juga-gradient text-white w-full sm:w-auto gap-2"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Ordem</span>
            <span className="sm:hidden">Nova OS</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards - Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <JugaKPICard
          title="OS Abertas"
          value={`${ordens.filter(o => o.status === 'aberta').length}`}
          description="Aguardando atendimento"
          trend="down"
          trendValue="Requer atenção"
          icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="warning"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Em Andamento"
          value={`${ordens.filter(o => o.status === 'em_andamento').length}`}
          description="Sendo executadas"
          trend="up"
          trendValue="Ativas"
          icon={<Wrench className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="accent"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Concluídas"
          value={`${ordens.filter(o => o.status === 'concluida').length}`}
          description="Este mês"
          trend="up"
          trendValue="+15.2%"
          icon={<CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="success"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Valor Estimado"
          value={formatCurrency(ordens.reduce((acc, o) => acc + o.valor_estimado, 0))}
          description="Total em aberto"
          trend="up"
          trendValue="+8.5%"
          icon={<FileText className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="primary"
          className="min-h-[120px] sm:min-h-[140px]"
        />
      </div>

      {/* Toolbar */}
      <Card className="juga-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Busca e Filtros */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar ordens de serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="w-full sm:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Filtros Avançados</span>
                <span className="sm:hidden">Filtros</span>
              </Button>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 sm:flex-initial">
                    <Settings2 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Colunas</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-lg" >
                  <DropdownMenuLabel>Mostrar Colunas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(columnVisibility).map(([key, value]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={value}
                      onCheckedChange={(checked) => {
                        const newVisibility = { ...columnVisibility, [key]: checked || false };
                        setColumnVisibility(newVisibility);
                        setStoredColumnVisibility(newVisibility);
                      }}
                      className="hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-800 focus:text-gray-900 dark:focus:text-gray-100"
                    >
                      {key === 'numero' ? 'Número' :
                       key === 'cliente' ? 'Cliente' :
                       key === 'tipo' ? 'Tipo' :
                       key === 'status' ? 'Status' :
                       key === 'prioridade' ? 'Prioridade' :
                       key === 'tecnico' ? 'Técnico' :
                       key === 'valor_estimado' ? 'Valor Estimado' :
                       key === 'data_abertura' ? 'Data Abertura' :
                       key === 'data_prazo' ? 'Data Prazo' : key}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 sm:flex-initial">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Mais</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-800">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Lista
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Busca Avançada */}
          {showAdvancedSearch && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <select 
                  className="px-3 py-2 border rounded-md bg-white dark:bg-gray-900"
                  value={advancedFilters.status}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">Todos os status</option>
                  <option value="aberta">Aberta</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </select>
                <select 
                  className="px-3 py-2 border rounded-md bg-white dark:bg-gray-900"
                  value={advancedFilters.prioridade}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, prioridade: e.target.value }))}
                >
                  <option value="">Todas as prioridades</option>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
                <Input
                  placeholder="Técnico..."
                  value={advancedFilters.tecnico}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, tecnico: e.target.value }))}
                />
                <Input
                  type="date"
                  placeholder="Data início..."
                  value={advancedFilters.data_inicio}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, data_inicio: e.target.value }))}
                />
                <Input
                  type="date"
                  placeholder="Data fim..."
                  value={advancedFilters.data_fim}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, data_fim: e.target.value }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="juga-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl text-heading">Lista de Ordens de Serviço</CardTitle>
          <CardDescription className="text-sm">
            {filteredOrdens.length} {filteredOrdens.length === 1 ? 'ordem encontrada' : 'ordens encontradas'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-3"></div>
              <p>Carregando ordens de serviço...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columnVisibility.numero && <TableHead>Número</TableHead>}
                    {columnVisibility.cliente && <TableHead>Cliente</TableHead>}
                    {columnVisibility.tipo && <TableHead>Tipo</TableHead>}
                    <TableHead>Descrição</TableHead>
                    {columnVisibility.status && <TableHead>Status</TableHead>}
                    {columnVisibility.prioridade && <TableHead>Prioridade</TableHead>}
                    {columnVisibility.tecnico && <TableHead>Técnico</TableHead>}
                    {columnVisibility.valor_estimado && <TableHead>Valor Estimado</TableHead>}
                    {columnVisibility.data_abertura && <TableHead>Data Abertura</TableHead>}
                    {columnVisibility.data_prazo && <TableHead>Prazo</TableHead>}
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrdens.map((ordem) => (
                    <TableRow key={ordem.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      {columnVisibility.numero && (
                        <TableCell className="font-mono text-sm font-medium text-heading">
                          {ordem.numero}
                        </TableCell>
                      )}
                      {columnVisibility.cliente && (
                        <TableCell className="font-medium text-heading">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {ordem.cliente}
                          </div>
                        </TableCell>
                      )}
                      {columnVisibility.tipo && <TableCell className="text-body">{ordem.tipo}</TableCell>}
                      <TableCell className="max-w-xs text-body">
                        <div className="truncate" title={ordem.descricao}>
                          {ordem.descricao}
                        </div>
                      </TableCell>
                      {columnVisibility.status && <TableCell>{getStatusBadge(ordem.status)}</TableCell>}
                      {columnVisibility.prioridade && <TableCell>{getPrioridadeBadge(ordem.prioridade)}</TableCell>}
                      {columnVisibility.tecnico && <TableCell className="text-body">{ordem.tecnico || '-'}</TableCell>}
                      {columnVisibility.valor_estimado && <TableCell className="text-body">{formatCurrency(ordem.valor_estimado)}</TableCell>}
                      {columnVisibility.data_abertura && (
                        <TableCell>
                          <div className="flex items-center gap-1 text-body">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(ordem.data_abertura)}
                          </div>
                        </TableCell>
                      )}
                      {columnVisibility.data_prazo && (
                        <TableCell>
                          {ordem.data_prazo ? (
                            <div className="flex items-center gap-1 text-body">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {formatDate(ordem.data_prazo)}
                            </div>
                          ) : '-'}
                        </TableCell>
                      )}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                            <DropdownMenuItem 
                              onClick={() => handleViewDetails(ordem)}
                              className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleEdit(ordem)}
                              className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                            <DropdownMenuItem 
                              className="cursor-pointer text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 focus:bg-red-50 dark:focus:bg-red-950/30"
                              onClick={() => handleDelete(ordem)}
                            >
                            <Trash2 className="h-4 w-4 mr-2" />
                              Excluir OS
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}

          {filteredOrdens.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Nenhuma ordem de serviço encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Adicionar OS */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          <div className="relative">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">Nova Ordem de Serviço</DialogTitle>
                  <DialogDescription className="text-blue-100 mt-1">
                    Preencha as informações da ordem de serviço. Os campos marcados com * são obrigatórios.
            </DialogDescription>
                </div>
              </div>
            </div>

            {/* Conteúdo principal */}
            <div className="p-6 bg-slate-800/50 backdrop-blur-sm">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cliente" className="text-sm font-medium text-white">Cliente *</Label>
              <Input
                id="cliente"
                value={newOrdem.cliente}
                onChange={(e) => setNewOrdem(prev => ({ ...prev, cliente: e.target.value }))}
                placeholder="Nome do cliente"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo" className="text-sm font-medium text-white">Tipo de Serviço *</Label>
                <Input
                  id="tipo"
                  value={newOrdem.tipo}
                  onChange={(e) => setNewOrdem(prev => ({ ...prev, tipo: e.target.value }))}
                  placeholder="Ex: Reparo, Manutenção..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
                  <div className="space-y-2">
                    <Label htmlFor="prioridade" className="text-sm font-medium text-white">Prioridade</Label>
                    <Select 
                  value={newOrdem.prioridade}
                      onValueChange={(value: 'baixa' | 'media' | 'alta') => setNewOrdem(prev => ({ ...prev, prioridade: value }))}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-blue-400 focus:ring-blue-400">
                        <SelectValue placeholder="Selecione a prioridade" className="text-white" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="baixa" className="text-white hover:bg-slate-700">Baixa</SelectItem>
                        <SelectItem value="media" className="text-white hover:bg-slate-700">Média</SelectItem>
                        <SelectItem value="alta" className="text-white hover:bg-slate-700">Alta</SelectItem>
                      </SelectContent>
                    </Select>
              </div>
            </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-sm font-medium text-white">Descrição do Serviço *</Label>
              <textarea
                id="descricao"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder:text-gray-300 rounded-md min-h-[100px] focus:border-blue-400 focus:ring-blue-400 resize-none"
                value={newOrdem.descricao}
                onChange={(e) => setNewOrdem(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o serviço a ser realizado..."
              />
            </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor_estimado" className="text-sm font-medium text-white">Valor Estimado</Label>
                    <Input
                      id="valor_estimado"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newOrdem.valor_estimado}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Permitir apenas números positivos e ponto decimal
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setNewOrdem(prev => ({ ...prev, valor_estimado: value }));
                        }
                      }}
                      placeholder="0.00"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_prazo" className="text-sm font-medium text-white">Data Prazo</Label>
                    <Input
                      id="data_prazo"
                      type="date"
                      value={newOrdem.data_prazo}
                      onChange={(e) => setNewOrdem(prev => ({ ...prev, data_prazo: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tecnico" className="text-sm font-medium text-white">Técnico Responsável</Label>
              <Input
                id="tecnico"
                value={newOrdem.tecnico}
                onChange={(e) => setNewOrdem(prev => ({ ...prev, tecnico: e.target.value }))}
                placeholder="Nome do técnico"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
          </div>

              {/* Footer com botões */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-white/10">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                  className="w-full sm:w-auto border-white/20 bg-transparent hover:bg-white/10 text-white hover:text-white"
                >
              Cancelar
            </Button>
                <Button 
                  onClick={handleAddOrdem} 
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                  type="button"
                >
              Criar Ordem de Serviço
            </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      <Dialog open={!!showDetailsDialog} onOpenChange={(open) => !open && setShowDetailsDialog(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          <div className="relative">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    Detalhes da Ordem de Serviço
                  </DialogTitle>
                  <DialogDescription className="text-blue-100 mt-1">
                    {showDetailsDialog?.numero}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Conteúdo principal */}
            <div className="p-6 bg-slate-800/50 backdrop-blur-sm">
              {showDetailsDialog && (
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Cliente</Label>
                      <div className="text-white bg-white/10 p-3 rounded-md">
                        {showDetailsDialog.cliente}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Tipo de Serviço</Label>
                      <div className="text-white bg-white/10 p-3 rounded-md">
                        {showDetailsDialog.tipo}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">Descrição</Label>
                    <div className="text-white bg-white/10 p-3 rounded-md min-h-[100px]">
                      {showDetailsDialog.descricao}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Status</Label>
                      <div className="text-white bg-white/10 p-3 rounded-md">
                        <Badge variant={showDetailsDialog.status === 'concluida' ? 'default' : 'secondary'}>
                          {showDetailsDialog.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Prioridade</Label>
                      <div className="text-white bg-white/10 p-3 rounded-md">
                        <Badge variant={showDetailsDialog.prioridade === 'alta' ? 'destructive' : 'outline'}>
                          {showDetailsDialog.prioridade}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Valor Estimado</Label>
                      <div className="text-white bg-white/10 p-3 rounded-md">
                        {formatCurrency(showDetailsDialog.valor_estimado)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Técnico Responsável</Label>
                      <div className="text-white bg-white/10 p-3 rounded-md">
                        {showDetailsDialog.tecnico || 'Não atribuído'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Data Prazo</Label>
                      <div className="text-white bg-white/10 p-3 rounded-md">
                        {showDetailsDialog.data_prazo ? formatDate(showDetailsDialog.data_prazo) : 'Não definido'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Data de Abertura</Label>
                      <div className="text-white bg-white/10 p-3 rounded-md">
                        {formatDate(showDetailsDialog.data_abertura)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Data de Conclusão</Label>
                      <div className="text-white bg-white/10 p-3 rounded-md">
                        {showDetailsDialog.data_conclusao ? formatDate(showDetailsDialog.data_conclusao) : 'Não concluída'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer com botões */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-white/10">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowDetailsDialog(null)}
                  className="w-full sm:w-auto border-white/20 bg-transparent hover:bg-white/10 text-white hover:text-white"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={!!showEditDialog} onOpenChange={(open) => !open && setShowEditDialog(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          <div className="relative">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Edit className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    Editar Ordem de Serviço
                  </DialogTitle>
                  <DialogDescription className="text-blue-100 mt-1">
                    {showEditDialog?.numero} - Atualize as informações
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Formulário com fundo escuro */}
            <div className="p-6 bg-slate-800/50 backdrop-blur-sm">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-cliente" className="text-sm font-medium text-white">Cliente *</Label>
                  <Input
                    id="edit-cliente"
                    value={editOrdem.cliente}
                    onChange={(e) => setEditOrdem(prev => ({ ...prev, cliente: e.target.value }))}
                    placeholder="Nome do cliente"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-tipo" className="text-sm font-medium text-white">Tipo de Serviço *</Label>
                    <Input
                      id="edit-tipo"
                      value={editOrdem.tipo}
                      onChange={(e) => setEditOrdem(prev => ({ ...prev, tipo: e.target.value }))}
                      placeholder="Ex: Reparo, Manutenção..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-prioridade" className="text-sm font-medium text-white">Prioridade</Label>
                    <Select 
                      value={editOrdem.prioridade} 
                      onValueChange={(value: 'baixa' | 'media' | 'alta') => setEditOrdem(prev => ({ ...prev, prioridade: value }))}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-blue-400 focus:ring-blue-400">
                        <SelectValue placeholder="Selecione a prioridade" className="text-white" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="baixa" className="text-white hover:bg-slate-700">Baixa</SelectItem>
                        <SelectItem value="media" className="text-white hover:bg-slate-700">Média</SelectItem>
                        <SelectItem value="alta" className="text-white hover:bg-slate-700">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-descricao" className="text-sm font-medium text-white">Descrição do Serviço *</Label>
                  <textarea
                    id="edit-descricao"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder:text-gray-300 rounded-md min-h-[100px] focus:border-blue-400 focus:ring-blue-400 resize-none"
                    value={editOrdem.descricao}
                    onChange={(e) => setEditOrdem(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descreva o serviço a ser realizado..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-valor" className="text-sm font-medium text-white">Valor Estimado</Label>
                    <Input
                      id="edit-valor"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editOrdem.valor_estimado}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Permitir apenas números positivos e ponto decimal
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setEditOrdem(prev => ({ ...prev, valor_estimado: value }));
                        }
                      }}
                      placeholder="0.00"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-prazo" className="text-sm font-medium text-white">Data Prazo</Label>
                    <Input
                      id="edit-prazo"
                      type="date"
                      value={editOrdem.data_prazo}
                      onChange={(e) => setEditOrdem(prev => ({ ...prev, data_prazo: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-tecnico" className="text-sm font-medium text-white">Técnico Responsável</Label>
                  <Input
                    id="edit-tecnico"
                    value={editOrdem.tecnico}
                    onChange={(e) => setEditOrdem(prev => ({ ...prev, tecnico: e.target.value }))}
                    placeholder="Nome do técnico"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Footer com botões */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-white/10">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditDialog(null)}
                  className="w-full sm:w-auto border-white/20 bg-transparent hover:bg-white/10 text-white hover:text-white"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdateOrdem} 
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Atualizar Ordem de Serviço
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}