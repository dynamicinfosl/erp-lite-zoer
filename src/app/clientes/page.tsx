
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, User, Phone, MapPin, Mail, FileSpreadsheet, Upload, ChevronDown, Eye, Camera, Paperclip, X, CheckSquare, Square, Trash } from 'lucide-react';
import { Customer } from '@/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { ENABLE_AUTH } from '@/constants/auth';
import { mockCustomers } from '@/lib/mock-data';
import { getErrorMessage } from '@/lib/error-handler';

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [showImportConfirmation, setShowImportConfirmation] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    zipcode: '',
    notes: '',
    responsible_seller: '',
    responsible_financial: '',
    photo: '',
    attachments: [] as string[],
    observations: '',
    credit_limit: 0,
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      if (ENABLE_AUTH) {
        const data = await api.get<Customer[]>('/customers');
        setCustomers(data);
      } else {
        // Corrige o tipo de user_id para number ao mapear os mockCustomers
        setCustomers(
          mockCustomers.map((customer) => ({
            ...customer,
            user_id: Number(customer.user_id),
          }))
        );
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', getErrorMessage(error));
      if (ENABLE_AUTH) {
        toast.error('Erro ao carregar clientes');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      if (editingCustomer) {
        await api.put(`/customers?id=${editingCustomer.id}`, formData);
        toast.success('Cliente atualizado com sucesso');
      } else {
        await api.post('/customers', formData);
        toast.success('Cliente criado com sucesso');
      }

      setShowDialog(false);
      setEditingCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error('Erro ao salvar cliente:', getErrorMessage(error));
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      document: customer.document || '',
      address: customer.address || '',
      neighborhood: customer.neighborhood || '',
      city: customer.city || '',
      state: customer.state || '',
      zipcode: customer.zipcode || '',
      notes: customer.notes || '',
      responsible_seller: customer.responsible_seller || '',
      responsible_financial: customer.responsible_financial || '',
      photo: customer.photo || '',
      attachments: customer.attachments || [],
      observations: customer.observations || '',
      credit_limit: customer.credit_limit || 0,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      await api.delete(`/customers?id=${id}`);
      toast.success('Cliente excluído com sucesso');
      fetchCustomers();
    } catch (error) {
      console.error('Erro ao excluir cliente:', getErrorMessage(error));
      toast.error('Erro ao excluir cliente');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      document: '',
      address: '',
      neighborhood: '',
      city: '',
      state: '',
      zipcode: '',
      notes: '',
      responsible_seller: '',
      responsible_financial: '',
      photo: '',
      attachments: [],
      observations: '',
      credit_limit: 0,
    });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('A foto deve ter no máximo 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, photo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments: string[] = [];
      
      Array.from(files).forEach(file => {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit per file
          toast.error(`O arquivo ${file.name} deve ter no máximo 10MB`);
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          newAttachments.push(e.target?.result as string);
          if (newAttachments.length === files.length) {
            setFormData(prev => ({ 
              ...prev, 
              attachments: [...prev.attachments, ...newAttachments] 
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // Funções de seleção múltipla
  const handleSelectCustomer = (customerId: number) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCustomers([]);
      setIsAllSelected(false);
    } else {
      const allIds = filteredCustomers.map(customer => customer.id);
      setSelectedCustomers(allIds);
      setIsAllSelected(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) return;
    
    if (!confirm(`Tem certeza que deseja excluir ${selectedCustomers.length} cliente(s) selecionado(s)?`)) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const customerId of selectedCustomers) {
        try {
          await api.delete(`/customers?id=${customerId}`);
          successCount++;
        } catch (error) {
          console.error('Erro ao excluir cliente:', getErrorMessage(error));
          errorCount++;
        }
      }

      setSelectedCustomers([]);
      setIsAllSelected(false);
      
      if (successCount > 0) {
        toast.success(`${successCount} cliente(s) excluído(s) com sucesso!`);
        fetchCustomers();
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} cliente(s) não puderam ser excluídos`);
      }
    } catch (error) {
      console.error('Erro ao excluir clientes:', getErrorMessage(error));
      toast.error('Erro ao excluir clientes');
    }
  };

  const handleBulkExport = () => {
    if (selectedCustomers.length === 0) {
      toast.error('Selecione pelo menos um cliente para exportar');
      return;
    }

    try {
      const selectedCustomersData = filteredCustomers.filter(customer => 
        selectedCustomers.includes(customer.id)
      );

      const csvData = selectedCustomersData.map(customer => ({
        'Nome': customer.name,
        'E-mail': customer.email || '',
        'Telefone': customer.phone || '',
        'CPF/CNPJ': customer.document || '',
        'Endereço': customer.address || '',
        'Bairro': customer.neighborhood || '',
        'Cidade': customer.city || '',
        'Estado': customer.state || '',
        'CEP': customer.zipcode || '',
        'Observações': customer.notes || '',
        'Vendedor Responsável': customer.responsible_seller || '',
        'Financeiro Responsável': customer.responsible_financial || '',
        'Limite Financeiro': customer.credit_limit || 0,
        'Observações Adicionais': customer.observations || '',
        'Status': customer.is_active ? 'Ativo' : 'Inativo',
        'Data de Criação': new Date(customer.created_at).toLocaleDateString('pt-BR')
      }));

      // Converter para CSV
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = (row as any)[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `clientes_selecionados_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${selectedCustomersData.length} cliente(s) exportado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao exportar clientes selecionados:', getErrorMessage(error));
      toast.error('Erro ao exportar clientes selecionados');
    }
  };

  const exportToCSV = () => {
    try {
      const csvData = filteredCustomers.map(customer => ({
        'Nome': customer.name,
        'E-mail': customer.email || '',
        'Telefone': customer.phone || '',
        'CPF/CNPJ': customer.document || '',
        'Endereço': customer.address || '',
        'Bairro': customer.neighborhood || '',
        'Cidade': customer.city || '',
        'Estado': customer.state || '',
        'CEP': customer.zipcode || '',
        'Observações': customer.notes || '',
        'Vendedor Responsável': customer.responsible_seller || '',
        'Financeiro Responsável': customer.responsible_financial || '',
        'Limite Financeiro': customer.credit_limit || 0,
        'Observações Adicionais': customer.observations || '',
        'Status': customer.is_active ? 'Ativo' : 'Inativo',
        'Data de Criação': new Date(customer.created_at).toLocaleDateString('pt-BR')
      }));

      // Converter para CSV
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = (row as any)[header] || '';
            // Escapar aspas e quebras de linha
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Planilha exportada com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar planilha:', getErrorMessage(error));
      toast.error('Erro ao exportar planilha');
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV válido');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error('Arquivo CSV deve ter pelo menos um cabeçalho e uma linha de dados');
          return;
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });

        setImportData(data);
        setShowImportConfirmation(true);
        toast.success(`${data.length} registros carregados com sucesso!`);
      } catch (error) {
        console.error('Erro ao processar arquivo CSV:', getErrorMessage(error));
        toast.error('Erro ao processar arquivo CSV');
      }
    };

    reader.readAsText(file, 'utf-8');
  };

  const confirmImport = () => {
    setShowImportConfirmation(false);
    setShowImportDialog(true);
  };

  const cancelImport = () => {
    setShowImportConfirmation(false);
    setImportData([]);
  };

  const processImportData = async () => {
    try {
      setImportLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const row of importData) {
        try {
          const customerData = {
            name: row['Nome'] || row['nome'] || '',
            email: row['E-mail'] || row['email'] || '',
            phone: row['Telefone'] || row['telefone'] || '',
            document: row['CPF/CNPJ'] || row['documento'] || '',
            address: row['Endereço'] || row['endereco'] || '',
            neighborhood: row['Bairro'] || row['bairro'] || '',
            city: row['Cidade'] || row['cidade'] || '',
            state: row['Estado'] || row['estado'] || '',
            zipcode: row['CEP'] || row['cep'] || '',
            notes: row['Observações'] || row['observacoes'] || '',
            responsible_seller: row['Vendedor Responsável'] || row['vendedor_responsavel'] || '',
            responsible_financial: row['Financeiro Responsável'] || row['financeiro_responsavel'] || '',
            observations: row['Observações Adicionais'] || row['observacoes_adicionais'] || '',
            credit_limit: parseFloat(row['Limite Financeiro'] || row['limite_financeiro'] || '0') || 0,
            is_active: (row['Status'] || row['status'] || 'Ativo').toLowerCase() === 'ativo'
          };

          if (!customerData.name) {
            errorCount++;
            continue;
          }

          if (ENABLE_AUTH) {
            await api.post('/customers', customerData);
          }
          successCount++;
        } catch (error) {
          console.error('Erro ao importar cliente:', getErrorMessage(error));
          errorCount++;
        }
      }

      setShowImportDialog(false);
      setImportData([]);
      
      if (successCount > 0) {
        toast.success(`${successCount} clientes importados com sucesso!`);
        fetchCustomers();
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} clientes não puderam ser importados`);
      }
    } catch (error) {
      console.error('Erro ao processar importação:', getErrorMessage(error));
      toast.error('Erro ao processar importação');
    } finally {
      setImportLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.document?.includes(searchTerm)
  );

  // Reset selection when filtered customers change
  useEffect(() => {
    setSelectedCustomers([]);
    setIsAllSelected(false);
  }, [searchTerm, customers]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie sua base de clientes
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Mais Opções
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setShowExportPreview(true)} 
                disabled={filteredCustomers.length === 0}
                className="cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar Planilha
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={exportToCSV} 
                disabled={filteredCustomers.length === 0}
                className="cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleBulkExport} 
                disabled={selectedCustomers.length === 0}
                className="cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar Selecionados ({selectedCustomers.length})
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => document.getElementById('import-file')?.click()}
                className="cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar CSV
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleBulkDelete} 
                disabled={selectedCustomers.length === 0}
                className="cursor-pointer text-red-600"
              >
                <Trash className="h-4 w-4 mr-2" />
                Excluir Selecionados ({selectedCustomers.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            id="import-file"
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingCustomer(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">CPF/CNPJ</Label>
                  <Input
                    id="document"
                    value={formData.document}
                    onChange={(e) => setFormData(prev => ({ ...prev, document: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipcode">CEP</Label>
                  <Input
                    id="zipcode"
                    value={formData.zipcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipcode: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Seção de Responsáveis e Limite Financeiro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsible_seller">Vendedor Responsável</Label>
                  <Input
                    id="responsible_seller"
                    value={formData.responsible_seller}
                    onChange={(e) => setFormData(prev => ({ ...prev, responsible_seller: e.target.value }))}
                    placeholder="Nome do vendedor responsável"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsible_financial">Financeiro Responsável</Label>
                  <Input
                    id="responsible_financial"
                    value={formData.responsible_financial}
                    onChange={(e) => setFormData(prev => ({ ...prev, responsible_financial: e.target.value }))}
                    placeholder="Nome do responsável financeiro"
                  />
                </div>
              </div>

              {/* Limite Financeiro */}
              <div className="space-y-2">
                <Label htmlFor="credit_limit">Limite Financeiro (R$)</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, credit_limit: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                />
                <p className="text-xs text-muted-foreground">
                  Limite de crédito disponível para o cliente
                </p>
              </div>

              {/* Seção de Foto */}
              <div className="space-y-2">
                <Label>Foto do Cliente</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {formData.photo ? (
                    <div className="relative">
                      <img 
                        src={formData.photo} 
                        alt="Foto do cliente" 
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="w-full sm:w-auto"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {formData.photo ? 'Alterar Foto' : 'Adicionar Foto'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Máximo 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Seção de Anexos */}
              <div className="space-y-2">
                <Label>Anexos</Label>
                <div className="space-y-2">
                  <input
                    type="file"
                    id="attachment-upload"
                    multiple
                    onChange={handleAttachmentUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('attachment-upload')?.click()}
                    className="w-full sm:w-auto"
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Adicionar Anexos
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Máximo 10MB por arquivo
                  </p>
                  
                  {formData.attachments.length > 0 && (
                    <div className="space-y-2">
                      {formData.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">Anexo {index + 1}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Seção de Observações Adicionais */}
              <div className="space-y-2">
                <Label htmlFor="observations">Observações Adicionais</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  rows={4}
                  placeholder="Informações adicionais sobre o cliente..."
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowDialog(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="w-full sm:w-auto"
                >
                  {editingCustomer ? 'Atualizar' : 'Criar'} Cliente
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Dialog de Importação */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisar Dados para Importação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h4 className="font-medium text-green-900">Dados Carregados</h4>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {importData.length} registros encontrados. Verifique os dados abaixo antes de confirmar a importação.
              </p>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importData.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row['Nome'] || row['nome'] || '-'}</TableCell>
                      <TableCell>{row['E-mail'] || row['email'] || '-'}</TableCell>
                      <TableCell>{row['Telefone'] || row['telefone'] || '-'}</TableCell>
                      <TableCell>{row['CPF/CNPJ'] || row['documento'] || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={row['Status']?.toLowerCase() === 'ativo' || row['status']?.toLowerCase() === 'ativo' ? 'default' : 'secondary'}>
                          {row['Status'] || row['status'] || 'Ativo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {importData.length > 10 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  ... e mais {importData.length - 10} registros
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowImportDialog(false);
                  setImportData([]);
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={processImportData} 
                disabled={importLoading}
              >
                {importLoading ? 'Importando...' : `Importar ${importData.length} Clientes`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Importação */}
      <Dialog open={showImportConfirmation} onOpenChange={setShowImportConfirmation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Importação de Clientes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h4 className="font-medium text-blue-900">Arquivo CSV Carregado</h4>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                {importData.length} registros foram encontrados no arquivo CSV.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Próximos passos:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Os dados serão validados automaticamente</li>
                <li>• Clientes com nomes duplicados serão ignorados</li>
                <li>• Você poderá revisar os dados antes da importação final</li>
                <li>• Um relatório será gerado com o resultado da importação</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <h4 className="font-medium text-yellow-900">Atenção</h4>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Esta operação irá adicionar novos clientes ao sistema. Certifique-se de que os dados estão corretos.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={cancelImport}
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmImport}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continuar para Revisão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização da Planilha */}
      <Dialog open={showExportPreview} onOpenChange={setShowExportPreview}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização da Planilha de Exportação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {filteredCustomers.length} clientes serão exportados. Esta é uma prévia dos dados que serão incluídos no arquivo CSV.
            </p>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Limite Financeiro</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.slice(0, 20).map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>{customer.document || '-'}</TableCell>
                      <TableCell>
                        {customer.credit_limit ? `R$ ${customer.credit_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                          {customer.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredCustomers.length > 20 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  ... e mais {filteredCustomers.length - 20} clientes
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Total de registros: {filteredCustomers.length}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowExportPreview(false)}
                >
                  Fechar
                </Button>
                <Button 
                  onClick={() => {
                    setShowExportPreview(false);
                    exportToCSV();
                  }}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {customers.filter(c => c.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com E-mail</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.email).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail, telefone ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={fetchCustomers}>
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Clientes ({filteredCustomers.length})</CardTitle>
            {selectedCustomers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedCustomers.length} selecionado(s)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCustomers([]);
                    setIsAllSelected(false);
                  }}
                >
                  Limpar Seleção
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 hover:bg-gray-50"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className={selectedCustomers.includes(customer.id) ? 'bg-blue-50' : ''}>
                    <TableCell>
                      <button
                        onClick={() => handleSelectCustomer(customer.id)}
                        className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 hover:bg-gray-50"
                      >
                        {selectedCustomers.includes(customer.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          {customer.document && (
                            <div className="text-sm text-muted-foreground">
                              {customer.document}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="text-sm">
                            <div>{customer.address}</div>
                            {(customer.neighborhood || customer.city) && (
                              <div className="text-muted-foreground">
                                {customer.neighborhood && `${customer.neighborhood}, `}
                                {customer.city}
                                {customer.state && ` - ${customer.state}`}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                        {customer.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
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

          {!loading && filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum cliente encontrado com os filtros aplicados.' : 'Nenhum cliente cadastrado.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
