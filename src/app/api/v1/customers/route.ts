import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiKeyAuth } from '@/lib/api-key-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Normaliza texto removendo acentos e convertendo para lowercase
 * Exemplo: "João Silva" -> "joao silva", "Café" -> "cafe"
 */
function normalizeText(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function digitsOnly(text: string): string {
  return String(text || '').replace(/\D+/g, '');
}

function tokenize(text: string): string[] {
  const t = normalizeText(text);
  if (!t) return [];
  return t
    .split(/[\s\-_.@/]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

// Escapa caracteres que podem quebrar o filtro `or(...)` do PostgREST/Supabase.
// Mantém o comportamento simples: remove vírgulas e curingas (%/_), e normaliza espaços.
function sanitizeForIlike(term: string): string {
  return String(term || '')
    .replace(/[%_]/g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  // Garantir que `b` seja o menor para reduzir memória
  if (b.length > a.length) {
    const tmp = a;
    a = b;
    b = tmp;
  }

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // remoção
        curr[j - 1] + 1, // inserção
        prev[j - 1] + cost // substituição
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

function similarityRatio(aRaw: string, bRaw: string): number {
  const a = normalizeText(aRaw);
  const b = normalizeText(bRaw);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(a, b);
  return Math.max(0, Math.min(1, 1 - dist / maxLen));
}

function scoreCustomerForSearch(customer: any, searchTerm: string): number {
  const normalizedSearch = normalizeText(searchTerm);
  if (!normalizedSearch) return 0;

  const searchLen = normalizedSearch.length;
  const searchTokens = tokenize(searchTerm);
  const searchDigits = digitsOnly(searchTerm);

  const normalizedName = normalizeText(customer?.name || '');
  const normalizedEmail = normalizeText(customer?.email || '');
  const normalizedDocument = normalizeText(customer?.document || '');
  const normalizedPhone = normalizeText(customer?.phone || '');

  // Match forte por dígitos (documento/telefone)
  if (searchDigits.length >= 3) {
    const docDigits = digitsOnly(normalizedDocument);
    const phoneDigits = digitsOnly(normalizedPhone);
    if ((docDigits && docDigits.includes(searchDigits)) || (phoneDigits && phoneDigits.includes(searchDigits))) return 1;
  }

  // Match forte por substring (já cobre acentos via normalize)
  if (
    (normalizedName && normalizedName.includes(normalizedSearch)) ||
    (normalizedEmail && normalizedEmail.includes(normalizedSearch)) ||
    (normalizedDocument && normalizedDocument.includes(normalizedSearch)) ||
    (normalizedPhone && normalizedPhone.includes(normalizedSearch))
  ) {
    return 0.98;
  }

  // Para buscas muito curtas, fuzzy tende a dar falsos positivos
  if (searchLen <= 2) return 0;

  const fields = [normalizedName, normalizedEmail, normalizedDocument, normalizedPhone].filter(Boolean);
  let bestFieldSim = 0;
  for (const f of fields) {
    bestFieldSim = Math.max(bestFieldSim, similarityRatio(normalizedSearch, f));
  }

  // Similaridade por tokens: para cada token da busca, acha o melhor token no campo
  let tokenScore = 0;
  if (searchTokens.length > 0) {
    const fieldTokens = new Set<string>();
    for (const f of fields) {
      for (const t of tokenize(f)) fieldTokens.add(t);
    }

    let sum = 0;
    for (const st of searchTokens) {
      let best = 0;
      for (const ft of fieldTokens) {
        // Prioriza prefixo
        if (ft.startsWith(st) || st.startsWith(ft)) {
          best = Math.max(best, 0.92);
          continue;
        }
        best = Math.max(best, similarityRatio(st, ft));
      }
      sum += best;
    }
    tokenScore = sum / searchTokens.length;
  }

  const combined = Math.max(bestFieldSim, tokenScore);

  // Ajuste de threshold implícito por tamanho: quanto menor, mais exigente
  if (searchLen <= 4) return combined * 0.9;
  return combined;
}

/**
 * POST /api/v1/customers
 * Cria um novo cliente via API externa
 */
async function createCustomerHandler(
  request: NextRequest,
  context: { tenant_id: string; api_key_id: string; permissions: string[] }
) {
  try {
    const { tenant_id } = context;
    const body = await request.json();

    const { name, email, phone, document, address, neighborhood, state, zipcode, notes, is_active, branch_id } = body;

    // Validações
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Opcional: permitir cadastrar diretamente em uma filial
    // - Se branch_id for informado: cliente aparece na filial (created_at_branch_id = branch_id)
    // - Se não: cliente fica na matriz (created_at_branch_id = NULL)
    let createdAtBranchId: number | null = null;
    if (branch_id !== undefined && branch_id !== null && String(branch_id).trim() !== '') {
      const bid = typeof branch_id === 'number' ? branch_id : parseInt(String(branch_id), 10);
      if (!Number.isFinite(bid) || bid <= 0) {
        return NextResponse.json(
          { success: false, error: 'branch_id inválido' },
          { status: 400 }
        );
      }

      // Validar que a filial pertence ao tenant
      const { data: branch, error: branchError } = await supabaseAdmin
        .from('branches')
        .select('id, tenant_id')
        .eq('id', bid)
        .eq('tenant_id', tenant_id)
        .maybeSingle();

      if (branchError || !branch) {
        return NextResponse.json(
          { success: false, error: 'Filial (branch_id) não encontrada para este tenant' },
          { status: 400 }
        );
      }

      createdAtBranchId = bid;
    }

    // Preparar dados para inserção
    const customerData: any = {
      tenant_id,
      user_id: '00000000-0000-0000-0000-000000000000', // API externa usa UUID padrão
      name: name.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      document: document ? document.trim() : null,
      address: address ? address.trim() : null,
      neighborhood: neighborhood ? neighborhood.trim() : null,
      state: state ? state.trim().substring(0, 2).toUpperCase() : null, // Limitar a 2 caracteres
      zipcode: zipcode ? zipcode.trim() : null,
      notes: notes ? notes.trim() : null,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      created_at_branch_id: createdAtBranchId, // NULL = matriz | number = filial
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar cliente:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar cliente: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('❌ Erro no handler de criação de cliente:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/customers
 * Lista clientes do tenant
 */
async function listCustomersHandler(
  request: NextRequest,
  context: { tenant_id: string; api_key_id: string; permissions: string[] }
) {
  try {
    const { tenant_id } = context;
    const { searchParams } = new URL(request.url);
    const limitRaw = parseInt(searchParams.get('limit') || '50');
    const offsetRaw = parseInt(searchParams.get('offset') || '0');
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;
    const is_active = searchParams.get('is_active');
    const search = searchParams.get('search'); // Busca por nome, email ou documento

    let query = supabaseAdmin
      .from('customers')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtrar por status ativo/inativo
    if (is_active !== null && is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const searchTerm = search && search.trim().length > 0 ? search.trim() : null;
    const normalizedSearch = searchTerm ? normalizeText(searchTerm) : null;

    // Estratégia:
    // - 1) tenta um `ilike` (rápido) com alguns heurísticos (inclui phone)
    // - 2) se não retornar o suficiente (ou se o termo tiver typos), busca um "pool" recente e faz fuzzy scoring em memória
    const fuzzyPoolMax = Math.min(Math.max(limit * 20, limit * 3), 500); // cap para não carregar demais
    let allCustomers: any[] = [];

    if (searchTerm) {
      const safeTerm = sanitizeForIlike(searchTerm);
      const tokens = tokenize(searchTerm);
      const t0 = sanitizeForIlike(tokens[0] || safeTerm);
      const digits = digitsOnly(searchTerm);

      const orParts: string[] = [];
      if (t0) {
        orParts.push(`name.ilike.%${t0}%`, `email.ilike.%${t0}%`);
      }
      if (safeTerm && safeTerm !== t0) {
        orParts.push(`name.ilike.%${safeTerm}%`, `email.ilike.%${safeTerm}%`);
      }
      if (digits.length >= 3) {
        orParts.push(`document.ilike.%${digits}%`, `phone.ilike.%${digits}%`);
      } else if (safeTerm) {
        orParts.push(`document.ilike.%${safeTerm}%`, `phone.ilike.%${safeTerm}%`);
      }

      // Primeiro: tentar candidatos via ilike
      let ilikeQuery = supabaseAdmin
        .from('customers')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('created_at', { ascending: false })
        .range(0, Math.max(limit * 3 - 1, 0));

      if (is_active !== null && is_active !== undefined) {
        ilikeQuery = ilikeQuery.eq('is_active', is_active === 'true');
      }

      if (orParts.length > 0) {
        ilikeQuery = ilikeQuery.or(orParts.join(','));
      }

      const { data: ilikeCustomers, error: ilikeError } = await ilikeQuery;
      if (ilikeError) {
        console.error('❌ Erro ao listar clientes (ilike):', ilikeError);
        return NextResponse.json(
          { success: false, error: 'Erro ao listar clientes: ' + ilikeError.message },
          { status: 500 }
        );
      }

      const candidates: any[] = Array.isArray(ilikeCustomers) ? ilikeCustomers : [];

      // Se não achou o suficiente, pega um pool recente e faz fuzzy scoring
      if (candidates.length < limit) {
        let poolQuery = supabaseAdmin
          .from('customers')
          .select('*')
          .eq('tenant_id', tenant_id)
          .order('created_at', { ascending: false })
          .range(0, fuzzyPoolMax - 1);

        if (is_active !== null && is_active !== undefined) {
          poolQuery = poolQuery.eq('is_active', is_active === 'true');
        }

        const { data: poolCustomers, error: poolError } = await poolQuery;
        if (poolError) {
          console.error('❌ Erro ao listar clientes (pool fuzzy):', poolError);
          return NextResponse.json(
            { success: false, error: 'Erro ao listar clientes: ' + poolError.message },
            { status: 500 }
          );
        }

        const pool = Array.isArray(poolCustomers) ? poolCustomers : [];

        // Unir + deduplicar por id
        const map = new Map<number, any>();
        for (const c of candidates) map.set(Number(c?.id), c);
        for (const c of pool) map.set(Number(c?.id), c);
        allCustomers = Array.from(map.values()).filter((c) => Number.isFinite(Number(c?.id)));
      } else {
        allCustomers = candidates;
      }
    } else {
      // Sem busca: mantém paginação nativa (mais eficiente)
      const { data, error } = await query;
      if (error) {
        console.error('❌ Erro ao listar clientes:', error);
        return NextResponse.json(
          { success: false, error: 'Erro ao listar clientes: ' + error.message },
          { status: 500 }
        );
      }
      allCustomers = Array.isArray(data) ? data : [];
    }

    // Se há busca, filtrar usando normalização para garantir flexibilidade com acentos e espaços
    let customers = allCustomers || [];
    if (normalizedSearch && customers.length > 0) {
      const scored = customers
        .map((c: any) => ({ c, score: scoreCustomerForSearch(c, searchTerm || '') }))
        .filter(({ score }) => {
          const len = normalizedSearch.length;
          const threshold = len <= 4 ? 0.78 : 0.72;
          return score >= threshold;
        })
        .sort((a, b) => b.score - a.score);

      customers = scored.map((x) => x.c);

      // Paginação no resultado fuzzy (já ordenado por relevância)
      customers = customers.slice(offset, offset + limit);
    }
    // Quando não há busca, customers já está paginado pelo range do Supabase

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        limit,
        offset,
        count: customers.length,
      },
    });
  } catch (error) {
    console.error('❌ Erro no handler de listagem de clientes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export const POST = withApiKeyAuth(createCustomerHandler, 'customers:create');
export const GET = withApiKeyAuth(listCustomersHandler, 'customers:read');
