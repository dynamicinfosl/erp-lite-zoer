'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import {
  identifyBackupFile,
  BACKUP_FILE_LABELS,
  BackupFileKey,
  DISPLAY_KEYS,
  IMPORTED_KEYS,
} from '@/lib/migration/backup-files';
import {
  runMigration,
  sortParts,
  STEP_LABELS,
  STEP_ORDER,
  type BatchResult,
  type Row,
  type SourceFile,
  type StepKey,
  type StepTotals,
} from '@/lib/migration/runner';
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

type FilesByKey = Partial<Record<BackupFileKey, SourceFile<File>[]>>;

interface StepState {
  step: StepKey;
  label: string;
  status: 'idle' | 'running' | 'success' | 'error' | 'skipped';
  phase: string;
  totals: StepTotals | null;
}

function emptySteps(): StepState[] {
  return STEP_ORDER.map((step) => ({
    step,
    label: STEP_LABELS[step],
    status: 'idle' as const,
    phase: '',
    totals: null,
  }));
}

const numberFmt = new Intl.NumberFormat('pt-BR');

export default function MigrarPage() {
  const { tenant, user, loading: authLoading } = useSimpleAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [scanSummary, setScanSummary] = useState<string>('');
  const [ignoredFiles, setIgnoredFiles] = useState<string[]>([]);

  const [filesByKey, setFilesByKey] = useState<FilesByKey>({});
  const [steps, setSteps] = useState<StepState[]>(emptySteps());
  const [openErrors, setOpenErrors] = useState<Record<string, boolean>>({});

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;

    setIsScanning(true);
    setScanSummary('');
    setIgnoredFiles([]);
    setSteps(emptySteps());

    try {
      const next: FilesByKey = {};
      const ignored: string[] = [];
      let matched = 0;

      // A varredura apenas classifica os arquivos pelo nome. As planilhas são
      // lidas uma a uma durante a importação — o backup pode ter centenas de
      // partes e mais de um milhão de linhas.
      for (const file of Array.from(filesList)) {
        const key = identifyBackupFile(file.name);
        if (!key) {
          if (/\.(xlsx|xls|csv)$/i.test(file.name)) ignored.push(file.name);
          continue;
        }
        if (!next[key]) next[key] = [];
        next[key]!.push({ key, name: file.name, handle: file });
        matched++;
      }

      for (const key of Object.keys(next) as BackupFileKey[]) {
        next[key] = sortParts(next[key]!);
      }

      setFilesByKey(next);
      setIgnoredFiles(ignored);

      const categorias = Object.keys(next).length;
      setScanSummary(
        `${matched} planilha(s) reconhecida(s) em ${categorias} categoria(s).` +
          (ignored.length > 0 ? ` ${ignored.length} arquivo(s) ignorado(s).` : '')
      );
      toast.success(`${matched} planilhas identificadas com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao varrer a pasta:', err);
      toast.error('Não foi possível ler a pasta selecionada.');
    } finally {
      setIsScanning(false);
    }
  };

  const triggerFolderSelect = () => fileInputRef.current?.click();

  const patchStep = (step: StepKey, patch: Partial<StepState>) => {
    setSteps((prev) => prev.map((s) => (s.step === step ? { ...s, ...patch } : s)));
  };

  const executeImport = async () => {
    if (!tenant) {
      toast.error('Nenhum tenant carregado. Faça login novamente.');
      return;
    }

    setIsImporting(true);
    setSteps(emptySteps());

    const XLSX = await import('xlsx');
    try {
      const report = await runMigration<File>(filesByKey, {
        async readRows(file) {
          const buffer = await file.handle.arrayBuffer();
          const wb = XLSX.read(buffer, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          if (!ws) return [];
          return XLSX.utils.sheet_to_json(ws, { defval: null }) as Row[];
        },

        async postBatch(step, data, reset): Promise<BatchResult> {
          const response = await fetch('/next_api/migration/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenant_id: tenant.id,
              user_id: user?.id,
              step,
              reset,
              data,
            }),
          });
          const resBody = await response.json().catch(() => ({}));
          if (!response.ok || !resBody?.success) {
            throw new Error(resBody?.error || `Falha HTTP ${response.status}`);
          }
          return resBody.result as BatchResult;
        },

        onProgress(step, totals, phase) {
          patchStep(step, {
            status: phase === 'concluído' ? (totals.failed > 0 ? 'error' : 'success') : 'running',
            phase,
            totals: { ...totals, errors: [...totals.errors] },
          });
        },

        onStepSkipped(step) {
          patchStep(step, { status: 'skipped', phase: 'sem arquivo correspondente' });
        },
      });

      const stepTotals = Object.values(report).filter(Boolean) as StepTotals[];
      const gravados = stepTotals.reduce((acc, t) => acc + t.inserted + t.updated, 0);
      const rejeitados = stepTotals.reduce((acc, t) => acc + t.failed, 0);
      if (rejeitados > 0) {
        toast.error(
          `Importação finalizada: ${numberFmt.format(gravados)} registros gravados, ` +
            `${numberFmt.format(rejeitados)} rejeitados. Confira os erros abaixo.`
        );
      } else {
        toast.success(`Importação concluída: ${numberFmt.format(gravados)} registros gravados.`);
      }
    } catch (err: any) {
      console.error('Erro na importação:', err);
      setSteps((prev) =>
        prev.map((s) =>
          s.status === 'running'
            ? {
                ...s,
                status: 'error',
                phase: 'interrompido',
                totals: s.totals
                  ? { ...s.totals, errors: [...s.totals.errors, err.message || String(err)] }
                  : null,
              }
            : s
        )
      );
      toast.error(`Importação interrompida: ${err.message || String(err)}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleRollback = async () => {
    if (!tenant) {
      toast.error('Nenhum tenant carregado. Faça login novamente.');
      return;
    }

    const confirmRollback = window.confirm(
      'Atenção: isso excluirá permanentemente os clientes, produtos, vendas, itens, ' +
        'transações financeiras e notas fiscais que vieram da migração de backup. ' +
        'Produtos importados por planilha na tela de Produtos também são removidos. Deseja continuar?'
    );
    if (!confirmRollback) return;

    setIsRollingBack(true);

    try {
      const response = await fetch(`/next_api/migration/import?tenant_id=${tenant.id}`, {
        method: 'DELETE',
      });

      const resBody = await response.json();

      if (response.ok && resBody.success) {
        const r = resBody.result;
        toast.success(
          `Limpeza concluída: ${numberFmt.format(r.sales)} vendas, ${numberFmt.format(
            r.sale_items
          )} itens, ${numberFmt.format(r.products)} produtos, ${numberFmt.format(
            r.customers
          )} clientes, ${numberFmt.format(r.finance)} transações e ${numberFmt.format(
            r.fiscal
          )} notas.`
        );
        setSteps(emptySteps());
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

  const hasMinData = useMemo(
    () => IMPORTED_KEYS.some((k) => (filesByKey[k]?.length || 0) > 0),
    [filesByKey]
  );

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
              Escolha a pasta principal do backup descompactado. O sistema reconhece as planilhas
              mesmo divididas em várias partes (<code>vendas_1.xlsx</code>, <code>vendas_2.xlsx</code>…)
              e soma todas elas.
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
            {ignoredFiles.length > 0 && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 max-w-lg">
                Ignorados: {ignoredFiles.slice(0, 6).join(', ')}
                {ignoredFiles.length > 6 ? ` e mais ${ignoredFiles.length - 6}` : ''}
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
              {DISPLAY_KEYS.map((key) => {
                const parts = filesByKey[key] || [];
                const found = parts.length > 0;
                const isMandatory = ['clientes', 'produtos', 'vendas'].includes(key);
                const isImported = IMPORTED_KEYS.includes(key);

                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                      found
                        ? isImported
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/60'
                          : 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/60'
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
                        {found
                          ? parts.length === 1
                            ? parts[0].name
                            : `${parts[0].name} … ${parts[parts.length - 1].name}`
                          : `Esperado: ${key}.xlsx`}
                      </span>
                    </div>

                    <div className="flex items-center">
                      {found ? (
                        <div className="text-right">
                          <Badge
                            className={`${
                              isImported ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-500'
                            } text-white rounded-lg text-xs py-0.5`}
                          >
                            {isImported ? 'Detectado' : 'Sem destino'}
                          </Badge>
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-1">
                            {parts.length === 1 ? '1 arquivo' : `${parts.length} arquivos`}
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
              <CardDescription>
                Acompanhe o processamento de cada módulo do ERP. Se a importação for interrompida,
                basta executá-la de novo: os registros já gravados são ignorados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {steps.map((s) => {
                  const totals = s.totals;
                  const progress =
                    totals && totals.filesTotal > 0
                      ? Math.min(100, Math.round((totals.filesDone / totals.filesTotal) * 100))
                      : 0;

                  return (
                    <div key={s.step} className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {s.status === 'running' && <Loader2 className="h-4.5 w-4.5 animate-spin text-blue-500" />}
                          {s.status === 'success' && <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />}
                          {s.status === 'error' && <AlertCircle className="h-4.5 w-4.5 text-rose-500" />}
                          {s.status === 'skipped' && <AlertCircle className="h-4.5 w-4.5 text-gray-400" />}
                          {s.status === 'idle' && (
                            <div className="h-4.5 w-4.5 rounded-full border border-gray-300 dark:border-gray-700" />
                          )}
                          <span className="font-semibold text-sm">{s.label}</span>
                        </div>
                        <div className="text-right">
                          {s.status === 'running' && (
                            <span className="text-xs text-blue-500 font-semibold animate-pulse">
                              {s.phase || 'Gravando...'}
                            </span>
                          )}
                          {s.status === 'success' && <span className="text-xs text-emerald-500 font-semibold">Sucesso</span>}
                          {s.status === 'error' && <span className="text-xs text-rose-500 font-semibold">Falha</span>}
                          {s.status === 'skipped' && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              Pulado (sem arquivo)
                            </span>
                          )}
                          {s.status === 'idle' && <span className="text-xs text-gray-400 font-medium">Aguardando</span>}
                        </div>
                      </div>

                      {s.status === 'running' && (
                        <>
                          <Progress value={progress} className="h-2 bg-blue-50 dark:bg-blue-950" />
                          {totals && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {totals.filesDone}/{totals.filesTotal} arquivos ·{' '}
                              {numberFmt.format(totals.rowsRead)} linhas lidas ·{' '}
                              {numberFmt.format(totals.inserted)} gravadas
                            </p>
                          )}
                        </>
                      )}

                      {totals && (
                        <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-3 border border-gray-100 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
                          <div>
                            <span className="text-gray-500 block">Lidos</span>
                            <span className="font-bold text-sm text-gray-700 dark:text-gray-300">
                              {numberFmt.format(totals.rowsRead)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Inseridos</span>
                            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                              {numberFmt.format(totals.inserted)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Atualizados</span>
                            <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                              {numberFmt.format(totals.updated)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Ignorados</span>
                            <span className="font-bold text-sm text-gray-500">
                              {numberFmt.format(totals.skipped)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Erros</span>
                            <span
                              className={`font-bold text-sm ${
                                totals.failed > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'
                              }`}
                            >
                              {numberFmt.format(totals.failed)}
                            </span>
                          </div>
                        </div>
                      )}

                      {totals && totals.errors.length > 0 && (
                        <div className="space-y-1.5">
                          <button
                            onClick={() => toggleErrors(s.step)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                          >
                            {openErrors[s.step] ? (
                              <>
                                <ChevronUp className="h-3 w-3" /> Ocultar erros ({totals.errors.length})
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" /> Mostrar erros ({totals.errors.length})
                              </>
                            )}
                          </button>
                          {openErrors[s.step] && (
                            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-lg p-2.5 max-h-40 overflow-y-auto font-mono text-[10px] text-rose-700 dark:text-rose-300 space-y-1">
                              {totals.errors.map((err, i) => (
                                <p
                                  key={i}
                                  className="leading-relaxed border-b border-rose-100/50 dark:border-rose-900/20 pb-1 last:border-0 last:pb-0"
                                >
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
