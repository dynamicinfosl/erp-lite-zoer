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

    let query = supabaseAdmin
      .from('products')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false });

    // Filtrar por status ativo/inativo
    if (is_active !== null && is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    // Busca por nome, SKU ou código de barras com normalização flexível
    // Normalizamos o termo de busca para remover acentos e tornar case-insensitive
    const searchTerm = search && search.trim().length > 0 ? search.trim() : null;
    const normalizedSearch = searchTerm ? normalizeText(searchTerm) : null;
    
    // Se há busca, buscamos mais produtos (até 500) para garantir que encontremos todos os possíveis matches
    // mesmo com diferenças de acentuação, e depois filtramos usando normalização no código
    if (searchTerm) {
      // Buscar mais produtos para garantir cobertura completa (busca flexível)
      query = query.range(0, 499); // Buscar até 500 produtos para filtrar depois
    } else {
      // Quando não há busca, aplicar paginação diretamente no banco
      query = query.range(offset, offset + limit - 1);
    }

    const { data: allProducts, error } = await query;

    if (error) {
      console.error('❌ Erro ao listar produtos:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao listar produtos: ' + error.message },
        { status: 500 }
      );
    }

    // Se há busca, filtrar usando normalização para garantir flexibilidade com acentos
    // Isso permite encontrar "Convenção" quando buscar "convencao" (sem acento)
    let products = allProducts || [];
    if (normalizedSearch && products.length > 0) {
      products = products.filter((product: any) => {
        const normalizedName = normalizeText(product.name || '');
        const normalizedSku = normalizeText(product.sku || '');
        const normalizedBarcode = normalizeText(product.barcode || '');
        
        // Busca flexível: verifica se o termo normalizado está contido em qualquer campo normalizado
        return (
          normalizedName.includes(normalizedSearch) ||
          normalizedSku.includes(normalizedSearch) ||
          normalizedBarcode.includes(normalizedSearch)
        );
      });
      
      // Ordenar resultados: produtos que começam com o termo aparecem primeiro
      products = products.sort((a: any, b: any) => {
        const aName = normalizeText(a.name || '');
        const bName = normalizeText(b.name || '');
        const aStarts = aName.startsWith(normalizedSearch);
        const bStarts = bName.startsWith(normalizedSearch);
        
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        // Se ambos começam ou não começam, ordenar alfabeticamente
        return aName.localeCompare(bName, 'pt-BR');
      });
      
      // Aplicar paginação no resultado filtrado
      products = products.slice(offset, offset + limit);
    }
    // Quando não há busca, products já está paginado pelo range do Supabase

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
        console.log(`📦 Buscando variações para ${productIds.length} produtos, encontradas ${variants.length} variações`);
        for (const variant of variants as any[]) {
          const pid = Number(variant.product_id);
          if (!Number.isFinite(pid) || pid <= 0) {
            console.warn('⚠️ Variação com product_id inválido:', variant);
            continue;
          }
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
        console.log(`✅ Variações mapeadas para ${Object.keys(variantsMap).length} produtos`);
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
        
        // Log para debug: verificar produtos com variações e estoque negativo
        if (productVariants.length > 0) {
          console.log(`📦 Produto ${pid} (${product.name}) - Estoque: ${product.stock_quantity}, Variações: ${productVariants.length}`);
        }
        
        // Log para debug se produto tem variações mas não foram encontradas
        if (productVariants.length === 0 && productPriceTiers.length > 0) {
          console.log(`⚠️ Produto ${pid} (${product.name}) tem tipos de preço mas não tem variações mapeadas`);
        }
        
        return {
          ...product,
          variants: productVariants,
          price_tiers: productPriceTiers,
        };
      });
      
      // Log final: quantos produtos têm variações
      const productsWithVariants = products.filter((p: any) => (p.variants || []).length > 0);
      console.log(`✅ Total de produtos retornados: ${products.length}, produtos com variações: ${productsWithVariants.length}`);
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
