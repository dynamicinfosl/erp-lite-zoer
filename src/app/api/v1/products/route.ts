import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiKeyAuth } from '@/lib/api-key-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim();
      query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('❌ Erro ao listar produtos:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao listar produtos: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: products || [],
      pagination: {
        limit,
        offset,
        count: products?.length || 0,
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
