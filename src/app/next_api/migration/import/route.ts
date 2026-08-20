import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  parseBrazilianPrice,
  parseBrazilianDate,
  onlyDigits,
  normalizeText,
  parseBoolean,
  cleanString,
  fitVarchar,
  mapPaymentMethod,
  mapSaleStatus,
  mapFinanceStatus,
  parseState,
} from '@/lib/migration/parsers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const DEFAULT_USER = '00000000-0000-0000-0000-000000000000';

/** Tamanho do lote enviado ao Postgres em cada INSERT. */
const DB_CHUNK = 500;
/** Tamanho de página ao ler tabelas grandes (limite do PostgREST é 1000). */
const PAGE = 1000;
/** Quantos erros distintos devolver por lote (evita respostas gigantes). */
const MAX_ERRORS = 20;

type Row = Record<string, any>;

interface StepResult {
  step: string;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

function emptyResult(step: string): StepResult {
  return { step, inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [] };
}

function pushError(res: StepResult, message: string) {
  if (res.errors.length < MAX_ERRORS && !res.errors.includes(message)) {
    res.errors.push(message);
  }
}

// Acessa valor de uma linha tentando chave exata e depois normalizada (sem acento/caixa).
function makeGetter(row: Row) {
  const normMap: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    normMap[normalizeText(k)] = v;
  }
  return (...keys: string[]): any => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
        return row[key];
      }
      const nk = normalizeText(key);
      if (normMap[nk] !== undefined && normMap[nk] !== null && String(normMap[nk]).trim() !== '') {
        return normMap[nk];
      }
    }
    return null;
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Lê uma tabela inteira paginando com .range().
 * Sem isso o PostgREST devolve no máximo 1000 linhas silenciosamente — era o que
 * fazia o vínculo venda→cliente falhar em bases com mais de 1000 clientes.
 */
async function fetchAll(table: string, columns: string, tenantId: string): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(columns)
      .eq('tenant_id', tenantId)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const rows = (data || []) as unknown as Row[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

/** Busca em lotes os valores de `column` que já existem (para deduplicar). */
async function fetchExistingValues(
  table: string,
  column: string,
  tenantId: string,
  values: string[]
): Promise<Set<string>> {
  const found = new Set<string>();
  const unique = [...new Set(values.filter(Boolean))];
  for (const part of chunk(unique, 300)) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(column)
      .eq('tenant_id', tenantId)
      .in(column, part);
    if (error) throw new Error(`${table}.${column}: ${error.message}`);
    for (const r of data || []) {
      const v = (r as Row)[column];
      if (v !== null && v !== undefined) found.add(String(v));
    }
  }
  return found;
}

/**
 * Insere um bloco; se ele for rejeitado, divide ao meio e tenta de novo até
 * isolar a(s) linha(s) problemática(s). Assim uma única linha inválida não
 * derruba as outras 499 do lote, e o custo é logarítmico em vez de linear.
 */
async function insertBlock(
  table: string,
  rows: Row[],
  res: StepResult,
  describe: (row: Row) => string
): Promise<void> {
  if (rows.length === 0) return;

  const { error, count } = await supabaseAdmin.from(table).insert(rows, { count: 'exact' });
  if (!error) {
    res.inserted += count ?? rows.length;
    return;
  }
  if (rows.length === 1) {
    res.failed++;
    pushError(res, `${describe(rows[0])}: ${error.message}`);
    return;
  }

  const mid = Math.floor(rows.length / 2);
  await insertBlock(table, rows.slice(0, mid), res, describe);
  await insertBlock(table, rows.slice(mid), res, describe);
}

async function insertRows(
  table: string,
  rows: Row[],
  res: StepResult,
  describe: (row: Row) => string
): Promise<void> {
  for (const part of chunk(rows, DB_CHUNK)) {
    await insertBlock(table, part, res, describe);
  }
}

// ----------------------------------------------------------------------------
// Índices em memória (reaproveitados entre os lotes de uma mesma execução)
// ----------------------------------------------------------------------------
interface TenantCache {
  at: number;
  customerByName?: Map<string, number>;
  productByName?: Map<string, number>;
  productBySku?: Map<string, number>;
  productCostById?: Map<number, number>;
  /** Vendas que ja receberam itens nesta execucao (ver importSaleItems). */
  itemsWrittenFor?: Set<number>;
}

const caches = new Map<string, TenantCache>();
const CACHE_TTL = 10 * 60 * 1000;

function getCache(tenantId: string, reset: boolean): TenantCache {
  const now = Date.now();
  const current = caches.get(tenantId);
  if (reset || !current || now - current.at > CACHE_TTL) {
    const fresh: TenantCache = { at: now };
    caches.set(tenantId, fresh);
    return fresh;
  }
  return current;
}

async function getCustomerIndex(tenantId: string, cache: TenantCache): Promise<Map<string, number>> {
  if (cache.customerByName) return cache.customerByName;
  const rows = await fetchAll('customers', 'id, name', tenantId);
  const byName = new Map<string, number>();
  for (const c of rows) {
    const key = normalizeText(c.name);
    if (key && !byName.has(key)) byName.set(key, Number(c.id));
  }
  cache.customerByName = byName;
  return byName;
}

async function getProductIndex(tenantId: string, cache: TenantCache) {
  if (cache.productByName && cache.productBySku && cache.productCostById) {
    return {
      byName: cache.productByName,
      bySku: cache.productBySku,
      costById: cache.productCostById,
    };
  }
  const rows = await fetchAll('products', 'id, name, sku, cost_price', tenantId);
  const byName = new Map<string, number>();
  const bySku = new Map<string, number>();
  const costById = new Map<number, number>();
  for (const p of rows) {
    const id = Number(p.id);
    const nameKey = normalizeText(p.name);
    if (nameKey && !byName.has(nameKey)) byName.set(nameKey, id);
    const skuKey = String(p.sku ?? '').trim().toLowerCase();
    if (skuKey && !bySku.has(skuKey)) bySku.set(skuKey, id);
    costById.set(id, Number(p.cost_price) || 0);
  }
  cache.productByName = byName;
  cache.productBySku = bySku;
  cache.productCostById = costById;
  return { byName, bySku, costById };
}

// ----------------------------------------------------------------------------
// CLIENTES
// ----------------------------------------------------------------------------
async function importCustomers(tenantId: string, userId: string, data: any): Promise<StepResult> {
  const res = emptyResult('customers');
  const clientes: Row[] = Array.isArray(data?.clientes) ? data.clientes : [];
  const enderecos: Row[] = Array.isArray(data?.enderecos) ? data.enderecos : [];
  if (clientes.length === 0) return res;

  const addrByCode = new Map<string, Row>();
  for (const e of enderecos) {
    const code = cleanString(makeGetter(e)('Código', 'Codigo'));
    if (code && !addrByCode.has(code)) addrByCode.set(code, e);
  }

  const codes = clientes
    .map((c) => cleanString(makeGetter(c)('Codigo', 'Código')))
    .filter((c): c is string => Boolean(c));
  const existingCodes = await fetchExistingValues('customers', 'external_code', tenantId, codes);

  // Documentos já usados: há índice único (user_id, document) quando document não é nulo.
  const usedDocuments = new Set<string>();
  const documents = clientes
    .map((c) => {
      const g = makeGetter(c);
      return onlyDigits(g('CPF')) || onlyDigits(g('CNPJ'));
    })
    .filter(Boolean);
  if (documents.length > 0) {
    for (const part of chunk([...new Set(documents)], 300)) {
      const { data: found } = await supabaseAdmin
        .from('customers')
        .select('document')
        .eq('user_id', userId)
        .in('document', part);
      for (const r of found || []) if (r.document) usedDocuments.add(String(r.document));
    }
  }

  const toInsert: Row[] = [];
  for (const c of clientes) {
    const g = makeGetter(c);
    const code = cleanString(g('Codigo', 'Código'));
    if (!code) {
      res.skipped++;
      continue;
    }
    if (existingCodes.has(code)) {
      res.skipped++;
      continue;
    }
    existingCodes.add(code);

    const tipo = normalizeText(g('Tipo de pessoa'));
    const isPJ = tipo.includes('jur') || tipo === 'pj';
    const nome =
      cleanString(g('Nome')) ||
      cleanString(g('Razão social', 'Razao social')) ||
      cleanString(g('Nome social')) ||
      `Cliente ${code}`;

    // Um CPF/CNPJ repetido violaria o índice único e derrubaria o lote inteiro;
    // o segundo cliente entra sem documento em vez de ser descartado.
    let document = isPJ ? onlyDigits(g('CNPJ')) : onlyDigits(g('CPF'));
    if (!document) document = isPJ ? onlyDigits(g('CPF')) : onlyDigits(g('CNPJ'));
    document = document.slice(0, 20);
    if (document && usedDocuments.has(document)) document = '';
    if (document) usedDocuments.add(document);

    const addr = addrByCode.get(code);
    const ag = addr ? makeGetter(addr) : null;

    toInsert.push({
      tenant_id: tenantId,
      user_id: userId,
      external_code: fitVarchar(code, 100),
      name: fitVarchar(nome, 200),
      email: fitVarchar(g('E-mail', 'Email'), 255),
      phone: (onlyDigits(g('Celular')) || onlyDigits(g('Telefone'))).slice(0, 20) || null,
      document: document || null,
      state_registration: fitVarchar(g('Inscrição estadual', 'Inscricao estadual'), 20),
      is_active: parseBoolean(g('Ativo'), true),
      address: ag ? cleanString(ag('Logradouro')) : null,
      address_number: ag ? fitVarchar(ag('Número', 'Numero'), 10) : null,
      address_complement: ag ? fitVarchar(ag('Complemento'), 100) : null,
      neighborhood: ag ? fitVarchar(ag('Bairro'), 100) : null,
      city: ag ? fitVarchar(ag('Cidade'), 100) : null,
      state: ag ? parseState(ag('UF', 'Estado'))?.slice(0, 2) ?? null : null,
      zipcode: ag ? onlyDigits(ag('CEP')).slice(0, 10) || null : null,
      created_at: parseBrazilianDate(g('Cadastrado em')) || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  await insertRows('customers', toInsert, res, (r) => `cliente ${r.external_code} (${r.name})`);
  return res;
}

// ----------------------------------------------------------------------------
// PRODUTOS
// ----------------------------------------------------------------------------
async function importProducts(tenantId: string, userId: string, data: any): Promise<StepResult> {
  const res = emptyResult('products');
  const produtos: Row[] = Array.isArray(data?.produtos) ? data.produtos : [];
  if (produtos.length === 0) return res;

  const skus = produtos
    .map((p) => cleanString(makeGetter(p)('Codigo', 'Código')))
    .filter((s): s is string => Boolean(s));

  const existingBySku = new Map<string, number>();
  for (const part of chunk([...new Set(skus)], 300)) {
    const { data: found, error } = await supabaseAdmin
      .from('products')
      .select('id, sku')
      .eq('tenant_id', tenantId)
      .in('sku', part);
    if (error) throw new Error(`products.sku: ${error.message}`);
    for (const r of found || []) {
      const key = String(r.sku ?? '').trim().toLowerCase();
      if (key && !existingBySku.has(key)) existingBySku.set(key, Number(r.id));
    }
  }

  const seenInBatch = new Set<string>();
  const toInsert: Row[] = [];

  for (const p of produtos) {
    const g = makeGetter(p);
    const sku = cleanString(g('Codigo', 'Código'));
    const name = cleanString(g('Produto', 'Nome'));
    if (!name) {
      res.skipped++;
      continue;
    }

    const skuKey = (sku || '').toLowerCase();
    if (skuKey && seenInBatch.has(skuKey)) {
      // código repetido dentro do próprio arquivo do backup
      res.skipped++;
      continue;
    }
    if (skuKey) seenInBatch.add(skuKey);

    const productData: Row = {
      tenant_id: tenantId,
      user_id: userId,
      sku: fitVarchar(sku, 100),
      name: fitVarchar(name, 200),
      barcode: fitVarchar(g('Codigo de barra', 'Código de barras', 'Codigo de barras'), 100),
      category: fitVarchar(g('Grupo', 'Categoria'), 100),
      description: cleanString(g('Descrição', 'Descricao')),
      cost_price: parseBrazilianPrice(g('Valor de custo')),
      sale_price: parseBrazilianPrice(g('Valor Varejo', 'Valor de venda', 'Valor venda')),
      stock_quantity: Math.round(parseBrazilianPrice(g('Estoque atual'))) || 0,
      min_stock: Math.round(parseBrazilianPrice(g('Estoque minimo', 'Estoque mínimo'))) || 0,
      unit: (cleanString(g('Unidade de saida', 'Unidade de saída', 'Unidade')) || 'UN')
        .toUpperCase()
        .slice(0, 20),
      // NCM e CEST são numéricos no ERP (varchar(20) e varchar(7)); o legado
      // exporta com pontuação, que não caberia na coluna.
      ncm: onlyDigits(g('Código NCM', 'Codigo NCM', 'NCM')).slice(0, 20) || null,
      cest: onlyDigits(g('Código CEST', 'Codigo CEST', 'CEST')).slice(0, 7) || null,
      is_active: parseBoolean(g('Ativo'), true),
      imported_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const existingId = skuKey ? existingBySku.get(skuKey) : undefined;
    if (existingId) {
      const { error } = await supabaseAdmin.from('products').update(productData).eq('id', existingId);
      if (error) {
        res.failed++;
        pushError(res, `produto ${sku} (${name}): ${error.message}`);
      } else {
        res.updated++;
      }
    } else {
      productData.created_at = new Date().toISOString();
      toInsert.push(productData);
    }
  }

  await insertRows('products', toInsert, res, (r) => `produto ${r.sku} (${r.name})`);
  return res;
}

// ----------------------------------------------------------------------------
// VENDAS (cabeçalho)
//
// O cliente envia cada linha de `vendas_*.xlsx` já enriquecida com:
//   __sale_number  número final e único da venda (MIG-<pedido>, com sufixo se repetir)
//   __forma        rótulo da forma de pagamento vindo de vendas_pagamentos
//   __parcelas     quantidade de parcelas
//   __situacao     situação mais recente vinda de vendas_historicos
// ----------------------------------------------------------------------------
async function importSales(
  tenantId: string,
  userId: string,
  data: any,
  cache: TenantCache
): Promise<StepResult> {
  const res = emptyResult('sales');
  const vendas: Row[] = Array.isArray(data?.vendas) ? data.vendas : [];
  if (vendas.length === 0) return res;

  const customerByName = await getCustomerIndex(tenantId, cache);

  const saleNumbers = vendas
    .map((v) => cleanString(v.__sale_number))
    .filter((s): s is string => Boolean(s));
  const existingNumbers = await fetchExistingValues('sales', 'sale_number', tenantId, saleNumbers);

  const toInsert: Row[] = [];
  for (const v of vendas) {
    const g = makeGetter(v);
    const saleNumber = cleanString(v.__sale_number);
    if (!saleNumber) {
      res.skipped++;
      continue;
    }
    if (existingNumbers.has(saleNumber)) {
      res.skipped++;
      continue;
    }
    existingNumbers.add(saleNumber);

    const customerName = cleanString(g('Cliente')) || 'Cliente Avulso';
    const customerId = customerByName.get(normalizeText(customerName)) ?? null;

    const totalAmount = parseBrazilianPrice(g('Valor total'));
    const discount = parseBrazilianPrice(g('Desconto valor'));
    const freight = parseBrazilianPrice(g('Valor frete'));
    const finalAmount =
      parseBrazilianPrice(g('Total do pedido')) || totalAmount - discount + freight;

    const rawPayment = cleanString(v.__forma);
    const parcelas = Number(v.__parcelas) || 0;
    const paymentCondition =
      parcelas > 1 ? `${parcelas}x ${rawPayment || ''}`.trim() : rawPayment || null;

    // 'Data' = data real da venda; 'Cadastrado em' = data de registro no sistema.
    // Os relatórios filtram por created_at, então ele precisa ficar na data legada.
    const soldAt =
      parseBrazilianDate(g('Data')) || parseBrazilianDate(g('Cadastrado em')) || new Date().toISOString();
    const createdAt = parseBrazilianDate(g('Cadastrado em')) || soldAt;

    toInsert.push({
      tenant_id: tenantId,
      user_id: userId,
      sale_number: fitVarchar(saleNumber, 50),
      customer_id: customerId,
      customer_name: fitVarchar(customerName, 255),
      total_amount: totalAmount,
      discount_amount: discount || 0,
      final_amount: finalAmount,
      payment_method: mapPaymentMethod(rawPayment),
      payment_condition: fitVarchar(paymentCondition, 100),
      sale_source: 'migracao',
      sale_type: 'produtos',
      seller_name: cleanString(g('Vendedor')),
      status: mapSaleStatus(v.__situacao),
      notes: cleanString(g('Observações', 'Observacoes')),
      internal_notes: cleanString(g('Observações interna', 'Observacoes interna')),
      sold_at: soldAt,
      created_at: createdAt,
      updated_at: new Date().toISOString(),
    });
  }

  await insertRows('sales', toInsert, res, (r) => `venda ${r.sale_number}`);
  return res;
}

// ----------------------------------------------------------------------------
// ITENS DAS VENDAS
//
// O cliente envia os itens agrupados por pedido (nunca parte um pedido entre dois
// lotes), com `__sale_number` já resolvido para o número da venda correspondente.
// ----------------------------------------------------------------------------
async function importSaleItems(
  tenantId: string,
  userId: string,
  data: any,
  cache: TenantCache
): Promise<StepResult> {
  const res = emptyResult('sale_items');
  const itens: Row[] = Array.isArray(data?.itens) ? data.itens : [];
  if (itens.length === 0) return res;

  const { byName, costById } = await getProductIndex(tenantId, cache);

  const numbers = [
    ...new Set(itens.map((i) => cleanString(i.__sale_number)).filter((s): s is string => Boolean(s))),
  ];

  const saleIdByNumber = new Map<string, number>();
  for (const part of chunk(numbers, 300)) {
    const { data: found, error } = await supabaseAdmin
      .from('sales')
      .select('id, sale_number')
      .eq('tenant_id', tenantId)
      .in('sale_number', part);
    if (error) throw new Error(`sales.sale_number: ${error.message}`);
    for (const s of found || []) saleIdByNumber.set(String(s.sale_number), Number(s.id));
  }

  // Idempotência: uma venda que já tem itens de uma execução ANTERIOR é pulada
  // (retomada). Mas o backup às vezes traz os itens de um mesmo pedido em blocos
  // separados, em arquivos distantes; nesse caso a venda já foi gravada por esta
  // mesma execução e o bloco seguinte precisa entrar.
  const writtenInThisRun = (cache.itemsWrittenFor ??= new Set<number>());
  const saleIds = [...saleIdByNumber.values()].filter((id) => !writtenInThisRun.has(id));
  const alreadyHasItems = new Set<number>();
  // Precisa paginar: cada venda tem varios itens, entao poucas centenas de
  // vendas ja passam do teto de 1000 linhas do PostgREST. Sem isso a consulta
  // vinha truncada, vendas apareciam como "sem itens" e os itens eram regravados.
  for (const part of chunk(saleIds, 200)) {
    for (let from = 0; ; from += PAGE) {
      const { data: found, error } = await supabaseAdmin
        .from('sale_items')
        .select('sale_id')
        .eq('tenant_id', tenantId)
        .in('sale_id', part)
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`sale_items.sale_id: ${error.message}`);
      const rows = found || [];
      for (const r of rows) alreadyHasItems.add(Number(r.sale_id));
      if (rows.length < PAGE) break;
    }
  }

  const toInsert: Row[] = [];
  for (const it of itens) {
    const g = makeGetter(it);
    const saleNumber = cleanString(it.__sale_number);
    const saleId = saleNumber ? saleIdByNumber.get(saleNumber) : undefined;
    if (!saleId) {
      res.skipped++;
      continue;
    }
    if (alreadyHasItems.has(saleId)) {
      res.skipped++;
      continue;
    }

    const productName = cleanString(g('Produto', 'Serviço', 'Servico')) || 'Produto';
    const quantity = Math.round(parseBrazilianPrice(g('Quantidade'))) || 1;
    const unitPrice = parseBrazilianPrice(g('Valor unitário', 'Valor unitario'));
    const gross = quantity * unitPrice;
    // No Gestão Click o "Desconto" do item é valor em R$ e "Valor total" já vem líquido.
    const net = parseBrazilianPrice(g('Valor total')) || gross;
    const discountValue = Math.max(0, gross - net);

    const productId = byName.get(normalizeText(productName)) ?? null;

    const item: Row = {
      sale_id: saleId,
      tenant_id: tenantId,
      user_id: userId,
      product_name: fitVarchar(productName, 255),
      quantity,
      unit_price: unitPrice,
      subtotal: net,
      total_price: net,
      discount_percentage: gross > 0 ? Number(((discountValue / gross) * 100).toFixed(4)) : 0,
      cost_price: productId ? costById.get(productId) || 0 : 0,
      created_at: new Date().toISOString(),
    };
    if (productId) item.product_id = productId;
    toInsert.push(item);
    writtenInThisRun.add(saleId);
  }

  await insertRows('sale_items', toInsert, res, (r) => `item da venda ${r.sale_id} (${r.product_name})`);
  return res;
}

// ----------------------------------------------------------------------------
// FINANCEIRO (contas a receber e a pagar)
//
// O legado não exporta id das contas. A chave de deduplicação usa o índice global
// da linha (enviado pelo cliente em `offset`), que é estável entre execuções.
// ----------------------------------------------------------------------------
async function importFinance(tenantId: string, userId: string, data: any): Promise<StepResult> {
  const res = emptyResult('finance');
  const contas: Row[] = Array.isArray(data?.contas) ? data.contas : [];
  if (contas.length === 0) return res;

  const isExpense = data?.tipo === 'despesa';
  const prefix = isExpense ? 'cp' : 'cr';
  const offset = Number(data?.offset) || 0;

  const codes = contas.map((_, i) => `${prefix}:${offset + i}`);
  const existingCodes = await fetchExistingValues(
    'financial_transactions',
    'external_code',
    tenantId,
    codes
  );

  const toInsert: Row[] = [];
  contas.forEach((c, index) => {
    const g = makeGetter(c);
    const extCode = `${prefix}:${offset + index}`;
    if (existingCodes.has(extCode)) {
      res.skipped++;
      return;
    }

    const description =
      cleanString(g('Descrição do recebimento', 'Descricao do recebimento')) ||
      cleanString(g('Descrição do pagamento', 'Descricao do pagamento')) ||
      cleanString(g('Descrição', 'Descricao')) ||
      (isExpense ? 'Pagamento' : 'Recebimento');
    const dueDate = parseBrazilianDate(g('Data do vencimento'));
    const paidDate = parseBrazilianDate(g('Data de confirmação', 'Data de confirmacao'));
    const amount = parseBrazilianPrice(g('Valor total')) || parseBrazilianPrice(g('Valor'));

    toInsert.push({
      tenant_id: tenantId,
      user_id: userId,
      transaction_type: isExpense ? 'despesa' : 'receita',
      category: fitVarchar(g('Plano de contas'), 100) || (isExpense ? 'Pagamentos' : 'Recebimentos'),
      description: fitVarchar(description, 200),
      amount,
      payment_method: fitVarchar(g('Forma de pagamento'), 20),
      reference_type: 'outras',
      due_date: dueDate ? dueDate.slice(0, 10) : null,
      paid_date: paidDate ? paidDate.slice(0, 10) : null,
      status: mapFinanceStatus(g('Situação', 'Situacao')),
      notes: cleanString(g('Observações', 'Observacoes')),
      external_code: extCode,
      created_at: parseBrazilianDate(g('Cadastrado em')) || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  await insertRows('financial_transactions', toInsert, res, (r) => `${r.external_code} (${r.description})`);
  return res;
}

// ----------------------------------------------------------------------------
// NOTAS FISCAIS (histórico)
// ----------------------------------------------------------------------------
async function importFiscal(tenantId: string, _userId: string, data: any): Promise<StepResult> {
  const res = emptyResult('fiscal');
  const notas: Row[] = Array.isArray(data?.notas) ? data.notas : [];
  const notasProdutos: Row[] = Array.isArray(data?.notasProdutos) ? data.notasProdutos : [];
  const notasPagamentos: Row[] = Array.isArray(data?.notasPagamentos) ? data.notasPagamentos : [];
  if (notas.length === 0) return res;

  const prodByNota = new Map<string, Row[]>();
  for (const p of notasProdutos) {
    const num = cleanString(makeGetter(p)('Nota fiscal nº', 'Nota fiscal n', 'Nota fiscal numero'));
    if (!num) continue;
    if (!prodByNota.has(num)) prodByNota.set(num, []);
    prodByNota.get(num)!.push(p);
  }
  const pagByNota = new Map<string, Row[]>();
  for (const p of notasPagamentos) {
    const num = cleanString(makeGetter(p)('Nota fiscal nº', 'Nota fiscal n'));
    if (!num) continue;
    if (!pagByNota.has(num)) pagByNota.set(num, []);
    pagByNota.get(num)!.push(p);
  }

  const refs = notas.map((n) => {
    const g = makeGetter(n);
    const numero = cleanString(g('Número', 'Numero'));
    const chave = cleanString(g('Chave'));
    return `mig-nfe:${numero || chave || ''}`;
  });
  const existingRefs = await fetchExistingValues('fiscal_documents', 'ref', tenantId, refs);

  const toInsert: Row[] = [];
  notas.forEach((n, index) => {
    const g = makeGetter(n);
    const numero = cleanString(g('Número', 'Numero'));
    const chave = cleanString(g('Chave'));
    const ref = refs[index];
    if (ref === 'mig-nfe:') {
      res.skipped++;
      return;
    }
    if (existingRefs.has(ref)) {
      res.skipped++;
      return;
    }
    existingRefs.add(ref);

    const sit = normalizeText(g('Situação', 'Situacao'));

    toInsert.push({
      tenant_id: tenantId,
      provider: 'gestaoclick',
      doc_type: 'nfe',
      ref,
      status: sit.includes('cancel') ? 'canceled' : 'authorized',
      numero,
      serie: cleanString(g('Série', 'Serie')),
      chave,
      payload: {
        nota: n,
        produtos: prodByNota.get(numero || '') || [],
        pagamentos: pagByNota.get(numero || '') || [],
      },
      created_at: parseBrazilianDate(g('Data de Emissão', 'Data de Emissao')) || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  await insertRows('fiscal_documents', toInsert, res, (r) => `nota ${r.numero || r.ref}`);
  return res;
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Servidor sem NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY configurados' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { tenant_id, user_id, step, data, reset } = body || {};

    if (!tenant_id || tenant_id === DEFAULT_USER) {
      return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 });
    }
    const userId = user_id && user_id !== DEFAULT_USER ? user_id : DEFAULT_USER;

    const { data: tenant, error: tErr } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('id', tenant_id)
      .maybeSingle();
    if (tErr || !tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    const cache = getCache(tenant_id, Boolean(reset));

    let result: StepResult;
    switch (step) {
      case 'customers':
        result = await importCustomers(tenant_id, userId, data);
        break;
      case 'products':
        result = await importProducts(tenant_id, userId, data);
        break;
      case 'sales':
        result = await importSales(tenant_id, userId, data, cache);
        break;
      case 'sale_items':
        result = await importSaleItems(tenant_id, userId, data, cache);
        break;
      case 'finance':
        result = await importFinance(tenant_id, userId, data);
        break;
      case 'fiscal':
        result = await importFiscal(tenant_id, userId, data);
        break;
      default:
        return NextResponse.json({ error: `Etapa inválida: ${step}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('❌ Erro na migração:', error);
    return NextResponse.json(
      { error: 'Erro interno: ' + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Servidor sem NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY configurados' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId || tenantId === DEFAULT_USER) {
      return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 });
    }

    const { data: tenant, error: tErr } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('id', tenantId)
      .maybeSingle();
    if (tErr || !tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    caches.delete(tenantId);

    // 1. Notas fiscais importadas
    const { count: fiscalCount, error: fiscalErr } = await supabaseAdmin
      .from('fiscal_documents')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)
      .like('ref', 'mig-nfe:%');

    // 2. Contas a receber / a pagar importadas
    const { count: financeCount, error: financeErr } = await supabaseAdmin
      .from('financial_transactions')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)
      .or('external_code.like.cr:%,external_code.like.cp:%');

    // 3. Itens e vendas importadas — em páginas, porque são centenas de milhares
    let itemsCount = 0;
    let salesCount = 0;
    let salesErr: any = null;
    for (;;) {
      const { data: salesToDelete, error } = await supabaseAdmin
        .from('sales')
        .select('id')
        .eq('tenant_id', tenantId)
        .or('sale_source.eq.migracao,sale_number.like.MIG-%')
        .limit(1000);
      if (error) {
        salesErr = error;
        break;
      }
      const saleIds = (salesToDelete || []).map((s: any) => s.id);
      if (saleIds.length === 0) break;

      const { count: itCount, error: itErr } = await supabaseAdmin
        .from('sale_items')
        .delete({ count: 'exact' })
        .in('sale_id', saleIds);
      if (itErr) {
        salesErr = itErr;
        break;
      }
      itemsCount += itCount || 0;

      const { count: slCount, error: slErr } = await supabaseAdmin
        .from('sales')
        .delete({ count: 'exact' })
        .in('id', saleIds);
      if (slErr) {
        salesErr = slErr;
        break;
      }
      salesCount += slCount || 0;
    }

    // 4. Produtos importados por planilha
    const { count: productsCount, error: productsErr } = await supabaseAdmin
      .from('products')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)
      .not('sku', 'is', null)
      .not('imported_at', 'is', null);

    // 5. Clientes importados
    const { count: customersCount, error: customersErr } = await supabaseAdmin
      .from('customers')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)
      .not('external_code', 'is', null);

    if (fiscalErr || financeErr || salesErr || productsErr || customersErr) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alguns erros ocorreram ao limpar tabelas',
          details: {
            fiscal: fiscalErr?.message,
            finance: financeErr?.message,
            sales: salesErr?.message,
            products: productsErr?.message,
            customers: customersErr?.message,
          },
          result: {
            fiscal: fiscalCount || 0,
            finance: financeCount || 0,
            sales: salesCount,
            sale_items: itemsCount,
            products: productsCount || 0,
            customers: customersCount || 0,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result: {
        fiscal: fiscalCount || 0,
        finance: financeCount || 0,
        sales: salesCount,
        sale_items: itemsCount,
        products: productsCount || 0,
        customers: customersCount || 0,
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao desfazer migração:', error);
    return NextResponse.json(
      { error: 'Erro interno: ' + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
