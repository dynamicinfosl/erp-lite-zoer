'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Loader2, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Building2,
  Key,
  Shield,
  Calendar,
  Receipt,
  Download,
  RefreshCw,
  Eye,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';

interface FiscalIntegration {
  id?: string;
  tenant_id: string;
  provider: string;
  environment: 'homologacao' | 'producao';
  api_token?: string;
  cnpj_emitente?: string;
  enabled: boolean;
  focus_empresa_id?: string;
  focus_token_homologacao?: string;
  focus_token_producao?: string;
  cert_valid_from?: string;
  cert_valid_to?: string;
  cert_cnpj?: string;
  nfe_serie?: string;
  nfce_serie?: string;
  created_at?: string;
  updated_at?: string;
}

interface FiscalCertificate {
  id?: string;
  tenant_id: string;
  provider: string;
  storage_path?: string;
  original_filename?: string;
  content_type?: string;
  size_bytes?: number;
  status?: string;
  cert_valid_from?: string;
  cert_valid_to?: string;
  cert_cnpj?: string;
  created_at?: string;
  updated_at?: string;
}

interface FiscalDocument {
  id: string;
  tenant_id: string;
  provider: string;
  doc_type: 'nfe' | 'nfce' | 'nfse' | 'nfse_nacional';
  ref: string;
  status: string;
  payload?: any;
  xml_path?: string;
  pdf_path?: string;
  numero?: string;
  serie?: string;
  chave?: string;
  created_at: string;
  updated_at: string;
}

interface FiscalDocumentEvent {
  id: string;
  fiscal_document_id: string;
  tenant_id: string;
  event_type: string;
  event_status: string;
  event_data?: any;
  provider_response?: any;
  created_at: string;
}

export default function ConfiguracaoFiscalPage() {
  const { user, tenant: authTenant, loading: authLoading } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [integration, setIntegration] = useState<FiscalIntegration | null>(null);
  const [certificate, setCertificate] = useState<FiscalCertificate | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsFilter, setDocumentsFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshingDoc, setRefreshingDoc] = useState<string | null>(null);
  const [selectedDocForEvents, setSelectedDocForEvents] = useState<string | null>(null);
  const [docEvents, setDocEvents] = useState<FiscalDocumentEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [formData, setFormData] = useState({
    certificate_password: '',
  });

  const [nfeSerie, setNfeSerie] = useState('1');
  const [nfceSerie, setNfceSerie] = useState('1');
  const [savingSeries, setSavingSeries] = useState(false);

  const loadFiscalData = useCallback(async () => {
    if (!authTenant && !user) {
      console.warn('Nenhum tenant ou usuário disponível');
      setLoading(false);
      return;
    }

    const fallbackTenantId = user?.id || '00000000-0000-0000-0000-000000000000';
    const tenantId = authTenant?.id || fallbackTenantId;
    
    // Validar se tenantId é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.error('tenantId inválido:', tenantId);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      let hasConfigError = false;

      // Carregar integração
      const integrationResponse = await fetch(`/next_api/fiscal/focusnfe/integration?tenant_id=${tenantId}`);
      
      if (!integrationResponse.ok) {
        // Se não for OK, tentar ler como JSON primeiro
        let errorData;
        try {
          errorData = await integrationResponse.json();
        } catch {
          // Se não for JSON, é HTML (página de erro)
          console.error('Erro ao carregar integração:', integrationResponse.status, integrationResponse.statusText);
          // Continuar sem erro - pode ser que não exista integração ainda
        }
        
        if (errorData?.error) {
          if (integrationResponse.status === 500 && errorData.error.includes('Configuração do servidor')) {
            // Erro de configuração - mostrar mensagem amigável
            const errorMsg = 'As variáveis de ambiente do Supabase não estão configuradas. Por favor, configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local';
            setConfigError(errorMsg);
            hasConfigError = true;
          } else if (integrationResponse.status !== 400) {
            // 400 é OK (não encontrado), mas outros erros são problemas
            console.error('Erro na API:', errorData.error);
            if (integrationResponse.status === 500) {
              setConfigError(errorData.details || errorData.error);
              hasConfigError = true;
            }
          }
        }
      } else {
        setConfigError(null); // Limpar erro se sucesso
        const integrationResult = await integrationResponse.json();
        if (integrationResult?.data) {
          setIntegration(integrationResult.data);
          setNfeSerie(integrationResult.data.nfe_serie || '1');
          setNfceSerie(integrationResult.data.nfce_serie || '1');
          setFormData({
            certificate_password: '',
          });
        }
      }

      // Carregar certificado (só se não houver erro de configuração)
      if (!hasConfigError) {
        const certificateResponse = await fetch(`/next_api/fiscal/focusnfe/certificate?tenant_id=${tenantId}`);
        
        if (!certificateResponse.ok) {
          // Se não for OK, tentar ler como JSON primeiro
          let errorData;
          try {
            errorData = await certificateResponse.json();
          } catch {
            // Se não for JSON, é HTML (página de erro)
            console.error('Erro ao carregar certificado:', certificateResponse.status, certificateResponse.statusText);
            // Continuar sem erro - pode ser que não exista certificado ainda
          }
          
          if (errorData?.error && certificateResponse.status !== 400) {
            console.error('Erro na API:', errorData.error);
          }
        } else {
          const certificateResult = await certificateResponse.json();
          if (certificateResult?.data) {
            setCertificate(certificateResult.data);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados fiscais:', error);
      toast.error('Erro ao carregar configuração fiscal');
    } finally {
      setLoading(false);
    }
  }, [authTenant, user]);

  useEffect(() => {
    if (authLoading) return;
    loadFiscalData();
  }, [authTenant, authLoading, loadFiscalData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !['pfx', 'p12'].includes(ext)) {
        toast.error('Por favor, selecione um arquivo .pfx ou .p12');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadCertificate = async () => {
    const fallbackTenantId = user?.id || '00000000-0000-0000-0000-000000000000';
    const tenantId = authTenant?.id || fallbackTenantId;

    if (!selectedFile) {
      toast.error('Por favor, selecione um arquivo de certificado');
      return;
    }

    if (!formData.certificate_password) {
      toast.error('Por favor, informe a senha do certificado');
      return;
    }

    try {
      setUploading(true);

      const formDataToSend = new FormData();
      formDataToSend.append('tenant_id', tenantId);
      formDataToSend.append('password', formData.certificate_password);
      formDataToSend.append('file', selectedFile);

      const response = await fetch('/next_api/fiscal/focusnfe/certificate', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer upload do certificado');
      }

      toast.success('Certificado enviado com sucesso!');
      setSelectedFile(null);
      setFormData({ ...formData, certificate_password: '' });
      await loadFiscalData();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao fazer upload: ' + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleProvisionCompany = async () => {
    const fallbackTenantId = user?.id || '00000000-0000-0000-0000-000000000000';
    const tenantId = authTenant?.id || fallbackTenantId;

    try {
      setProvisioning(true);

      const response = await fetch('/next_api/fiscal/focusnfe/company/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Provider error details:', result.provider_error);
        let msg = result.error || 'Erro ao provisionar empresa';
        if (result.provider_error) {
          if (result.provider_error.mensagem) {
            msg += ': ' + result.provider_error.mensagem;
          }
          const errorsList = result.provider_error.erros || result.provider_error.errors;
          if (errorsList) {
            const extra = Array.isArray(errorsList)
              ? errorsList.map((e: any) => `${e.campo || ''}: ${e.mensagem || JSON.stringify(e)}`).join(', ')
              : JSON.stringify(errorsList);
            msg += ' (' + extra + ')';
          }
        }
        throw new Error(msg);
      }

      toast.success('Empresa provisionada com sucesso!');
      await loadFiscalData();
    } catch (error) {
      console.error('Erro ao provisionar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro: ' + errorMessage, { duration: 10000 });
    } finally {
      setProvisioning(false);
    }
  };

  const handleSaveSeries = async () => {
    if (!integration) return;
    const fallbackTenantId = user?.id || '00000000-0000-0000-0000-000000000000';
    const tenantId = authTenant?.id || fallbackTenantId;

    try {
      setSavingSeries(true);
      const response = await fetch('/next_api/fiscal/focusnfe/integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          api_token: integration.api_token,
          nfe_serie: nfeSerie,
          nfce_serie: nfceSerie,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar séries');
      }

      toast.success('Séries de notas fiscais atualizadas com sucesso!');
      await loadFiscalData();
    } catch (error: any) {
      console.error('Erro ao salvar séries:', error);
      toast.error(`Erro ao salvar séries: ${error.message}`);
    } finally {
      setSavingSeries(false);
    }
  };

  const loadDocuments = useCallback(async () => {
    if (!authTenant && !user) return;

    const fallbackTenantId = user?.id || '00000000-0000-0000-0000-000000000000';
    const tenantId = authTenant?.id || fallbackTenantId;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) return;

    try {
      setDocumentsLoading(true);
      const url = `/next_api/fiscal/focusnfe/documents?tenant_id=${tenantId}${documentsFilter !== 'all' ? `&doc_type=${documentsFilter}` : ''}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const result = await response.json();
        setDocuments(result.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast.error('Erro ao carregar documentos fiscais');
    } finally {
      setDocumentsLoading(false);
    }
  }, [authTenant, user, documentsFilter]);

  const handleRefreshDocument = async (documentId: string, ref: string) => {
    try {
      setRefreshingDoc(documentId);
      const response = await fetch(`/next_api/fiscal/focusnfe/status?fiscal_document_id=${documentId}&completa=1`);
      const result = await response.json();
      
      if (response.ok) {
        toast.success('Status atualizado com sucesso!');
        await loadDocuments();
      } else {
        toast.error(result.error || 'Erro ao consultar status');
      }
    } catch (error) {
      console.error('Erro ao consultar status:', error);
      toast.error('Erro ao consultar status do documento');
    } finally {
      setRefreshingDoc(null);
    }
  };

  const handleDownloadFile = (url: string, filename: string) => {
    if (!url) {
      toast.error('Arquivo não disponível');
      return;
    }
    
    // Abrir em nova aba para download
    window.open(url, '_blank');
  };

  const loadDocumentEvents = useCallback(async (documentId: string) => {
    try {
      setEventsLoading(true);
      const response = await fetch(`/next_api/fiscal/focusnfe/events?fiscal_document_id=${documentId}`);
      
      if (response.ok) {
        const result = await response.json();
        setDocEvents(result.data || []);
      } else {
        toast.error('Erro ao carregar histórico de eventos');
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast.error('Erro ao carregar histórico de eventos');
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const handleViewEvents = (documentId: string) => {
    setSelectedDocForEvents(documentId);
    loadDocumentEvents(documentId);
  };

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando configuração fiscal...</p>
        </div>
      </div>
    );
  }

  const tenantId = authTenant?.id || user?.id || '00000000-0000-0000-0000-000000000000';

  return (
    <TenantPageWrapper>
      <div className="space-y-6">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwVjEwSC0xMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/10">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Emissão Fiscal</h1>
                <p className="text-blue-100 mt-1 text-sm sm:text-base">
                  Gerencie seu certificado digital e acompanhe seus documentos fiscais
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 backdrop-blur-sm text-white border border-white/20 px-3 py-1.5 font-semibold text-xs">
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                {certificate ? 'Certificado Ativo' : 'Sem Certificado'}
              </Badge>
              <Badge className="bg-emerald-500/90 text-white border-0 px-3 py-1.5 font-semibold text-xs">
                Produção
              </Badge>
            </div>
          </div>
        </div>

        {/* KPIs rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="juga-card p-5 flex items-center gap-4 border-l-4 border-l-blue-500">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Certificado</p>
              <p className="text-lg font-bold text-foreground">
                {certificate ? 'Enviado' : 'Pendente'}
              </p>
            </div>
          </div>
          <div className="juga-card p-5 flex items-center gap-4 border-l-4 border-l-emerald-500">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
              <Building2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Faturamento</p>
              <p className="text-lg font-bold text-foreground">
                {integration?.focus_empresa_id ? 'Ativado' : 'Pendente'}
              </p>
            </div>
          </div>
          <div className="juga-card p-5 flex items-center gap-4 border-l-4 border-l-purple-500">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30">
              <Receipt className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas Emitidas</p>
              <p className="text-lg font-bold text-foreground">{documents.length}</p>
            </div>
          </div>
        </div>

        {configError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-red-900 dark:text-red-100 font-semibold mb-1">Erro de Configuração</h3>
                <p className="text-red-700 dark:text-red-300 text-sm">{configError}</p>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="certificado" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl shadow-inner border border-slate-200/50 dark:border-slate-700/50">
            <TabsTrigger value="certificado" className="rounded-lg font-semibold py-3 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Shield className="h-4 w-4 mr-2" />
              Certificado Digital
            </TabsTrigger>
            <TabsTrigger value="status" className="rounded-lg font-semibold py-3 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Status da Emissão
            </TabsTrigger>
            <TabsTrigger value="documentos" className="rounded-lg font-semibold py-3 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Receipt className="h-4 w-4 mr-2" />
              Histórico de Notas
            </TabsTrigger>
          </TabsList>

          {/* ABA: CERTIFICADO */}
          <TabsContent value="certificado" className="space-y-6">
            <Card className="juga-card-elevated overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-foreground font-bold text-lg">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  Certificado Digital A1
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Faça upload do seu certificado digital (.pfx ou .p12) e informe a senha
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {certificate && (
                  <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                          ✅ Certificado cadastrado com sucesso
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                          Arquivo: <span className="font-medium">{certificate.original_filename}</span>
                        </p>
                        {certificate.size_bytes && (
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            Tamanho: {(certificate.size_bytes / 1024).toFixed(2)} KB
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="certificate_file" className="text-sm font-semibold text-foreground">
                    Arquivo do Certificado (.pfx ou .p12)<span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <div 
                    onClick={() => document.getElementById('certificate_file')?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-slate-50/50 dark:bg-slate-900/10 cursor-pointer group"
                  >
                    <Upload className="h-10 w-10 mx-auto mb-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <Input
                      id="certificate_file"
                      type="file"
                      accept=".pfx,.p12"
                      onChange={handleFileSelect}
                      onClick={(e) => e.stopPropagation()}
                      className="hidden"
                    />
                    <div className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-sm group-hover:border-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all mb-2">
                      Escolher arquivo
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedFile ? `Selecionado: ${selectedFile.name}` : 'Nenhum arquivo escolhido'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Formatos aceitos: .pfx, .p12
                    </p>
                  </div>
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">{selectedFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="h-6 px-2 text-xs ml-auto text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="certificate_password" className="text-sm font-semibold text-foreground">
                    Senha do Certificado<span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <Input
                    id="certificate_password"
                    type="password"
                    value={formData.certificate_password}
                    onChange={(e) => setFormData({ ...formData, certificate_password: e.target.value })}
                    placeholder="Digite a senha do certificado"
                    className="h-12 text-base border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Informe a senha usada para proteger o arquivo do certificado
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    type="button"
                    onClick={handleUploadCertificate}
                    disabled={uploading || !selectedFile || !formData.certificate_password}
                    className="min-w-[180px] h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Enviar Certificado
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="juga-card-elevated overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-foreground font-bold text-lg">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-md">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  Ativar Faturamento Fiscal
                </CardTitle>
                <CardDescription>
                  Ative a emissão de notas fiscais diretamente pela sua empresa no ERP
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/15 dark:to-orange-900/15 border border-amber-200 dark:border-amber-800 p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                          Pré-requisitos para ativação
                        </p>
                        <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-2">
                          <li className="flex items-center gap-2">
                            {certificate ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                            )}
                            Envie o certificado digital na seção acima
                          </li>
                          <li className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                            Certifique-se de que os dados da empresa estão completos em &quot;Perfil da Empresa&quot;
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      type="button"
                      onClick={handleProvisionCompany}
                      disabled={provisioning || !certificate}
                      className="min-w-[180px] h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50"
                    >
                      {provisioning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Ativando...
                        </>
                      ) : (
                        <>
                          <Building2 className="mr-2 h-4 w-4" />
                          Ativar Faturamento
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: STATUS */}
          <TabsContent value="status" className="space-y-6">
            <Card className="juga-card-elevated overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-foreground font-bold text-lg">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  Status da Emissão
                </CardTitle>
                <CardDescription>
                  Informações sobre o faturamento e validade do certificado da sua empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status da Emissão */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-900/50 dark:to-blue-900/20 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Faturamento Fiscal</p>
                    {integration?.focus_empresa_id ? (
                      <Badge className="bg-emerald-600 font-bold text-white px-4 py-1.5 text-sm shadow-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Ativado
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="font-bold text-white px-4 py-1.5 text-sm shadow-sm">
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                        Pendente
                      </Badge>
                    )}
                  </div>
                  <div className="p-5 rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50/50 dark:from-slate-900/50 dark:to-emerald-900/20 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Ambiente de Operação</p>
                    {integration?.environment === 'producao' ? (
                      <Badge className="bg-emerald-600 font-bold text-white px-4 py-1.5 text-sm shadow-sm">
                        <Shield className="h-3.5 w-3.5 mr-1.5" />
                        Produção (Real)
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-600 font-bold text-white px-4 py-1.5 text-sm shadow-sm">
                        <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                        Homologação (Testes)
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Status do Certificado */}
                <div className="space-y-4 pt-5 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Key className="h-5 w-5 text-blue-600" />
                    Certificado Digital
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status</Label>
                      <div className="mt-2">
                        {certificate ? (
                          <Badge className="bg-emerald-600 text-white font-semibold">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Enviado
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="font-semibold">
                            <XCircle className="h-3 w-3 mr-1" />
                            Não enviado
                          </Badge>
                        )}
                      </div>
                    </div>
                    {certificate?.original_filename && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Arquivo</Label>
                        <p className="text-sm font-medium mt-2 text-foreground">{certificate.original_filename}</p>
                      </div>
                    )}
                    {integration?.cert_cnpj && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">CNPJ do Certificado</Label>
                        <p className="text-sm font-medium mt-2 text-foreground font-mono">{integration.cert_cnpj}</p>
                      </div>
                    )}
                    {integration?.cert_valid_from && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Válido de
                        </Label>
                        <p className="text-sm font-medium mt-2 text-foreground">
                          {new Date(integration.cert_valid_from).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {integration?.cert_valid_to && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Válido até
                        </Label>
                        <div className="mt-2 flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {new Date(integration.cert_valid_to).toLocaleDateString('pt-BR')}
                          </p>
                          {new Date(integration.cert_valid_to) < new Date() && (
                            <Badge variant="destructive" className="text-xs">
                              Expirado
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="juga-card-elevated overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-foreground font-bold text-lg">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Série dos Documentos Fiscais
                </CardTitle>
                <CardDescription>
                  Configure as séries que serão utilizadas para a emissão em Produção / Homologação.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nfe_serie" className="text-sm font-semibold text-foreground">
                      Série da NF-e (Produto / Modelo 55)
                    </Label>
                    <Input
                      id="nfe_serie"
                      value={nfeSerie}
                      onChange={(e) => setNfeSerie(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ex: 1"
                      className="h-12 text-base border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Se você configurou a série no painel da Focus NFe (Ex: série 50), informe-a aqui.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nfce_serie" className="text-sm font-semibold text-foreground">
                      Série da NFC-e (Consumidor / Modelo 65)
                    </Label>
                    <Input
                      id="nfce_serie"
                      value={nfceSerie}
                      onChange={(e) => setNfceSerie(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ex: 1"
                      className="h-12 text-base border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Série configurada para cupons fiscais eletrônicos no painel da Focus NFe.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    type="button"
                    onClick={handleSaveSeries}
                    disabled={savingSeries || !integration}
                    className="min-w-[180px] h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
                  >
                    {savingSeries ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Séries'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: DOCUMENTOS */}
          <TabsContent value="documentos" className="space-y-6">
            <Card className="juga-card-elevated overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500" />
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-foreground font-bold text-lg">
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-md">
                    <Receipt className="h-5 w-5 text-white" />
                  </div>
                  Documentos Fiscais
                </CardTitle>
                <CardDescription>
                  Liste, consulte status e faça download dos documentos fiscais emitidos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filtros e Busca */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por ref, número, chave..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 border-slate-300 dark:border-slate-600"
                    />
                  </div>
                  <select
                    value={documentsFilter}
                    onChange={(e) => setDocumentsFilter(e.target.value)}
                    className="flex h-11 w-full md:w-[200px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">Todos os tipos</option>
                    <option value="nfe">NFe</option>
                    <option value="nfce">NFCe</option>
                    <option value="nfse">NFSe</option>
                    <option value="nfse_nacional">NFSe Nacional</option>
                  </select>
                  <Button
                    onClick={loadDocuments}
                    disabled={documentsLoading}
                    variant="outline"
                    className="h-11 px-4 border-slate-300 dark:border-slate-600"
                  >
                    {documentsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Tabela de Documentos */}
                {documentsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <p className="text-sm text-muted-foreground">Carregando documentos...</p>
                    </div>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mx-auto mb-4">
                      <Receipt className="h-10 w-10 text-slate-400" />
                    </div>
                    <p className="text-muted-foreground font-medium">Nenhum documento fiscal encontrado</p>
                    <p className="text-xs text-muted-foreground mt-1">Os documentos emitidos aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/80">
                          <tr>
                            <th className="px-4 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Tipo</th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Ref</th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Número</th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Chave</th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Data</th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {documents
                            .filter((doc) => {
                              if (!searchTerm) return true;
                              const search = searchTerm.toLowerCase();
                              return (
                                doc.ref?.toLowerCase().includes(search) ||
                                doc.numero?.toLowerCase().includes(search) ||
                                doc.chave?.toLowerCase().includes(search)
                              );
                            })
                            .map((doc) => (
                              <tr key={doc.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                                <td className="px-4 py-3.5">
                                  <Badge variant="outline" className="uppercase font-bold text-xs border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400">
                                    {doc.doc_type}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3.5 text-sm font-mono text-xs text-muted-foreground">
                                  {doc.ref}
                                </td>
                                <td className="px-4 py-3.5">
                                  <Badge
                                    className={`font-semibold text-white ${
                                      doc.status === 'autorizado' || doc.status === 'processado'
                                        ? 'bg-emerald-600'
                                        : doc.status === 'cancelado' || doc.status === 'erro'
                                        ? 'bg-red-600'
                                        : doc.status === 'submitted'
                                        ? 'bg-amber-500'
                                        : 'bg-slate-500'
                                    }`}
                                  >
                                    {doc.status || 'Pendente'}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                                  {doc.numero || '-'}
                                </td>
                                <td className="px-4 py-3.5 text-sm font-mono text-xs text-muted-foreground">
                                  {doc.chave ? (
                                    <span className="truncate block max-w-[200px]" title={doc.chave}>
                                      {doc.chave}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-sm text-muted-foreground">
                                  {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewEvents(doc.id)}
                                      title="Ver histórico de eventos"
                                      className="h-8 w-8 p-0 border-slate-300 dark:border-slate-600 hover:bg-blue-50 hover:border-blue-300"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRefreshDocument(doc.id, doc.ref)}
                                      disabled={refreshingDoc === doc.id}
                                      title="Consultar status"
                                      className="h-8 w-8 p-0 border-slate-300 dark:border-slate-600 hover:bg-blue-50 hover:border-blue-300"
                                    >
                                      {refreshingDoc === doc.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <RefreshCw className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                    {doc.xml_path && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDownloadFile(doc.xml_path!, `doc_${doc.ref}.xml`)}
                                        title="Download XML"
                                        className="h-8 w-8 p-0 border-slate-300 dark:border-slate-600 hover:bg-emerald-50 hover:border-emerald-300"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    {doc.pdf_path && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDownloadFile(doc.pdf_path!, `doc_${doc.ref}.pdf`)}
                                        title="Download PDF"
                                        className="h-8 w-8 p-0 border-slate-300 dark:border-slate-600 hover:bg-red-50 hover:border-red-300"
                                      >
                                        <FileText className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Histórico de Eventos */}
        <Dialog open={selectedDocForEvents !== null} onOpenChange={(open) => !open && setSelectedDocForEvents(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <Eye className="h-5 w-5 text-blue-600" />
                Histórico de Eventos
              </DialogTitle>
              <DialogDescription>
                Eventos e notificações recebidas para este documento fiscal
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-4">
              {eventsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : docEvents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mx-auto mb-4">
                    <AlertCircle className="h-10 w-10 text-slate-400" />
                  </div>
                  <p className="font-medium">Nenhum evento registrado para este documento</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {docEvents.map((event) => (
                    <Card key={event.id} className="border-l-4 border-l-blue-500 shadow-sm">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`font-semibold text-white ${
                                event.event_status === 'autorizado' || event.event_status === 'processado'
                                  ? 'bg-emerald-600'
                                  : event.event_status === 'cancelado' || event.event_status === 'erro'
                                  ? 'bg-red-600'
                                  : 'bg-amber-500'
                              }`}
                            >
                              {event.event_status || 'N/A'}
                            </Badge>
                            <Badge variant="outline" className="font-medium">{event.event_type}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">
                            {new Date(event.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        {event.provider_response && (
                          <div className="mt-3">
                            <details className="cursor-pointer">
                              <summary className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Ver detalhes do evento
                              </summary>
                              <pre className="mt-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs overflow-x-auto border border-slate-200 dark:border-slate-700">
                                {JSON.stringify(event.provider_response, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TenantPageWrapper>
  );
}

