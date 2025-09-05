'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Wrench,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { OrdemServicoForm } from '@/components/ordem-servicos/OrdemServicoForm';
import { OrdemServicoPDFSimple } from '@/components/ordem-servicos/OrdemServicoPDFSimple';
import { TestPDF } from '@/components/ordem-servicos/TestPDF';

interface OrdemServico {
  id: string;
  numero: string;
  cliente: {
    id: string;
    nome: string;
    telefone: string;
    endereco: string;
  };
  equipamento: {
    tipo: string;
    marca: string;
    modelo: string;
    numeroSerie: string;
  };
  problema: string;
  diagnostico?: string;
  solucao?: string;
  status: 'aberta' | 'em_andamento' | 'aguardando_pecas' | 'concluida' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  dataAbertura: string;
  dataPrevisao?: string;
  dataConclusao?: string;
  tecnico?: string;
  valorServico?: number;
  valorPecas?: number;
  observacoes?: string;
}

const statusConfig = {
  aberta: { label: 'Aberta', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  aguardando_pecas: { label: 'Aguardando Peças', color: 'bg-orange-100 text-orange-800', icon: Wrench },
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: XCircle }
};

const prioridadeConfig = {
  baixa: { label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  media: { label: 'Média', color: 'bg-blue-100 text-blue-800' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-800' }
};

export default function OrdemServicosPage() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrdem, setEditingOrdem] = useState<OrdemServico | null>(null);
  const [showPDF, setShowPDF] = useState(false);
  const [selectedOrdemForPDF, setSelectedOrdemForPDF] = useState<OrdemServico | null>(null);

  // Dados do formulário
  const [formData, setFormData] = useState({
    cliente: { nome: '', telefone: '', endereco: '' },
    equipamento: { tipo: '', marca: '', modelo: '', numeroSerie: '' },
    problema: '',
    prioridade: 'media' as const,
    dataPrevisao: '',
    tecnico: '',
    observacoes: ''
  });

  // Dados mockados para demonstração
  useEffect(() => {
    const ordensMock: OrdemServico[] = [
      {
        id: '1',
        numero: 'OS-2024-001',
        cliente: {
          id: '1',
          nome: 'João Silva',
          telefone: '(11) 99999-9999',
          endereco: 'Rua das Flores, 123 - São Paulo/SP'
        },
        equipamento: {
          tipo: 'Geladeira',
          marca: 'Brastemp',
          modelo: 'BRM44HK',
          numeroSerie: 'BR2024001'
        },
        problema: 'Não está gelando',
        status: 'em_andamento',
        prioridade: 'alta',
        dataAbertura: '2024-01-15',
        dataPrevisao: '2024-01-20',
        tecnico: 'Carlos Santos',
        valorServico: 150.00
      },
      {
        id: '2',
        numero: 'OS-2024-002',
        cliente: {
          id: '2',
          nome: 'Maria Oliveira',
          telefone: '(11) 88888-8888',
          endereco: 'Av. Paulista, 456 - São Paulo/SP'
        },
        equipamento: {
          tipo: 'Máquina de Lavar',
          marca: 'Consul',
          modelo: 'CWH12B',
          numeroSerie: 'CO2024002'
        },
        problema: 'Não centrifuga',
        diagnostico: 'Problema no motor de centrifugação',
        status: 'aguardando_pecas',
        prioridade: 'media',
        dataAbertura: '2024-01-16',
        dataPrevisao: '2024-01-25',
        tecnico: 'Ana Costa',
        valorServico: 200.00,
        valorPecas: 80.00
      },
      {
        id: '3',
        numero: 'OS-2024-003',
        cliente: {
          id: '3',
          nome: 'Pedro Santos',
          telefone: '(11) 77777-7777',
          endereco: 'Rua Augusta, 789 - São Paulo/SP'
        },
        equipamento: {
          tipo: 'Ar Condicionado',
          marca: 'Samsung',
          modelo: 'AR12BVH',
          numeroSerie: 'SA2024003'
        },
        problema: 'Não liga',
        diagnostico: 'Problema na placa de controle',
        solucao: 'Substituição da placa de controle',
        status: 'concluida',
        prioridade: 'baixa',
        dataAbertura: '2024-01-10',
        dataPrevisao: '2024-01-15',
        dataConclusao: '2024-01-14',
        tecnico: 'Roberto Lima',
        valorServico: 300.00,
        valorPecas: 150.00
      }
    ];
    setOrdens(ordensMock);
  }, []);

  const filteredOrdens = ordens.filter(ordem => {
    const matchesSearch = ordem.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ordem.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ordem.equipamento.tipo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || ordem.status === statusFilter;
    const matchesPrioridade = prioridadeFilter === 'todos' || ordem.prioridade === prioridadeFilter;
    
    return matchesSearch && matchesStatus && matchesPrioridade;
  });

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      
      const novaOrdem: OrdemServico = {
        id: Date.now().toString(),
        numero: `OS-2024-${String(ordens.length + 1).padStart(3, '0')}`,
        cliente: data.cliente,
        equipamento: data.equipamento,
        problema: data.problema,
        diagnostico: data.diagnostico,
        solucao: data.solucao,
        status: 'aberta',
        prioridade: data.prioridade,
        dataAbertura: new Date().toISOString().split('T')[0],
        dataPrevisao: data.dataPrevisao,
        tecnico: data.tecnico,
        valorServico: data.valorServico,
        valorPecas: data.valorPecas,
        observacoes: data.observacoes
      };

      setOrdens([...ordens, novaOrdem]);
      setIsDialogOpen(false);
      setEditingOrdem(null);
      toast.success('Ordem de serviço criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar ordem de serviço');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cliente: { nome: '', telefone: '', endereco: '' },
      equipamento: { tipo: '', marca: '', modelo: '', numeroSerie: '' },
      problema: '',
      prioridade: 'media',
      dataPrevisao: '',
      tecnico: '',
      observacoes: ''
    });
  };

  const handleEdit = (ordem: OrdemServico) => {
    setEditingOrdem(ordem);
    setIsDialogOpen(true);
  };

  const handleGeneratePDF = (ordem: OrdemServico) => {
    setSelectedOrdemForPDF(ordem);
    setShowPDF(true);
  };

  const handleDelete = (id: string) => {
    setOrdens(ordens.filter(ordem => ordem.id !== id));
    toast.success('Ordem de serviço removida com sucesso!');
  };

  const updateStatus = (id: string, novoStatus: OrdemServico['status']) => {
    setOrdens(ordens.map(ordem => 
      ordem.id === id 
        ? { ...ordem, status: novoStatus, dataConclusao: novoStatus === 'concluida' ? new Date().toISOString().split('T')[0] : undefined }
        : ordem
    ));
    toast.success('Status atualizado com sucesso!');
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Ordem de Serviços</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Gerencie as ordens de serviço da sua empresa</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto h-8 text-sm">
            <Plus className="h-3 w-3 mr-1" />
            Nova Ordem
          </Button>
          <TestPDF />
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1 text-sm">
            <Filter className="h-3 w-3" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-xs">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Número, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="status-filter" className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="aguardando_pecas">Aguardando Peças</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="prioridade-filter" className="text-xs">Prioridade</Label>
              <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Ordens */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Ordens de Serviço ({filteredOrdens.length})</CardTitle>
          <CardDescription className="text-xs">
            Lista de todas as ordens de serviço cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="text-xs py-2">Número</TableHead>
                  <TableHead className="text-xs py-2">Cliente</TableHead>
                  <TableHead className="text-xs py-2">Equipamento</TableHead>
                  <TableHead className="text-xs py-2">Problema</TableHead>
                  <TableHead className="text-xs py-2">Status</TableHead>
                  <TableHead className="text-xs py-2">Prioridade</TableHead>
                  <TableHead className="text-xs py-2">Técnico</TableHead>
                  <TableHead className="text-xs py-2">Data</TableHead>
                  <TableHead className="text-xs py-2">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrdens.map((ordem) => {
                  const StatusIcon = statusConfig[ordem.status].icon;
                  return (
                    <TableRow key={ordem.id} className="h-10">
                      <TableCell className="font-medium text-xs py-2">{ordem.numero}</TableCell>
                      <TableCell className="py-2">
                        <div>
                          <div className="font-medium text-xs">{ordem.cliente.nome}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-2 w-2" />
                            {ordem.cliente.telefone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div>
                          <div className="font-medium text-xs">{ordem.equipamento.tipo}</div>
                          <div className="text-xs text-muted-foreground">
                            {ordem.equipamento.marca} {ordem.equipamento.modelo}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs py-2">{ordem.problema}</TableCell>
                      <TableCell className="py-2">
                        <Badge className={`${statusConfig[ordem.status].color} text-xs px-1 py-0`}>
                          <StatusIcon className="h-2 w-2 mr-1" />
                          {statusConfig[ordem.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge className={`${prioridadeConfig[ordem.prioridade].color} text-xs px-1 py-0`}>
                          {prioridadeConfig[ordem.prioridade].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs py-2">{ordem.tecnico || '-'}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-2 w-2" />
                          <span className="text-xs">{new Date(ordem.dataAbertura).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGeneratePDF(ordem)}
                            title="Gerar PDF"
                            className="h-6 w-6 p-0"
                          >
                            <FileText className="h-2 w-2" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(ordem)}
                            title="Editar"
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-2 w-2" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(ordem.id)}
                            title="Excluir"
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-2 w-2" />
                          </Button>
                          <Select
                            value={ordem.status}
                            onValueChange={(value: any) => updateStatus(ordem.id, value)}
                          >
                            <SelectTrigger className="w-20 h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aberta">Aberta</SelectItem>
                              <SelectItem value="em_andamento">Em Andamento</SelectItem>
                              <SelectItem value="aguardando_pecas">Aguardando Peças</SelectItem>
                              <SelectItem value="concluida">Concluída</SelectItem>
                              <SelectItem value="cancelada">Cancelada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-2">
            {filteredOrdens.map((ordem) => {
              const StatusIcon = statusConfig[ordem.status].icon;
              return (
                <Card key={ordem.id} className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-xs">{ordem.numero}</h3>
                        <p className="text-xs text-muted-foreground">{ordem.cliente.nome}</p>
                      </div>
                      <Badge className={`${statusConfig[ordem.status].color} text-xs px-1 py-0`}>
                        <StatusIcon className="h-2 w-2 mr-1" />
                        {statusConfig[ordem.status].label}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Equipamento:</span>
                        <p className="font-medium text-xs">{ordem.equipamento.tipo}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prioridade:</span>
                        <Badge className={`${prioridadeConfig[ordem.prioridade].color} text-xs px-1 py-0`}>
                          {prioridadeConfig[ordem.prioridade].label}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-xs">
                      <span className="text-muted-foreground">Problema:</span>
                      <p className="line-clamp-2 text-xs">{ordem.problema}</p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">
                        <Calendar className="h-2 w-2 inline mr-1" />
                        {new Date(ordem.dataAbertura).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGeneratePDF(ordem)}
                          className="h-6 w-6 p-0"
                        >
                          <FileText className="h-2 w-2" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(ordem)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-2 w-2" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(ordem.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-2 w-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          
          {filteredOrdens.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma ordem encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'todos' || prioridadeFilter !== 'todos'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Crie sua primeira ordem de serviço'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal do Formulário */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-2">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[98vh] overflow-hidden">
            <OrdemServicoForm
              initialData={editingOrdem ? {
                cliente: editingOrdem.cliente,
                equipamento: editingOrdem.equipamento,
                problema: editingOrdem.problema,
                diagnostico: editingOrdem.diagnostico,
                solucao: editingOrdem.solucao,
                prioridade: editingOrdem.prioridade,
                dataPrevisao: editingOrdem.dataPrevisao || '',
                tecnico: editingOrdem.tecnico || '',
                valorServico: editingOrdem.valorServico || 0,
                valorPecas: editingOrdem.valorPecas || 0,
                observacoes: editingOrdem.observacoes || ''
              } : undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingOrdem(null);
              }}
              isLoading={loading}
              title={editingOrdem ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
            />
          </div>
        </div>
      )}

      {/* Modal do PDF */}
      {showPDF && selectedOrdemForPDF && (
        <OrdemServicoPDFSimple
          ordem={selectedOrdemForPDF}
          onClose={() => {
            setShowPDF(false);
            setSelectedOrdemForPDF(null);
          }}
        />
      )}
    </div>
  );
}
