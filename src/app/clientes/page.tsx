
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
import { ImportPreviewModal } from '@/components/ui/ImportPreviewModal';

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
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<any[][]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);
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

  const parseCSVFlexible = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];
    const first = lines[0];
    const delimiter = (first.split(';').length - 1) > (first.split(',').length - 1) ? ';' : ',';
    const headers = first.split(delimiter).map(h => h.replace(/"/g, '').trim());
    return lines.slice(1).map(line => {
      const values = [] as string[];
      let cur = '';
      let quoted = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (quoted && line[i + 1] === '"') { cur += '"'; i++; }
          else { quoted = !quoted; }
        } else if (ch === delimiter && !quoted) {
          values.push(cur); cur = '';
        } else { cur += ch; }
      }
      values.push(cur);
      const row: any = {};
      headers.forEach((h, idx) => { row[h] = (values[idx] || '').replace(/"/g, '').trim(); });
      return row;
    });
  };

  // Normalização de cabeçalhos e linhas importadas
  const normalizeHeader = (raw: string): string => {
    const h = String(raw || '')
      .replace(/\u00A0/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s\/]/g, '') // Manter barras para "nome/nome fantasia"
      .replace(/\s+/g, ' ')
      .trim();
    if (["nome","name","cliente","razão social","razao social","nome do cliente","nome/nome fantasia"].includes(h)) return "nome";
    if (["e-mail","email","mail"].includes(h)) return "e-mail";
    if (["telefone","celular","phone","telemovel"].includes(h)) return "telefone";
    if (["cpf/cnpj","cpf","cnpj","documento","document"].includes(h)) return "cpf/cnpj";
    if (["endereço","endereco","address"].includes(h)) return "endereço";
    if (["bairro","district","neighborhood"].includes(h)) return "bairro";
    if (["cidade","city","municipio","município"].includes(h)) return "cidade";
    if (["estado","uf","state"].includes(h)) return "estado";
    if (["cep","zip","zipcode","código postal","codigo postal"].includes(h)) return "cep";
    if (["observações","observacoes","obs","notes","observações adicionais","observacoes adicionais"].includes(h)) return "observações";
    if (["vendedor responsável","vendedor responsavel","responsible_seller"].includes(h)) return "vendedor responsável";
    if (["financeiro responsável","financeiro responsavel","responsible_financial"].includes(h)) return "financeiro responsável";
    if (["limite financeiro","limite","credit_limit","limite de crédito","limite de credito"].includes(h)) return "limite financeiro";
    return h;
  };

  const normalizeImportedRow = (row: Record<string, any>): Record<string, any> => {
    const out: Record<string, any> = {};
    Object.entries(row).forEach(([k, v]) => {
      const key = normalizeHeader(k);
      out[key] = typeof v === 'string' ? v.replace(/\u00A0/g, ' ').trim() : v;
    });
    return out;
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let rows: any[][] = [];
      let headers: string[] = [];

      if (ext === 'xlsx' || ext === 'xls') {
        // @ts-ignore dependência opcional
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data);
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (rows.length < 2) {
          toast.error('Planilha deve conter cabeçalho e pelo menos uma linha');
          return;
        }
        const rawHeaders = rows[0].map((h: any) => String(h || ''));
        headers = rawHeaders.map(h => h.replace(/\u00A0/g, ' ').trim());
      } else if (ext === 'csv') {
        const text = await file.text();
        const parsed = parseCSVFlexible(text);
        const first = parsed[0] || {};
        headers = Object.keys(first).map(h => h.replace(/\u00A0/g, ' ').trim());
        rows = [headers, ...parsed.map(r => headers.map(h => r[h]))];
        if (rows.length === 0) {
          toast.error('Arquivo CSV inválido ou vazio');
          return;
        }
      } else {
        toast.error('Selecione um arquivo .csv, .xls ou .xlsx');
          return;
        }

      // Preparar dados para o modal de preview
      const dataRows = rows.slice(1).map(r => {
        const obj: any = {};
        headers.forEach((h: string, idx: number) => {
          const key = normalizeHeader(h);
          obj[key] = (r[idx] ?? '').toString().replace(/\u00A0/g, ' ').trim();
        });
        // Ajustes específicos para o layout Clientes.xlsx (Worksheet)
        const tipo = (obj['tipo'] || '').toUpperCase();
        const cpf = (obj['cpf'] || '').replace(/\D/g, '');
        const cnpj = (obj['cnpj'] || '').replace(/\D/g, '');
        if (!obj['cpf/cnpj']) {
          obj['cpf/cnpj'] = (tipo === 'PJ' ? cnpj : cpf) || cpf || cnpj || '';
        }
        // Endereço completo
        const logradouro = obj['endereço'] || obj['logradouro'] || '';
        const numero = obj['número'] || obj['numero'] || '';
        const complemento = obj['complemento'] || '';
        if (!obj['endereço']) {
          const parts = [logradouro, numero && `, ${numero}`, complemento && `, ${complemento}`].filter(Boolean);
          obj['endereço'] = parts.join('');
        }
        // Telefone preferindo celular
        if (!obj['telefone'] && obj['celular']) obj['telefone'] = obj['celular'];
        // CEP somente dígitos
        if (obj['cep']) obj['cep'] = String(obj['cep']).replace(/\D/g, '');
        // Ativo: "Sim" -> true
        if (obj['ativo']) obj['ativo'] = /^sim$/i.test(String(obj['ativo']).trim());
        return obj;
      });

      // Validar dados e contar erros
      const errors: string[] = [];
      let validCount = 0;
      let invalidCount = 0;

      dataRows.forEach((row, index) => {
        const nome = row['nome'] || row['Nome'];
        if (!nome || String(nome).trim().length === 0) {
          errors.push(`Linha ${index + 2}: Nome é obrigatório`);
          invalidCount++;
        } else {
          validCount++;
        }
      });

      // Configurar estado para o modal de preview
      setImportFileName(file.name);
      setImportHeaders(headers.map(normalizeHeader));
      setImportRows(rows.slice(1));
      setImportData(dataRows);
      setImportErrors(errors);
      setShowImportPreview(true);

      toast.success(`${rows.length - 1} registros carregados com sucesso!`);
      } catch (error) {
      console.error('Erro ao importar arquivo:', getErrorMessage(error));
      toast.error('Erro ao importar arquivo');
    }
  };

  const handleImportConfirm = () => {
    setShowImportPreview(false);
    setShowImportDialog(true);
  };

  const handleImportCancel = () => {
    setShowImportPreview(false);
    setImportData([]);
    setImportHeaders([]);
    setImportRows([]);
    setImportErrors([]);
  };

  const handleExtractData = async () => {
    console.log('🔵 handleExtractData chamado');
    try {
      setIsExtracting(true);
      console.log('🔵 isExtracting definido como true');
      
      if (ENABLE_AUTH) {
        // Verificar se há dados para extrair
        if (!importData || importData.length === 0) {
          console.log('🔴 Nenhum dado para extrair');
          toast.error('Nenhum dado para extrair');
          return;
        }
      }
      
      // Processar e salvar os dados extraídos diretamente no sistema
      let successCount = 0;
      let errorCount = 0;
      
      for (const row of importData) {
        try {
          const customerData = {
            name: row['nome'] || row['Nome'] || '',
            email: row['e-mail'] || row['email'] || '',
            phone: row['telefone'] || row['phone'] || '',
            document: row['cpf/cnpj'] || row['cpf'] || row['cnpj'] || '',
            address: row['endereço'] || row['address'] || '',
            neighborhood: row['bairro'] || row['neighborhood'] || '',
            city: row['cidade'] || row['city'] || '',
            state: row['estado'] || row['state'] || '',
            zipcode: row['cep'] || row['zipcode'] || '',
            notes: row['observações'] || row['notes'] || '',
            is_active: (String(row['ativo'] || 'Sim')).toLowerCase() === 'sim'
          };

          console.log('Dados do cliente a ser criado:', customerData);

          if (customerData.name.trim()) {
            if (ENABLE_AUTH) {
              await api.post('/customers', customerData);
            } else {
              // Modo sem autenticação - adicionar diretamente à lista local
              const newCustomer = {
                id: Date.now() + Math.random(),
                user_id: 1,
                ...customerData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              setCustomers(prev => [...prev, newCustomer]);
            }
            successCount++;
          }
        } catch (error) {
          console.error('Erro ao extrair cliente:', error);
          console.error('Dados que causaram erro:', row);
          errorCount++;
        }
      }
      
      // Atualizar a lista de clientes
      await fetchCustomers();
      
      toast.success(`${successCount} clientes extraídos com sucesso!${errorCount > 0 ? ` (${errorCount} erros)` : ''}`);
      
    } catch (error) {
      console.error('Erro ao extrair dados:', getErrorMessage(error));
      toast.error('Erro ao extrair dados');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConsumeData = async () => {
    console.log('🟣 handleConsumeData chamado');
    try {
      setIsConsuming(true);
      console.log('🟣 isConsuming definido como true');
      
      // Consumir dados de uma sessão anterior (simular dados em memória)
      // Em um sistema real, isso poderia vir de um cache ou sessão
      const mockConsumeData = [
        {
          name: 'Cliente Consumido 1',
          email: 'consumido1@email.com',
          phone: '(11) 99999-0001',
          document: '12345678901',
          address: 'Rua Consumida, 123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234567',
          is_active: true
        },
        {
          name: 'Cliente Consumido 2',
          email: 'consumido2@email.com',
          phone: '(11) 99999-0002',
          document: '12345678902',
          address: 'Rua Consumida, 456',
          neighborhood: 'Vila Nova',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234568',
          is_active: true
        }
      ];
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const customerData of mockConsumeData) {
        try {
          await api.post('/customers', customerData);
          successCount++;
        } catch (error) {
          console.error('Erro ao consumir cliente:', error);
          errorCount++;
        }
      }
      
      // Atualizar a lista de clientes
      await fetchCustomers();
      
      toast.success(`${successCount} clientes consumidos com sucesso!${errorCount > 0 ? ` (${errorCount} erros)` : ''}`);
      
    } catch (error) {
      console.error('Erro ao consumir dados:', getErrorMessage(error));
      toast.error('Erro ao consumir dados');
    } finally {
      setIsConsuming(false);
    }
  };

  const processImportData = async () => {
    try {
      setImportLoading(true);
      let successCount = 0;
      let errorCount = 0;

      console.log('Iniciando importação de', importData.length, 'clientes');
      console.log('ENABLE_AUTH:', ENABLE_AUTH);

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
            is_active: (row['Status'] || row['status'] || 'Ativo').toLowerCase() === 'ativo'
          };

          console.log('Processando cliente:', customerData.name);

          if (!customerData.name) {
            console.log('Cliente sem nome, pulando...');
            errorCount++;
            continue;
          }

          if (ENABLE_AUTH) {
            console.log('Salvando via API...');
            await api.post('/customers', customerData);
          } else {
            console.log('Modo sem auth - adicionando à lista local');
            const newCustomer = {
              id: Date.now() + Math.random(),
              user_id: 1,
              ...customerData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            setCustomers(prev => [...prev, newCustomer]);
          }
          successCount++;
        } catch (error) {
          console.error('Erro ao importar cliente:', getErrorMessage(error));
          console.error('Dados do cliente que causou erro:', row);
          errorCount++;
        }
      }

      setShowImportDialog(false);
      setImportData([]);
      
      // Sempre atualizar a lista após importação
      console.log('Atualizando lista de clientes...');
      await fetchCustomers();
      
      if (successCount > 0) {
        toast.success(`${successCount} clientes importados com sucesso!`);
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
                Importar CSV/XLSX
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
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
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

      {/* Modal de Preview da Importação */}
      <ImportPreviewModal
        isOpen={showImportPreview}
        onClose={handleImportCancel}
        onConfirm={handleImportConfirm}
        onExtract={handleExtractData}
        onConsume={handleConsumeData}
        fileName={importFileName}
        headers={importHeaders}
        data={importRows}
        totalRows={importRows.length}
        validRows={importRows.length - importErrors.length}
        invalidRows={importErrors.length}
        errors={importErrors}
        isExtracting={isExtracting}
        isConsuming={isConsuming}
      />

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
