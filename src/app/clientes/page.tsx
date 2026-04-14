'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRef } from 'react';
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
import { Label } from '@/components/ui/label';
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
  RefreshCw,
  Pencil,
  MapPin,
  User,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { ImportPreviewModal } from '@/components/ui/ImportPreviewModal';
// XLSX carregado dinamicamente para reduzir bundle inicial
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { useBranch } from '@/contexts/BranchContext';
import { AddCustomerDialog } from '@/components/clientes/AddCustomerDialog';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  address?: string;
  address_number?: string;
  address_complement?: string;
  neighborhood?: string;
  city: string;
  state?: string;
  zipcode?: string;
  state_registration?: string;
  notes?: string;
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
  const { enabled: branchesEnabled, loading: branchLoading, branches, branchId, scope, currentBranch, isMatrixAdmin, userBranchId } = useBranch();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Estados para importação de endereços
  const [showImportAddressDialog, setShowImportAddressDialog] = useState(false);
  const [showImportAddressPreview, setShowImportAddressPreview] = useState(false);
  const [importAddressFileName, setImportAddressFileName] = useState('');
  const [importAddressHeaders, setImportAddressHeaders] = useState<string[]>([]);
  const [importAddressRows, setImportAddressRows] = useState<any[]>([]);
  const [importAddressErrors, setImportAddressErrors] = useState<string[]>([]);
  const [isImportingAddresses, setIsImportingAddresses] = useState(false);

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

  // Diálogo de edição (editCustomer continua aqui para edições na tabela)
  const [editCustomer, setEditCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    city: '',
    address: '',
    address_number: '',
    address_complement: '',
    neighborhood: '',
    state: '',
    zipcode: '',
    state_registration: '',
    notes: '',
    type: 'PF' as 'PF' | 'PJ',
    status: 'active' as 'active' | 'inactive',
  });

  // Controle de concorrência: evita respostas antigas sobrescreverem novas
  const requestSeqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const loadCustomers = useCallback(async () => {
    let mySeq = 0;
    let controller: AbortController | null = null;
    
    // Wrapper para capturar qualquer erro de abort antes do try/catch
    try {
      const tenantId = tenant?.id;
      if (!tenantId) {
        console.log('⏳ Nenhum tenant disponível, aguardando...');
        return;
      }

      // Evitar "piscar" dados: aguardar BranchContext resolver a branch atual
      // (principalmente quando admin matriz usa branchId da HQ, mas currentBranch ainda não carregou)
      if (branchesEnabled && scope === 'branch' && branchId && !currentBranch) {
        if (branchLoading) {
          console.log('⏳ Aguardando carregar filiais para determinar HQ antes de buscar clientes...', { branchId });
          return;
        }
        if (Array.isArray(branches) && branches.length > 0) {
          const resolved = branches.find((b) => b.id === branchId) || null;
          if (!resolved) {
            console.log('⏳ Branch selecionada ainda não resolvida, aguardando...', { branchId });
            return;
          }
        } else {
          console.log('⏳ Filiais ainda não carregadas, aguardando...', { branchId });
          return;
        }
      }

      // iniciar nova requisição e cancelar a anterior
      requestSeqRef.current += 1;
      mySeq = requestSeqRef.current;
      
      // Cancelar requisição anterior de forma segura
      if (abortRef.current) {
        try { 
          abortRef.current.abort();
        } catch (e) {
          // Ignorar erros ao abortar controller antigo
        }
        abortRef.current = null;
      }
      
      controller = new AbortController();
      abortRef.current = controller;

      // Verificar se já foi cancelado antes de continuar
      if (controller.signal.aborted) {
        return;
      }

      setLoading(true);
      
      // Construir parâmetros da query
      const params = new URLSearchParams({ tenant_id: tenantId });
      
      // Matriz x Filial:
      // - Se estiver em "all" OU sem branchId, buscar cadastros da matriz
      // - Se a filial atual for a HQ (Matriz), também buscar cadastros da matriz (created_at_branch_id IS NULL)
      const isHeadquarters = Boolean(currentBranch?.is_headquarters);
      const shouldUseMatrix = scope === 'all' || !branchId || isHeadquarters || !branchesEnabled;

      // Se está na matriz (scope === 'all' ou sem branchId ou HQ), buscar todos os clientes da matriz
      if (shouldUseMatrix) {
        params.set('branch_scope', 'all');
        console.log(`🔄 [Matriz] Buscando todos os clientes da matriz`, {
          scope,
          branchId,
          isHeadquarters,
          branchesEnabled,
          isMatrixAdmin,
          userBranchId,
        });
      } else if (branchId) {
        // Se está em uma filial, buscar clientes compartilhados + da filial
        params.set('branch_id', String(branchId));
        console.log(`🔄 [Filial ${branchId}] Buscando clientes compartilhados e da filial`);
      }
      
      const url = `/next_api/customers?${params.toString()}`;
      console.log(`🔄 Carregando clientes para tenant: ${tenantId}, branch: ${branchId}, scope: ${scope}`);
      console.log(`📡 URL da requisição: ${url}`);
      
      // Verificar se foi cancelado antes de fazer o fetch
      if (!controller || controller.signal.aborted || mySeq !== requestSeqRef.current) {
        return;
      }
      
      let response: Response;
      try {
        response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      } catch (fetchError: any) {
        // Se foi abortado durante o fetch, apenas retornar silenciosamente
        const isAbortError = 
          fetchError?.name === 'AbortError' ||
          (typeof fetchError?.message === 'string' && fetchError.message.toLowerCase().includes('aborted')) ||
          (typeof fetchError?.message === 'string' && fetchError.message.toLowerCase().includes('signal is aborted')) ||
          !controller ||
          controller.signal.aborted || 
          mySeq !== requestSeqRef.current;
          
        if (isAbortError) {
          return;
        }
        throw fetchError;
      }
      
      // Verificar novamente após o fetch
      if (!controller || controller.signal.aborted || mySeq !== requestSeqRef.current) {
        console.log('⚠️ Resposta antiga ignorada (customers)', { mySeq, current: requestSeqRef.current });
        return;
      }
      
      if (!response.ok) throw new Error('Erro ao carregar clientes');
      
      const data = await response.json();
      
      // ignorar se já houve outra requisição depois
      if (!controller || controller.signal.aborted || mySeq !== requestSeqRef.current) {
        console.log('⚠️ Resposta antiga ignorada (customers)', { mySeq, current: requestSeqRef.current });
        return;
      }
      console.log(`📊 Dados recebidos:`, data);
      const rows = Array.isArray(data?.data) ? data.data : (data?.rows || data || []);
      console.log(`👥 Clientes encontrados: ${rows.length}`);
      
      // Mapear os dados para o formato esperado, convertendo is_active para status
      const mappedCustomers: Customer[] = rows.map((c: any) => {
        // Determinar status: se is_active for explicitamente false, é inactive; caso contrário, é active
        let status: 'active' | 'inactive' = 'active';
        if (c.is_active === false) {
          status = 'inactive';
        } else if (c.status === 'inactive') {
          status = 'inactive';
        } else {
          status = 'active'; // default para true, null, undefined, ou qualquer outro valor
        }

        return {
          id: String(c.id || ''),
          name: c.name || '',
          email: c.email || '',
          phone: c.phone || '',
          document: c.document || '',
          city: c.city || '',
          address: c.address || '',
          neighborhood: c.neighborhood || '',
          state: c.state || '',
          zipcode: c.zipcode || '',
          notes: c.notes || '',
          type: (c.type === 'PJ' ? 'PJ' : 'PF') as 'PF' | 'PJ',
          status,
          created_at: c.created_at || c.createdAt || '',
        } as Customer;
      });
      
      console.log(`✅ Clientes mapeados: ${mappedCustomers.length}`);
      setCustomers(mappedCustomers);
    } catch (error) {
      // Verificar se foi cancelado antes de processar erro
      if (mySeq !== requestSeqRef.current) {
        return;
      }
      
      // Abort é esperado quando outra requisição começou (não deve aparecer como erro)
      const anyErr = error as any;
      const isAbort =
        anyErr?.name === 'AbortError' ||
        (typeof anyErr?.message === 'string' && anyErr.message.toLowerCase().includes('aborted')) ||
        (typeof anyErr?.message === 'string' && anyErr.message.toLowerCase().includes('signal is aborted')) ||
        (typeof anyErr?.message === 'string' && anyErr.message.toLowerCase().includes('without reason')) ||
        (typeof DOMException !== 'undefined' && anyErr instanceof DOMException && anyErr.name === 'AbortError');
      
      if (isAbort) {
        // Se foi abortado, apenas retornar sem fazer nada (não mostrar erro)
        return;
      }

      // Só mostrar erro se não foi abortado e é a requisição mais recente
      if (mySeq === requestSeqRef.current) {
        console.error('❌ Erro ao carregar clientes:', error);
        toast.error('Erro ao carregar clientes');
      }
    } finally {
      // Só finalizar loading se esta for a requisição mais recente
      if (mySeq && mySeq !== requestSeqRef.current) return;
      setLoading(false);
    }
  }, [
    tenant?.id,
    branchesEnabled,
    branchLoading,
    branches,
    branchId,
    scope,
    currentBranch?.id,
    currentBranch?.is_headquarters,
    isMatrixAdmin,
    userBranchId,
  ]);

  // Carregar clientes quando houver tenant
  useEffect(() => {
    console.log(`🔄 useEffect carregar clientes - tenant atual:`, tenant?.id);
    
    // Se não há tenant, não fazer nada ainda
    if (!tenant?.id) {
      console.log(`⏳ Nenhum tenant disponível, aguardando...`);
      return;
    }
    
    // Se há tenant, carregar clientes
    console.log(`👥 Carregando clientes para tenant: ${tenant.id}`);
    loadCustomers();
  }, [tenant?.id, loadCustomers]);

  // Recarregar quando o usuário volta para a aba (útil quando cadastro vem de API externa)
  useEffect(() => {
    const handleFocus = () => {
      if (tenant?.id) {
        console.log('🔄 Janela/aba em foco: recarregando clientes...');
        loadCustomers();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [tenant?.id, loadCustomers]);

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

  // Diálogo de adição agora é gerenciado pelo componente externo
  const handleAddSuccess = async () => {
    await loadCustomers();
  };

  // Abrir modal de edição
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditCustomer({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      document: customer.document || '',
      city: customer.city || '',
      address: (customer as any).address || '',
      address_number: (customer as any).address_number || '',
      address_complement: (customer as any).address_complement || '',
      neighborhood: (customer as any).neighborhood || '',
      state: (customer as any).state || '',
      zipcode: (customer as any).zipcode || '',
      state_registration: (customer as any).state_registration || '',
      notes: (customer as any).notes || '',
      type: customer.type,
      status: customer.status,
    });
    setShowEditDialog(true);
  };

  // Salvar edição
  const handleSaveEdit = async () => {
    if (!tenant?.id || !editingCustomer) {
      toast.error('Dados insuficientes para editar');
      return;
    }

    try {
      const response = await fetch(`/next_api/customers?id=${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editCustomer,
          tenant_id: tenant.id,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao atualizar cliente');
      }

      await loadCustomers();
      setShowEditDialog(false);
      setEditingCustomer(null);
      toast.success('Cliente atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar cliente');
    }
  };

  // Excluir cliente
  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${customer.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/next_api/customers?id=${customer.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao excluir cliente');
      }

      await loadCustomers();
      toast.success('Cliente excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir cliente');
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
        // Carregar XLSX dinamicamente apenas quando necessário (otimização de bundle)
        const XLSX = await import('xlsx');
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

  // Handle import de endereços
  const handleAddressFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let headers: string[] = [];
      let rows: any[] = [];
      if (ext === 'xlsx' || ext === 'xls') {
        // Carregar XLSX dinamicamente apenas quando necessário (otimização de bundle)
        const XLSX = await import('xlsx');
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

      setImportAddressFileName(file.name);
      setImportAddressHeaders(headers);
      setImportAddressRows(rows);
      setImportAddressErrors([]);
      setShowImportAddressPreview(true);
      setShowImportAddressDialog(false);
    } catch (err) {
      console.error(err);
      toast.error('Falha ao ler arquivo de endereços');
    }
  };

  const formatDocument = (doc: string | null | undefined, type: 'PF' | 'PJ') => {
    if (!doc) return '-';
    const cleanDoc = doc.replace(/\D/g, '');
    if (type === 'PF') {
      if (cleanDoc.length === 11) {
        return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
      return doc;
    } else {
      if (cleanDoc.length === 14) {
        return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }
      return doc;
    }
  };

  const formatPhone = (phone: string | null | undefined) => {
    if (!phone) return '-';
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  // Botão de diagnóstico: cria um cliente simples para validar a rota
  const testCreateCustomer = async () => {
    try {
      console.log('🧪 Teste API: criando cliente de teste...');
      const res = await fetch('/next_api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Cliente Teste API', email: 'teste@example.com' })
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

  const handleRegisterSelected = async (rows: any[]) => {
    if (!tenant?.id) {
      toast.error('Tenant não disponível para importar clientes');
      return;
    }

    try {
      setIsRegistering(true);
      let success = 0, fail = 0;
      const errors: string[] = [];
      
      for (const row of rows) {
        try {
          // Garantir que tenant_id está presente
          const rowData = {
            ...row,
            tenant_id: tenant.id,
            branch_id: scope === 'branch' && branchId ? branchId : null, // ✅ Incluir branch_id se estiver em filial
          };
          
          const res = await fetch('/next_api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rowData)
          });
          
          if (res.ok) {
            success++;
          } else {
            fail++;
            const errorText = await res.text().catch(() => res.statusText);
            errors.push(`Linha ${row.rowIndex || '?'}: ${errorText}`);
          }
        } catch (err: any) {
          fail++;
          errors.push(`Linha ${row.rowIndex || '?'}: ${err.message}`);
        }
      }
      
      if (success > 0) {
        toast.success(`${success} clientes importados com sucesso`);
        await loadCustomers();
      }
      
      if (fail > 0) {
        toast.error(`${fail} clientes falharam na importação`);
        console.error('Erros de importação:', errors);
      }
      
      setShowImportPreview(false);
    } catch (error: any) {
      console.error('Erro na importação:', error);
      toast.error('Erro na importação: ' + error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full space-y-3 pb-8 lg:pb-0">
      {/* Header */}
      <Card className="border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-white flex-shrink-0">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-blue-900">Gerenciar Clientes</h1>
              <p className="text-xs text-blue-900/70">
                Gerencie seus clientes e informações de contato
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="px-2 py-1 bg-blue-600 text-white text-xs">
                <Users className="h-3 w-3 mr-1" />
                {customers.length} clientes
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <Card className="border-blue-100 flex-shrink-0">
        <CardContent className="pt-3 pb-3">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Lado esquerdo - Botões de ação */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Button 
                className="juga-gradient text-white"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cliente
              </Button>

              <Button variant="outline" onClick={testCreateCustomer} title="Diagnóstico: testar POST /next_api/customers">
                Teste API
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-blue-200 hover:bg-blue-50">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Mais Ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowImportDialog(true)} className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Clientes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowImportAddressDialog(true)} className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Endereços
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Lista
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Selecionados
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-blue-200 hover:bg-blue-50">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Colunas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Mostrar Colunas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.type}
                    onCheckedChange={(checked) => 
                      setColumnVisibility(prev => ({ ...prev, type: checked || false }))
                    }
                  >
                    Tipo de Pessoa
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.phone}
                    onCheckedChange={(checked) => 
                      setColumnVisibility(prev => ({ ...prev, phone: checked || false }))
                    }
                  >
                    Telefone
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.document}
                    onCheckedChange={(checked) => 
                      setColumnVisibility(prev => ({ ...prev, document: checked || false }))
                    }
                  >
                    CPF/CNPJ
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.email}
                    onCheckedChange={(checked) => 
                      setColumnVisibility(prev => ({ ...prev, email: checked || false }))
                    }
                  >
                    E-mail
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.city}
                    onCheckedChange={(checked) => 
                      setColumnVisibility(prev => ({ ...prev, city: checked || false }))
                    }
                  >
                    Cidade
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.status}
                    onCheckedChange={(checked) => 
                      setColumnVisibility(prev => ({ ...prev, status: checked || false }))
                    }
                  >
                    Status
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Lado direito - Busca */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full md:w-64 lg:w-80"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => loadCustomers()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="w-full sm:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                Busca Avançada
              </Button>
            </div>
          </div>

          {/* Busca Avançada */}
          {showAdvancedSearch && (
            <div className="mt-4 p-4 bg-blue-50/40 rounded-lg border border-blue-100">
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
      <Card className="border-blue-100 flex-1 flex flex-col min-h-[400px] lg:min-h-0 overflow-hidden">
        <CardHeader className="flex-shrink-0 pb-2 pt-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-4 w-4" />
            Lista de Clientes ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          {loading ? (
            <div className="text-center py-8">Carregando clientes...</div>
          ) : (
            <div className="h-full overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10">
                  <TableRow>
                    <TableHead className="font-semibold">Nome</TableHead>
                    {columnVisibility.type && <TableHead className="font-semibold">Tipo</TableHead>}
                    {columnVisibility.document && <TableHead className="font-semibold">CPF/CNPJ</TableHead>}
                    {columnVisibility.phone && <TableHead className="font-semibold">Telefone</TableHead>}
                    {columnVisibility.email && <TableHead className="font-semibold">E-mail</TableHead>}
                    {columnVisibility.city && <TableHead className="font-semibold">Cidade</TableHead>}
                    {columnVisibility.status && <TableHead className="font-semibold">Status</TableHead>}
                    <TableHead className="font-semibold">Ações</TableHead>
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
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {/* TODO: Implementar ver detalhes */}}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(customer)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(customer)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
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

          {filteredCustomers.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Adicionar Cliente */}
      {/* Modal Adicionar Cliente */}
      <AddCustomerDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
        onSuccess={handleAddSuccess}
      />

      {/* Dialog Editar Cliente */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          <div className="relative">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Pencil className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">Editar Cliente</DialogTitle>
                  <DialogDescription className="text-blue-100 mt-1">
                    Atualize as informações do cliente abaixo.
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-800/50 backdrop-blur-sm space-y-8">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/50 pb-2 flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  Informações Básicas
                </h3>
                <div className="grid gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-name" className="text-sm font-medium text-slate-200">Nome *</Label>
                    <Input
                      id="edit-name"
                      value={editCustomer.name}
                      onChange={(e) => setEditCustomer(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome completo"
                      className="h-11 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-type" className="text-sm font-medium text-slate-200">Tipo</Label>
                      <select 
                        className="h-11 w-full bg-slate-700/50 border border-slate-600 rounded-md text-white px-3"
                        value={editCustomer.type}
                        onChange={(e) => setEditCustomer(prev => ({ ...prev, type: e.target.value as 'PF' | 'PJ' }))}
                      >
                        <option value="PF" className="bg-slate-800">Pessoa Física</option>
                        <option value="PJ" className="bg-slate-800">Pessoa Jurídica</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-status" className="text-sm font-medium text-slate-200">Status</Label>
                      <select 
                        className="h-11 w-full bg-slate-700/50 border border-slate-600 rounded-md text-white px-3"
                        value={editCustomer.status}
                        onChange={(e) => setEditCustomer(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                      >
                        <option value="active" className="bg-slate-800">Ativo</option>
                        <option value="inactive" className="bg-slate-800">Inativo</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-document" className="text-sm font-medium text-slate-200">CPF/CNPJ</Label>
                      <Input
                        id="edit-document"
                        value={editCustomer.document}
                        onChange={(e) => setEditCustomer(prev => ({ ...prev, document: e.target.value.replace(/\D/g, '') }))}
                        className="h-11 bg-slate-700/50 border-slate-600 text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-state_registration" className="text-sm font-medium text-slate-200">Inscrição Estadual</Label>
                      <Input
                        id="edit-state_registration"
                        value={editCustomer.state_registration}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setEditCustomer(prev => ({ ...prev, state_registration: val === 'ISENTO' ? 'ISENTO' : val.replace(/\D/g, '') }));
                        }}
                        className="h-11 bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/50 pb-2 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  Contato
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-email" className="text-sm font-medium text-slate-200">E-mail</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editCustomer.email}
                      onChange={(e) => setEditCustomer(prev => ({ ...prev, email: e.target.value }))}
                      className="h-11 bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-phone" className="text-sm font-medium text-slate-200">Telefone</Label>
                    <Input
                      id="edit-phone"
                      value={editCustomer.phone}
                      onChange={(e) => setEditCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      className="h-11 bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/50 pb-2 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  Endereço
                </h3>
                <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-zipcode" className="text-sm font-medium text-slate-200">CEP</Label>
                      <Input
                        id="edit-zipcode"
                        value={editCustomer.zipcode}
                        onChange={(e) => setEditCustomer(prev => ({ ...prev, zipcode: e.target.value.replace(/\D/g, '') }))}
                        className="h-11 bg-slate-700/50 border-slate-600 text-white font-mono"
                      />
                    </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label htmlFor="edit-address" className="text-sm font-medium text-slate-200">Logradouro</Label>
                      <Input
                        id="edit-address"
                        value={editCustomer.address}
                        onChange={(e) => setEditCustomer(prev => ({ ...prev, address: e.target.value }))}
                        className="h-11 bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-address_number" className="text-sm font-medium text-slate-200">Número</Label>
                      <Input
                        id="edit-address_number"
                        value={editCustomer.address_number}
                        onChange={(e) => setEditCustomer(prev => ({ ...prev, address_number: e.target.value }))}
                        className="h-11 bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-address_complement" className="text-sm font-medium text-slate-200">Complemento</Label>
                    <Input
                      id="edit-address_complement"
                      value={editCustomer.address_complement}
                      onChange={(e) => setEditCustomer(prev => ({ ...prev, address_complement: e.target.value }))}
                      className="h-11 bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-neighborhood" className="text-sm font-medium text-slate-200">Bairro</Label>
                      <Input
                        id="edit-neighborhood"
                        value={editCustomer.neighborhood}
                        onChange={(e) => setEditCustomer(prev => ({ ...prev, neighborhood: e.target.value }))}
                        className="h-11 bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-city" className="text-sm font-medium text-slate-200">Cidade</Label>
                      <Input
                        id="edit-city"
                        value={editCustomer.city}
                        onChange={(e) => setEditCustomer(prev => ({ ...prev, city: e.target.value }))}
                        className="h-11 bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-state" className="text-sm font-medium text-slate-200">UF</Label>
                      <Input
                        id="edit-state"
                        value={editCustomer.state}
                        onChange={(e) => setEditCustomer(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                        className="h-11 bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-b-lg border-t border-slate-600/50">
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button variant="ghost" onClick={() => {
                  setShowEditDialog(false);
                  setEditingCustomer(null);
                }} className="text-slate-300 hover:text-white hover:bg-slate-700">
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20">
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Importar */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="p-0 border-0 shadow-2xl bg-slate-900">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">Importar Clientes</DialogTitle>
                <DialogDescription className="text-emerald-100 mt-1">
                  Selecione um arquivo CSV ou Excel com os dados dos clientes.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="file" className="text-slate-200">Selecione o Arquivo</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200">
              <p className="font-bold mb-2">Colunas esperadas:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>nome (obrigatório)</li>
                <li>email</li>
                <li>telefone</li>
                <li>documento (CPF/CNPJ)</li>
                <li>cidade</li>
                <li>tipo (PF ou PJ)</li>
              </ul>
            </div>
          </div>
          
          <div className="p-6 bg-slate-800/50 flex justify-end gap-3 rounded-b-lg">
            <Button variant="ghost" onClick={() => setShowImportDialog(false)} className="text-slate-400 hover:text-white hover:bg-slate-700">
              Cancelar
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => document.getElementById('file')?.click()}>
              Selecionar Arquivo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Preview da Importação */}
      <ImportPreviewModal
        isOpen={showImportPreview}
        onClose={() => setShowImportPreview(false)}
        onRegister={async (selected) => {
          try {
            setIsRegistering(true);
            let success = 0, fail = 0;
            const errors: string[] = [];
            for (let rowIndex = 0; rowIndex < selected.length; rowIndex++) {
              const row = selected[rowIndex];
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
              const nameValue = pick(['nome', 'name', 'fantasia']).trim();
              const customerData = {
                name: nameValue,
                email: pick(['email', 'e mail']).trim() || null,
                phone: pick(['telefone', 'celular', 'phone']).trim() || null,
                document: pick(['cpf/cnpj', 'cpf', 'cnpj', 'documento']).replace(/\D/g, '') || null,
                address: pick(['endereco', 'endereco completo', 'address', 'logradouro', 'rua']).trim() || null,
                neighborhood: pick(['bairro']).trim() || null,
                city: pick(['cidade', 'city']).trim() || null,
                state: (pick(['estado', 'uf']).slice(0,2).toUpperCase() || null) as any,
                zipcode: pick(['cep', 'zip']).replace(/\D/g, '') || null,
                notes: pick(['observacoes', 'observacoes adicionais', 'notes']).trim() || null,
                external_code: pick(['codigo', 'code', 'id externo', 'external_code']).trim() || null,
                status: 'active' as 'active' | 'inactive',
                tenant_id: tenant?.id,
                // ✅ IMPORTANTE: Incluir branch_id explicitamente para garantir que os clientes sejam salvos na matriz (null) ou na filial correta
                branch_id: scope === 'branch' && branchId ? branchId : null,
              } as any;

              // Validações obrigatórias
              if (!customerData.name || customerData.name.length === 0) { 
                fail++; 
                errors.push(`Linha ${rowIndex + 1}: Nome ausente`); 
                continue; 
              }
              if (!customerData.tenant_id) { 
                fail++; 
                errors.push(`Linha ${rowIndex + 1}: Tenant não disponível`); 
                continue; 
              }

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
        entityName="clientes"
        fileName={importFileName}
        headers={importHeaders}
        data={importRows}
        totalRows={importRows.length}
        validRows={importRows.length}
        invalidRows={importErrors.length}
        errors={importErrors}
        isRegistering={isRegistering}
      />

      {/* Dialog Importar Endereços */}
      <Dialog open={showImportAddressDialog} onOpenChange={setShowImportAddressDialog}>
        <DialogContent className="p-0 border-0 shadow-2xl bg-slate-900">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">Importar Endereços</DialogTitle>
                <DialogDescription className="text-emerald-100 mt-1">
                  Vincule endereços aos seus clientes via arquivo.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="address-file" className="text-slate-200">Arquivo de Endereços</Label>
              <Input
                id="address-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleAddressFileUpload}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200">
              <p className="font-bold mb-2">Colunas esperadas:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Código</strong> (obrigatório) - código do cliente para vincular</li>
                <li>CEP, Logradouro, Número, Complemento, Bairro, Cidade, UF</li>
              </ul>
            </div>
          </div>
          
          <div className="p-6 bg-slate-800/50 flex justify-end gap-3 rounded-b-lg">
            <Button variant="ghost" onClick={() => setShowImportAddressDialog(false)} className="text-slate-400 hover:text-white hover:bg-slate-700">
              Cancelar
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => document.getElementById('address-file')?.click()}>
              Selecionar Arquivo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Preview da Importação de Endereços */}
      <ImportPreviewModal
        isOpen={showImportAddressPreview}
        onClose={() => setShowImportAddressPreview(false)}
        onRegister={async (selected) => {
          if (!tenant?.id) {
            toast.error('Tenant não disponível');
            return;
          }

          try {
            setIsImportingAddresses(true);
            let success = 0, fail = 0;
            const errors: string[] = [];

            // Primeiro, buscar todos os clientes do tenant para fazer o match
            const customersResponse = await fetch(`/next_api/customers?tenant_id=${tenant.id}`);
            if (!customersResponse.ok) {
              throw new Error('Erro ao buscar clientes');
            }
            const customersData = await customersResponse.json();
            const customers = Array.isArray(customersData?.data) ? customersData.data : [];

            // Criar mapa de código externo para cliente
            const customerMap = new Map<string, any>();
            customers.forEach((c: any) => {
              if (c.external_code) {
                customerMap.set(String(c.external_code), c);
              }
            });

            for (let rowIndex = 0; rowIndex < selected.length; rowIndex++) {
              const row = selected[rowIndex];
              const obj: any = Array.isArray(row)
                ? (() => {
                    const keys = importAddressHeaders.map(normalizeHeader);
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

              // Buscar código do cliente
              const codigo = pick(['codigo', 'code', 'id externo', 'external_code']).trim();
              if (!codigo) {
                fail++;
                errors.push(`Linha ${rowIndex + 1}: Código não encontrado`);
                continue;
              }

              // Buscar cliente pelo código
              const customer = customerMap.get(codigo);
              if (!customer) {
                fail++;
                errors.push(`Linha ${rowIndex + 1}: Cliente com código "${codigo}" não encontrado`);
                continue;
              }

              // Preparar dados do endereço
              const logradouro = pick(['logradouro', 'endereco', 'rua', 'address']).trim();
              const numero = pick(['numero', 'number', 'num']).trim();
              const complemento = pick(['complemento', 'complement', 'complemento adicional']).trim();
              
              // Combinar logradouro + número + complemento no campo address
              let address = logradouro;
              if (numero) {
                address += numero.startsWith(',') || address.endsWith(',') ? numero : `, ${numero}`;
              }
              if (complemento) {
                address += complemento.startsWith(',') || address.endsWith(',') ? complemento : `, ${complemento}`;
              }

              const addressData = {
                address: address || null,
                neighborhood: pick(['bairro', 'neighborhood']).trim() || null,
                city: pick(['cidade', 'city']).trim() || null,
                state: (pick(['uf', 'estado', 'state']).slice(0, 2).toUpperCase() || null) as any,
                zipcode: pick(['cep', 'zipcode', 'zip']).replace(/\D/g, '') || null,
              };

              // Atualizar cliente com os dados do endereço
              const res = await fetch(`/next_api/customers?id=${customer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...addressData,
                  tenant_id: tenant.id,
                })
              });

              if (res.ok) {
                success++;
              } else {
                fail++;
                const errorText = await res.text().catch(() => res.statusText);
                errors.push(`Linha ${rowIndex + 1}: ${errorText}`);
              }
            }

            if (success > 0) {
              toast.success(`${success} endereços atualizados com sucesso`);
              await loadCustomers();
            }
            if (fail > 0) {
              toast.error(`${fail} endereços falharam na atualização`);
              console.error('Erros de importação de endereços:', errors);
            }

            setShowImportAddressPreview(false);
          } catch (error: any) {
            console.error('Erro na importação de endereços:', error);
            toast.error('Erro na importação: ' + error.message);
          } finally {
            setIsImportingAddresses(false);
          }
        }}
        entityName="endereços"
        fileName={importAddressFileName}
        headers={importAddressHeaders}
        data={importAddressRows}
        totalRows={importAddressRows.length}
        validRows={importAddressRows.length}
        invalidRows={importAddressErrors.length}
        errors={importAddressErrors}
        isRegistering={isImportingAddresses}
      />
    </div>
  );
}