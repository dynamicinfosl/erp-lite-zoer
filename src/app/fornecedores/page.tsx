"use client";

import { useEffect, useState } from "react";
import { api } from '@/lib/api-client';
import type { Supplier } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Edit, Trash2, CheckSquare, Square, Trash, FileSpreadsheet, Upload, ChevronDown, Eye } from 'lucide-react';
import { useRef } from 'react';
import { getErrorMessage } from '@/lib/error-handler';
import { ImportPreviewModal } from '@/components/ui/ImportPreviewModal';

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showSheet, setShowSheet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    id: 0,
    name: "",
    email: "",
    phone: "",
  });
  const [editing, setEditing] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<number[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRowsData, setImportRowsData] = useState<any[][]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importData, setImportData] = useState<any[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Reset selection when suppliers change
  useEffect(() => {
    setSelectedSuppliers([]);
    setIsAllSelected(false);
  }, [search, suppliers]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await api.get<Supplier[]>(`/suppliers${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setSuppliers(data);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', getErrorMessage(error));
      toast.error('Erro ao buscar fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!form.name.trim()) {
        toast.error('Nome é obrigatório');
        return;
      }
      if (editing) {
        await api.put(`/suppliers?id=${form.id}`, form);
        toast.success('Fornecedor atualizado');
      } else {
        await api.post('/suppliers', form);
        toast.success('Fornecedor criado');
      }
      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', getErrorMessage(error));
      toast.error('Erro ao salvar fornecedor');
    }
  };

  const edit = (supplier: Supplier) => {
    setForm({ id: supplier.id, name: supplier.name || '', email: supplier.email || '', phone: supplier.phone || '' });
    setEditing(true);
  };

  const remove = async (id: number) => {
    try {
      await api.delete(`/suppliers?id=${id}`);
      toast.success('Fornecedor excluído');
      fetchSuppliers();
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', getErrorMessage(error));
      toast.error('Erro ao excluir fornecedor');
    }
  };

  const resetForm = () => {
    setForm({ id: 0, name: '', email: '', phone: '' });
    setEditing(false);
  };

  // Funções de seleção múltipla
  const handleSelectSupplier = (supplierId: number) => {
    setSelectedSuppliers(prev => {
      if (prev.includes(supplierId)) {
        return prev.filter(id => id !== supplierId);
      } else {
        return [...prev, supplierId];
      }
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSuppliers([]);
      setIsAllSelected(false);
    } else {
      const allIds = suppliers.map(supplier => supplier.id);
      setSelectedSuppliers(allIds);
      setIsAllSelected(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSuppliers.length === 0) return;
    
    if (!confirm(`Tem certeza que deseja excluir ${selectedSuppliers.length} fornecedor(es) selecionado(s)?`)) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const supplierId of selectedSuppliers) {
        try {
          await api.delete(`/suppliers?id=${supplierId}`);
          successCount++;
        } catch (error) {
          console.error('Erro ao excluir fornecedor:', getErrorMessage(error));
          errorCount++;
        }
      }

      setSelectedSuppliers([]);
      setIsAllSelected(false);
      
      if (successCount > 0) {
        toast.success(`${successCount} fornecedor(es) excluído(s) com sucesso!`);
        fetchSuppliers();
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} fornecedor(es) não puderam ser excluídos`);
      }
    } catch (error) {
      console.error('Erro ao excluir fornecedores:', getErrorMessage(error));
      toast.error('Erro ao excluir fornecedores');
    }
  };

  const exportCSV = () => {
    try {
      const rows = [
        ['Nome', 'Doc', 'Telefone', 'Situação'],
        ...suppliers.map((s) => [
          s.name || '',
          s.document || '',
          s.phone || '',
          s.is_active ? 'Ativo' : 'Inativo',
        ]),
      ];
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fornecedores_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao exportar CSV:', e);
      toast.error('Erro ao exportar CSV');
    }
  };

  const exportXLSX = async () => {
    try {
      // @ts-ignore: dependência opcional carregada dinamicamente
      const XLSX = await import('xlsx');
      const rows = [
        ['Nome', 'Doc', 'Telefone', 'Situação'],
        ...suppliers.map((s) => [
          s.name || '',
          s.document || '',
          s.phone || '',
          s.is_active ? 'Ativo' : 'Inativo',
        ]),
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Fornecedores');
      XLSX.writeFile(wb, `fornecedores_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (e) {
      console.error('Erro ao exportar XLSX:', e);
      toast.error('Erro ao exportar XLSX. Instale a dependência "xlsx" se necessário.');
    }
  };

  const onClickImport = () => {
    fileInputRef.current?.click();
  };

  const handleImportConfirm = async () => {
    setShowImportPreview(false);
    await importRows(importRowsData);
  };

  const handleImportCancel = () => {
    setShowImportPreview(false);
    setImportData([]);
    setImportHeaders([]);
    setImportRowsData([]);
    setImportErrors([]);
  };

  const handleExtractData = async () => {
    try {
      setIsExtracting(true);
      
      const extractedData = {
        fileName: importFileName,
        headers: importHeaders,
        data: importData,
        totalRows: importRowsData.length,
        validRows: importRowsData.length - importErrors.length,
        extractedAt: new Date().toISOString()
      };
      
      localStorage.setItem('extractedSupplierData', JSON.stringify(extractedData));
      toast.success('Dados de fornecedores extraídos com sucesso!');
      
    } catch (error) {
      console.error('Erro ao extrair dados:', getErrorMessage(error));
      toast.error('Erro ao extrair dados');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConsumeData = async () => {
    try {
      setIsConsuming(true);
      
      const extractedData = localStorage.getItem('extractedSupplierData');
      if (extractedData) {
        const parsedData = JSON.parse(extractedData);
        
        const combinedData = [...importData, ...parsedData.data];
        const combinedHeaders = [...new Set([...importHeaders, ...parsedData.headers])];
        
        setImportData(combinedData);
        setImportHeaders(combinedHeaders);
        
        toast.success(`${parsedData.data.length} registros de fornecedores consumidos com sucesso!`);
      } else {
        toast.error('Nenhum dado de fornecedor extraído encontrado para consumir');
      }
      
    } catch (error) {
      console.error('Erro ao consumir dados:', getErrorMessage(error));
      toast.error('Erro ao consumir dados');
    } finally {
      setIsConsuming(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let rows: any[][] = [];
      let headers: string[] = [];

      if (ext === 'xlsx' || ext === 'xls') {
        // @ts-ignore: dependência opcional carregada dinamicamente
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data);
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (rows.length < 2) {
          toast.error('Planilha deve conter cabeçalho e pelo menos uma linha');
          return;
        }
        headers = rows[0].map((h: any) => String(h || '').trim());
      } else if (ext === 'csv') {
        rows = parseCSV(await file.text());
        if (rows.length < 2) {
          toast.error('Arquivo CSV deve conter cabeçalho e pelo menos uma linha');
          return;
        }
        headers = rows[0];
      } else {
        toast.error('Formato não suportado. Use CSV ou XLSX.');
        return;
      }

      // Preparar dados para o modal de preview
      const dataRows = rows.slice(1).map(r => {
        const obj: any = {};
        headers.forEach((h: string, idx: number) => { 
          obj[h] = (r[idx] ?? '').toString().trim(); 
        });
        return obj;
      });

      // Validar dados e contar erros
      const errors: string[] = [];
      let validCount = 0;
      let invalidCount = 0;

      dataRows.forEach((row, index) => {
        if (!row['Nome'] && !row['nome']) {
          errors.push(`Linha ${index + 2}: Nome é obrigatório`);
          invalidCount++;
        } else {
          validCount++;
        }
      });

      // Configurar estado para o modal de preview
      setImportFileName(file.name);
      setImportHeaders(headers);
      setImportRowsData(rows.slice(1));
      setImportData(dataRows);
      setImportErrors(errors);
      setShowImportPreview(true);

      toast.success(`${rows.length - 1} registros carregados com sucesso!`);
    } catch (err) {
      console.error('Erro ao importar arquivo:', err);
      toast.error('Erro ao importar arquivo');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    const first = lines[0];
    const delimiter = (first.split(';').length - 1) > (first.split(',').length - 1) ? ';' : ',';
    return lines.map(line => {
      const result: string[] = [];
      let cur = '';
      let quoted = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (quoted && line[i + 1] === '"') { cur += '"'; i++; }
          else { quoted = !quoted; }
        } else if (ch === delimiter && !quoted) {
          result.push(cur); cur = '';
        } else {
          cur += ch;
        }
      }
      result.push(cur);
      return result.map(v => v.trim());
    });
  };

  const normalizeDoc = (s: string): string => s.replace(/\D/g, '');

  const importRows = async (rows: any[][]) => {
    if (!rows.length) return;
    // Identificar cabeçalhos
    const header = rows[0].map((h: any) => String(h || '').toLowerCase());
    const idxNome = header.findIndex((h: string) => ['nome','name'].includes(h));
    const idxDoc = header.findIndex((h: string) => ['doc','document','cpf','cnpj'].includes(h));
    const idxTel = header.findIndex((h: string) => ['telefone','phone','celular'].includes(h));
    const idxSit = header.findIndex((h: string) => ['situação','situacao','status'].includes(h));

    if (idxNome === -1) {
      toast.error('Cabeçalho "nome" não encontrado');
      return;
    }

    let imported = 0;
    let skipped = 0;
    const existingDocs = new Set((suppliers || []).map(s => (s.document || '').trim()));
    const seenDocsInFile = new Set<string>();
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0) continue;
      const name = (r[idxNome] || '').toString().trim();
      if (!name) continue;
      const document = idxDoc !== -1 ? normalizeDoc((r[idxDoc] || '').toString().trim()) : '';
      const phone = idxTel !== -1 ? (r[idxTel] || '').toString().trim() : '';
      const situacaoRaw = idxSit !== -1 ? (r[idxSit] || '').toString().toLowerCase().trim() : '';
      const is_active = situacaoRaw ? ['ativo','ativa','1','true','sim','yes','ok'].includes(situacaoRaw) : true;

      try {
        if (document) {
          if (existingDocs.has(document) || seenDocsInFile.has(document)) {
            skipped++;
            continue;
          }
          seenDocsInFile.add(document);
        }
        await api.post('/suppliers', { name, document, phone, is_active });
        imported++;
      } catch (err) {
        console.error('Falha ao importar linha', i + 1, err);
      }
    }

    toast.success(`Importação concluída: ${imported} fornecedor(es). Ignorados: ${skipped}.`);
    fetchSuppliers();
  };

  return (
    <div className="container mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Fornecedores</h1>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por nome, email ou telefone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={fetchSuppliers}>Buscar</Button>
        <Button variant="secondary" onClick={resetForm}>Novo</Button>
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
              onClick={exportCSV} 
              disabled={suppliers.length === 0}
              className="cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={exportXLSX} 
              disabled={suppliers.length === 0}
              className="cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar XLSX
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setShowSheet(true)}
              className="cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar Planilha
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleBulkDelete} 
              disabled={selectedSuppliers.length === 0}
              className="cursor-pointer text-red-600"
            >
              <Trash className="h-4 w-4 mr-2" />
              Excluir Selecionados ({selectedSuppliers.length})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog open={showSheet} onOpenChange={setShowSheet}>
          <DialogTrigger asChild>
            <div></div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Planilha de Fornecedores</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-end gap-2 pb-2">
              <input ref={fileInputRef} onChange={handleImportFile} type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" />
              <Button size="sm" variant="outline" onClick={onClickImport}>Importar</Button>
              <Button size="sm" variant="outline" onClick={exportCSV}>Exportar CSV</Button>
              <Button size="sm" onClick={exportXLSX}>Exportar XLSX</Button>
            </div>
            <div className="overflow-x-auto">
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Doc</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((s) => (
                    <TableRow key={s.id} className={selectedSuppliers.includes(s.id) ? 'bg-blue-50' : ''}>
                      <TableCell>
                        <button
                          onClick={() => handleSelectSupplier(s.id)}
                          className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 hover:bg-gray-50"
                        >
                          {selectedSuppliers.includes(s.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.document || '-'}</TableCell>
                      <TableCell>{s.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={s.is_active ? 'default' : 'secondary'}>
                          {s.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setShowSheet(false); edit(s); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => remove(s.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {suppliers.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">Nenhum fornecedor cadastrado.</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <Input placeholder="Nome" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
        <Input placeholder="Telefone" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
        <Button type="submit">{editing ? 'Atualizar' : 'Salvar'}</Button>
      </form>

      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : suppliers.length === 0 ? (
        <div className="text-sm text-muted-foreground">Nenhum fornecedor encontrado.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4">Nome</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Telefone</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id} className="border-t">
                  <td className="py-2 pr-4">{s.name}</td>
                  <td className="py-2 pr-4">{s.email || '-'}</td>
                  <td className="py-2 pr-4">{s.phone || '-'}</td>
                  <td className="py-2 pr-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => edit(s)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => remove(s.id)}>Excluir</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Preview da Importação */}
      <ImportPreviewModal
        isOpen={showImportPreview}
        onClose={handleImportCancel}
        onConfirm={handleImportConfirm}
        onExtract={handleExtractData}
        onConsume={handleConsumeData}
        fileName={importFileName}
        headers={importHeaders}
        data={importRowsData}
        totalRows={importRowsData.length}
        validRows={importRowsData.length - importErrors.length}
        invalidRows={importErrors.length}
        errors={importErrors}
        isExtracting={isExtracting}
        isConsuming={isConsuming}
      />
    </div>
  );
}
