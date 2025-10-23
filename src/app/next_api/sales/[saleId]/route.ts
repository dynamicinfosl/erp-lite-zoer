import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const { saleId } = await params;
    console.log('🔍 API - Buscando venda:', saleId);
    
    // ✅ Supabase Admin sempre configurado com fallbacks

    if (!saleId) {
      console.error('❌ ID da venda não fornecido');
      return NextResponse.json(
        { error: 'ID da venda é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dados da venda (pode ser por ID numérico, UUID ou por número da venda)
    // Primeiro, tentar buscar direto por ID (se for número ou UUID)
    const isNumber = /^\d+$/.test(saleId);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(saleId);
    
    console.log('🔍 saleId:', saleId, '| É número?', isNumber, '| É UUID?', isUUID);
    
    let query = supabaseAdmin
      .from('sales')
      .select('*');
    
    if (isNumber) {
      // Se for número, buscar por ID numérico
      query = query.eq('id', parseInt(saleId));
      console.log('🔍 Buscando por ID numérico:', parseInt(saleId));
    } else if (isUUID) {
      // Se for UUID, buscar por ID UUID
      query = query.eq('id', saleId);
      console.log('🔍 Buscando por ID UUID:', saleId);
    } else {
      // Senão, buscar por sale_number
      query = query.eq('sale_number', saleId);
      console.log('🔍 Buscando por sale_number:', saleId);
    }
    
    const { data: sales, error: saleError } = await query;
    
    // Verificar se encontrou alguma venda
    if (saleError || !sales || sales.length === 0) {
      console.error('❌ Erro ao buscar venda:', saleError || 'Nenhuma venda encontrada');
      return NextResponse.json(
        { error: 'Venda não encontrada', details: saleError?.message || 'Nenhum registro encontrado' },
        { status: 404 }
      );
    }
    
    const sale = sales[0];
    console.log('✅ Venda encontrada:', sale?.id, sale?.sale_number);

    // Buscar itens da venda
    console.log('🔍 Buscando itens para sale_id:', sale.id);
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('sale_items')
      .select('*')
      .eq('sale_id', sale.id);

    if (itemsError) {
      console.error('❌ Erro ao buscar itens da venda:', itemsError);
      // Não retornar erro, apenas usar array vazio
      console.log('⚠️ Continuando sem itens...');
    }
    
    console.log('✅ Itens encontrados:', items?.length || 0, items);

    // Formatar dados da venda
    const saleData = {
      id: sale.id,
      sale_number: sale.sale_number,
      customer_name: sale.customer_name,
      total_amount: sale.total_amount,
      payment_method: sale.payment_method,
      created_at: sale.created_at,
      items: items?.map(item => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal || item.total_price || (item.unit_price * item.quantity)
      })) || []
    };

    console.log('✅ Retornando dados da venda:', saleData);
    return NextResponse.json({ success: true, data: saleData });

  } catch (error) {
    console.error('Erro no handler de busca:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
