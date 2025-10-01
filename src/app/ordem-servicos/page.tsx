'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';

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
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    numero: true,
    cliente: true,
    tipo: true,
    status: true,
    prioridade: true,
    tecnico: true,
    valor_estimado: true,
    data_abertura: true,
    data_prazo: true,
  });

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
    try {
      setLoading(true);
      setTimeout(() => {
        setOrdens(mockOrdens);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erro ao carregar ordens de serviço:', error);
      toast.error('Erro ao carregar ordens de serviço');
      setLoading(false);
    }
  }, [mockOrdens]);

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
    try {
      const novaOrdem: OrdemServico = {
        id: Date.now().toString(),
        numero: `OS-${new Date().getFullYear()}-${(ordens.length + 1).toString().padStart(3, '0')}`,
        ...newOrdem,
        valor_estimado: parseFloat(newOrdem.valor_estimado) || 0,
        status: 'aberta',
        data_abertura: new Date().toISOString()
      };

      setOrdens(prev => [...prev, novaOrdem]);
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
      toast.success('Ordem de serviço criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar ordem de serviço:', error);
      toast.error('Erro ao criar ordem de serviço');
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
                      onCheckedChange={(checked) => 
                        setColumnVisibility(prev => ({ ...prev, [key]: checked || false }))
                      }
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
                            Cancelar OS
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
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Preencha as informações da ordem de serviço
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="cliente">Cliente *</label>
              <Input
                id="cliente"
                value={newOrdem.cliente}
                onChange={(e) => setNewOrdem(prev => ({ ...prev, cliente: e.target.value }))}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="tipo">Tipo de Serviço *</label>
                <Input
                  id="tipo"
                  value={newOrdem.tipo}
                  onChange={(e) => setNewOrdem(prev => ({ ...prev, tipo: e.target.value }))}
                  placeholder="Ex: Reparo, Manutenção..."
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="prioridade">Prioridade</label>
                <select 
                  id="prioridade"
                  className="px-3 py-2 border rounded-md"
                  value={newOrdem.prioridade}
                  onChange={(e) => setNewOrdem(prev => ({ ...prev, prioridade: e.target.value as 'baixa' | 'media' | 'alta' }))}
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="descricao">Descrição do Serviço *</label>
              <textarea
                id="descricao"
                className="px-3 py-2 border rounded-md min-h-[100px]"
                value={newOrdem.descricao}
                onChange={(e) => setNewOrdem(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o serviço a ser realizado..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="valor_estimado">Valor Estimado</label>
                <Input
                  id="valor_estimado"
                  type="number"
                  step="0.01"
                  value={newOrdem.valor_estimado}
                  onChange={(e) => setNewOrdem(prev => ({ ...prev, valor_estimado: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="data_prazo">Data Prazo</label>
                <Input
                  id="data_prazo"
                  type="date"
                  value={newOrdem.data_prazo}
                  onChange={(e) => setNewOrdem(prev => ({ ...prev, data_prazo: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="tecnico">Técnico Responsável</label>
              <Input
                id="tecnico"
                value={newOrdem.tecnico}
                onChange={(e) => setNewOrdem(prev => ({ ...prev, tecnico: e.target.value }))}
                placeholder="Nome do técnico"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddOrdem} className="bg-emerald-600 hover:bg-emerald-700">
              Criar Ordem de Serviço
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}