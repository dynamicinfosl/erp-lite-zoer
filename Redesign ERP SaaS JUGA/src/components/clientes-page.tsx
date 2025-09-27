import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { JugaStepper, JugaEmptyState } from './juga-components';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

// Mock data
const clientes = [
  {
    id: 1,
    nome: 'João Silva',
    email: 'joao@empresa.com',
    telefone: '(11) 99999-9999',
    cidade: 'São Paulo',
    status: 'Ativo',
    ultimaCompra: '2024-01-15',
    totalCompras: 25600,
    categoria: 'Premium'
  },
  {
    id: 2,
    nome: 'Maria Santos',
    email: 'maria@email.com',
    telefone: '(11) 88888-8888',
    cidade: 'Rio de Janeiro',
    status: 'Ativo',
    ultimaCompra: '2024-01-10',
    totalCompras: 12800,
    categoria: 'Regular'
  },
  {
    id: 3,
    nome: 'Pedro Costa',
    email: 'pedro@empresa.com.br',
    telefone: '(11) 77777-7777',
    cidade: 'Belo Horizonte',
    status: 'Inativo',
    ultimaCompra: '2023-12-20',
    totalCompras: 8400,
    categoria: 'Regular'
  },
];

const importSteps = [
  {
    id: 'upload',
    title: 'Upload do Arquivo',
    description: 'Envie seu arquivo CSV/XLSX',
    status: 'current' as const,
  },
  {
    id: 'mapping',
    title: 'Mapeamento',
    description: 'Configure as colunas',
    status: 'pending' as const,
  },
  {
    id: 'import',
    title: 'Importação',
    description: 'Confirme e importe',
    status: 'pending' as const,
  },
];

export function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || cliente.status.toLowerCase() === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variant = status === 'Ativo' ? 'default' : 'secondary';
    const color = status === 'Ativo' ? 'bg-juga-success text-white' : 'bg-juga-text-muted text-white';
    return <Badge className={color}>{status}</Badge>;
  };

  const getCategoryBadge = (categoria: string) => {
    const color = categoria === 'Premium' ? 'bg-juga-primary text-white' : 'bg-juga-secondary text-white';
    return <Badge className={color}>{categoria}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-heading">Clientes</h1>
          <p className="text-body">Gerencie sua base de clientes</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Importar Clientes</DialogTitle>
                <DialogDescription>
                  Importe seus clientes através de um arquivo CSV ou XLSX
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <JugaStepper steps={importSteps} />
                
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-juga-border rounded-lg p-8 text-center">
                      <FileSpreadsheet className="h-12 w-12 text-juga-text-muted mx-auto mb-4" />
                      <p className="text-heading mb-2">Arraste seu arquivo aqui</p>
                      <p className="text-caption text-sm mb-4">ou clique para selecionar</p>
                      <Button variant="outline">Selecionar Arquivo</Button>
                    </div>
                    <div className="text-sm text-caption">
                      <p><strong>Formatos aceitos:</strong> CSV, XLSX</p>
                      <p><strong>Tamanho máximo:</strong> 10MB</p>
                      <p><strong>Colunas esperadas:</strong> Nome, Email, Telefone, Cidade</p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <Button variant="outline" disabled={currentStep === 0}>
                    Anterior
                  </Button>
                  <Button className="juga-gradient text-white">
                    {currentStep === 2 ? 'Importar' : 'Próximo'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="juga-gradient text-white">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
                <DialogDescription>
                  Cadastre um novo cliente no sistema
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input id="nome" placeholder="Digite o nome completo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Textarea id="endereco" placeholder="Endereço completo" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancelar</Button>
                <Button className="juga-gradient text-white">Salvar Cliente</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="juga-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-juga-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-juga-primary" />
              </div>
              <div>
                <p className="text-caption text-sm">Total de Clientes</p>
                <p className="text-heading font-bold text-xl">1,248</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="juga-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-juga-success/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-juga-success" />
              </div>
              <div>
                <p className="text-caption text-sm">Clientes Ativos</p>
                <p className="text-heading font-bold text-xl">1,186</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="juga-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-juga-warning/10 rounded-lg">
                <Calendar className="h-5 w-5 text-juga-warning" />
              </div>
              <div>
                <p className="text-caption text-sm">Novos Este Mês</p>
                <p className="text-heading font-bold text-xl">89</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="juga-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-juga-accent/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-juga-accent" />
              </div>
              <div>
                <p className="text-caption text-sm">Ticket Médio</p>
                <p className="text-heading font-bold text-xl">R$ 458</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="juga-card">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-juga-text-muted h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="juga-card">
        <CardHeader>
          <CardTitle className="text-heading">Lista de Clientes</CardTitle>
          <CardDescription>
            {filteredClientes.length} clientes encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClientes.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Última Compra</TableHead>
                    <TableHead>Total Compras</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-heading">{cliente.nome}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-juga-text-muted" />
                            <span className="text-body">{cliente.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-juga-text-muted" />
                            <span className="text-body">{cliente.telefone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-juga-text-muted" />
                          <span className="text-body">{cliente.cidade}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(cliente.status)}</TableCell>
                      <TableCell>{getCategoryBadge(cliente.categoria)}</TableCell>
                      <TableCell>
                        <span className="text-body">{cliente.ultimaCompra}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-heading">
                          R$ {cliente.totalCompras.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <JugaEmptyState
              icon={<Search className="h-16 w-16" />}
              title="Nenhum cliente encontrado"
              description="Tente ajustar os filtros de busca ou cadastre um novo cliente."
              action={{
                label: "Novo Cliente",
                onClick: () => {}
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}