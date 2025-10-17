import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

// GET - listar movimentações
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');

    if (!tenant_id) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('stock_movements')
      .select(`
        id,
        product_id,
        movement_type,
        quantity,
        reason,
        created_at,
        products!inner (
          name,
          sku,
          tenant_id
        )
      `)
      .eq('products.tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Erro ao listar movimentações:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Transformar para incluir dados do produto
    const movements = (data || []).map((mov: any) => ({
      id: mov.id,
      product_id: mov.product_id,
      product_name: mov.products?.name,
      product_sku: mov.products?.sku,
      movement_type: mov.movement_type,
      quantity: mov.quantity,
      reason: mov.reason,
      created_at: mov.created_at,
    }));

    return NextResponse.json({ success: true, data: movements });
  } catch (error) {
    console.error('Erro no handler de listagem:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - criar movimentação
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { product_id, movement_type, quantity, reason } = body;

    if (!product_id || !movement_type || !quantity) {
      return NextResponse.json(
        { error: 'Produto, tipo e quantidade são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar produto para atualizar estoque
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('stock_quantity')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    let newStock = product.stock_quantity;
    const qty = parseInt(quantity);

    switch (movement_type) {
      case 'entrada':
        newStock += qty;
        break;
      case 'saida':
        newStock -= qty;
        break;
      case 'ajuste':
        newStock = qty;
        break;
      default:
        return NextResponse.json({ error: 'Tipo de movimentação inválido' }, { status: 400 });
    }

    if (newStock < 0) {
      return NextResponse.json({ error: 'Estoque não pode ficar negativo' }, { status: 400 });
    }

    // Registrar movimentação
    const { data: movement, error: movError } = await supabaseAdmin
      .from('stock_movements')
      .insert({
        product_id,
        movement_type,
        quantity: qty,
        reason: reason || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (movError) {
      console.error('Erro ao criar movimentação:', movError);
      return NextResponse.json({ error: movError.message }, { status: 400 });
    }

    // Atualizar estoque do produto
    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
      .eq('id', product_id);

    if (updateError) {
      console.error('Erro ao atualizar estoque:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar estoque' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: movement });
  } catch (error) {
    console.error('Erro no handler de criação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
