'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  FileText,
  Clock,
  Eye,
  Edit,
  Plus,
  BarChart3,
  PieChart,
  Activity,
  Users,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { toast } from 'sonner';

interface ComplianceRecord {
  id: string;
  type: 'age_verification' | 'license_check' | 'tax_report' | 'audit' | 'inspection';
  date: string;
  status: 'compliant' | 'non_compliant' | 'pending' | 'warning';
  description: string;
  responsible: string;
  location: string;
  details: string;
  nextReview: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface LicenseRecord {
  id: string;
  type: string;
  number: string;
  issuer: string;
  issueDate: string;
  expirationDate: string;
  status: 'active' | 'expired' | 'pending_renewal';
  responsible: string;
}

const mockComplianceRecords: ComplianceRecord[] = [
  {
    id: '1',
    type: 'age_verification',
    date: '2024-01-15',
    status: 'compliant',
    description: 'Verificação de idade - Venda de bebidas alcoólicas',
    responsible: 'João Silva',
    location: 'Loja Principal',
    details: 'Todas as vendas verificadas corretamente. 100% de conformidade.',
    nextReview: '2024-02-15',
    severity: 'high'
  },
  {
    id: '2',
    type: 'license_check',
    date: '2024-01-14',
    status: 'warning',
    description: 'Verificação de licenças e alvarás',
    responsible: 'Maria Santos',
    location: 'Depósito Central',
    details: 'Licença de funcionamento vence em 30 dias. Renovação em andamento.',
    nextReview: '2024-01-30',
    severity: 'medium'
  },
  {
    id: '3',
    type: 'tax_report',
    date: '2024-01-10',
    status: 'compliant',
    description: 'Relatório fiscal mensal - Impostos sobre bebidas',
    responsible: 'Carlos Oliveira',
    location: 'Sistema',
    details: 'Relatório enviado dentro do prazo. Todos os impostos calculados corretamente.',
    nextReview: '2024-02-10',
    severity: 'high'
  },
  {
    id: '4',
    type: 'audit',
    date: '2024-01-08',
    status: 'non_compliant',
    description: 'Auditoria de vendas - Controle de estoque',
    responsible: 'Ana Costa',
    location: 'Loja Secundária',
    details: 'Discrepância encontrada no estoque de destilados. Investigação em andamento.',
    nextReview: '2024-01-22',
    severity: 'critical'
  },
  {
    id: '5',
    type: 'inspection',
    date: '2024-01-05',
    status: 'compliant',
    description: 'Inspeção sanitária - Armazenamento de bebidas',
    responsible: 'Pedro Lima',
    location: 'Depósito Central',
    details: 'Inspeção aprovada. Condições de armazenamento adequadas.',
    nextReview: '2024-07-05',
    severity: 'medium'
  }
];

const mockLicenses: LicenseRecord[] = [
  {
    id: '1',
    type: 'Licença de Funcionamento',
    number: 'LF-2024-001',
    issuer: 'Prefeitura Municipal',
    issueDate: '2024-01-01',
    expirationDate: '2024-12-31',
    status: 'active',
    responsible: 'João Silva'
  },
  {
    id: '2',
    type: 'Alvará Sanitário',
    number: 'AS-2024-002',
    issuer: 'Vigilância Sanitária',
    issueDate: '2024-01-15',
    expirationDate: '2024-12-31',
    status: 'active',
    responsible: 'Maria Santos'
  },
  {
    id: '3',
    type: 'Licença para Venda de Bebidas',
    number: 'LVB-2024-003',
    issuer: 'Polícia Civil',
    issueDate: '2024-01-10',
    expirationDate: '2024-12-31',
    status: 'active',
    responsible: 'Carlos Oliveira'
  },
  {
    id: '4',
    type: 'Licença Ambiental',
    number: 'LA-2024-004',
    issuer: 'IBAMA',
    issueDate: '2023-12-01',
    expirationDate: '2024-11-30',
    status: 'pending_renewal',
    responsible: 'Ana Costa'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'compliant': return 'bg-juga-primary/10 text-juga-primary';
    case 'non_compliant': return 'bg-red-100 text-red-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'warning': return 'bg-yellow-100 text-yellow-800';
    case 'active': return 'bg-juga-primary/10 text-juga-primary';
    case 'expired': return 'bg-red-100 text-red-800';
    case 'pending_renewal': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'compliant': return 'Conforme';
    case 'non_compliant': return 'Não Conforme';
    case 'pending': return 'Pendente';
    case 'warning': return 'Atenção';
    case 'active': return 'Ativa';
    case 'expired': return 'Expirada';
    case 'pending_renewal': return 'Renovação Pendente';
    default: return 'Desconhecido';
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'critical': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'age_verification': return <User className="h-4 w-4" />;
    case 'license_check': return <FileText className="h-4 w-4" />;
    case 'tax_report': return <CreditCard className="h-4 w-4" />;
    case 'audit': return <Shield className="h-4 w-4" />;
    case 'inspection': return <Activity className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

export function BeverageCompliance() {
  const [records, setRecords] = useState<ComplianceRecord[]>(mockComplianceRecords);
  const [licenses, setLicenses] = useState<LicenseRecord[]>(mockLicenses);
  const [filteredRecords, setFilteredRecords] = useState<ComplianceRecord[]>(mockComplianceRecords);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const types = [
    { value: 'all', label: 'Todos os tipos' },
    { value: 'age_verification', label: 'Verificação de Idade' },
    { value: 'license_check', label: 'Verificação de Licenças' },
    { value: 'tax_report', label: 'Relatório Fiscal' },
    { value: 'audit', label: 'Auditoria' },
    { value: 'inspection', label: 'Inspeção' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'compliant', label: 'Conforme' },
    { value: 'non_compliant', label: 'Não Conforme' },
    { value: 'pending', label: 'Pendente' },
    { value: 'warning', label: 'Atenção' }
  ];

  useEffect(() => {
    let filtered = records;

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(record => record.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    setFilteredRecords(filtered);
  }, [records, searchTerm, typeFilter, statusFilter]);

  const getCompliancePercentage = () => {
    const compliant = records.filter(r => r.status === 'compliant').length;
    return Math.round((compliant / records.length) * 100);
  };

  const getCriticalIssues = () => {
    return records.filter(r => r.severity === 'critical' || r.status === 'non_compliant').length;
  };

  const getExpiringLicenses = () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    return licenses.filter(license => {
      const expirationDate = new Date(license.expirationDate);
      return expirationDate <= thirtyDaysFromNow && expirationDate > today;
    }).length;
  };

  const getPendingReviews = () => {
    const today = new Date();
    
    return records.filter(record => {
      const reviewDate = new Date(record.nextReview);
      return reviewDate <= today;
    }).length;
  };

  const exportCompliance = (format: 'csv' | 'pdf') => {
    toast.success(`Relatório de compliance exportado em formato ${format.toUpperCase()}`);
  };

  const refreshCompliance = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Dados de compliance atualizados');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-juga-primary" />
            Compliance e Regulamentações
          </h2>
          <p className="text-muted-foreground">Gerencie conformidade legal e regulamentações para bebidas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCompliance('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => exportCompliance('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button onClick={refreshCompliance} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Conformidade Geral</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Shield className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-juga-primary">{getCompliancePercentage()}%</div>
              <Progress value={getCompliancePercentage()} className="h-2" />
              <p className="text-sm text-caption">
                Taxa de conformidade
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Licenças Ativas</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <FileText className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-juga-primary">{licenses.filter(l => l.status === 'active').length}</div>
              <p className="text-sm text-caption">
                {licenses.length} total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Problemas Críticos</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-juga-primary">{getCriticalIssues()}</div>
              <p className="text-sm text-caption">
                Requer atenção
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-juga-text-secondary">Revisões Pendentes</CardTitle>
              <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-juga-primary">{getPendingReviews()}</div>
              <p className="text-sm text-caption">
                Próximas revisões
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="records">Registros</TabsTrigger>
          <TabsTrigger value="licenses">Licenças</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          {/* Filters */}
          <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                  <Filter className="h-5 w-5 text-juga-primary" />
                  Filtros
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                }}>
                  Limpar Filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-juga-primary" />
                    <Input
                      id="search"
                      placeholder="Descrição, responsável, local..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Tipo</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Records Table */}
          <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-juga-text-secondary">Registros de Compliance ({filteredRecords.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Próxima Revisão</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(record.type)}
                            <span className="text-sm">{types.find(t => t.value === record.type)?.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{new Date(record.date).toLocaleDateString('pt-BR')}</div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="font-medium text-sm">{record.description}</div>
                            <div className="text-xs text-muted-foreground truncate">{record.details}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{record.responsible}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{record.location}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.status)}>
                            {getStatusText(record.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(record.severity)}>
                            {record.severity.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{new Date(record.nextReview).toLocaleDateString('pt-BR')}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 text-juga-primary" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4 text-juga-primary" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses" className="space-y-4">
          <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-juga-text-secondary">Licenças e Alvarás</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Emissor</TableHead>
                      <TableHead>Data de Emissão</TableHead>
                      <TableHead>Data de Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.map((license) => (
                      <TableRow key={license.id}>
                        <TableCell>
                          <div className="font-medium">{license.type}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{license.number}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{license.issuer}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{new Date(license.issueDate).toLocaleDateString('pt-BR')}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{new Date(license.expirationDate).toLocaleDateString('pt-BR')}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(license.status)}>
                            {getStatusText(license.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{license.responsible}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 text-juga-primary" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4 text-juga-primary" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                  <BarChart3 className="h-5 w-5 text-juga-primary" />
                  Relatórios Fiscais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Relatório Mensal - Janeiro 2024</div>
                      <div className="text-sm text-muted-foreground">Impostos sobre bebidas alcoólicas</div>
                    </div>
                    <Badge className="bg-juga-primary/10 text-juga-primary">Enviado</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Relatório Trimestral - Q4 2023</div>
                      <div className="text-sm text-muted-foreground">ICMS e IPI</div>
                    </div>
                    <Badge className="bg-juga-primary/10 text-juga-primary">Enviado</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Relatório Anual - 2023</div>
                      <div className="text-sm text-muted-foreground">Declaração anual</div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                  <Activity className="h-5 w-5 text-juga-primary" />
                  Auditorias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Auditoria de Vendas - Janeiro 2024</div>
                      <div className="text-sm text-muted-foreground">Controle de idade e documentação</div>
                    </div>
                    <Badge className="bg-juga-primary/10 text-juga-primary">Aprovada</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Auditoria de Estoque - Dezembro 2023</div>
                      <div className="text-sm text-muted-foreground">Controle de lotes e validade</div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Em Andamento</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Auditoria de Licenças - Novembro 2023</div>
                      <div className="text-sm text-muted-foreground">Verificação de documentação</div>
                    </div>
                    <Badge className="bg-juga-primary/10 text-juga-primary">Aprovada</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
