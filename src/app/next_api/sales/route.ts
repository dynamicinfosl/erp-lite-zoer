import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withPlanValidation } from '@/lib/plan-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificar se as variáveis estão definidas
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variáveis do Supabase não configuradas em sales route:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceKey
  });
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Handler original para criar venda
async function createSaleHandler(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { tenant_id, customer_id, products, total, payment_method } = body;

    if (!tenant_id || !products || !total) {
      return NextResponse.json(
        { error: 'Tenant ID, produtos e total são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar a venda
    const { data: sale, error: saleError } = await supabaseAdmin
      .from('sales')
      .insert({
        tenant_id,
        customer_id,
        total: parseFloat(total),
        payment_method,
        status: 'completed',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saleError) {
      console.error('Erro ao criar venda:', saleError);
      return NextResponse.json(
        { error: 'Erro ao criar venda: ' + saleError.message },
        { status: 400 }
      );
    }

    // Criar itens da venda
    const saleItems = products.map((product: any) => ({
      sale_id: sale.id,
      product_id: product.id,
      quantity: product.quantity,
      price: product.price,
      subtotal: product.quantity * product.price,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) {
      console.error('Erro ao criar itens da venda:', itemsError);
      // Tentar deletar a venda criada
      await supabaseAdmin.from('sales').delete().eq('id', sale.id);
      return NextResponse.json(
        { error: 'Erro ao criar itens da venda: ' + itemsError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: sale });

  } catch (error) {
    console.error('Erro no handler de criação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Handler original para listar vendas
async function listSalesHandler(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Tenant ID é obrigatório' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('sales')
      .select(`
        *,
        customer:customers(name, email),
        items:sale_items(
          *,
          product:products(name, price)
        )
      `)
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar vendas:', error);
      return NextResponse.json(
        { error: 'Erro ao listar vendas: ' + error.message },
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
export const POST = withPlanValidation(createSaleHandler, 'create_sale');
export const GET = listSalesHandler;