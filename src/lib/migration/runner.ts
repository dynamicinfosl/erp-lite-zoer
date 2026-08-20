// Orquestra a migração do backup do Gestão Click em fluxo (streaming).
//
// O backup real tem ~614 planilhas e mais de 1,2 milhão de linhas. Carregar tudo
// na memória e mandar num único POST estoura o navegador e o timeout da rota.
// Aqui cada arquivo é lido, convertido e enviado em lotes, e a memória é liberada
// em seguida — só ficam residentes dois índices compactos (forma de pagamento e
// situação por pedido), necessários para montar o cabeçalho das vendas.
//
// A leitura das planilhas e o envio HTTP entram por injeção (`RunnerIO`), de modo
// que a tela /migrar e os scripts de validação executem exatamente o mesmo código.

import type { BackupFileKey } from './backup-files';
import { cleanString, normalizeText, parseBrazilianDate } from './parsers';

export type Row = Record<string, any>;

export type StepKey = 'customers' | 'products' | 'sales' | 'sale_items' | 'finance' | 'fiscal';

export const STEP_LABELS: Record<StepKey, string> = {
  customers: 'Clientes & Endereços',
  products: 'Cadastro de Produtos',
  sales: 'Vendas (pedidos)',
  sale_items: 'Itens das Vendas',
  finance: 'Financeiro (Contas a Receber/Pagar)',
  fiscal: 'Histórico de Notas Fiscais',
};

export const STEP_ORDER: StepKey[] = [
  'customers',
  'products',
  'sales',
  'sale_items',
  'finance',
  'fiscal',
];

export interface BatchResult {
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface StepTotals extends BatchResult {
  rowsRead: number;
  filesDone: number;
  filesTotal: number;
}

/** Um arquivo do backup já classificado. `handle` é repassado ao leitor. */
export interface SourceFile<H = unknown> {
  key: BackupFileKey;
  name: string;
  handle: H;
}

export interface RunnerIO<H = unknown> {
  /** Lê todas as linhas de uma planilha do backup. */
  readRows(file: SourceFile<H>): Promise<Row[]>;
  /** Envia um lote para /next_api/migration/import. */
  postBatch(step: StepKey, data: any, reset: boolean): Promise<BatchResult>;
  /** Chamado sempre que os totais de uma etapa mudam. */
  onProgress(step: StepKey, totals: StepTotals, phase: string): void;
  /** Chamado quando uma etapa é pulada por não haver arquivo correspondente. */
  onStepSkipped?(step: StepKey): void;
}

/** Quantas linhas por requisição. Itens e financeiro toleram lotes maiores. */
const BATCH_SIZES: Record<StepKey, number> = {
  customers: 500,
  products: 500,
  sales: 500,
  sale_items: 1000,
  finance: 1000,
  fiscal: 200,
};

const MAX_ERRORS_PER_STEP = 20;

/** Separador interno dos indices em memoria; nunca aparece nos dados do backup. */
const SEP = '\u0001';

/**
 * Ordena as partes numericamente: vendas_2.xlsx antes de vendas_10.xlsx.
 * A ordem lexicográfica quebraria a continuidade dos itens por pedido.
 */
export function sortParts<H>(files: SourceFile<H>[]): SourceFile<H>[] {
  const partOf = (name: string): number => {
    const m = String(name)
      .toLowerCase()
      .replace(/\.(xlsx|xls|csv)$/, '')
      .match(/_(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  };
  return [...files].sort((a, b) => {
    const d = partOf(a.name) - partOf(b.name);
    return d !== 0 ? d : a.name.localeCompare(b.name);
  });
}

function newTotals(filesTotal = 0): StepTotals {
  return {
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    rowsRead: 0,
    filesDone: 0,
    filesTotal,
  };
}

function mergeBatch(totals: StepTotals, batch: BatchResult) {
  totals.inserted += batch.inserted || 0;
  totals.updated += batch.updated || 0;
  totals.skipped += batch.skipped || 0;
  totals.failed += batch.failed || 0;
  for (const e of batch.errors || []) {
    if (totals.errors.length < MAX_ERRORS_PER_STEP && !totals.errors.includes(e)) {
      totals.errors.push(e);
    }
  }
}

/** Nº do pedido de uma linha de venda/item/pagamento/histórico. */
function pedidoOf(row: Row): string | null {
  return (
    cleanString(row['Nº do pedido']) ??
    cleanString(row['N do pedido']) ??
    cleanString(row['Numero do pedido']) ??
    cleanString(row['Número do pedido']) ??
    null
  );
}

export interface RunOptions {
  /** Só executa estas etapas (padrão: todas). */
  only?: StepKey[];
}

export type RunReport = Record<StepKey, StepTotals | null>;

export async function runMigration<H>(
  filesByKey: Partial<Record<BackupFileKey, SourceFile<H>[]>>,
  io: RunnerIO<H>,
  options: RunOptions = {}
): Promise<RunReport> {
  const enabled = (s: StepKey) => !options.only || options.only.includes(s);
  const get = (k: BackupFileKey): SourceFile<H>[] => sortParts(filesByKey[k] || []);

  const report: RunReport = {
    customers: null,
    products: null,
    sales: null,
    sale_items: null,
    finance: null,
    fiscal: null,
  };

  // --------------------------------------------------------------------------
  // 1. CLIENTES
  // --------------------------------------------------------------------------
  if (enabled('customers')) {
    const clienteFiles = get('clientes');
    if (clienteFiles.length === 0) {
      io.onStepSkipped?.('customers');
    } else {
      const totals = newTotals(clienteFiles.length);
      report.customers = totals;

      // Endereços costumam ser 1 linha por cliente — cabem na memória de uma vez.
      const addrByCode = new Map<string, Row>();
      for (const f of get('clientes_enderecos')) {
        for (const row of await io.readRows(f)) {
          const code = cleanString(row['Código'] ?? row['Codigo']);
          if (code && !addrByCode.has(code)) addrByCode.set(code, row);
        }
      }
      io.onProgress('customers', totals, 'endereços carregados');

      let first = true;
      let buffer: Row[] = [];
      const flush = async () => {
        if (buffer.length === 0) return;
        const enderecos: Row[] = [];
        for (const c of buffer) {
          const code = cleanString(c['Codigo'] ?? c['Código']);
          const addr = code ? addrByCode.get(code) : undefined;
          if (addr) enderecos.push(addr);
        }
        const batch = await io.postBatch('customers', { clientes: buffer, enderecos }, first);
        first = false;
        mergeBatch(totals, batch);
        buffer = [];
        io.onProgress('customers', totals, 'gravando clientes');
      };

      for (const f of clienteFiles) {
        const rows = await io.readRows(f);
        totals.rowsRead += rows.length;
        for (const row of rows) {
          buffer.push(row);
          if (buffer.length >= BATCH_SIZES.customers) await flush();
        }
        totals.filesDone++;
        io.onProgress('customers', totals, `lendo ${f.name}`);
      }
      await flush();
      addrByCode.clear();
      io.onProgress('customers', totals, 'concluído');
    }
  }

  // --------------------------------------------------------------------------
  // 2. PRODUTOS
  // --------------------------------------------------------------------------
  if (enabled('products')) {
    const produtoFiles = get('produtos');
    if (produtoFiles.length === 0) {
      io.onStepSkipped?.('products');
    } else {
      const totals = newTotals(produtoFiles.length);
      report.products = totals;

      let first = true;
      let buffer: Row[] = [];
      const flush = async () => {
        if (buffer.length === 0) return;
        const batch = await io.postBatch('products', { produtos: buffer }, first);
        first = false;
        mergeBatch(totals, batch);
        buffer = [];
        io.onProgress('products', totals, 'gravando produtos');
      };

      for (const f of produtoFiles) {
        const rows = await io.readRows(f);
        totals.rowsRead += rows.length;
        for (const row of rows) {
          buffer.push(row);
          if (buffer.length >= BATCH_SIZES.products) await flush();
        }
        totals.filesDone++;
        io.onProgress('products', totals, `lendo ${f.name}`);
      }
      await flush();
      io.onProgress('products', totals, 'concluído');
    }
  }

  // --------------------------------------------------------------------------
  // 3. VENDAS (cabeçalho)
  // --------------------------------------------------------------------------
  const vendaFiles = get('vendas');
  if (enabled('sales')) {
    if (vendaFiles.length === 0) {
      io.onStepSkipped?.('sales');
    } else {
      const pagamentoFiles = get('vendas_pagamentos');
      const historicoFiles = get('vendas_historicos');
      const totals = newTotals(vendaFiles.length + pagamentoFiles.length + historicoFiles.length);
      report.sales = totals;

      // Índice 1: forma de pagamento e nº de parcelas por pedido.
      // Guardado como "<parcelas>\u0001<forma>" para não criar 155 mil objetos.
      const pagamentoByPedido = new Map<string, string>();
      for (const f of pagamentoFiles) {
        const rows = await io.readRows(f);
        for (const row of rows) {
          const ped = pedidoOf(row);
          if (!ped) continue;
          const forma = cleanString(row['Forma de pagamento']) || '';
          const prev = pagamentoByPedido.get(ped);
          if (prev === undefined) {
            pagamentoByPedido.set(ped, `1${SEP}${forma}`);
          } else {
            const sep = prev.indexOf(SEP);
            const n = parseInt(prev.slice(0, sep), 10) + 1;
            pagamentoByPedido.set(ped, `${n}${SEP}${prev.slice(sep + 1) || forma}`);
          }
        }
        totals.filesDone++;
        io.onProgress('sales', totals, `lendo pagamentos (${f.name})`);
      }

      // Índice 2: situação mais recente por pedido ("<iso>\u0001<situação>").
      // Um cancelamento em qualquer ponto do histórico prevalece.
      const situacaoByPedido = new Map<string, string>();
      const canceladas = new Set<string>();
      for (const f of historicoFiles) {
        const rows = await io.readRows(f);
        for (const row of rows) {
          const ped = pedidoOf(row);
          if (!ped) continue;
          const sit = cleanString(row['Situação'] ?? row['Situacao']) || '';
          if (normalizeText(sit).includes('cancel')) canceladas.add(ped);
          const iso = parseBrazilianDate(row['Data']) || '';
          const prev = situacaoByPedido.get(ped);
          if (prev === undefined || iso >= prev.slice(0, prev.indexOf(SEP))) {
            situacaoByPedido.set(ped, `${iso}${SEP}${sit}`);
          }
        }
        totals.filesDone++;
        io.onProgress('sales', totals, `lendo históricos (${f.name})`);
      }

      // O mesmo nº de pedido aparece repetido em alguns backups, referindo vendas
      // diferentes. Em vez de descartar, a 2ª ocorrência vira MIG-<pedido>-2.
      const seenPedido = new Map<string, number>();

      let first = true;
      let buffer: Row[] = [];
      const flush = async () => {
        if (buffer.length === 0) return;
        const batch = await io.postBatch('sales', { vendas: buffer }, first);
        first = false;
        mergeBatch(totals, batch);
        buffer = [];
        io.onProgress('sales', totals, 'gravando vendas');
      };

      for (const f of vendaFiles) {
        const rows = await io.readRows(f);
        totals.rowsRead += rows.length;
        for (const row of rows) {
          const ped = pedidoOf(row);
          if (!ped) {
            totals.skipped++;
            continue;
          }
          const occurrence = (seenPedido.get(ped) || 0) + 1;
          seenPedido.set(ped, occurrence);

          const pag = pagamentoByPedido.get(ped);
          const sep = pag ? pag.indexOf(SEP) : -1;

          row.__sale_number = occurrence === 1 ? `MIG-${ped}` : `MIG-${ped}-${occurrence}`;
          row.__parcelas = pag ? parseInt(pag.slice(0, sep), 10) : 0;
          row.__forma = pag ? pag.slice(sep + 1) : null;
          row.__situacao = canceladas.has(ped)
            ? 'Cancelada'
            : (situacaoByPedido.get(ped) || '').split(SEP)[1] || null;

          buffer.push(row);
          if (buffer.length >= BATCH_SIZES.sales) await flush();
        }
        totals.filesDone++;
        io.onProgress('sales', totals, `lendo ${f.name}`);
      }
      await flush();

      pagamentoByPedido.clear();
      situacaoByPedido.clear();
      canceladas.clear();
      seenPedido.clear();
      io.onProgress('sales', totals, 'concluído');
    }
  }

  // --------------------------------------------------------------------------
  // 4. ITENS DAS VENDAS
  // --------------------------------------------------------------------------
  if (enabled('sale_items')) {
    const itemFiles = get('vendas_produtos');
    const servicoFiles = get('vendas_servicos');
    if (itemFiles.length === 0 && servicoFiles.length === 0) {
      io.onStepSkipped?.('sale_items');
    } else {
      const totals = newTotals(itemFiles.length + servicoFiles.length);
      report.sale_items = totals;

      // Serviços vêm em arquivo separado; são reinseridos junto dos produtos do
      // mesmo pedido para que o lote continue completo por pedido.
      const servicosByPedido = new Map<string, Row[]>();
      for (const f of servicoFiles) {
        for (const row of await io.readRows(f)) {
          const ped = pedidoOf(row);
          if (!ped) continue;
          if (!servicosByPedido.has(ped)) servicosByPedido.set(ped, []);
          servicosByPedido.get(ped)!.push(row);
        }
        totals.filesDone++;
        io.onProgress('sale_items', totals, `lendo ${f.name}`);
      }

      let first = true;
      let buffer: Row[] = [];
      const flush = async () => {
        if (buffer.length === 0) return;
        const batch = await io.postBatch('sale_items', { itens: buffer }, first);
        first = false;
        mergeBatch(totals, batch);
        buffer = [];
        io.onProgress('sale_items', totals, 'gravando itens');
      };

      // Um pedido nunca é dividido entre dois lotes: o lote só fecha quando o
      // pedido muda. Isso mantém a etapa idempotente ao ser reexecutada.
      let lastPedido: string | null = null;
      const push = (row: Row, ped: string) => {
        row.__sale_number = `MIG-${ped}`;
        buffer.push(row);
        lastPedido = ped;
      };

      for (const f of itemFiles) {
        const rows = await io.readRows(f);
        totals.rowsRead += rows.length;
        for (const row of rows) {
          const ped = pedidoOf(row);
          if (!ped) {
            totals.skipped++;
            continue;
          }
          if (buffer.length >= BATCH_SIZES.sale_items && ped !== lastPedido) await flush();
          push(row, ped);

          const servicos = servicosByPedido.get(ped);
          if (servicos) {
            for (const s of servicos) push(s, ped);
            servicosByPedido.delete(ped);
            totals.rowsRead += servicos.length;
          }
        }
        totals.filesDone++;
        io.onProgress('sale_items', totals, `lendo ${f.name}`);
      }

      // Serviços de pedidos que não têm nenhum produto.
      for (const [ped, servicos] of servicosByPedido.entries()) {
        if (buffer.length >= BATCH_SIZES.sale_items && ped !== lastPedido) await flush();
        for (const s of servicos) push(s, ped);
        totals.rowsRead += servicos.length;
      }
      servicosByPedido.clear();

      await flush();
      io.onProgress('sale_items', totals, 'concluído');
    }
  }

  // --------------------------------------------------------------------------
  // 5. FINANCEIRO
  // --------------------------------------------------------------------------
  if (enabled('finance')) {
    const receberFiles = get('contas_receber');
    const pagarFiles = get('contas_pagar');
    if (receberFiles.length === 0 && pagarFiles.length === 0) {
      io.onStepSkipped?.('finance');
    } else {
      const totals = newTotals(receberFiles.length + pagarFiles.length);
      report.finance = totals;

      let first = true;
      const runGroup = async (files: SourceFile<H>[], tipo: 'receita' | 'despesa') => {
        // `offset` é o índice global da linha; é o que torna a chave de
        // deduplicação estável entre execuções (o legado não exporta id).
        let offset = 0;
        let buffer: Row[] = [];
        const flush = async () => {
          if (buffer.length === 0) return;
          const batch = await io.postBatch(
            'finance',
            { contas: buffer, tipo, offset: offset - buffer.length },
            first
          );
          first = false;
          mergeBatch(totals, batch);
          buffer = [];
          io.onProgress('finance', totals, `gravando ${tipo}`);
        };

        for (const f of files) {
          const rows = await io.readRows(f);
          totals.rowsRead += rows.length;
          for (const row of rows) {
            buffer.push(row);
            offset++;
            if (buffer.length >= BATCH_SIZES.finance) await flush();
          }
          totals.filesDone++;
          io.onProgress('finance', totals, `lendo ${f.name}`);
        }
        await flush();
      };

      await runGroup(receberFiles, 'receita');
      await runGroup(pagarFiles, 'despesa');
      io.onProgress('finance', totals, 'concluído');
    }
  }

  // --------------------------------------------------------------------------
  // 6. NOTAS FISCAIS
  // --------------------------------------------------------------------------
  if (enabled('fiscal')) {
    const notaFiles = get('notas_fiscais');
    if (notaFiles.length === 0) {
      io.onStepSkipped?.('fiscal');
    } else {
      const totals = newTotals(notaFiles.length);
      report.fiscal = totals;

      const byNota = async (keys: BackupFileKey) => {
        const map = new Map<string, Row[]>();
        for (const f of get(keys)) {
          for (const row of await io.readRows(f)) {
            const num = cleanString(row['Nota fiscal nº'] ?? row['Nota fiscal n']);
            if (!num) continue;
            if (!map.has(num)) map.set(num, []);
            map.get(num)!.push(row);
          }
        }
        return map;
      };
      const produtosMap = await byNota('notas_fiscais_produtos');
      const pagamentosMap = await byNota('notas_fiscais_pagamentos');

      let first = true;
      let buffer: Row[] = [];
      const flush = async () => {
        if (buffer.length === 0) return;
        const notasProdutos: Row[] = [];
        const notasPagamentos: Row[] = [];
        for (const n of buffer) {
          const num = cleanString(n['Número'] ?? n['Numero']);
          if (!num) continue;
          notasProdutos.push(...(produtosMap.get(num) || []));
          notasPagamentos.push(...(pagamentosMap.get(num) || []));
        }
        const batch = await io.postBatch(
          'fiscal',
          { notas: buffer, notasProdutos, notasPagamentos },
          first
        );
        first = false;
        mergeBatch(totals, batch);
        buffer = [];
        io.onProgress('fiscal', totals, 'gravando notas');
      };

      for (const f of notaFiles) {
        const rows = await io.readRows(f);
        totals.rowsRead += rows.length;
        for (const row of rows) {
          buffer.push(row);
          if (buffer.length >= BATCH_SIZES.fiscal) await flush();
        }
        totals.filesDone++;
        io.onProgress('fiscal', totals, `lendo ${f.name}`);
      }
      await flush();
      produtosMap.clear();
      pagamentosMap.clear();
      io.onProgress('fiscal', totals, 'concluído');
    }
  }

  return report;
}
