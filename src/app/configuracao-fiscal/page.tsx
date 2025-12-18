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
  Save, 
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
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

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

export default function ConfiguracaoFiscalPage() {
  const { user, tenant: authTenant, loading: authLoading } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [integration, setIntegration] = useState<FiscalIntegration | null>(null);
  const [certificate, setCertificate] = useState<FiscalCertificate | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsFilter, setDocumentsFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshingDoc, setRefreshingDoc] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    api_token: '',
    environment: 'homologacao' as 'homologacao' | 'producao',
    enabled: true,
    certificate_password: '',
  });

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
          setFormData({
            // Não preencher o token por segurança - usuário precisa digitar novamente se quiser alterar
            api_token: '',
            environment: integrationResult.data.environment || 'homologacao',
            enabled: integrationResult.data.enabled !== false,
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
  }, [authTenant, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    loadFiscalData();
  }, [authTenant, authLoading, loadFiscalData]);

  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    const fallbackTenantId = user?.id || '00000000-0000-0000-0000-000000000000';
    const tenantId = authTenant?.id || fallbackTenantId;

    // Se não há token configurado e não foi digitado um novo, não permitir salvar
    if (!integration?.api_token && !formData.api_token) {
      toast.error('Token da API é obrigatório');
      return;
    }
    
    // Se já existe token configurado mas não foi digitado um novo, usar o existente
    const tokenToSave = formData.api_token || integration?.api_token;
    if (!tokenToSave) {
      toast.error('Token da API é obrigatório');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch('/next_api/fiscal/focusnfe/integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          api_token: formData.api_token || integration?.api_token,
          environment: formData.environment,
          enabled: formData.enabled,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar integração');
      }

      toast.success('Configuração salva com sucesso!');
      setShowSuccessMessage(true);
      await loadFiscalData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao salvar: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

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
        throw new Error(result.error || 'Erro ao provisionar empresa');
      }

      toast.success('Empresa provisionada com sucesso na FocusNFe!');
      await loadFiscalData();
    } catch (error) {
      console.error('Erro ao provisionar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao provisionar: ' + errorMessage);
    } finally {
      setProvisioning(false);
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

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Auto-esconder mensagem de sucesso após 5 segundos
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuração Fiscal</h1>
            <p className="text-muted-foreground">
              Configure a integração com FocusNFe para emissão de documentos fiscais
            </p>
          </div>
        </div>
      </div>

      {configError && (
        <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-red-900 dark:text-red-100 font-semibold mb-2">Erro de Configuração do Servidor</h3>
              <p className="text-red-700 dark:text-red-300 text-sm mb-3">{configError}</p>
              <div className="bg-red-100 dark:bg-red-900/40 rounded p-3 text-xs font-mono text-red-900 dark:text-red-200">
                <p className="mb-1">Certifique-se de que o arquivo <code>.env.local</code> contém:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
                  <li><code>SUPABASE_SERVICE_ROLE_KEY</code></li>
                </ul>
                <p className="mt-2 text-red-800 dark:text-red-300">Após configurar, reinicie o servidor de desenvolvimento.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessMessage && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 mr-3" />
            <span className="text-green-800 font-medium">Configuração salva com sucesso!</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSuccessMessage(false)}
            className="text-green-600 hover:bg-green-100"
          >
            ✕
          </Button>
        </div>
      )}

      <Tabs defaultValue="integracao" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="integracao">Integração</TabsTrigger>
          <TabsTrigger value="certificado">Certificado</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        {/* ABA: INTEGRAÇÃO */}
        <TabsContent value="integracao" className="space-y-6">
          <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Key className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                Configuração da API FocusNFe
              </CardTitle>
              <CardDescription>
                Configure o token de acesso e o ambiente (homologação ou produção)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveIntegration} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="api_token">
                      Token da API FocusNFe<span className="text-red-500">*</span>
                    </Label>
                    {integration?.api_token && (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Token configurado
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="api_token"
                    type="password"
                    value={formData.api_token}
                    onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                    placeholder={integration?.api_token ? "Digite um novo token para alterar" : "Cole seu token da API FocusNFe aqui"}
                    required={!integration?.api_token}
                    className="h-11"
                  />
                  <p className="text-sm text-muted-foreground">
                    {integration?.api_token 
                      ? "Token já configurado. Digite um novo token apenas se desejar alterar."
                      : "Você pode obter o token no painel da FocusNFe: https://app-v2.focusnfe.com.br/"
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment">Ambiente<span className="text-red-500">*</span></Label>
                  <select
                    id="environment"
                    value={formData.environment}
                    onChange={(e) => setFormData({ ...formData, environment: e.target.value as 'homologacao' | 'producao' })}
                    className="flex h-11 w-full rounded-md border border-input bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2 text-sm text-gray-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="homologacao">Homologação (Testes)</option>
                    <option value="producao">Produção</option>
                  </select>
                  <p className="text-sm text-muted-foreground">
                    Use homologação para testes e produção para documentos reais
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="enabled" className="text-sm font-normal cursor-pointer">
                    Habilitar integração
                  </Label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="min-w-[120px] bg-green-600 hover:bg-green-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: CERTIFICADO */}
        <TabsContent value="certificado" className="space-y-6">
          <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Shield className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                Certificado Digital A1
              </CardTitle>
              <CardDescription>
                Faça upload do seu certificado digital (.pfx ou .p12) e informe a senha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {certificate && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Certificado já cadastrado
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Arquivo: {certificate.original_filename}
                      </p>
                      {certificate.size_bytes && (
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Tamanho: {(certificate.size_bytes / 1024).toFixed(2)} KB
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="certificate_file">
                  Arquivo do Certificado (.pfx ou .p12)<span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="certificate_file"
                    type="file"
                    accept=".pfx,.p12"
                    onChange={handleFileSelect}
                    className="h-11"
                  />
                </div>
                {selectedFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>{selectedFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="h-6 px-2 text-xs"
                    >
                      Remover
                    </Button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Selecione o arquivo do certificado digital A1 (.pfx ou .p12)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificate_password">
                  Senha do Certificado<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="certificate_password"
                  type="password"
                  value={formData.certificate_password}
                  onChange={(e) => setFormData({ ...formData, certificate_password: e.target.value })}
                  placeholder="Digite a senha do certificado"
                  className="h-11"
                />
                <p className="text-sm text-muted-foreground">
                  Informe a senha usada para proteger o arquivo do certificado
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleUploadCertificate}
                  disabled={uploading || !selectedFile || !formData.certificate_password}
                  className="min-w-[120px] bg-green-600 hover:bg-green-700"
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

          <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Building2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                Provisionar Empresa
              </CardTitle>
              <CardDescription>
                Após configurar o token e enviar o certificado, provisione a empresa na FocusNFe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        Antes de provisionar
                      </p>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 list-disc list-inside space-y-1">
                        <li>Configure o token da API na aba "Integração"</li>
                        <li>Envie o certificado digital na seção acima</li>
                        <li>Certifique-se de que os dados da empresa estão completos em "Perfil da Empresa"</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleProvisionCompany}
                    disabled={provisioning || !integration?.enabled || !certificate}
                    className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
                  >
                    {provisioning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Provisionando...
                      </>
                    ) : (
                      <>
                        <Building2 className="mr-2 h-4 w-4" />
                        Provisionar Empresa
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
          <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <CheckCircle2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                Status da Integração
              </CardTitle>
              <CardDescription>
                Informações sobre a configuração e status da integração com FocusNFe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status da Integração */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Integração</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <div>
                      {integration?.enabled ? (
                        <Badge className="bg-green-600">Habilitada</Badge>
                      ) : (
                        <Badge variant="destructive">Desabilitada</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Ambiente</Label>
                    <div>
                      {integration?.environment === 'producao' ? (
                        <Badge className="bg-red-600">Produção</Badge>
                      ) : (
                        <Badge className="bg-yellow-600">Homologação</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Token Configurado</Label>
                    <div>
                      {integration?.api_token ? (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Sim
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Não
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status da Empresa na FocusNFe */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Empresa na FocusNFe</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">ID da Empresa</Label>
                    <div>
                      {integration?.focus_empresa_id ? (
                        <Badge className="bg-blue-600">{integration.focus_empresa_id}</Badge>
                      ) : (
                        <Badge variant="outline">Não provisionada</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Token Homologação</Label>
                    <div>
                      {integration?.focus_token_homologacao ? (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Configurado
                        </Badge>
                      ) : (
                        <Badge variant="outline">Não disponível</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Token Produção</Label>
                    <div>
                      {integration?.focus_token_producao ? (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Configurado
                        </Badge>
                      ) : (
                        <Badge variant="outline">Não disponível</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status do Certificado */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Certificado Digital</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <div>
                      {certificate ? (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Enviado
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Não enviado
                        </Badge>
                      )}
                    </div>
                  </div>
                  {certificate?.original_filename && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Arquivo</Label>
                      <p className="text-sm font-medium">{certificate.original_filename}</p>
                    </div>
                  )}
                  {integration?.cert_cnpj && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">CNPJ do Certificado</Label>
                      <p className="text-sm font-medium">{integration.cert_cnpj}</p>
                    </div>
                  )}
                  {integration?.cert_valid_from && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Válido de
                      </Label>
                      <p className="text-sm font-medium">
                        {new Date(integration.cert_valid_from).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                  {integration?.cert_valid_to && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Válido até
                      </Label>
                      <p className="text-sm font-medium">
                        {new Date(integration.cert_valid_to).toLocaleDateString('pt-BR')}
                        {new Date(integration.cert_valid_to) < new Date() && (
                          <Badge variant="destructive" className="ml-2">
                            Expirado
                          </Badge>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: DOCUMENTOS */}
        <TabsContent value="documentos" className="space-y-6">
          <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Receipt className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                Documentos Fiscais
              </CardTitle>
              <CardDescription>
                Liste, consulte status e faça download dos documentos fiscais emitidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filtros e Busca */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ref, número, chave..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={documentsFilter}
                  onChange={(e) => setDocumentsFilter(e.target.value)}
                  className="flex h-10 w-full md:w-[200px] rounded-md border border-input bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2 text-sm"
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
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum documento fiscal encontrado</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Tipo</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Ref</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Número</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Chave</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Data</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
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
                            <tr key={doc.id} className="border-t hover:bg-muted/50">
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="uppercase">
                                  {doc.doc_type}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm font-mono text-xs">
                                {doc.ref}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  className={
                                    doc.status === 'autorizado' || doc.status === 'processado'
                                      ? 'bg-green-600'
                                      : doc.status === 'cancelado' || doc.status === 'erro'
                                      ? 'bg-red-600'
                                      : doc.status === 'submitted'
                                      ? 'bg-yellow-600'
                                      : 'bg-gray-600'
                                  }
                                >
                                  {doc.status || 'Pendente'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {doc.numero || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm font-mono text-xs">
                                {doc.chave ? (
                                  <span className="truncate block max-w-[200px]" title={doc.chave}>
                                    {doc.chave}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRefreshDocument(doc.id, doc.ref)}
                                    disabled={refreshingDoc === doc.id}
                                    title="Consultar status"
                                  >
                                    {refreshingDoc === doc.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-3 w-3" />
                                    )}
                                  </Button>
                                  {doc.xml_path && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDownloadFile(doc.xml_path!, `doc_${doc.ref}.xml`)}
                                      title="Download XML"
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {doc.pdf_path && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDownloadFile(doc.pdf_path!, `doc_${doc.ref}.pdf`)}
                                      title="Download PDF"
                                    >
                                      <FileText className="h-3 w-3" />
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
    </div>
  );
}

