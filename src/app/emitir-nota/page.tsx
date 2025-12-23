'use client';

import { useState, useEffect } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Send,
  Download,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EmissionResult {
  fiscal_document_id: string;
  ref: string;
  status: string;
  numero?: string;
  serie?: string;
  chave?: string;
  xml_url?: string;
  pdf_url?: string;
}

interface Item {
  id: string;
  numero_item: string;
  codigo_produto: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade_comercial: string;
  quantidade_comercial: string;
  valor_unitario_comercial: string;
  valor_bruto: string;
  icms_situacao_tributaria: string;
  icms_origem: string;
  pis_situacao_tributaria: string;
  cofins_situacao_tributaria: string;
}

export default function EmitirNotaPage() {
  const { user, tenant, loading: authLoading } = useSimpleAuth();
  const [emitting, setEmitting] = useState(false);
  const [docType, setDocType] = useState<'nfe' | 'nfce' | 'nfse'>('nfce');
  const [emissionResult, setEmissionResult] = useState<EmissionResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [checkingConfig, setCheckingConfig] = useState(false);

  // Dados do destinatário
  const [destinatario, setDestinatario] = useState({
    nome: '',
    cpf_cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    municipio: '',
    uf: '',
    cep: '',
    inscricao_estadual: '',
  });

  // Itens da nota
  const [items, setItems] = useState<Item[]>([
    {
      id: '1',
      numero_item: '1',
      codigo_produto: '',
      descricao: '',
      ncm: '00000000',
      cfop: '5102',
      unidade_comercial: 'UN',
      quantidade_comercial: '1',
      valor_unitario_comercial: '0.00',
      valor_bruto: '0.00',
      icms_situacao_tributaria: '102',
      icms_origem: '0',
      pis_situacao_tributaria: '07',
      cofins_situacao_tributaria: '07',
    }
  ]);

  // Dados da nota
  const [notaData, setNotaData] = useState({
    natureza_operacao: 'Venda de mercadorias',
    tipo_documento: '1',
    finalidade_emissao: '1',
    presenca_comprador: '1',
    consumidor_final: '1',
    forma_pagamento: '01', // 01 = Dinheiro
  });

  const addItem = () => {
    const newId = (items.length + 1).toString();
    setItems([...items, {
      id: newId,
      numero_item: newId,
      codigo_produto: '',
      descricao: '',
      ncm: '00000000',
      cfop: '5102',
      unidade_comercial: 'UN',
      quantidade_comercial: '1',
      valor_unitario_comercial: '0.00',
      valor_bruto: '0.00',
      icms_situacao_tributaria: '102',
      icms_origem: '0',
      pis_situacao_tributaria: '07',
      cofins_situacao_tributaria: '07',
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    } else {
      toast.error('É necessário ter pelo menos um item');
    }
  };

  const updateItem = (id: string, field: string, value: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Calcular valor bruto automaticamente
        if (field === 'quantidade_comercial' || field === 'valor_unitario_comercial') {
          const qtd = parseFloat(field === 'quantidade_comercial' ? value : updated.quantidade_comercial) || 0;
          const valor = parseFloat(field === 'valor_unitario_comercial' ? value : updated.valor_unitario_comercial) || 0;
          updated.valor_bruto = (qtd * valor).toFixed(2);
        }
        
        return updated;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const total = items.reduce((sum, item) => sum + parseFloat(item.valor_bruto || '0'), 0);
    return {
      valor_produtos: total.toFixed(2),
      valor_total: total.toFixed(2),
    };
  };

  const checkConfiguration = async () => {
    if (!tenant?.id) return;

    try {
      setCheckingConfig(true);
      const response = await fetch(`/next_api/fiscal/focusnfe/integration?tenant_id=${tenant.id}`);
      const result = await response.json();
      setConfigStatus(result.data);
    } catch (error) {
      console.error('Erro ao verificar configuração:', error);
      setConfigStatus(null);
    } finally {
      setCheckingConfig(false);
    }
  };

  useEffect(() => {
    if (tenant?.id) {
      checkConfiguration();
    }
  }, [tenant?.id]);

  const handleEmitirNota = async () => {
    // Validações
    if (!destinatario.nome) {
      toast.error('Nome do destinatário é obrigatório');
      return;
    }

    if (docType === 'nfe' && !destinatario.cpf_cnpj) {
      toast.error('CPF/CNPJ é obrigatório para NF-e');
      return;
    }

    if (docType === 'nfe' && (!destinatario.endereco || !destinatario.municipio || !destinatario.uf)) {
      toast.error('Endereço completo é obrigatório para NF-e');
      return;
    }

    // Validar itens
    for (const item of items) {
      if (!item.descricao) {
        toast.error(`Descrição do item ${item.numero_item} é obrigatória`);
        return;
      }
      if (parseFloat(item.quantidade_comercial) <= 0) {
        toast.error(`Quantidade do item ${item.numero_item} deve ser maior que zero`);
        return;
      }
      if (parseFloat(item.valor_unitario_comercial) <= 0) {
        toast.error(`Valor unitário do item ${item.numero_item} deve ser maior que zero`);
        return;
      }
    }

    if (!tenant?.id) {
      toast.error('Tenant não identificado');
      return;
    }

    try {
      setEmitting(true);

      const totals = calculateTotals();

      // Montar payload para FocusNFe
      const payload: any = {
        natureza_operacao: notaData.natureza_operacao,
        data_emissao: new Date().toISOString(),
        tipo_documento: notaData.tipo_documento,
        finalidade_emissao: notaData.finalidade_emissao,
        consumidor_final: notaData.consumidor_final,
        
        // Dados do destinatário
        nome: destinatario.nome,
        cpf_cnpj: destinatario.cpf_cnpj || undefined,
        email: destinatario.email || undefined,
        telefone: destinatario.telefone || undefined,
        
        // Itens
        items: items.map(item => ({
          numero_item: item.numero_item,
          codigo_produto: item.codigo_produto || undefined,
          descricao: item.descricao,
          cfop: item.cfop,
          ncm: item.ncm,
          unidade_comercial: item.unidade_comercial,
          quantidade_comercial: item.quantidade_comercial,
          valor_unitario_comercial: item.valor_unitario_comercial,
          valor_bruto: item.valor_bruto,
          icms_situacao_tributaria: item.icms_situacao_tributaria,
          icms_origem: item.icms_origem,
          pis_situacao_tributaria: item.pis_situacao_tributaria,
          cofins_situacao_tributaria: item.cofins_situacao_tributaria,
        })),

        // Totais
        valor_produtos: totals.valor_produtos,
        valor_total: totals.valor_total,

        // Forma de pagamento
        formas_pagamento: [
          {
            forma_pagamento: notaData.forma_pagamento,
            valor_pagamento: totals.valor_total,
          }
        ],
      };

      // Adicionar endereço se for NF-e
      if (docType === 'nfe') {
        payload.endereco = destinatario.endereco;
        payload.numero = destinatario.numero || 'S/N';
        payload.complemento = destinatario.complemento || undefined;
        payload.bairro = destinatario.bairro;
        payload.municipio = destinatario.municipio;
        payload.uf = destinatario.uf;
        payload.cep = destinatario.cep?.replace(/\D/g, '') || undefined;
        payload.inscricao_estadual = destinatario.inscricao_estadual || undefined;
        payload.presenca_comprador = notaData.presenca_comprador;
      }

      // Se for NFC-e, marcar presença do comprador como presencial
      if (docType === 'nfce') {
        payload.presenca_comprador = '1'; // Operação presencial
      }

      const requestBody = {
        tenant_id: tenant.id,
        doc_type: docType,
        payload: payload,
      };

      console.log('📤 Enviando para API:', requestBody);
      console.log('📄 Payload completo:', JSON.stringify(payload, null, 2));

      const response = await fetch('/next_api/fiscal/focusnfe/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      console.log('Resposta da API:', result);

      if (!response.ok) {
        // Extrair detalhes do erro do FocusNFe
        let errorMsg = result.error || 'Erro ao emitir nota fiscal';
        let errorType = 'generic';
        
        if (result.provider_error) {
          console.error('Erro do FocusNFe:', result.provider_error);
          
          // Tentar extrair mensagem de erro do provider
          if (result.provider_error.mensagem) {
            errorMsg = result.provider_error.mensagem;
          } else if (result.provider_error.erros && Array.isArray(result.provider_error.erros)) {
            // FocusNFe retorna erros em um array
            const erros = result.provider_error.erros.map((e: any) => 
              typeof e === 'string' ? e : e.mensagem || JSON.stringify(e)
            ).join('; ');
            errorMsg = `FocusNFe: ${erros}`;
          } else if (typeof result.provider_error === 'string') {
            errorMsg = result.provider_error;
          } else {
            errorMsg = `${errorMsg} - ${JSON.stringify(result.provider_error)}`;
          }
        }
        
        if (result.details) {
          errorMsg += ` | Detalhes: ${result.details}`;
        }
        
        // Detectar tipo de erro para mensagem específica
        if (errorMsg.toLowerCase().includes('cnpj') && errorMsg.toLowerCase().includes('não autorizado')) {
          errorType = 'cnpj_nao_autorizado';
        } else if (errorMsg.toLowerCase().includes('empresa não provisionada')) {
          errorType = 'empresa_nao_provisionada';
        }
        
        const error: any = new Error(errorMsg);
        error.type = errorType;
        throw error;
      }

      toast.success('Nota fiscal emitida com sucesso!');
      setEmissionResult(result.data);
      setShowResultDialog(true);

      // Limpar formulário
      setDestinatario({
        nome: '',
        cpf_cnpj: '',
        email: '',
        telefone: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        municipio: '',
        uf: '',
        cep: '',
        inscricao_estadual: '',
      });
      setItems([{
        id: '1',
        numero_item: '1',
        codigo_produto: '',
        descricao: '',
        ncm: '00000000',
        cfop: '5102',
        unidade_comercial: 'UN',
        quantidade_comercial: '1',
        valor_unitario_comercial: '0.00',
        valor_bruto: '0.00',
        icms_situacao_tributaria: '102',
        icms_origem: '0',
        pis_situacao_tributaria: '07',
        cofins_situacao_tributaria: '07',
      }]);

    } catch (error: any) {
      console.error('❌ Erro ao emitir nota:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorType = error?.type || 'generic';
      
      // Toast com erro específico e ações
      if (errorType === 'cnpj_nao_autorizado') {
        toast.error(
          <div className="space-y-2">
            <p className="font-semibold">⚠️ CNPJ do Emitente Não Autorizado</p>
            <p className="text-sm">{errorMessage}</p>
            <div className="pt-2 space-y-1 text-xs">
              <p className="font-medium">Soluções:</p>
              <p>1. Verifique se o CNPJ da empresa está correto em Perfil da Empresa</p>
              <p>2. Certifique-se de que a empresa foi provisionada</p>
              <p>3. O CNPJ do certificado deve ser igual ao CNPJ da empresa</p>
            </div>
            <button
              onClick={() => window.location.href = '/configuracao-fiscal'}
              className="mt-2 px-3 py-1 bg-white text-red-600 rounded text-sm font-medium hover:bg-gray-100"
            >
              Ir para Configuração Fiscal
            </button>
          </div>,
          {
            duration: 15000,
          }
        );
      } else if (errorType === 'empresa_nao_provisionada') {
        toast.error(
          <div className="space-y-2">
            <p className="font-semibold">⚠️ Empresa Não Provisionada</p>
            <p className="text-sm">A empresa precisa ser provisionada no FocusNFe antes de emitir notas.</p>
            <button
              onClick={() => window.location.href = '/configuracao-fiscal'}
              className="mt-2 px-3 py-1 bg-white text-red-600 rounded text-sm font-medium hover:bg-gray-100"
            >
              Provisionar Agora
            </button>
          </div>,
          {
            duration: 10000,
          }
        );
      } else {
        toast.error(
          <div className="space-y-1">
            <p className="font-semibold">Erro ao emitir nota fiscal</p>
            <p className="text-sm">{errorMessage}</p>
          </div>,
          {
            duration: 10000,
          }
        );
      }
    } finally {
      setEmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <TenantPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Emitir Nota Fiscal</h1>
              <p className="text-muted-foreground">
                Preencha os dados e emita NF-e, NFC-e ou NFS-e via FocusNFe
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Status de Configuração */}
          {configStatus && (
            <Card className={!configStatus.enabled || !configStatus.focus_empresa_id ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' : 'border-green-500 bg-green-50/50 dark:bg-green-900/10'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {configStatus.enabled && configStatus.focus_empresa_id ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <CardTitle>Status da Integração FocusNFe</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={checkConfiguration}
                    disabled={checkingConfig}
                  >
                    {checkingConfig ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Atualizar'
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    {configStatus.enabled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>Integração {configStatus.enabled ? 'Ativa' : 'Desativada'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {configStatus.api_token ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>Token {configStatus.api_token ? 'Configurado' : 'Não configurado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {configStatus.focus_empresa_id ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>Empresa {configStatus.focus_empresa_id ? 'Provisionada' : 'Não provisionada'}</span>
                  </div>
                </div>
                {(!configStatus.enabled || !configStatus.focus_empresa_id) && (
                  <div className="mt-4 bg-white dark:bg-gray-800 border rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                      ⚠️ Para emitir notas fiscais, você precisa:
                    </p>
                    <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 ml-2">
                      {!configStatus.api_token && <li>Configurar o token da API FocusNFe</li>}
                      {!configStatus.focus_empresa_id && <li>Enviar o certificado digital</li>}
                      {!configStatus.focus_empresa_id && <li>Provisionar a empresa na FocusNFe</li>}
                      {!configStatus.enabled && <li>Habilitar a integração</li>}
                    </ol>
                    <Button
                      onClick={() => window.location.href = '/configuracao-fiscal'}
                      variant="outline"
                      size="sm"
                      className="mt-3"
                    >
                      Ir para Configuração Fiscal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tipo de Documento */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Documento</CardTitle>
              <CardDescription>Selecione o tipo de nota fiscal a ser emitida</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                {/* NFC-e */}
                <button
                  type="button"
                  onClick={() => setDocType('nfce')}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    docType === 'nfce'
                      ? 'border-primary bg-primary text-primary-foreground shadow-lg scale-105'
                      : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-lg font-semibold">NFC-e</span>
                    {docType === 'nfce' && (
                      <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                    )}
                  </div>
                  <p className={`text-sm ${docType === 'nfce' ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                    Consumidor - Varejo
                  </p>
                  {docType === 'nfce' && (
                    <div className="absolute inset-0 rounded-lg ring-4 ring-primary/20 pointer-events-none"></div>
                  )}
                </button>

                {/* NF-e */}
                <button
                  type="button"
                  onClick={() => setDocType('nfe')}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    docType === 'nfe'
                      ? 'border-primary bg-primary text-primary-foreground shadow-lg scale-105'
                      : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-lg font-semibold">NF-e</span>
                    {docType === 'nfe' && (
                      <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                    )}
                  </div>
                  <p className={`text-sm ${docType === 'nfe' ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                    Completa - Dados completos
                  </p>
                  {docType === 'nfe' && (
                    <div className="absolute inset-0 rounded-lg ring-4 ring-primary/20 pointer-events-none"></div>
                  )}
                </button>

                {/* NFS-e */}
                <button
                  type="button"
                  onClick={() => setDocType('nfse')}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    docType === 'nfse'
                      ? 'border-primary bg-primary text-primary-foreground shadow-lg scale-105'
                      : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-lg font-semibold">NFS-e</span>
                    {docType === 'nfse' && (
                      <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                    )}
                  </div>
                  <p className={`text-sm ${docType === 'nfse' ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                    Serviço - Prestação
                  </p>
                  {docType === 'nfse' && (
                    <div className="absolute inset-0 rounded-lg ring-4 ring-primary/20 pointer-events-none"></div>
                  )}
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="text-2xl">
                    {docType === 'nfce' && '📱'}
                    {docType === 'nfe' && '📄'}
                    {docType === 'nfse' && '🔧'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      {docType === 'nfce' && 'NFC-e - Nota Fiscal de Consumidor Eletrônica'}
                      {docType === 'nfe' && 'NF-e - Nota Fiscal Eletrônica'}
                      {docType === 'nfse' && 'NFS-e - Nota Fiscal de Serviço Eletrônica'}
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {docType === 'nfce' && 'Para vendas no varejo com menos requisitos de dados do cliente'}
                      {docType === 'nfe' && 'Para vendas que exigem dados completos do destinatário'}
                      {docType === 'nfse' && 'Para prestação de serviços'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="destinatario" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="destinatario">Destinatário</TabsTrigger>
              <TabsTrigger value="itens">Itens</TabsTrigger>
              <TabsTrigger value="dados-nota">Dados da Nota</TabsTrigger>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
            </TabsList>

            {/* ABA: DESTINATÁRIO */}
            <TabsContent value="destinatario">
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Destinatário</CardTitle>
                  <CardDescription>Informações do cliente que receberá a nota fiscal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="nome">
                        Nome/Razão Social<span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="nome"
                        value={destinatario.nome}
                        onChange={(e) => setDestinatario({ ...destinatario, nome: e.target.value })}
                        placeholder="Nome completo ou razão social"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpf_cnpj">
                        CPF/CNPJ{docType === 'nfe' && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        id="cpf_cnpj"
                        value={destinatario.cpf_cnpj}
                        onChange={(e) => setDestinatario({ ...destinatario, cpf_cnpj: e.target.value })}
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                      <Input
                        id="inscricao_estadual"
                        value={destinatario.inscricao_estadual}
                        onChange={(e) => setDestinatario({ ...destinatario, inscricao_estadual: e.target.value })}
                        placeholder="000.000.000.000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={destinatario.email}
                        onChange={(e) => setDestinatario({ ...destinatario, email: e.target.value })}
                        placeholder="cliente@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={destinatario.telefone}
                        onChange={(e) => setDestinatario({ ...destinatario, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  {docType === 'nfe' && (
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-semibold">Endereço (obrigatório para NF-e)</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="endereco">
                            Logradouro<span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="endereco"
                            value={destinatario.endereco}
                            onChange={(e) => setDestinatario({ ...destinatario, endereco: e.target.value })}
                            placeholder="Rua, Avenida, etc."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="numero">Número<span className="text-red-500">*</span></Label>
                          <Input
                            id="numero"
                            value={destinatario.numero}
                            onChange={(e) => setDestinatario({ ...destinatario, numero: e.target.value })}
                            placeholder="123 ou S/N"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="complemento">Complemento</Label>
                          <Input
                            id="complemento"
                            value={destinatario.complemento}
                            onChange={(e) => setDestinatario({ ...destinatario, complemento: e.target.value })}
                            placeholder="Apto, Sala, etc."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bairro">Bairro<span className="text-red-500">*</span></Label>
                          <Input
                            id="bairro"
                            value={destinatario.bairro}
                            onChange={(e) => setDestinatario({ ...destinatario, bairro: e.target.value })}
                            placeholder="Centro"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cep">CEP</Label>
                          <Input
                            id="cep"
                            value={destinatario.cep}
                            onChange={(e) => setDestinatario({ ...destinatario, cep: e.target.value })}
                            placeholder="00000-000"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="municipio">Município<span className="text-red-500">*</span></Label>
                          <Input
                            id="municipio"
                            value={destinatario.municipio}
                            onChange={(e) => setDestinatario({ ...destinatario, municipio: e.target.value })}
                            placeholder="São Paulo"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="uf">UF<span className="text-red-500">*</span></Label>
                          <Input
                            id="uf"
                            value={destinatario.uf}
                            onChange={(e) => setDestinatario({ ...destinatario, uf: e.target.value.toUpperCase() })}
                            placeholder="SP"
                            maxLength={2}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA: ITENS */}
            <TabsContent value="itens">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Itens da Nota Fiscal</CardTitle>
                      <CardDescription>Produtos ou serviços a serem incluídos na nota</CardDescription>
                    </div>
                    <Button onClick={addItem} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <Badge>Item {item.numero_item}</Badge>
                        {items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Código do Produto</Label>
                          <Input
                            value={item.codigo_produto}
                            onChange={(e) => updateItem(item.id, 'codigo_produto', e.target.value)}
                            placeholder="SKU ou código"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>
                            Descrição<span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={item.descricao}
                            onChange={(e) => updateItem(item.id, 'descricao', e.target.value)}
                            placeholder="Descrição do produto ou serviço"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>NCM</Label>
                          <Input
                            value={item.ncm}
                            onChange={(e) => updateItem(item.id, 'ncm', e.target.value)}
                            placeholder="00000000"
                            maxLength={8}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>CFOP<span className="text-red-500">*</span></Label>
                          <select
                            value={item.cfop}
                            onChange={(e) => updateItem(item.id, 'cfop', e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                          >
                            <option value="5102">5102 - Venda de mercadoria</option>
                            <option value="5405">5405 - Venda de serviço</option>
                            <option value="5101">5101 - Venda de produção própria</option>
                            <option value="5403">5403 - Venda de serviço não sujeito ao ISSQN</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Unidade</Label>
                          <Input
                            value={item.unidade_comercial}
                            onChange={(e) => updateItem(item.id, 'unidade_comercial', e.target.value)}
                            placeholder="UN, KG, PC"
                            maxLength={6}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Quantidade<span className="text-red-500">*</span></Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.quantidade_comercial}
                            onChange={(e) => updateItem(item.id, 'quantidade_comercial', e.target.value)}
                            placeholder="1.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Valor Unitário<span className="text-red-500">*</span></Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.valor_unitario_comercial}
                            onChange={(e) => updateItem(item.id, 'valor_unitario_comercial', e.target.value)}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Valor Total</Label>
                          <Input
                            value={item.valor_bruto}
                            readOnly
                            className="bg-gray-100 dark:bg-gray-800"
                          />
                        </div>
                      </div>

                      <details className="text-sm">
                        <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                          Configurações Fiscais
                        </summary>
                        <div className="grid md:grid-cols-4 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label>ICMS Origem</Label>
                            <select
                              value={item.icms_origem}
                              onChange={(e) => updateItem(item.id, 'icms_origem', e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                            >
                              <option value="0">0 - Nacional</option>
                              <option value="1">1 - Estrangeira</option>
                              <option value="2">2 - Estrangeira (adq. mercado interno)</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label>ICMS CST</Label>
                            <select
                              value={item.icms_situacao_tributaria}
                              onChange={(e) => updateItem(item.id, 'icms_situacao_tributaria', e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                            >
                              <option value="102">102 - Simples Nacional s/ permissão crédito</option>
                              <option value="103">103 - Isenção do ICMS</option>
                              <option value="300">300 - Imune</option>
                              <option value="400">400 - Não tributada</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label>PIS CST</Label>
                            <select
                              value={item.pis_situacao_tributaria}
                              onChange={(e) => updateItem(item.id, 'pis_situacao_tributaria', e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                            >
                              <option value="07">07 - Isenta da contribuição</option>
                              <option value="01">01 - Tributável (alíquota normal)</option>
                              <option value="06">06 - Tributável (alíquota zero)</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label>COFINS CST</Label>
                            <select
                              value={item.cofins_situacao_tributaria}
                              onChange={(e) => updateItem(item.id, 'cofins_situacao_tributaria', e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                            >
                              <option value="07">07 - Isenta da contribuição</option>
                              <option value="01">01 - Tributável (alíquota normal)</option>
                              <option value="06">06 - Tributável (alíquota zero)</option>
                            </select>
                          </div>
                        </div>
                      </details>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA: DADOS DA NOTA */}
            <TabsContent value="dados-nota">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Nota Fiscal</CardTitle>
                  <CardDescription>Informações complementares da nota</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="natureza_operacao">Natureza da Operação</Label>
                      <Input
                        id="natureza_operacao"
                        value={notaData.natureza_operacao}
                        onChange={(e) => setNotaData({ ...notaData, natureza_operacao: e.target.value })}
                        placeholder="Venda de mercadorias"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                      <select
                        id="forma_pagamento"
                        value={notaData.forma_pagamento}
                        onChange={(e) => setNotaData({ ...notaData, forma_pagamento: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                      >
                        <option value="01">01 - Dinheiro</option>
                        <option value="03">03 - Cartão de Crédito</option>
                        <option value="04">04 - Cartão de Débito</option>
                        <option value="17">17 - PIX</option>
                        <option value="15">15 - Boleto Bancário</option>
                        <option value="99">99 - Outros</option>
                      </select>
                    </div>

                    {docType === 'nfe' && (
                      <div className="space-y-2">
                        <Label htmlFor="presenca_comprador">Presença do Comprador</Label>
                        <select
                          id="presenca_comprador"
                          value={notaData.presenca_comprador}
                          onChange={(e) => setNotaData({ ...notaData, presenca_comprador: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                        >
                          <option value="1">1 - Operação presencial</option>
                          <option value="2">2 - Operação não presencial (Internet)</option>
                          <option value="3">3 - Operação não presencial (Teleatendimento)</option>
                          <option value="4">4 - Operação não presencial (Outros)</option>
                          <option value="9">9 - Operação não presencial (Outros)</option>
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="finalidade_emissao">Finalidade da Emissão</Label>
                      <select
                        id="finalidade_emissao"
                        value={notaData.finalidade_emissao}
                        onChange={(e) => setNotaData({ ...notaData, finalidade_emissao: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                      >
                        <option value="1">1 - NF-e normal</option>
                        <option value="2">2 - NF-e complementar</option>
                        <option value="3">3 - NF-e de ajuste</option>
                        <option value="4">4 - Devolução de mercadoria</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA: RESUMO */}
            <TabsContent value="resumo">
              <Card className="bg-white dark:bg-gray-900">
                <CardHeader className="border-b-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold">
                        {docType === 'nfe' && 'NOTA FISCAL ELETRÔNICA'}
                        {docType === 'nfce' && 'NFC-e - NOTA FISCAL DE CONSUMIDOR ELETRÔNICA'}
                        {docType === 'nfse' && 'NOTA FISCAL DE SERVIÇOS ELETRÔNICA'}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">Confira os dados antes de emitir</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-base px-4 py-2">
                      {docType.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 p-6">
                  {/* Emitente */}
                  <div className="border-2 border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                    <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">EMITENTE</h3>
                    <div className="space-y-1 text-sm">
                      <p className="font-bold text-lg">{tenant?.name || 'Empresa'}</p>
                      {tenant?.document && (
                        <p className="text-sm">
                          <span className="font-semibold">CNPJ:</span> {tenant.document}
                        </p>
                      )}
                      {tenant?.address && (
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          {tenant.address}, {tenant.city}/{tenant.state}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Destinatário */}
                  <div className="border-2 border-gray-300 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">DESTINATÁRIO / REMETENTE</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="col-span-2">
                        <span className="font-semibold">Nome/Razão Social:</span> {destinatario.nome || '-'}
                      </div>
                      {destinatario.cpf_cnpj && (
                        <div>
                          <span className="font-semibold">CPF/CNPJ:</span> {destinatario.cpf_cnpj}
                        </div>
                      )}
                      {destinatario.inscricao_estadual && (
                        <div>
                          <span className="font-semibold">Inscrição Estadual:</span> {destinatario.inscricao_estadual}
                        </div>
                      )}
                      {destinatario.email && (
                        <div className="col-span-2">
                          <span className="font-semibold">E-mail:</span> {destinatario.email}
                        </div>
                      )}
                      {destinatario.telefone && (
                        <div>
                          <span className="font-semibold">Telefone:</span> {destinatario.telefone}
                        </div>
                      )}
                      {docType === 'nfe' && destinatario.endereco && (
                        <div className="col-span-2">
                          <span className="font-semibold">Endereço:</span> {destinatario.endereco}, {destinatario.numero}
                          {destinatario.complemento && ` - ${destinatario.complemento}`}
                          {' - '}{destinatario.bairro}
                        </div>
                      )}
                      {docType === 'nfe' && destinatario.municipio && (
                        <div>
                          <span className="font-semibold">Município:</span> {destinatario.municipio}/{destinatario.uf}
                        </div>
                      )}
                      {docType === 'nfe' && destinatario.cep && (
                        <div>
                          <span className="font-semibold">CEP:</span> {destinatario.cep}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dados da Nota */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="border border-gray-300 dark:border-gray-700 rounded p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">NATUREZA DA OPERAÇÃO</p>
                      <p className="font-medium mt-1">{notaData.natureza_operacao || 'Venda de Mercadorias'}</p>
                    </div>
                    <div className="border border-gray-300 dark:border-gray-700 rounded p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">FORMA DE PAGAMENTO</p>
                      <p className="font-medium mt-1">
                        {notaData.forma_pagamento === '01' && 'Dinheiro'}
                        {notaData.forma_pagamento === '03' && 'Cartão de Crédito'}
                        {notaData.forma_pagamento === '04' && 'Cartão de Débito'}
                        {notaData.forma_pagamento === '17' && 'PIX'}
                        {notaData.forma_pagamento === '15' && 'Boleto Bancário'}
                        {notaData.forma_pagamento === '99' && 'Outros'}
                      </p>
                    </div>
                    <div className="border border-gray-300 dark:border-gray-700 rounded p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">FINALIDADE</p>
                      <p className="font-medium mt-1">
                        {notaData.finalidade_emissao === '1' && 'NF-e Normal'}
                        {notaData.finalidade_emissao === '2' && 'NF-e Complementar'}
                        {notaData.finalidade_emissao === '3' && 'NF-e de Ajuste'}
                        {notaData.finalidade_emissao === '4' && 'Devolução'}
                      </p>
                    </div>
                  </div>

                  {/* Tabela de Itens */}
                  <div className="border-2 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-700">
                      <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300">DADOS DOS PRODUTOS / SERVIÇOS</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-700">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-xs">CÓDIGO</th>
                            <th className="px-3 py-2 text-left font-semibold text-xs">DESCRIÇÃO</th>
                            <th className="px-3 py-2 text-center font-semibold text-xs">NCM</th>
                            <th className="px-3 py-2 text-center font-semibold text-xs">CFOP</th>
                            <th className="px-3 py-2 text-center font-semibold text-xs">UN</th>
                            <th className="px-3 py-2 text-right font-semibold text-xs">QTDE</th>
                            <th className="px-3 py-2 text-right font-semibold text-xs">VL. UNIT.</th>
                            <th className="px-3 py-2 text-right font-semibold text-xs">VL. TOTAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={item.id} className={`border-b border-gray-200 dark:border-gray-700 ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
                              <td className="px-3 py-2 font-mono text-xs">{item.codigo_produto || '-'}</td>
                              <td className="px-3 py-2">{item.descricao || 'Sem descrição'}</td>
                              <td className="px-3 py-2 text-center font-mono text-xs">{item.ncm || '-'}</td>
                              <td className="px-3 py-2 text-center font-mono text-xs">{item.cfop}</td>
                              <td className="px-3 py-2 text-center">{item.unidade_comercial}</td>
                              <td className="px-3 py-2 text-right">{item.quantidade_comercial}</td>
                              <td className="px-3 py-2 text-right">R$ {item.valor_unitario_comercial}</td>
                              <td className="px-3 py-2 text-right font-semibold">R$ {item.valor_bruto}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cálculo do Imposto */}
                  <div className="border-2 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-700">
                      <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300">CÁLCULO DO IMPOSTO</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-4 p-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Base de Cálculo do ICMS</p>
                        <p className="font-semibold">R$ 0,00</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Valor do ICMS</p>
                        <p className="font-semibold">R$ 0,00</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Base de Cálculo do ICMS ST</p>
                        <p className="font-semibold">R$ 0,00</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Valor do ICMS ST</p>
                        <p className="font-semibold">R$ 0,00</p>
                      </div>
                    </div>
                  </div>

                  {/* Totais */}
                  <div className="border-2 border-gray-900 dark:border-gray-100 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-base">
                        <span className="font-semibold">Total dos Produtos:</span>
                        <span className="font-bold text-green-600">R$ {totals.valor_produtos}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-semibold">Valor do Frete:</span>
                        <span className="font-semibold">R$ 0,00</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-semibold">Valor do Seguro:</span>
                        <span className="font-semibold">R$ 0,00</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-semibold">Desconto:</span>
                        <span className="font-semibold">R$ 0,00</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-semibold">Outras Despesas:</span>
                        <span className="font-semibold">R$ 0,00</span>
                      </div>
                      <div className="border-t-2 border-gray-900 dark:border-gray-100 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xl">TOTAL DA NOTA:</span>
                          <span className="font-bold text-2xl text-primary">R$ {totals.valor_total}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Emissão */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleEmitirNota}
                      disabled={emitting || !destinatario.nome || items.length === 0}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg"
                      size="lg"
                    >
                      {emitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Emitindo Nota Fiscal...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Emitir {docType.toUpperCase()}
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                          Atenção antes de emitir:
                        </p>
                        <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
                          <li>Verifique se a integração FocusNFe está configurada</li>
                          <li>Certifique-se de que todos os dados estão corretos</li>
                          <li>Após a emissão, a nota não pode ser alterada, apenas cancelada</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal de Resultado */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              Nota Fiscal Emitida com Sucesso!
            </DialogTitle>
            <DialogDescription>
              A nota fiscal foi enviada para processamento no FocusNFe
            </DialogDescription>
          </DialogHeader>
          
          {emissionResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Referência</Label>
                  <p className="font-mono text-sm">{emissionResult.ref}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Badge className="bg-yellow-600">{emissionResult.status}</Badge>
                </div>
                {emissionResult.numero && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Número</Label>
                    <p className="font-medium">{emissionResult.numero}</p>
                  </div>
                )}
                {emissionResult.serie && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Série</Label>
                    <p className="font-medium">{emissionResult.serie}</p>
                  </div>
                )}
                {emissionResult.chave && (
                  <div className="space-y-1 col-span-2">
                    <Label className="text-sm text-muted-foreground">Chave de Acesso</Label>
                    <p className="font-mono text-xs break-all">{emissionResult.chave}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                {emissionResult.xml_url && (
                  <Button
                    onClick={() => window.open(emissionResult.xml_url, '_blank')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download XML
                  </Button>
                )}
                {emissionResult.pdf_url && (
                  <Button
                    onClick={() => window.open(emissionResult.pdf_url, '_blank')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                )}
                <Button
                  onClick={() => window.location.href = '/configuracao-fiscal'}
                  variant="default"
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Documentos
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      A nota fiscal foi enviada para processamento. Você pode acompanhar o status na página de Configuração Fiscal, na aba "Documentos". 
                      O processamento pode levar alguns minutos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowResultDialog(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setShowResultDialog(false);
              window.location.reload();
            }}>
              Emitir Nova Nota
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TenantPageWrapper>
  );
}

