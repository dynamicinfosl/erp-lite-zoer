import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  parseBrazilianPrice,
  parseBrazilianDate,
  onlyDigits,
  normalizeText,
  parseBoolean,
  cleanString,
  mapPaymentMethod,
  parseState,
} from '@/lib/migration/parsers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const DEFAULT_USER = '00000000-0000-0000-0000-000000000000';
const CHUNK = 200;

type Row = Record<string, any>;

interface StepResult {
  step: string;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
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

// ----------------------------------------------------------------------------
// CLIENTES
// ----------------------------------------------------------------------------
async function importCustomers(tenantId: string, userId: string, data: any): Promise<StepResult> {
  const res: StepResult = { step: 'customers', inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [] };
  const clientes: Row[] = Array.isArray(data?.clientes) ? data.clientes : [];
  const enderecos: Row[] = Array.isArray(data?.enderecos) ? data.enderecos : [];

  // Mapa de endereços por código do cliente
  const addrByCode = new Map<string, Row>();
  for (const e of enderecos) {
    const g = makeGetter(e);
    const code = cleanString(g('Código', 'Codigo'));
    if (code) addrByCode.set(code, e);
  }

  // Clientes já existentes (por external_code) neste tenant
  const { data: existing } = await supabaseAdmin
    .from('customers')
    .select('id, external_code')
    .eq('tenant_id', tenantId)
    .not('external_code', 'is', null);
  const existingCodes = new Set((existing || []).map((c: any) => String(c.external_code)));

  const toInsert: Row[] = [];
  for (const c of clientes) {
    const g = makeGetter(c);
    const code = cleanString(g('Codigo', 'Código'));
    if (!code) { res.skipped++; continue; }
    if (existingCodes.has(code)) { res.skipped++; continue; }

    const tipo = normalizeText(g('Tipo de pessoa'));
    const isPJ = tipo.includes('jur') || tipo === 'pj';
    const nome = cleanString(g('Nome')) || cleanString(g('Razão social', 'Razao social')) || 'Cliente';
    const document = isPJ ? onlyDigits(g('CNPJ')) : onlyDigits(g('CPF'));

    const addr = addrByCode.get(code);
    const ag = addr ? makeGetter(addr) : null;

    toInsert.push({
      tenant_id: tenantId,
      user_id: userId,
      external_code: code,
      name: nome,
      email: cleanString(g('E-mail', 'Email')),
      phone: onlyDigits(g('Celular')) || onlyDigits(g('Telefone')) || null,
      document: document || null,
      state_registration: cleanString(g('Inscrição estadual', 'Inscricao estadual')),
      is_active: parseBoolean(g('Ativo'), true),
      address: ag ? cleanString(ag('Logradouro')) : null,
      address_number: ag ? cleanString(ag('Número', 'Numero'))?.slice(0, 10) : null,
      address_complement: ag ? cleanString(ag('Complemento')) : null,
      neighborhood: ag ? cleanString(ag('Bairro')) : null,
      city: ag ? cleanString(ag('Cidade')) : null,
      state: ag ? parseState(ag('UF', 'Estado')) : null,
      zipcode: ag ? onlyDigits(ag('CEP'))?.slice(0, 10) || null : null,
      created_at: parseBrazilianDate(g('Cadastrado em')) || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    existingCodes.add(code);
  }

  for (const part of chunk(toInsert, CHUNK)) {
    const { error, count } = await supabaseAdmin.from('customers').insert(part, { count: 'exact' });
    if (error) {
      res.failed += part.length;
      res.errors.push(error.message);
    } else {
      res.inserted += count ?? part.length;
    }
  }
  return res;
}

// ----------------------------------------------------------------------------
// PRODUTOS
// ----------------------------------------------------------------------------
async function importProducts(tenantId: string, userId: string, data: any): Promise<StepResult> {
  const res: StepResult = { step: 'products', inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [] };
  const produtos: Row[] = Array.isArray(data?.produtos) ? data.produtos : [];

  const { data: existing } = await supabaseAdmin
    .from('products')
    .select('id, sku')
    .eq('tenant_id', tenantId)
    .not('sku', 'is', null);
  const skuToId = new Map<string, number>();
  for (const p of existing || []) {
    const sku = String((p as any).sku || '').trim().toLowerCase();
    if (sku) skuToId.set(sku, (p as any).id);
  }

  const toInsert: Row[] = [];
  for (const p of produtos) {
    const g = makeGetter(p);
    const sku = cleanString(g('Codigo', 'Código'));
    const name = cleanString(g('Produto', 'Nome'));
    if (!name) { res.skipped++; continue; }

    const productData: Row = {
      tenant_id: tenantId,
      user_id: userId,
      sku: sku,
      name,
      barcode: cleanString(g('Codigo de barra', 'Código de barras', 'Codigo de barras')),
      category: cleanString(g('Grupo', 'Categoria')),
      description: cleanString(g('Descrição', 'Descricao')),
      cost_price: parseBrazilianPrice(g('Valor de custo')),
      sale_price: parseBrazilianPrice(g('Valor Varejo', 'Valor de venda', 'Valor venda')),
      stock_quantity: Math.round(parseBrazilianPrice(g('Estoque atual'))) || 0,
      min_stock: Math.round(parseBrazilianPrice(g('Estoque minimo', 'Estoque mínimo'))) || 0,
      unit: (cleanString(g('Unidade de saida', 'Unidade de saída', 'Unidade')) || 'UN').toUpperCase().slice(0, 10),
      ncm: cleanString(g('Código NCM', 'Codigo NCM', 'NCM')),
      cest: cleanString(g('Código CEST', 'Codigo CEST', 'CEST')),
      is_active: parseBoolean(g('Ativo'), true),
      imported_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const skuKey = (sku || '').toLowerCase();
    if (skuKey && skuToId.has(skuKey)) {
      const id = skuToId.get(skuKey)!;
      const { error } = await supabaseAdmin.from('products').update(productData).eq('id', id);
      if (error) { res.failed++; res.errors.push(`${name}: ${error.message}`); }
      else res.updated++;
    } else {
      productData.created_at = new Date().toISOString();
      toInsert.push(productData);
      if (skuKey) skuToId.set(skuKey, -1); // marca para evitar duplicar no mesmo lote
    }
  }

  for (const part of chunk(toInsert, CHUNK)) {
    const { error, count } = await supabaseAdmin.from('products').insert(part, { count: 'exact' });
    if (error) { res.failed += part.length; res.errors.push(error.message); }
    else res.inserted += count ?? part.length;
  }
  return res;
}

// ----------------------------------------------------------------------------
// VENDAS (cruza vendas + itens + pagamentos + históricos)
// ----------------------------------------------------------------------------
async function importSales(tenantId: string, userId: string, data: any): Promise<StepResult> {
  const res: StepResult = { step: 'sales', inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [] };
  const vendas: Row[] = Array.isArray(data?.vendas) ? data.vendas : [];
  const itens: Row[] = Array.isArray(data?.itens) ? data.itens : [];
  const pagamentos: Row[] = Array.isArray(data?.pagamentos) ? data.pagamentos : [];
  const historicos: Row[] = Array.isArray(data?.historicos) ? data.historicos : [];

  // Índices auxiliares por Nº do pedido
  const itensByPedido = new Map<string, Row[]>();
  for (const it of itens) {
    const g = makeGetter(it);
    const ped = cleanString(g('Nº do pedido', 'N do pedido', 'Numero do pedido'));
    if (!ped) continue;
    if (!itensByPedido.has(ped)) itensByPedido.set(ped, []);
    itensByPedido.get(ped)!.push(it);
  }
  const pagByPedido = new Map<string, Row[]>();
  for (const pg of pagamentos) {
    const g = makeGetter(pg);
    const ped = cleanString(g('Nº do pedido', 'N do pedido'));
    if (!ped) continue;
    if (!pagByPedido.has(ped)) pagByPedido.set(ped, []);
    pagByPedido.get(ped)!.push(pg);
  }
  const histByPedido = new Map<string, Row[]>();
  for (const h of historicos) {
    const g = makeGetter(h);
    const ped = cleanString(g('Nº do pedido', 'N do pedido'));
    if (!ped) continue;
    if (!histByPedido.has(ped)) histByPedido.set(ped, []);
    histByPedido.get(ped)!.push(h);
  }

  // Mapas de clientes e produtos para vínculo
  const { data: customers } = await supabaseAdmin
    .from('customers')
    .select('id, name')
    .eq('tenant_id', tenantId);
  const customerByName = new Map<string, number>();
  for (const c of customers || []) {
    const key = normalizeText((c as any).name);
    if (key && !customerByName.has(key)) customerByName.set(key, (c as any).id);
  }

  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, name')
    .eq('tenant_id', tenantId);
  const productByName = new Map<string, number>();
  for (const p of products || []) {
    const key = normalizeText((p as any).name);
    if (key && !productByName.has(key)) productByName.set(key, (p as any).id);
  }

  // Vendas já existentes (por sale_number) neste tenant
  const { data: existingSales } = await supabaseAdmin
    .from('sales')
    .select('sale_number')
    .eq('tenant_id', tenantId);
  const existingNumbers = new Set((existingSales || []).map((s: any) => String(s.sale_number)));

  // Monta as vendas novas
  const newSales: Array<{ saleRow: Row; pedido: string }> = [];
  for (const v of vendas) {
    const g = makeGetter(v);
    const pedido = cleanString(g('Nº do pedido', 'N do pedido', 'Numero do pedido'));
    if (!pedido) { res.skipped++; continue; }
    const saleNumber = `MIG-${pedido}`;
    if (existingNumbers.has(saleNumber)) { res.skipped++; continue; }
    existingNumbers.add(saleNumber);

    const customerName = cleanString(g('Cliente')) || 'Cliente Avulso';
    const customerId = customerByName.get(normalizeText(customerName)) || null;

    const totalAmount = parseBrazilianPrice(g('Valor total'));
    const discount = parseBrazilianPrice(g('Desconto valor'));
    const finalAmount = parseBrazilianPrice(g('Total do pedido')) || (totalAmount - discount);

    // pagamento principal
    const pags = pagByPedido.get(pedido) || [];
    let rawPayment: string | null = null;
    if (pags.length > 0) {
      const pgg = makeGetter(pags[0]);
      rawPayment = cleanString(pgg('Forma de pagamento'));
    }
    const paymentMethod = mapPaymentMethod(rawPayment);
    const paymentCondition = pags.length > 1 ? `${pags.length}x` : (rawPayment || null);

    // situação (último histórico)
    const hists = histByPedido.get(pedido) || [];
    let status: string | null = 'completed';
    if (hists.length > 0) {
      const last = hists[hists.length - 1];
      const sg = makeGetter(last);
      const sit = normalizeText(sg('Situação', 'Situacao'));
      if (sit.includes('cancel')) status = 'canceled';
      else status = 'completed';
    }

    // 'Data' = data real da venda; 'Cadastrado em' = data de registro no sistema (podem divergir)
    const soldAt =
      parseBrazilianDate(g('Data')) ||
      parseBrazilianDate(g('Cadastrado em')) ||
      new Date().toISOString();
    const createdAt =
      parseBrazilianDate(g('Cadastrado em')) ||
      soldAt;

    newSales.push({
      pedido,
      saleRow: {
        tenant_id: tenantId,
        user_id: userId,
        sale_number: saleNumber,
        customer_id: customerId,
        customer_name: customerName,
        total_amount: totalAmount,
        discount_amount: discount || 0,
        final_amount: finalAmount,
        payment_method: paymentMethod,
        payment_condition: paymentCondition,
        sale_source: 'migracao',
        sale_type: 'produtos',
        seller_name: cleanString(g('Vendedor')),
        status,
        notes: cleanString(g('Observações', 'Observacoes')),
        internal_notes: cleanString(g('Observações interna', 'Observacoes interna')),
        sold_at: soldAt,
        created_at: createdAt,
        updated_at: new Date().toISOString(),
      },
    });
  }

  // Insere vendas em lotes e recupera ids
  const pedidoToSaleId = new Map<string, number>();
  for (const part of chunk(newSales, CHUNK)) {
    const rows = part.map((p) => p.saleRow);
    const { data: inserted, error } = await supabaseAdmin
      .from('sales')
      .insert(rows)
      .select('id, sale_number');
    if (error) {
      res.failed += part.length;
      res.errors.push(error.message);
      continue;
    }
    res.inserted += inserted?.length || 0;
    const numToId = new Map<string, number>();
    for (const s of inserted || []) numToId.set(String((s as any).sale_number), (s as any).id);
    for (const p of part) {
      const id = numToId.get(p.saleRow.sale_number);
      if (id) pedidoToSaleId.set(p.pedido, id);
    }
  }

  // Monta e insere itens das vendas
  const allItems: Row[] = [];
  for (const [pedido, saleId] of pedidoToSaleId.entries()) {
    const list = itensByPedido.get(pedido) || [];
    for (const it of list) {
      const g = makeGetter(it);
      const productName = cleanString(g('Produto')) || 'Produto';
      const quantity = Math.round(parseBrazilianPrice(g('Quantidade'))) || 1;
      const unitPrice = parseBrazilianPrice(g('Valor unitário', 'Valor unitario'));
      const total = parseBrazilianPrice(g('Valor total')) || unitPrice * quantity;
      const productId = productByName.get(normalizeText(productName)) || null;
      const item: Row = {
        sale_id: saleId,
        tenant_id: tenantId,
        user_id: userId,
        product_name: productName,
        quantity,
        unit_price: unitPrice,
        subtotal: total,
        total_price: total,
        created_at: new Date().toISOString(),
      };
      if (productId) item.product_id = productId;
      allItems.push(item);
    }
  }

  for (const part of chunk(allItems, CHUNK)) {
    const { error } = await supabaseAdmin.from('sale_items').insert(part);
    if (error) { res.errors.push(`itens: ${error.message}`); res.failed += part.length; }
  }

  return res;
}

// ----------------------------------------------------------------------------
// FINANCEIRO (contas a receber)
// ----------------------------------------------------------------------------
async function importFinance(tenantId: string, userId: string, data: any): Promise<StepResult> {
  const res: StepResult = { step: 'finance', inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [] };
  const contas: Row[] = Array.isArray(data?.contas) ? data.contas : [];

  const { data: existing } = await supabaseAdmin
    .from('financial_transactions')
    .select('external_code')
    .eq('tenant_id', tenantId)
    .not('external_code', 'is', null);
  const existingCodes = new Set((existing || []).map((c: any) => String(c.external_code)));

  const toInsert: Row[] = [];
  let seq = 0;
  for (const c of contas) {
    const g = makeGetter(c);
    const description = cleanString(g('Descrição do recebimento', 'Descricao do recebimento')) || 'Recebimento';
    const dueDate = parseBrazilianDate(g('Data do vencimento'));
    const amount = parseBrazilianPrice(g('Valor total')) || parseBrazilianPrice(g('Valor'));

    // chave de dedupe (legado não tem id explícito): descrição + vencimento + valor + índice
    const extCode = `cr:${normalizeText(description)}|${dueDate || ''}|${amount}|${seq++}`;
    if (existingCodes.has(extCode)) { res.skipped++; continue; }
    existingCodes.add(extCode);

    const situacao = normalizeText(g('Situação', 'Situacao'));
    let status = 'pendente';
    if (situacao.includes('cancel')) status = 'cancelado';
    else if (situacao.includes('receb') || situacao.includes('confirm') || situacao.includes('pago')) status = 'pago';

    toInsert.push({
      tenant_id: tenantId,
      user_id: userId,
      transaction_type: 'receita',
      category: cleanString(g('Plano de contas')) || 'Recebimentos',
      description,
      amount,
      payment_method: cleanString(g('Forma de pagamento')),
      reference_type: 'outras',
      due_date: dueDate ? dueDate.slice(0, 10) : null,
      paid_date: (() => { const d = parseBrazilianDate(g('Data de confirmação', 'Data de confirmacao')); return d ? d.slice(0, 10) : null; })(),
      status,
      notes: cleanString(g('Observações', 'Observacoes')),
      external_code: extCode,
      created_at: parseBrazilianDate(g('Cadastrado em')) || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  for (const part of chunk(toInsert, CHUNK)) {
    const { error, count } = await supabaseAdmin
      .from('financial_transactions')
      .insert(part, { count: 'exact' });
    if (error) { res.failed += part.length; res.errors.push(error.message); }
    else res.inserted += count ?? part.length;
  }
  return res;
}

// ----------------------------------------------------------------------------
// NOTAS FISCAIS (histórico)
// ----------------------------------------------------------------------------
async function importFiscal(tenantId: string, _userId: string, data: any): Promise<StepResult> {
  const res: StepResult = { step: 'fiscal', inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [] };
  const notas: Row[] = Array.isArray(data?.notas) ? data.notas : [];
  const notasProdutos: Row[] = Array.isArray(data?.notasProdutos) ? data.notasProdutos : [];
  const notasPagamentos: Row[] = Array.isArray(data?.notasPagamentos) ? data.notasPagamentos : [];

  const prodByNota = new Map<string, Row[]>();
  for (const p of notasProdutos) {
    const g = makeGetter(p);
    const num = cleanString(g('Nota fiscal nº', 'Nota fiscal n', 'Nota fiscal numero'));
    if (!num) continue;
    if (!prodByNota.has(num)) prodByNota.set(num, []);
    prodByNota.get(num)!.push(p);
  }
  const pagByNota = new Map<string, Row[]>();
  for (const p of notasPagamentos) {
    const g = makeGetter(p);
    const num = cleanString(g('Nota fiscal nº', 'Nota fiscal n'));
    if (!num) continue;
    if (!pagByNota.has(num)) pagByNota.set(num, []);
    pagByNota.get(num)!.push(p);
  }

  const { data: existing } = await supabaseAdmin
    .from('fiscal_documents')
    .select('ref')
    .eq('tenant_id', tenantId);
  const existingRefs = new Set((existing || []).map((c: any) => String(c.ref)));

  const toInsert: Row[] = [];
  for (const n of notas) {
    const g = makeGetter(n);
    const numero = cleanString(g('Número', 'Numero'));
    const chave = cleanString(g('Chave'));
    const ref = `mig-nfe:${numero || chave || Math.random().toString(36).slice(2)}`;
    if (existingRefs.has(ref)) { res.skipped++; continue; }
    existingRefs.add(ref);

    const sit = normalizeText(g('Situação', 'Situacao'));
    let status = 'authorized';
    if (sit.includes('cancel')) status = 'canceled';
    else if (sit.includes('autoriz') || sit.includes('emit')) status = 'authorized';
    else status = 'authorized';

    toInsert.push({
      tenant_id: tenantId,
      provider: 'gestaoclick',
      doc_type: 'nfe',
      ref,
      status,
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
  }

  for (const part of chunk(toInsert, CHUNK)) {
    const { error, count } = await supabaseAdmin
      .from('fiscal_documents')
      .insert(part, { count: 'exact' });
    if (error) { res.failed += part.length; res.errors.push(error.message); }
    else res.inserted += count ?? part.length;
  }
  return res;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, user_id, step, data } = body || {};

    if (!tenant_id || tenant_id === DEFAULT_USER) {
      return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 });
    }
    const userId = user_id && user_id !== DEFAULT_USER ? user_id : DEFAULT_USER;

    // Confirma que o tenant existe
    const { data: tenant, error: tErr } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('id', tenant_id)
      .maybeSingle();
    if (tErr || !tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    let result: StepResult;
    switch (step) {
      case 'customers':
        result = await importCustomers(tenant_id, userId, data);
        break;
      case 'products':
        result = await importProducts(tenant_id, userId, data);
        break;
      case 'sales':
        result = await importSales(tenant_id, userId, data);
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
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId || tenantId === DEFAULT_USER) {
      return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 });
    }

    // Confirma que o tenant existe
    const { data: tenant, error: tErr } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('id', tenantId)
      .maybeSingle();
    if (tErr || !tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    // 1. Deletar Notas Fiscais importadas (ref começa com 'mig-nfe:')
    const { count: fiscalCount, error: fiscalErr } = await supabaseAdmin
      .from('fiscal_documents')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)
      .like('ref', 'mig-nfe:%');

    // 2. Deletar Contas a Receber importadas (external_code começa com 'cr:')
    const { count: financeCount, error: financeErr } = await supabaseAdmin
      .from('financial_transactions')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)
      .like('external_code', 'cr:%');

    // 3. Deletar Vendas importadas (sale_source = 'migracao' ou sale_number começa com 'MIG-')
    const { data: salesToDelete } = await supabaseAdmin
      .from('sales')
      .select('id')
      .eq('tenant_id', tenantId)
      .or('sale_source.eq.migracao,sale_number.like.MIG-%');

    const saleIds = (salesToDelete || []).map((s: any) => s.id);
    let itemsCount = 0;
    if (saleIds.length > 0) {
      const { count: itCount } = await supabaseAdmin
        .from('sale_items')
        .delete({ count: 'exact' })
        .in('sale_id', saleIds);
      itemsCount = itCount || 0;
    }

    const { count: salesCount, error: salesErr } = await supabaseAdmin
      .from('sales')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)
      .or('sale_source.eq.migracao,sale_number.like.MIG-%');

    // 4. Deletar Produtos importados (que possuem SKU e imported_at não nulo)
    const { count: productsCount, error: productsErr } = await supabaseAdmin
      .from('products')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)
      .not('sku', 'is', null)
      .not('imported_at', 'is', null);

    // 5. Deletar Clientes importados (que possuem external_code não nulo)
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
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result: {
        fiscal: fiscalCount || 0,
        finance: financeCount || 0,
        sales: salesCount || 0,
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

