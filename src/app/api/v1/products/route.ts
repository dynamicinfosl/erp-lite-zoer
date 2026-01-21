import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiKeyAuth } from '@/lib/api-key-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Normaliza texto removendo acentos e convertendo para lowercase
 * Exemplo: "Café" -> "cafe", "João" -> "joao"
 */
function normalizeText(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtrar por status ativo/inativo
    if (is_active !== null && is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    // Busca por nome, SKU ou código de barras
    // Buscamos mais resultados para poder filtrar com normalização depois
    const searchTerm = search && search.trim().length > 0 ? search.trim() : null;
    const normalizedSearch = searchTerm ? normalizeText(searchTerm) : null;
    
    if (searchTerm) {
      // Busca inicial usando ilike (case-insensitive, mas não remove acentos)
      // Buscamos mais resultados (até 3x o limite) para garantir que encontremos produtos mesmo com variações de acentos
      query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      query = query.range(offset, offset + (limit * 3) - 1); // Buscar mais para filtrar depois
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
    let products = allProducts || [];
    if (normalizedSearch && products.length > 0) {
      products = products.filter((product: any) => {
        const normalizedName = normalizeText(product.name || '');
        const normalizedSku = normalizeText(product.sku || '');
        const normalizedBarcode = normalizeText(product.barcode || '');
        
        return (
          normalizedName.includes(normalizedSearch) ||
          normalizedSku.includes(normalizedSearch) ||
          normalizedBarcode.includes(normalizedSearch)
        );
      });
      
      // Quando há busca, aplicamos paginação no resultado filtrado
      // (porque buscamos mais resultados para garantir que encontremos produtos mesmo com variações de acentos)
      products = products.slice(offset, offset + limit);
    }
    // Quando não há busca, products já está paginado pelo range do Supabase

    // Se solicitado, incluir variações e tipos de preço para cada produto
    if (include_variants || include_price_tiers) {
      const productIds = products.map((p: any) => Number(p.id)).filter((id: number) => Number.isFinite(id) && id > 0);
      
      if (productIds.length > 0) {
        // Buscar variações se solicitado
        let variantsMap: Record<number, any[]> = {};
        if (include_variants) {
          const { data: variants, error: variantsError } = await supabaseAdmin
            .from('product_variants')
            .select('*')
            .eq('tenant_id', tenant_id)
            .in('product_id', productIds)
            .eq('is_active', true);
          
          if (!variantsError && variants) {
            for (const variant of variants as any[]) {
              const pid = Number(variant.product_id);
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
              });
            }
          }
        }

        // Buscar tipos de preço se solicitado
        let priceTiersMap: Record<number, any[]> = {};
        if (include_price_tiers) {
          const { data: tiers, error: tiersError } = await supabaseAdmin
            .from('product_price_tiers')
            .select('id, product_id, price, price_type_id, price_type:product_price_types(id,name,slug,is_active)')
            .eq('tenant_id', tenant_id)
            .in('product_id', productIds);
          
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
        }

        // Adicionar variações e tipos de preço aos produtos
        products = products.map((product: any) => ({
          ...product,
          ...(include_variants && { variants: variantsMap[Number(product.id)] || [] }),
          ...(include_price_tiers && { price_tiers: priceTiersMap[Number(product.id)] || [] }),
        }));
      }
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
