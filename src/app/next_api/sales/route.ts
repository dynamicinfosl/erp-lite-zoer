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
    const { customer_id, products, total, payment_method } = body;

    if (!products || !total) {
      return NextResponse.json(
        { error: 'Produtos e total são obrigatórios' },
        { status: 400 }
      );
    }

    // Gerar número da venda (versão simplificada)
    const { data: saleNumber, error: numberError } = await supabaseAdmin
      .rpc('generate_sale_number');

    if (numberError) {
      console.error('Erro ao gerar número da venda:', numberError);
      return NextResponse.json(
        { error: 'Erro ao gerar número da venda' },
        { status: 400 }
      );
    }

    // Criar a venda (versão simplificada)
    const { data: sale, error: saleError } = await supabaseAdmin
      .from('sales')
      .insert({
        sale_number: saleNumber,
        customer_name: body.customer_name || 'Cliente Avulso',
        total_amount: parseFloat(total),
        payment_method,
        status: 'completed',
        notes: body.notes || null,
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
    const saleItems = products.map((product: any) => {
      const discountAmount = (product.price * product.quantity * (product.discount || 0)) / 100;
      const subtotal = (product.price * product.quantity) - discountAmount;
      
      return {
        sale_id: sale.id,
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        unit_price: product.price,
        quantity: product.quantity,
        discount_percentage: product.discount || 0,
        subtotal: subtotal,
      };
    });

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
    const today = searchParams.get('today');

    let query = supabaseAdmin
      .from('sales')
      .select(`
        *,
        items:sale_items(
          *,
          product:products(name, price)
        )
      `);

    // Se solicitado apenas vendas de hoje
    if (today === 'true') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      query = query
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

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