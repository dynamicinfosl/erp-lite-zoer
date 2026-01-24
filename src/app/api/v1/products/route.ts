import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiKeyAuth } from '@/lib/api-key-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Normaliza texto removendo acentos e convertendo caracteres especiais
 * Exemplo: "Café" -> "cafe", "João" -> "joao", "Convenção" -> "convencao"
 * Trata também cedilha (ç -> c) e outros caracteres especiais
 */
function normalizeText(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // Remove acentos (á -> a, é -> e, etc)
    .replace(/ç/g, 'c') // Converte cedilha (ç -> c)
    .replace(/Ç/g, 'c') // Converte cedilha maiúscula (Ç -> c)
    .toLowerCase()
    .trim();
}

/**
 * Levenshtein com "early exit" para ficar rápido.
 * Retorna true se a distância <= maxDist.
 */
function levenshteinWithin(a: string, b: string, maxDist: number): boolean {
  if (maxDist < 0) return false;
  if (a === b) return true;
  if (!a || !b) return Math.max(a.length, b.length) <= maxDist;

  // Garantir que a seja a menor (otimiza memória)
  if (a.length > b.length) {
    const tmp = a;
    a = b;
    b = tmp;
  }

  const la = a.length;
  const lb = b.length;
  if (lb - la > maxDist) return false;

  const prev = new Array<number>(la + 1);
  const curr = new Array<number>(la + 1);
  for (let i = 0; i <= la; i++) prev[i] = i;

  for (let j = 1; j <= lb; j++) {
    curr[0] = j;
    let rowMin = curr[0];
    const bj = b.charCodeAt(j - 1);

    for (let i = 1; i <= la; i++) {
      const cost = a.charCodeAt(i - 1) === bj ? 0 : 1;
      const del = prev[i] + 1;
      const ins = curr[i - 1] + 1;
      const sub = prev[i - 1] + cost;
      const val = del < ins ? (del < sub ? del : sub) : (ins < sub ? ins : sub);
      curr[i] = val;
      if (val < rowMin) rowMin = val;
    }

    if (rowMin > maxDist) return false;
    for (let i = 0; i <= la; i++) prev[i] = curr[i];
  }

  return prev[la] <= maxDist;
}

/**
 * POST /api/v1/products
 * Cria um novo produto via API externa
 */
async function createProductHandler(
  request: NextRequest,
  context: { tenant_id: string; api_key_id: string; permissions: string[] }
) {
  try {
    const { tenant_id } = context;
    const body = await request.json();

    const {
      name,
      sku,
      barcode,
      description,
      cost_price,
      sale_price,
      stock,
      min_stock,
      unit,
      is_active,
    } = body;

    // Validações
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    if (sale_price === undefined || sale_price === null || isNaN(Number(sale_price))) {
      return NextResponse.json(
        { success: false, error: 'sale_price é obrigatório e deve ser um número' },
        { status: 400 }
      );
    }

    if (cost_price === undefined || cost_price === null || isNaN(Number(cost_price))) {
      return NextResponse.json(
        { success: false, error: 'cost_price é obrigatório e deve ser um número' },
        { status: 400 }
      );
    }

    // Gerar SKU único se não fornecido
    const finalSku = sku && sku.trim() ? sku.trim() : `PROD-${Date.now()}`;
    const stockQty = stock !== undefined ? parseInt(String(stock), 10) : 0;

    const productData: any = {
      tenant_id,
      user_id: '00000000-0000-0000-0000-000000000000', // API externa usa UUID padrão
      sku: finalSku,
      name: name.trim(),
      description: description ? description.trim() : null,
      cost_price: parseFloat(String(cost_price)),
      sale_price: parseFloat(String(sale_price)),
      stock_quantity: stockQty,
      min_stock: min_stock !== undefined ? parseInt(String(min_stock), 10) : 0,
      barcode: barcode ? barcode.trim() : null,
      unit: unit || 'UN',
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar produto:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar produto: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('❌ Erro no handler de criação de produto:', error);
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
 * GET /api/v1/products
 * Lista produtos do tenant
 */
async function listProductsHandler(
  request: NextRequest,
  context: { tenant_id: string; api_key_id: string; permissions: string[] }
) {
  try {
    const { tenant_id } = context;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const is_active = searchParams.get('is_active');
    const search = searchParams.get('search'); // Busca por nome, SKU ou código de barras
    const include_variants = searchParams.get('include_variants') === 'true';
    const include_price_tiers = searchParams.get('include_price_tiers') === 'true';

    // Split por palavras e remove termos “fracos” para melhorar flexibilidade:
    // Ex.: "cliper limao" deve encontrar "Cliper ... (cola com limao)"
    const stopWords = new Set(['de', 'da', 'do', 'das', 'dos', 'com', 'e']);
    const searchTerm = search && search.trim().length > 0 ? search.trim() : null;
    const normalizedSearch = searchTerm ? normalizeText(searchTerm) : null;
    const tokens = normalizedSearch
      ? normalizedSearch
          .split(/\s+/)
          .map((t) => t.trim())
          .filter((t) => t.length > 0 && !stopWords.has(t))
      : [];

    const tokenMaxDist = (t: string) => {
      // tolerância por tamanho (bem conservadora pra não trazer coisa demais)
      const n = t.length;
      if (n <= 2) return 0;
      if (n <= 5) return 1;
      if (n <= 9) return 2;
      return 3;
    };

    const addMatches = (tokenSets: Record<string, Set<number>>, productId: number, haystack: string) => {
      const normalizedHaystack = haystack; // já vem normalizado
      // separar em "palavras" pra fuzzy match (evita comparar contra a frase inteira)
      const words = normalizedHaystack.split(/[^a-z0-9]+/g).filter((w) => w.length > 0);

      for (const t of tokens) {
        // match exato (rápido)
        if (normalizedHaystack.includes(t)) {
          tokenSets[t].add(productId);
          continue;
        }

        // match fuzzy: se alguma palavra for "parecida" com o token
        const maxDist = tokenMaxDist(t);
        if (maxDist <= 0) continue;

        // heurística: só compara palavras com tamanho parecido
        for (const w of words) {
          if (Math.abs(w.length - t.length) > maxDist) continue;
          if (levenshteinWithin(w, t, maxDist)) {
            tokenSets[t].add(productId);
            break;
          }
        }
      }
    };

    let query = supabaseAdmin
      .from('products')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false });

    // Filtrar por status ativo/inativo
    if (is_active !== null && is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    // Busca flexível (multi-termos):
    // - Divide em palavras e faz AND entre elas.
    // - Cada palavra pode bater no produto OU em qualquer variação do produto.
    //   Ex.: "cliper limao" encontra produto "Cliper ..." com variação "cola com limao".
    // - Faz varredura em páginas para não depender só dos mais recentes.
    let allProducts: any[] = [];
    let error: any = null;
    if (tokens.length > 0) {
      const tokenSets: Record<string, Set<number>> = Object.fromEntries(tokens.map((t) => [t, new Set<number>()]));

      // 1) Varredura de produtos (name/sku/barcode)
      const pageSize = 500;
      const maxPages = 20; // até 10k produtos (ajustável)
      let scanned = 0;
      for (let page = 0; page < maxPages; page++) {
        const { data: pageRows, error: pageError } = await query
          .order('name', { ascending: true })
          .range(scanned, scanned + pageSize - 1);

        if (pageError) {
          error = pageError;
          break;
        }
        const rows = Array.isArray(pageRows) ? pageRows : [];
        if (rows.length === 0) break;

        for (const product of rows) {
          const pid = Number(product.id);
          if (!Number.isFinite(pid) || pid <= 0) continue;
          const normalizedName = normalizeText(product.name || '');
          const normalizedSku = normalizeText(product.sku || '');
          const normalizedBarcode = normalizeText(product.barcode || '');
          const haystack = `${normalizedName} ${normalizedSku} ${normalizedBarcode}`;
          addMatches(tokenSets, pid, haystack);
        }

        scanned += pageSize;
      }

      // 2) Varredura de variações (label/name/barcode) para complementar matches por token
      try {
        const variantPageSize = 1000;
        const maxVariantPages = 10; // até 10k variações (ajustável)
        let vScanned = 0;
        for (let page = 0; page < maxVariantPages; page++) {
          const { data: pageVariants, error: vErr } = await supabaseAdmin
            .from('product_variants')
            .select('product_id, label, name, barcode')
            .eq('tenant_id', tenant_id)
            .order('id', { ascending: true })
            .range(vScanned, vScanned + variantPageSize - 1);

          if (vErr) {
            console.warn('⚠️ Erro ao varrer variações para busca flexível (ignorado):', vErr);
            break;
          }

          const vars = Array.isArray(pageVariants) ? pageVariants : [];
          if (vars.length === 0) break;

          for (const v of vars) {
            const pid = Number(v.product_id);
            if (!Number.isFinite(pid) || pid <= 0) continue;
            const haystack = `${normalizeText(v.label || '')} ${normalizeText(v.name || '')} ${normalizeText(v.barcode || '')}`;
            addMatches(tokenSets, pid, haystack);
          }

          vScanned += variantPageSize;
        }
      } catch (e) {
        console.warn('⚠️ Falha ao varrer variações para busca flexível (ignorado):', e);
      }

      // 3) Interseção: o produto precisa bater TODOS os tokens (em qualquer combinação produto/variação)
      // Se o usuário digitar uma palavra "errada" a mais, isso poderia zerar os resultados.
      // Então fazemos relaxamento automático: tenta 100% das palavras; se não achar, tenta N-1, etc.
      const counts = new Map<number, number>();
      for (const t of tokens) {
        const setForToken = tokenSets[t] || new Set<number>();
        for (const id of setForToken) {
          counts.set(id, (counts.get(id) || 0) + 1);
        }
      }

      let required = tokens.length;
      let ids: number[] = [];
      while (required > 0) {
        ids = Array.from(counts.entries())
          .filter(([, c]) => c >= required)
          .map(([id]) => id);
        if (ids.length > 0) break;
        required -= 1;
      }

      // Evitar retorno gigantesco quando required relaxa demais
      if (ids.length > 2000) ids = ids.slice(0, 2000);

      if (ids.length === 0) {
        allProducts = [];
      } else {
        // Buscar produtos finais por IDs (chunk para evitar limite do .in)
        const chunkSize = 200;
        const fetched: any[] = [];
        for (let i = 0; i < ids.length; i += chunkSize) {
          const chunk = ids.slice(i, i + chunkSize);
          const { data: chunkProducts, error: pErr } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('tenant_id', tenant_id)
            .in('id', chunk);

          if (pErr) {
            error = pErr;
            break;
          }
          fetched.push(...(chunkProducts || []));
        }
        allProducts = fetched;
      }
    } else {
      // Sem busca: paginação normal no banco
      const res = await query.range(offset, offset + limit - 1);
      allProducts = Array.isArray(res.data) ? res.data : [];
      error = res.error;
    }

    if (error) {
      console.error('❌ Erro ao listar produtos:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao listar produtos: ' + error.message },
        { status: 500 }
      );
    }

    // Se há busca, filtrar/ordenar usando tokens normalizados para garantir flexibilidade
    let products = allProducts || [];
    if (tokens.length > 0 && products.length > 0) {
      // Ranking simples: quem dá match no início do nome recebe prioridade
      const firstToken = tokens[0] || '';
      products = products.sort((a: any, b: any) => {
        const aName = normalizeText(a.name || '');
        const bName = normalizeText(b.name || '');
        const aStarts = firstToken ? aName.startsWith(firstToken) : false;
        const bStarts = firstToken ? bName.startsWith(firstToken) : false;
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aName.localeCompare(bName, 'pt-BR');
      });

      products = products.slice(offset, offset + limit);
    }
    // Quando não há busca, products já está paginado pelo range do Supabase

    // Observação: a busca por variações já foi incorporada na etapa de interseção por token,
    // então não é necessário um segundo passo de "parent products".
    
    // Sempre incluir variações e tipos de preço para cada produto quando disponíveis
    const productIds = products.map((p: any) => Number(p.id)).filter((id: number) => Number.isFinite(id) && id > 0);
    
    if (productIds.length > 0) {
      // Buscar variações de todos os produtos (sem filtrar por is_active para retornar todas)
      const { data: variants, error: variantsError } = await supabaseAdmin
        .from('product_variants')
        .select('*')
        .eq('tenant_id', tenant_id)
        .in('product_id', productIds)
        .order('id', { ascending: true });
      
      const variantsMap: Record<number, any[]> = {};
      if (variantsError) {
        console.error('❌ Erro ao buscar variações:', variantsError);
      }
      if (!variantsError && variants) {
        for (const variant of variants as any[]) {
          const pid = Number(variant.product_id);
          if (!Number.isFinite(pid) || pid <= 0) continue;
          
          if (!variantsMap[pid]) variantsMap[pid] = [];
          variantsMap[pid].push({
            id: variant.id,
            label: variant.label,
            name: variant.name,
            barcode: variant.barcode,
            unit: variant.unit,
            sale_price: variant.sale_price,
            cost_price: variant.cost_price,
            stock_quantity: variant.stock_quantity,
            is_active: variant.is_active,
          });
        }
      }

      // Buscar tipos de preço de todos os produtos
      const { data: tiers, error: tiersError } = await supabaseAdmin
        .from('product_price_tiers')
        .select('id, product_id, price, price_type_id, price_type:product_price_types(id,name,slug,is_active)')
        .eq('tenant_id', tenant_id)
        .in('product_id', productIds)
        .order('price_type_id', { ascending: true });
      
      const priceTiersMap: Record<number, any[]> = {};
      if (!tiersError && tiers) {
        for (const tier of tiers as any[]) {
          const pid = Number(tier.product_id);
          if (!priceTiersMap[pid]) priceTiersMap[pid] = [];
          priceTiersMap[pid].push({
            id: tier.id,
            price: Number(tier.price),
            price_type_id: Number(tier.price_type_id),
            price_type: tier.price_type ? {
              id: Number(tier.price_type.id),
              name: String(tier.price_type.name),
              slug: String(tier.price_type.slug),
              is_active: Boolean(tier.price_type.is_active),
            } : null,
          });
        }
      }

      // Adicionar variações e tipos de preço aos produtos (sempre, mesmo que vazios)
      products = products.map((product: any) => {
        const pid = Number(product.id);
        const productVariants = variantsMap[pid] || [];
        const productPriceTiers = priceTiersMap[pid] || [];
        
        return {
          ...product,
          variants: productVariants,
          price_tiers: productPriceTiers,
        };
      });
    } else {
      // Se não há produtos, garantir que cada produto tenha arrays vazios
      products = products.map((product: any) => ({
        ...product,
        variants: [],
        price_tiers: [],
      }));
    }

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        limit,
        offset,
        count: products.length,
      },
    });
  } catch (error) {
    console.error('❌ Erro no handler de listagem de produtos:', error);
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

export const POST = withApiKeyAuth(createProductHandler, 'products:create');
export const GET = withApiKeyAuth(listProductsHandler, 'products:read');
