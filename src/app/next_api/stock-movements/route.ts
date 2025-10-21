import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configurações hardcoded para garantir funcionamento
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// GET - listar movimentações
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');

    if (!tenant_id) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Buscar movimentações diretamente sem join problemático
    const { data, error } = await supabaseAdmin
      .from('stock_movements')
      .select(`
        id,
        product_id,
        movement_type,
        quantity,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Erro ao listar movimentações:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Filtrar por tenant_id através dos produtos
    const filteredMovements = [];
    for (const movement of data || []) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('name, sku, tenant_id')
        .eq('id', movement.product_id)
        .eq('tenant_id', tenant_id)
        .single();
      
      if (product) {
        filteredMovements.push({
          ...movement,
          product_name: product.name,
          product_sku: product.sku
        });
      }
    }

    return NextResponse.json({ success: true, data: filteredMovements });
  } catch (error) {
    console.error('Erro no handler de listagem:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - criar movimentação
export async function POST(request: NextRequest) {
  try {

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
