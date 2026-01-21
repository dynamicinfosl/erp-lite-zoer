import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiKeyAuth } from '@/lib/api-key-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/v1/products/[productId]
 * Busca um produto específico por ID
 */
async function getProductHandler(
  request: NextRequest,
  context: { tenant_id: string; api_key_id: string; permissions: string[] }
) {
  try {
    const { tenant_id } = context;
    // Extrair productId da URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }

    const productIdNum = parseInt(productId, 10);
    if (isNaN(productIdNum)) {
      return NextResponse.json(
        { success: false, error: 'ID do produto inválido' },
        { status: 400 }
      );
    }

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productIdNum)
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    if (error) {
      console.error('❌ Erro ao buscar produto:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar produto: ' + error.message },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Buscar variações do produto
    const { data: variants, error: variantsError } = await supabaseAdmin
      .from('product_variants')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('product_id', productIdNum)
      .eq('is_active', true)
      .order('id', { ascending: true });

    // Buscar tipos de preço do produto
    const { data: tiers, error: tiersError } = await supabaseAdmin
      .from('product_price_tiers')
      .select('id, product_id, price, price_type_id, price_type:product_price_types(id,name,slug,is_active)')
      .eq('tenant_id', tenant_id)
      .eq('product_id', productIdNum)
      .order('price_type_id', { ascending: true });

    // Montar resposta com variações e tipos de preço
    const productWithDetails = {
      ...product,
      variants: variantsError ? [] : (variants || []).map((v: any) => ({
        id: v.id,
        label: v.label,
        name: v.name,
        barcode: v.barcode,
        unit: v.unit,
        sale_price: v.sale_price,
        cost_price: v.cost_price,
        stock_quantity: v.stock_quantity,
      })),
      price_tiers: tiersError ? [] : (tiers || []).map((t: any) => ({
        id: t.id,
        price: Number(t.price),
        price_type_id: Number(t.price_type_id),
        price_type: t.price_type ? {
          id: Number(t.price_type.id),
          name: String(t.price_type.name),
          slug: String(t.price_type.slug),
          is_active: Boolean(t.price_type.is_active),
        } : null,
      })),
    };

    return NextResponse.json({
      success: true,
      data: productWithDetails,
    });
  } catch (error) {
    console.error('❌ Erro no handler de busca de produto:', error);
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

export const GET = withApiKeyAuth(getProductHandler, 'products:read');
