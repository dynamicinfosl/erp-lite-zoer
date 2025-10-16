import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function GET(
  request: NextRequest,
  { params }: { params: { saleId: string } }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    const saleId = params.saleId;

    if (!saleId) {
      return NextResponse.json(
        { error: 'ID da venda é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dados da venda (pode ser por ID ou por número da venda)
    let query = supabaseAdmin
      .from('sales')
      .select('*');
    
    // Se for um UUID, buscar por ID, senão buscar por sale_number
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(saleId);
    
    if (isUUID) {
      query = query.eq('id', saleId);
    } else {
      query = query.eq('sale_number', saleId);
    }
    
    const { data: sale, error: saleError } = await query.single();

    if (saleError) {
      console.error('Erro ao buscar venda:', saleError);
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      );
    }

    // Buscar itens da venda
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('sale_items')
      .select('*')
      .eq('sale_id', saleId);

    if (itemsError) {
      console.error('Erro ao buscar itens da venda:', itemsError);
      return NextResponse.json(
        { error: 'Erro ao buscar itens da venda' },
        { status: 400 }
      );
    }

    // Formatar dados da venda
    const saleData = {
      id: sale.id,
      sale_number: sale.sale_number,
      customer_name: sale.customer_name,
      total_amount: sale.total_amount,
      payment_method: sale.payment_method,
      created_at: sale.created_at,
      items: items.map(item => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal || item.total_price || (item.unit_price * item.quantity)
      }))
    };

    return NextResponse.json({ success: true, data: saleData });

  } catch (error) {
    console.error('Erro no handler de busca:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
