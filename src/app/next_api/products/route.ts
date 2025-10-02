import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withPlanValidation } from '@/lib/plan-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Handler original para criar produto
async function createProductHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, name, description, price, stock, category } = body;

    if (!tenant_id || !name || !price) {
      return NextResponse.json(
        { error: 'Tenant ID, nome e preço são obrigatórios' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        tenant_id,
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        category,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar produto:', error);
      return NextResponse.json(
        { error: 'Erro ao criar produto: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Erro no handler de criação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Handler original para listar produtos
async function listProductsHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'Tenant ID é obrigatório' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar produtos:', error);
      return NextResponse.json(
        { error: 'Erro ao listar produtos: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Erro no handler de listagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Exportar handlers com validação de plano
export const POST = withPlanValidation(createProductHandler, 'create_product');
export const GET = listProductsHandler;