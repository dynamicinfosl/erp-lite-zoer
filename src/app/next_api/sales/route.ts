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
    const { customer_id, products, total, total_amount, payment_method, tenant_id, user_id, sale_type } = body;
    
    // Usar total_amount se fornecido, senão usar total
    const finalTotal = total_amount || total;

    console.log('📝 Dados recebidos na venda:', { 
      tenant_id, 
      total, 
      finalTotal, 
      payment_method, 
      productsCount: products?.length,
      customer_name: body.customer_name,
      user_id: user_id 
    });

    if (!products || !finalTotal) {
      return NextResponse.json(
        { error: 'Produtos e total são obrigatórios' },
        { status: 400 }
      );
    }

    if (!tenant_id || tenant_id === '00000000-0000-0000-0000-000000000000') {
      return NextResponse.json(
        { error: 'Tenant ID é obrigatório' },
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
        tenant_id: tenant_id, // ✅ Usar tenant_id validado
        user_id: user_id || '00000000-0000-0000-0000-000000000000', // ✅ Adicionar user_id
        sale_type: sale_type || null, // ✅ Usar NULL como padrão
        sale_number: saleNumber,
        customer_name: body.customer_name || 'Cliente Avulso',
        total_amount: parseFloat(finalTotal),
        final_amount: parseFloat(finalTotal),
        payment_method,
        status: null, // ✅ Usar NULL para evitar constraint
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

    // Criar itens da venda (versão simplificada sem discount_percentage)
    const saleItems = products.map((product: any) => {
      const discountAmount = (product.price * product.quantity * (product.discount || 0)) / 100;
      const subtotal = (product.price * product.quantity) - discountAmount;
      
      return {
        sale_id: sale.id,
        user_id: user_id || '00000000-0000-0000-0000-000000000000', // ✅ Adicionar user_id
        product_id: product.id,
        product_name: product.name,
        // product_code: product.code, // ✅ Removido temporariamente
        unit_price: product.price,
        quantity: product.quantity,
        // discount_percentage: product.discount || 0, // ✅ Removido temporariamente
        subtotal: subtotal,
        total_price: subtotal, // ✅ Adicionar total_price (mesmo valor do subtotal)
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
    const tenant_id = searchParams.get('tenant_id');
    const tzParam = searchParams.get('tz'); // minutos de offset do fuso (ex: -180 para BRT)

    console.log(`💰 GET /sales - tenant_id: ${tenant_id}, today: ${today}`);

    let query = supabaseAdmin
      .from('sales')
      .select(`
        *,
        items:sale_items(
          *,
          product:products(name, price)
        )
      `);

    // Filtrar por tenant_id se fornecido
    if (tenant_id && tenant_id !== '00000000-0000-0000-0000-000000000000') {
      query = query.eq('tenant_id', tenant_id);
      console.log(`🔍 Buscando vendas com tenant_id: ${tenant_id}`);
    } else {
      console.log('⚠️ GET /sales - Nenhum tenant_id válido fornecido');
    }

    // Se solicitado apenas vendas de hoje
    if (today === 'true') {
      // Ajuste de fuso horário: o frontend envia o offset em minutos (Date.getTimezoneOffset()*-1)
      const clientOffsetMin = Number.isFinite(Number(tzParam)) ? parseInt(tzParam as string, 10) : 0;
      // Janela do dia no fuso do cliente convertida para UTC
      const startLocal = new Date();
      startLocal.setHours(0, 0, 0, 0);
      const endLocal = new Date();
      endLocal.setHours(23, 59, 59, 999);
      const startUtc = new Date(startLocal.getTime() - clientOffsetMin * 60000);
      const endUtc = new Date(endLocal.getTime() - clientOffsetMin * 60000);

      query = query
        .gte('created_at', startUtc.toISOString())
        .lte('created_at', endUtc.toISOString());
    }

    let { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao listar vendas:', error);
      return NextResponse.json(
        { error: 'Erro ao listar vendas: ' + error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Vendas encontradas: ${data?.length || 0} para tenant: ${tenant_id}`);
    // Fallback DEV: se não retornou nada, tentar sem filtro de tenant (útil quando vendas antigas foram salvas com tenant diferente)
    if ((data?.length || 0) === 0 && tenant_id) {
      try {
        let fallbackQuery = supabaseAdmin
          .from('sales')
          .select(`*, items:sale_items(*, product:products(name, price))`);
        if (today === 'true') {
          const clientOffsetMin = Number.isFinite(Number(searchParams.get('tz'))) ? parseInt(searchParams.get('tz') as string, 10) : 0;
          const startLocal = new Date(); startLocal.setHours(0,0,0,0);
          const endLocal = new Date(); endLocal.setHours(23,59,59,999);
          const startUtc = new Date(startLocal.getTime() - clientOffsetMin * 60000);
          const endUtc = new Date(endLocal.getTime() - clientOffsetMin * 60000);
          fallbackQuery = fallbackQuery.gte('created_at', startUtc.toISOString()).lte('created_at', endUtc.toISOString());
        }
        const fb = await fallbackQuery.order('created_at', { ascending: false });
        if (!fb.error && fb.data) {
          data = fb.data;
          console.log('ℹ️ Fallback sem tenant aplicado. Registros:', data.length);
        }
      } catch (e) {
        console.log('⚠️ Falha no fallback de vendas:', e);
      }
    }
    
    // Retornar no formato esperado pelo frontend
    if (today === 'true') {
      return NextResponse.json({ success: true, sales: data });
    } else {
      return NextResponse.json({ success: true, data: data });
    }

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