'use client';

import React, { useState, useRef } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { identifyBackupFile, BACKUP_FILE_LABELS, BackupFileKey } from '@/lib/migration/backup-files';
import { toast } from 'react-hot-toast';
import {
  FolderOpen,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  FileSpreadsheet,
  Play,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ParsedFile {
  key: BackupFileKey;
  fileName: string;
  rowCount: number;
  data: any[];
}

interface StepStatus {
  step: 'customers' | 'products' | 'sales' | 'finance' | 'fiscal';
  label: string;
  status: 'idle' | 'running' | 'success' | 'error' | 'skipped';
  progress: number;
  result?: {
    inserted: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: string[];
  };
}

export default function MigrarPage() {
  const { tenant, user, loading: authLoading } = useSimpleAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [scanSummary, setScanSummary] = useState<string>('');

  const [parsedFiles, setParsedFiles] = useState<Record<BackupFileKey, ParsedFile | null>>({
    clientes: null,
    clientes_enderecos: null,
    produtos: null,
    vendas: null,
    vendas_produtos: null,
    vendas_pagamentos: null,
    vendas_historicos: null,
    contas_receber: null,
    notas_fiscais: null,
    notas_fiscais_produtos: null,
    notas_fiscais_pagamentos: null,
  });

  const [steps, setSteps] = useState<StepStatus[]>([
    { step: 'customers', label: 'Clientes & Endereços', status: 'idle', progress: 0 },
    { step: 'products', label: 'Cadastro de Produtos', status: 'idle', progress: 0 },
    { step: 'sales', label: 'Vendas & Itens/Pagamentos/Histórico', status: 'idle', progress: 0 },
    { step: 'finance', label: 'Financeiro (Contas a Receber)', status: 'idle', progress: 0 },
    { step: 'fiscal', label: 'Histórico de Notas Fiscais', status: 'idle', progress: 0 },
  ]);

  const [openErrors, setOpenErrors] = useState<Record<string, boolean>>({});

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;

    setIsScanning(true);
    setScanSummary('');
    const files = Array.from(filesList);

    // Reset previous states
    const newParsedFiles: Record<BackupFileKey, ParsedFile | null> = {
      clientes: null,
      clientes_enderecos: null,
      produtos: null,
      vendas: null,
      vendas_produtos: null,
      vendas_pagamentos: null,
      vendas_historicos: null,
      contas_receber: null,
      notas_fiscais: null,
      notas_fiscais_produtos: null,
      notas_fiscais_pagamentos: null,
    };

    try {
      const XLSX = await import('xlsx');
      let matchedCount = 0;

      for (const file of files) {
        const key = identifyBackupFile(file.name);
        if (!key) continue;

        try {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(ws, { defval: null });

          newParsedFiles[key] = {
            key,
            fileName: file.name,
            rowCount: json.length,
            data: json,
          };
          matchedCount++;
        } catch (err: any) {
          console.error(`Erro ao ler arquivo ${file.name}:`, err);
          toast.error(`Erro ao ler ${file.name}: ${err.message}`);
        }
      }

      setParsedFiles(newParsedFiles);
      setScanSummary(`Varredura concluída. Encontrados ${matchedCount} arquivos válidos de backup.`);
      toast.success(`${matchedCount} planilhas identificadas com sucesso!`);
    } catch (err: any) {
      console.error('Erro na importação da lib XLSX:', err);
      toast.error('Não foi possível carregar a biblioteca de planilhas.');
    } finally {
      setIsScanning(false);
    }
  };

  const triggerFolderSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const executeImport = async () => {
    if (!tenant) {
      toast.error('Nenhum tenant carregado. Faça login novamente.');
      return;
    }

    setIsImporting(true);

    // Reset steps
    const updatedSteps = steps.map((s) => ({
      ...s,
      status: 'idle' as const,
      progress: 0,
      result: undefined,
    }));
    setSteps(updatedSteps);

    const runStep = async (index: number) => {
      if (index >= steps.length) {
        setIsImporting(false);
        toast.success('Processamento do backup finalizado!');
        return;
      }

      const stepConfig = steps[index];
      let requestData: any = {};
      let hasData = false;

      // Monta os payloads baseados na etapa
      if (stepConfig.step === 'customers') {
        requestData = {
          clientes: parsedFiles.clientes?.data || [],
          enderecos: parsedFiles.clientes_enderecos?.data || [],
        };
        hasData = requestData.clientes.length > 0;
      } else if (stepConfig.step === 'products') {
        requestData = {
          produtos: parsedFiles.produtos?.data || [],
        };
        hasData = requestData.produtos.length > 0;
      } else if (stepConfig.step === 'sales') {
        requestData = {
          vendas: parsedFiles.vendas?.data || [],
          itens: parsedFiles.vendas_produtos?.data || [],
          pagamentos: parsedFiles.vendas_pagamentos?.data || [],
          historicos: parsedFiles.vendas_historicos?.data || [],
        };
        hasData = requestData.vendas.length > 0;
      } else if (stepConfig.step === 'finance') {
        requestData = {
          contas: parsedFiles.contas_receber?.data || [],
        };
        hasData = requestData.contas.length > 0;
      } else if (stepConfig.step === 'fiscal') {
        requestData = {
          notas: parsedFiles.notas_fiscais?.data || [],
          notasProdutos: parsedFiles.notas_fiscais_produtos?.data || [],
          notasPagamentos: parsedFiles.notas_fiscais_pagamentos?.data || [],
        };
        hasData = requestData.notas.length > 0;
      }

      // Se não há dados, pula a etapa
      if (!hasData) {
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === index
              ? {
                  ...s,
                  status: 'skipped' as const,
                  progress: 100,
                  result: { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [] },
                }
              : s
          )
        );
        runStep(index + 1);
        return;
      }

      // Inicia etapa
      setSteps((prev) =>
        prev.map((s, idx) => (idx === index ? { ...s, status: 'running' as const, progress: 40 } : s))
      );

      try {
        const response = await fetch('/next_api/migration/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenant.id,
            user_id: user?.id,
            step: stepConfig.step,
            data: requestData,
          }),
        });

        const resBody = await response.json();

        if (response.ok && resBody.success) {
          const result = resBody.result;
          setSteps((prev) =>
            prev.map((s, idx) =>
              idx === index ? { ...s, status: 'success' as const, progress: 100, result } : s
            )
          );
        } else {
          throw new Error(resBody.error || 'Erro na requisição');
        }
      } catch (err: any) {
        console.error(`Erro na etapa ${stepConfig.step}:`, err);
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === index
              ? {
                  ...s,
                  status: 'error' as const,
                  progress: 100,
                  result: {
                    inserted: 0,
                    updated: 0,
                    skipped: 0,
                    failed: 0,
                    errors: [err.message || String(err)],
                  },
                }
              : s
          )
        );
      }

      runStep(index + 1);
    };

    runStep(0);
  };

  const handleRollback = async () => {
    if (!tenant) {
      toast.error('Nenhum tenant carregado. Faça login novamente.');
      return;
    }

    const confirmRollback = window.confirm(
      'Atenção: Isso excluirá permanentemente todos os clientes, produtos, vendas, transações financeiras e notas fiscais importadas via migração de backup. Deseja continuar?'
    );
    if (!confirmRollback) return;

    setIsRollingBack(true);

    try {
      const response = await fetch(`/next_api/migration/import?tenant_id=${tenant.id}`, {
        method: 'DELETE',
      });

      const resBody = await response.json();

      if (response.ok && resBody.success) {
        const result = resBody.result;
        toast.success(
          `Limpeza concluída! Removidos: ${result.sales} vendas, ${result.products} produtos, ${result.customers} clientes, ${result.finance} transações e ${result.fiscal} notas.`
        );

        // Reset progress steps
        setSteps(steps.map((s) => ({ ...s, status: 'idle', progress: 0, result: undefined })));
      } else {
        throw new Error(resBody.error || 'Erro ao desfazer migração');
      }
    } catch (err: any) {
      console.error('Erro ao desfazer migração:', err);
      toast.error(`Erro ao desfazer: ${err.message || String(err)}`);
    } finally {
      setIsRollingBack(false);
    }
  };

  const toggleErrors = (stepKey: string) => {
    setOpenErrors((prev) => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  // Verificar se há pelo menos um arquivo obrigatório detectado
  const hasMinData = parsedFiles.clientes || parsedFiles.produtos || parsedFiles.vendas || parsedFiles.contas_receber || parsedFiles.notas_fiscais;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header da Página */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Migração de Dados</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Importe de forma automatizada o backup de planilhas exportadas do Gestão Click para sua conta atual.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl px-4 py-2">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="text-xs">
              <p className="font-semibold text-blue-800 dark:text-blue-300">Empresa Ativa</p>
              <p className="text-blue-600 dark:text-blue-400 truncate max-w-[200px]">{tenant?.name || 'Carregando...'}</p>
            </div>
          </div>
        </div>

        {/* Zona de Upload */}
        <Card className="border-dashed border-2 border-gray-300 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-400 transition bg-white dark:bg-gray-900 shadow-sm">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFolderSelect}
              className="hidden"
              multiple
              {...({
                webkitdirectory: '',
                directory: '',
              } as any)}
            />
            <div className="h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
              <UploadCloud className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Selecionar Pasta do Backup</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mb-5">
              Escolha a pasta principal do backup descompactado. O sistema irá rastrear os 11 arquivos `.xlsx` esperados (clientes, produtos, vendas, pagamentos, etc.).
            </p>
            <Button
              onClick={triggerFolderSelect}
              disabled={isScanning || isImporting}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow px-6 py-2"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando arquivos...
                </>
              ) : (
                <>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Escolher Pasta de Backup
                </>
              )}
            </Button>
            {scanSummary && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-4 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                {scanSummary}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Painel de Arquivos Mapeados */}
        <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-gray-500" />
              Arquivos de Backup Mapeados
            </CardTitle>
            <CardDescription>
              Status de detecção das planilhas na pasta fornecida.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(BACKUP_FILE_LABELS) as BackupFileKey[]).map((key) => {
                const file = parsedFiles[key];
                const isMandatory = ['clientes', 'produtos', 'vendas'].includes(key);

                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                      file
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/60'
                        : 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate block">{BACKUP_FILE_LABELS[key]}</span>
                        {isMandatory && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1 border-amber-300 dark:border-amber-900 text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/10">
                            Requerido
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 block truncate">
                        {file ? file.fileName : `Esperado: ${key}.xlsx`}
                      </span>
                    </div>

                    <div className="flex items-center">
                      {file ? (
                        <div className="text-right">
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white rounded-lg text-xs py-0.5">
                            Detectado
                          </Badge>
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-1">
                            {file.rowCount} linhas
                          </span>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-xs">
                          Ausente
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-between items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleRollback}
                disabled={isImporting || isScanning || isRollingBack}
                className="border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl px-6 py-3 font-semibold"
              >
                {isRollingBack ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Limpando dados...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5 mr-2" />
                    Desfazer Importação
                  </>
                )}
              </Button>

              <Button
                size="lg"
                onClick={executeImport}
                disabled={!hasMinData || isImporting || isScanning || isRollingBack}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg px-8 py-3 flex items-center gap-2 font-semibold"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Migrando Dados...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 fill-current" />
                    Iniciar Importação
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Painel de Execução & Progresso */}
        {(isImporting || steps.some((s) => s.status !== 'idle')) && (
          <Card className="bg-white dark:bg-gray-900 shadow-md border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Progresso da Migração</CardTitle>
              <CardDescription>Acompanhe o processamento de cada módulo do ERP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {steps.map((s) => {
                  return (
                    <div key={s.step} className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {s.status === 'running' && (
                            <Loader2 className="h-4.5 w-4.5 animate-spin text-blue-500" />
                          )}
                          {s.status === 'success' && (
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                          )}
                          {s.status === 'error' && (
                            <AlertCircle className="h-4.5 w-4.5 text-rose-500" />
                          )}
                          {s.status === 'skipped' && (
                            <AlertCircle className="h-4.5 w-4.5 text-gray-400" />
                          )}
                          {s.status === 'idle' && (
                            <div className="h-4.5 w-4.5 rounded-full border border-gray-300 dark:border-gray-700" />
                          )}
                          <span className="font-semibold text-sm">{s.label}</span>
                        </div>
                        <div>
                          {s.status === 'running' && (
                            <span className="text-xs text-blue-500 font-semibold animate-pulse">Gravando...</span>
                          )}
                          {s.status === 'success' && (
                            <span className="text-xs text-emerald-500 font-semibold">Sucesso</span>
                          )}
                          {s.status === 'error' && (
                            <span className="text-xs text-rose-500 font-semibold">Falha</span>
                          )}
                          {s.status === 'skipped' && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pulado (sem arquivo)</span>
                          )}
                          {s.status === 'idle' && (
                            <span className="text-xs text-gray-400 font-medium">Aguardando</span>
                          )}
                        </div>
                      </div>

                      {s.status === 'running' && <Progress value={s.progress} className="h-2 bg-blue-50 dark:bg-blue-950" />}

                      {s.result && (
                        <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-3 border border-gray-100 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                          <div>
                            <span className="text-gray-500 block">Inseridos</span>
                            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{s.result.inserted}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Atualizados</span>
                            <span className="font-bold text-sm text-blue-600 dark:text-blue-400">{s.result.updated}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Ignorados</span>
                            <span className="font-bold text-sm text-gray-500">{s.result.skipped}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Erros</span>
                            <span className={`font-bold text-sm ${s.result.failed > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'}`}>
                              {s.result.failed}
                            </span>
                          </div>
                        </div>
                      )}

                      {s.result && s.result.errors && s.result.errors.length > 0 && (
                        <div className="space-y-1.5">
                          <button
                            onClick={() => toggleErrors(s.step)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                          >
                            {openErrors[s.step] ? (
                              <>
                                <ChevronUp className="h-3 w-3" /> Ocultar erros ({s.result.errors.length})
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" /> Mostrar erros ({s.result.errors.length})
                              </>
                            )}
                          </button>
                          {openErrors[s.step] && (
                            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-lg p-2.5 max-h-40 overflow-y-auto font-mono text-[10px] text-rose-700 dark:text-rose-300 space-y-1">
                              {s.result.errors.map((err, i) => (
                                <p key={i} className="leading-relaxed border-b border-rose-100/50 dark:border-rose-900/20 pb-1 last:border-0 last:pb-0">
                                  {err}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
