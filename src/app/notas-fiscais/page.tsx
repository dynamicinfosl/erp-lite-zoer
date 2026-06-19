'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { 
  Receipt, 
  Search, 
  Filter, 
  RefreshCw, 
  Loader2, 
  Eye, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Database,
  Building2,
  FileText,
  AlertCircle,
  XCircle,
  CheckCircle2,
  FileJson,
  ShoppingCart,
  Calendar,
  DollarSign,
  User
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const getFullFileUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return path.startsWith('/arquivos_development')
    ? `https://homologacao.focusnfe.com.br${path}`
    : `https://api.focusnfe.com.br${path}`;
};

interface FiscalDocument {
  id: string;
  tenant_id: string;
  provider: 'focusnfe' | 'gestaoclick';
  doc_type: 'nfe' | 'nfce' | 'nfse' | 'nfse_nacional';
  ref: string;
  status: string;
  numero: string | null;
  serie: string | null;
  chave: string | null;
  payload: any;
  xml_path: string | null;
  pdf_path: string | null;
  caminho_xml: string | null;
  caminho_pdf: string | null;
  created_at: string;
  updated_at: string;
}

export default function NotasFiscaisPage() {
  const { tenant } = useSimpleAuth();
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  // Detail Modal
  const [selectedDoc, setSelectedDoc] = useState<FiscalDocument | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Cancellation Modal
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelJustification, setCancelJustification] = useState('');
  const [docToCancel, setDocToCancel] = useState<FiscalDocument | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Mapa de Vendas para atrelar e facilitar a identificação
  const [salesMap, setSalesMap] = useState<Map<string, { numero: string; cliente: string; total: number }>>(new Map());
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [isSaleDetailOpen, setIsSaleDetailOpen] = useState(false);
  const [loadingSale, setLoadingSale] = useState(false);

  const loadSalesMap = useCallback(async () => {
    if (!tenant?.id) return;
    try {
      const res = await fetch(`/next_api/sales?tenant_id=${tenant.id}&limit=2000`);
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
        const newMap = new Map<string, { numero: string; cliente: string; total: number }>();
        data.forEach((s: any) => {
          newMap.set(String(s.id), {
            numero: s.sale_number || s.numero || '',
            cliente: s.customer?.name || s.customer_name || s.cliente || 'Cliente Avulso',
            total: Number(s.total_amount || s.final_amount || s.total || 0)
          });
        });
        setSalesMap(newMap);
      }
    } catch (e) {
      console.error('Erro ao carregar mapa de vendas:', e);
    }
  }, [tenant?.id]);

  useEffect(() => {
    loadSalesMap();
  }, [loadSalesMap]);

  const handleViewSaleDetails = async (saleId: string) => {
    setSelectedSaleId(saleId);
    setIsSaleDetailOpen(true);
    setLoadingSale(true);
    setSelectedSale(null);
    try {
      const res = await fetch(`/next_api/sales/${saleId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSelectedSale(json.data);
        } else {
          toast.error('Venda não encontrada ou erro ao carregar.');
        }
      } else {
        toast.error('Erro ao carregar detalhes da venda.');
      }
    } catch (e) {
      console.error('Erro ao buscar venda:', e);
      toast.error('Erro ao conectar com a API de vendas.');
    } finally {
      setLoadingSale(false);
    }
  };

  const loadDocuments = useCallback(async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenant_id: tenant.id,
        limit: String(limit),
        offset: String(offset),
      });

      if (docTypeFilter !== 'all') params.set('doc_type', docTypeFilter);
      if (providerFilter !== 'all') params.set('provider', providerFilter);

      const res = await fetch(`/next_api/fiscal/documents?${params.toString()}`);
      if (!res.ok) throw new Error(`Erro ao carregar documentos: ${res.status}`);
      
      const json = await res.json();
      if (json.success) {
        setDocuments(json.data || []);
        setTotal(json.pagination?.total || 0);
      } else {
        throw new Error(json.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Erro ao buscar notas fiscais:', error);
      toast.error(`Falha ao buscar notas fiscais: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, limit, offset, docTypeFilter, providerFilter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
  }, [docTypeFilter, providerFilter, statusFilter]);

  const handlePageChange = (newOffset: number) => {
    if (newOffset >= 0 && newOffset < total) {
      setOffset(newOffset);
    }
  };

  const handleDownloadFile = (path: string, fileName: string) => {
    // Se o path for absoluto ou relativo, inicia o download resolvendo caminhos relativos da FocusNFe
    const link = document.createElement('a');
    link.href = getFullFileUrl(path);
    link.setAttribute('download', fileName);
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCancelDocument = async () => {
    if (!docToCancel || !cancelJustification) return;
    if (cancelJustification.trim().length < 15) {
      toast.error('A justificativa de cancelamento deve ter pelo menos 15 caracteres.');
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch('/next_api/fiscal/focusnfe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiscal_document_id: docToCancel.id,
          justificativa: cancelJustification,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Erro ao cancelar documento fiscal.');
      }

      toast.success('Documento fiscal cancelado com sucesso!');
      setIsCancelOpen(false);
      setCancelJustification('');
      setDocToCancel(null);
      loadDocuments();
      if (selectedDoc?.id === docToCancel.id) {
        setIsDetailOpen(false);
      }
    } catch (error: any) {
      console.error('Erro ao cancelar nota:', error);
      toast.error(`Falha ao cancelar: ${error.message}`);
    } finally {
      setCancelling(false);
    }
  };

  // Client-side text and status filtering
  const filteredDocuments = documents.filter((doc) => {
    // 1. Text Search
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const refMatch = doc.ref?.toLowerCase().includes(term);
      const numMatch = doc.numero?.toLowerCase().includes(term);
      const chaveMatch = doc.chave?.toLowerCase().includes(term);
      const providerMatch = doc.provider?.toLowerCase().includes(term);
      const statusMatch = doc.status?.toLowerCase().includes(term);
      
      if (!refMatch && !numMatch && !chaveMatch && !providerMatch && !statusMatch) {
        return false;
      }
    }

    // 2. Status filter
    if (statusFilter !== 'all') {
      const docStatus = (doc.status || '').toLowerCase();
      if (statusFilter === 'autorizado' && !docStatus.includes('autoriz') && !docStatus.includes('processado')) return false;
      if (statusFilter === 'cancelado' && !docStatus.includes('cancel')) return false;
      if (statusFilter === 'erro' && !docStatus.includes('err') && !docStatus.includes('rejeic')) return false;
      if (statusFilter === 'pendente' && docStatus !== '' && !docStatus.includes('submitt') && !docStatus.includes('pendent')) return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('autoriz') || s.includes('processado') || s.includes('success')) {
      return (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1 w-fit">
          <CheckCircle2 className="h-3 w-3" />
          Autorizada
        </Badge>
      );
    }
    if (s.includes('cancel')) {
      return (
        <Badge className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-1 w-fit">
          <XCircle className="h-3 w-3" />
          Cancelada
        </Badge>
      );
    }
    if (s.includes('err') || s.includes('rejeic') || s.includes('fail')) {
      return (
        <Badge className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 w-fit">
          <AlertCircle className="h-3 w-3" />
          Erro
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 w-fit">
        <RefreshCw className="h-3 w-3 animate-spin" />
        {status || 'Pendente'}
      </Badge>
    );
  };

  const getProviderBadge = (provider: string) => {
    if (provider === 'focusnfe') {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-50/20 dark:bg-blue-950/20 flex items-center gap-1 w-fit">
          <Building2 className="h-3 w-3" />
          Faturamento ERP
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-purple-500 text-purple-500 bg-purple-50/20 dark:bg-purple-950/20 flex items-center gap-1 w-fit">
        <Database className="h-3 w-3" />
        Importada (Legado)
      </Badge>
    );
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Receipt className="h-8 w-8 text-primary" />
            Notas Fiscais
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e consulte todas as notas fiscais do sistema (emitidas e importadas).
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={loadDocuments} disabled={loading} variant="outline" className="w-full md:w-auto flex items-center gap-2 shadow-sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Main card */}
      <Card className="border border-gray-200 dark:border-gray-800 shadow-lg dark:bg-gray-950">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filtros de Busca
          </CardTitle>
          <CardDescription>
            Refine sua pesquisa por tipo de documento, provider, situação ou termos de texto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ref, número, chave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 shadow-sm"
              />
            </div>
            
            <div>
              <select
                value={docTypeFilter}
                onChange={(e) => setDocTypeFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
              >
                <option value="all">Todos os Tipos</option>
                <option value="nfe">NF-e (Produto)</option>
                <option value="nfce">NFC-e (Consumidor)</option>
                <option value="nfse">NFS-e (Serviço)</option>
              </select>
            </div>

            <div>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
              >
                <option value="all">Todas as Origens</option>
                <option value="focusnfe">Emitidas pelo ERP</option>
                <option value="gestaoclick">Importadas (Legado)</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
              >
                <option value="all">Todas as Situações</option>
                <option value="autorizado">Autorizadas</option>
                <option value="cancelado">Canceladas</option>
                <option value="erro">Erros / Rejeições</option>
                <option value="pendente">Pendentes</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm font-medium">Carregando notas fiscais...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-lg border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10">
              <Receipt className="h-14 w-14 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Nenhuma nota encontrada</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1">
                Tente ajustar os filtros de busca ou importar novas notas fiscais do backup na página "Migrar dados".
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-sm font-semibold">Tipo</th>
                      <th className="px-4 py-3 text-sm font-semibold">Venda / Cliente</th>
                      <th className="px-4 py-3 text-sm font-semibold">Série / Número</th>
                      <th className="px-4 py-3 text-sm font-semibold">Ref / Chave de Acesso</th>
                      <th className="px-4 py-3 text-sm font-semibold">Situação</th>
                      <th className="px-4 py-3 text-sm font-semibold">Emissão</th>
                      <th className="px-4 py-3 text-sm font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 dark:bg-gray-950">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="uppercase font-bold tracking-wider text-[10px] px-2 py-0.5">
                            {doc.doc_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {doc.ref && doc.ref.startsWith('sale_') ? (() => {
                            const saleId = doc.ref.split('_')[1];
                            const saleInfo = salesMap.get(saleId);
                            return (
                              <div className="flex flex-col space-y-0.5">
                                <Button
                                  variant="link"
                                  className="p-0 h-auto text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold flex items-center gap-1 w-fit"
                                  onClick={() => handleViewSaleDetails(saleId)}
                                  title="Clique para visualizar detalhes da venda"
                                >
                                  <ShoppingCart className="h-3 w-3" />
                                  {saleInfo?.numero ? `Venda #${saleInfo.numero}` : `Venda #${saleId}`}
                                </Button>
                                {saleInfo?.cliente ? (
                                  <span className="text-xs text-gray-900 dark:text-gray-100 font-medium truncate max-w-[180px]" title={saleInfo.cliente}>
                                    {saleInfo.cliente}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">Carregando cliente...</span>
                                )}
                              </div>
                            );
                          })() : (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground italic">Sem venda atrelada</span>
                              {getProviderBadge(doc.provider)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {doc.numero ? (
                            <span>
                              Série {doc.serie || '0'} — <strong className="text-primary">{doc.numero}</strong>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col space-y-0.5 max-w-[280px]">
                            {doc.chave ? (
                              <span 
                                className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate cursor-help" 
                                title={doc.chave}
                              >
                                {doc.chave}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground font-mono">Chave: não informada</span>
                            )}
                            <span className="text-[10px] text-muted-foreground font-mono">Ref: {doc.ref}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(doc.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setSelectedDoc(doc);
                                setIsDetailOpen(true);
                              }}
                              title="Visualizar Detalhes"
                            >
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Button>
                            
                            {(doc.pdf_path || doc.caminho_pdf) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDownloadFile((doc.pdf_path || doc.caminho_pdf)!, `DANFE_${doc.numero || doc.ref}.pdf`)}
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4 text-emerald-500" />
                              </Button>
                            )}

                            {(doc.xml_path || doc.caminho_xml) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDownloadFile((doc.xml_path || doc.caminho_xml)!, `XML_${doc.numero || doc.ref}.xml`)}
                                title="Download XML"
                              >
                                <FileJson className="h-4 w-4 text-indigo-500" />
                              </Button>
                            )}

                            {doc.provider === 'focusnfe' && (doc.status === 'autorizado' || doc.status === 'processado' || doc.status === 'success' || doc.status.includes('autoriz') || doc.status.includes('success')) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setDocToCancel(doc);
                                  setIsCancelOpen(true);
                                }}
                                title="Cancelar Nota Fiscal"
                              >
                                <XCircle className="h-4 w-4 text-red-500 hover:text-red-700" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <div className="flex flex-1 justify-between sm:hidden">
                  <Button
                    onClick={() => handlePageChange(offset - limit)}
                    disabled={offset === 0}
                    variant="outline"
                    size="sm"
                  >
                    Anterior
                  </Button>
                  <Button
                    onClick={() => handlePageChange(offset + limit)}
                    disabled={offset + limit >= total}
                    variant="outline"
                    size="sm"
                  >
                    Próximo
                  </Button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-400">
                      Mostrando <span className="font-semibold text-foreground">{offset + 1}</span> a{' '}
                      <span className="font-semibold text-foreground">
                        {Math.min(offset + limit, total)}
                      </span>{' '}
                      de <span className="font-semibold text-foreground">{total}</span> notas fiscais
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <Button
                        onClick={() => handlePageChange(offset - limit)}
                        disabled={offset === 0}
                        variant="outline"
                        className="rounded-l-md px-2 py-2 h-9"
                      >
                        <span className="sr-only">Anterior</span>
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <div className="flex items-center px-4 py-2 text-sm font-semibold border-t border-b border-input">
                        Página {currentPage} de {totalPages}
                      </div>
                      <Button
                        onClick={() => handlePageChange(offset + limit)}
                        disabled={offset + limit >= total}
                        variant="outline"
                        className="rounded-r-md px-2 py-2 h-9"
                      >
                        <span className="sr-only">Próximo</span>
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Detalhes da Nota Fiscal — {selectedDoc?.numero ? `Nº ${selectedDoc.numero}` : selectedDoc?.ref}
            </DialogTitle>
            <DialogDescription>
              Informações consolidadas e estrutura JSON do documento.
            </DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-6 pt-4">
              {/* Resumo rápido */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border">
                <div>
                  <span className="text-xs text-muted-foreground block">Provedor</span>
                  <span className="font-semibold text-sm">{selectedDoc.provider === 'focusnfe' ? 'Emitida pelo ERP' : 'Importada (Legado)'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Tipo</span>
                  <span className="font-semibold text-sm uppercase">{selectedDoc.doc_type}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Número / Série</span>
                  <span className="font-semibold text-sm">
                    {selectedDoc.numero ? `${selectedDoc.numero} (Série ${selectedDoc.serie || '0'})` : 'Não gerado'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Data Emissão</span>
                  <span className="font-semibold text-sm">
                    {new Date(selectedDoc.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Chave de acesso se disponível */}
              {selectedDoc.chave && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-lg">
                  <span className="text-xs text-muted-foreground block mb-1">Chave de Acesso NF-e (44 dígitos)</span>
                  <code className="text-xs font-mono font-bold block select-all break-all text-primary">
                    {selectedDoc.chave}
                  </code>
                </div>
              )}

              {/* Detalhes específicos baseados no Payload (Estrutura da Nota) */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base flex items-center gap-1.5">
                  <FileJson className="h-4.5 w-4.5 text-muted-foreground" />
                  Estrutura JSON Completa
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <pre className="bg-gray-950 text-gray-200 p-4 text-xs font-mono rounded-lg max-h-[350px] overflow-auto select-all">
                    {JSON.stringify(selectedDoc.payload || {}, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Ações adicionais */}
              <div className="flex justify-end gap-2 border-t pt-4">
                {selectedDoc.provider === 'focusnfe' && (selectedDoc.status === 'autorizado' || selectedDoc.status === 'processado' || selectedDoc.status === 'success' || selectedDoc.status.includes('autoriz') || selectedDoc.status.includes('success')) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDocToCancel(selectedDoc);
                      setIsCancelOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar Nota
                  </Button>
                )}
                {(selectedDoc.xml_path || selectedDoc.caminho_xml) && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadFile((selectedDoc.xml_path || selectedDoc.caminho_xml)!, `XML_${selectedDoc.numero || selectedDoc.ref}.xml`)}
                    className="flex items-center gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                  >
                    <Download className="h-4 w-4" />
                    Baixar XML
                  </Button>
                )}
                {(selectedDoc.pdf_path || selectedDoc.caminho_pdf) && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadFile((selectedDoc.pdf_path || selectedDoc.caminho_pdf)!, `DANFE_${selectedDoc.numero || selectedDoc.ref}.pdf`)}
                    className="flex items-center gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  >
                    <Download className="h-4 w-4" />
                    Baixar PDF (DANFE)
                  </Button>
                )}
                <Button onClick={() => setIsDetailOpen(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancellation Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-red-600 font-bold">
              <XCircle className="h-5 w-5" />
              Cancelar Nota Fiscal
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              Tem certeza de que deseja cancelar esta nota fiscal? Esta ação enviará um pedido de homologação de cancelamento perante a SEFAZ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium block text-gray-900 dark:text-gray-100">
                Justificativa do Cancelamento <span className="text-red-500">*</span>
              </label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-gray-100"
                placeholder="Informe o motivo do cancelamento (mínimo de 15 caracteres)..."
                value={cancelJustification}
                onChange={(e) => setCancelJustification(e.target.value)}
                maxLength={255}
                disabled={cancelling}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Mínimo: 15 caracteres</span>
                <span className={cancelJustification.trim().length < 15 ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
                  {cancelJustification.trim().length} / 255
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCancelOpen(false);
                  setCancelJustification('');
                  setDocToCancel(null);
                }}
                disabled={cancelling}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelDocument}
                disabled={cancelling || cancelJustification.trim().length < 15}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  'Confirmar Cancelamento'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog de Detalhes da Venda */}
      <Dialog open={isSaleDetailOpen} onOpenChange={setIsSaleDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-indigo-600" />
              Detalhes da Venda {selectedSale?.sale_number}
            </DialogTitle>
            <DialogDescription>
              Informações consolidadas da venda de produtos vinculada a este documento fiscal.
            </DialogDescription>
          </DialogHeader>
          
          {loadingSale ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm text-muted-foreground">Carregando dados da venda...</p>
            </div>
          ) : selectedSale ? (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">Número da Venda</label>
                  <div className="font-mono text-sm mt-1 font-semibold">{selectedSale.sale_number}</div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">Status</label>
                  <div className="mt-1">
                    <Badge variant={selectedSale.status === 'completed' || selectedSale.status === 'paga' ? 'default' : 'outline'}>
                      {selectedSale.status === 'completed' || selectedSale.status === 'paga' ? 'Paga' : selectedSale.status === 'canceled' ? 'Cancelada' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">Cliente</label>
                  <div className="mt-1 text-sm font-medium flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedSale.customer_name || 'Cliente Avulso'}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">Vendedor</label>
                  <div className="mt-1 text-sm">{selectedSale.seller_name || '-'}</div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">Data da Venda</label>
                  <div className="mt-1 text-sm flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {new Date(selectedSale.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">Forma de Pagamento</label>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {selectedSale.payment_method === 'dinheiro' ? 'Dinheiro' :
                       selectedSale.payment_method === 'cartao_debito' ? 'Cartão Débito' :
                       selectedSale.payment_method === 'cartao_credito' ? 'Cartão Crédito' :
                       selectedSale.payment_method === 'pix' ? 'PIX' :
                       selectedSale.payment_method === 'boleto' ? 'Boleto' : selectedSale.payment_method || 'Não Informada'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {selectedSale.items && selectedSale.items.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider mb-2">Itens Vendidos</label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Produto</th>
                          <th className="px-3 py-2 font-semibold text-center">Qtd</th>
                          <th className="px-3 py-2 font-semibold text-right">Preço Unit.</th>
                          <th className="px-3 py-2 font-semibold text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedSale.items.map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2">{item.product_name}</td>
                            <td className="px-3 py-2 text-center">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">Subtotal</label>
                  <div className="text-sm font-semibold mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(selectedSale.total_amount || 0))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">Total Final</label>
                  <div className="text-lg font-bold text-indigo-600 mt-0.5">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(selectedSale.final_amount || selectedSale.total_amount || 0))}
                  </div>
                </div>
              </div>
              
              {selectedSale.notes && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">Observações</label>
                  <div className="text-xs text-muted-foreground mt-1 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 italic leading-relaxed">
                    {selectedSale.notes}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Erro ao exibir detalhes da venda.
            </div>
          )}
          
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsSaleDetailOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
