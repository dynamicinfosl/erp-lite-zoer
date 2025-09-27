'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  FileText,
  Trash2,
  Edit,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ordens de Serviço</h1>
          <p className="text-muted-foreground">
            Gerencie ordens de serviço e manutenções
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            <FileText className="h-3 w-3 mr-1" />
            {ordens.length} ordens
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Clock className="h-3 w-3 mr-1" />
            {ordens.filter(o => o.status === 'aberta').length} abertas
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OS Abertas</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordens.filter(o => o.status === 'aberta').length}</div>
            <p className="text-xs text-muted-foreground">Aguardando atendimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordens.filter(o => o.status === 'em_andamento').length}</div>
            <p className="text-xs text-muted-foreground">Sendo executadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordens.filter(o => o.status === 'concluida').length}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Estimado</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(ordens.reduce((acc, o) => acc + o.valor_estimado, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Total em aberto</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Lado esquerdo - Botões de ação */}
            <div className="flex items-center gap-2">
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova OS
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Mais Ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar OSs
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Lista
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Selecionadas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
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
            </div>

            {/* Lado direito - Busca */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar ordens de serviço..."
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
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <select 
                  className="px-3 py-2 border rounded-md"
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
                  className="px-3 py-2 border rounded-md"
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lista de Ordens de Serviço ({filteredOrdens.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando ordens de serviço...</div>
          ) : (
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
                  <TableRow key={ordem.id}>
                    {columnVisibility.numero && (
                      <TableCell className="font-mono text-sm font-medium">
                        {ordem.numero}
                      </TableCell>
                    )}
                    {columnVisibility.cliente && (
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-gray-400" />
                          {ordem.cliente}
                        </div>
                      </TableCell>
                    )}
                    {columnVisibility.tipo && <TableCell>{ordem.tipo}</TableCell>}
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={ordem.descricao}>
                        {ordem.descricao}
                      </div>
                    </TableCell>
                    {columnVisibility.status && <TableCell>{getStatusBadge(ordem.status)}</TableCell>}
                    {columnVisibility.prioridade && <TableCell>{getPrioridadeBadge(ordem.prioridade)}</TableCell>}
                    {columnVisibility.tecnico && <TableCell>{ordem.tecnico || '-'}</TableCell>}
                    {columnVisibility.valor_estimado && <TableCell>{formatCurrency(ordem.valor_estimado)}</TableCell>}
                    {columnVisibility.data_abertura && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {formatDate(ordem.data_abertura)}
                        </div>
                      </TableCell>
                    )}
                    {columnVisibility.data_prazo && (
                      <TableCell>
                        {ordem.data_prazo ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
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
          )}

          {filteredOrdens.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma ordem de serviço encontrada
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