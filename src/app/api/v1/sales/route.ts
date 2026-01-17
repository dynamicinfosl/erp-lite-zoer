import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiKeyAuth } from '@/lib/api-key-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/v1/sales
 * Cria uma nova venda via API externa
 * Quando sale_type='entrega', cria automaticamente o registro de entrega
 */
async function createSaleHandler(
  request: NextRequest,
  context: { tenant_id: string; api_key_id: string; permissions: string[] }
) {
  try {
    const { tenant_id } = context;
    const body = await request.json();

    const {
      customer_id,
      customer_name,
      products,
      total_amount,
      payment_method,
      sale_type,
      delivery_address,
      delivery_neighborhood,
      delivery_phone,
      delivery_fee,
      notes,
    } = body;

    // Validações básicas
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lista de produtos é obrigatória e não pode estar vazia' },
        { status: 400 }
      );
    }

    if (!total_amount || isNaN(Number(total_amount))) {
      return NextResponse.json(
        { success: false, error: 'total_amount é obrigatório e deve ser um número' },
        { status: 400 }
      );
    }

    if (!payment_method) {
      return NextResponse.json(
        { success: false, error: 'payment_method é obrigatório' },
        { status: 400 }
      );
    }

    // Validações específicas para vendas de entrega
    if (sale_type === 'entrega') {
      if (!delivery_address || delivery_address.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'delivery_address é obrigatório para vendas de entrega' },
          { status: 400 }
        );
      }

      if (!delivery_phone || delivery_phone.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'delivery_phone é obrigatório para vendas de entrega' },
          { status: 400 }
        );
      }
    }

    // Gerar número da venda
    const { data: saleNumber, error: numberError } = await supabaseAdmin.rpc('generate_sale_number');

    if (numberError || !saleNumber) {
      console.error('❌ Erro ao gerar número da venda:', numberError);
      return NextResponse.json(
        { success: false, error: 'Erro ao gerar número da venda' },
        { status: 500 }
      );
    }

    // Criar a venda
    const currentDate = new Date();
    const createdAt = currentDate.toISOString();

    const saleData: any = {
      tenant_id,
      user_id: '00000000-0000-0000-0000-000000000000', // API externa usa UUID padrão
      branch_id: null,
      sale_type: sale_type || 'balcao',
      sale_number: saleNumber,
      customer_id: customer_id || null,
      customer_name: customer_name || 'Cliente Avulso',
      total_amount: parseFloat(String(total_amount)),
      discount_amount: 0,
      final_amount: parseFloat(String(total_amount)),
      payment_method,
      status: null,
      notes: notes || null,
      sale_source: 'api', // Marcar como venda via API
      created_at: createdAt,
    };

    // Adicionar campos de entrega na venda se aplicável
    if (sale_type === 'entrega') {
      if (delivery_address) {
        saleData.delivery_address = delivery_address;
      }
    }

    const { data: sale, error: saleError } = await supabaseAdmin
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (saleError) {
      console.error('❌ Erro ao criar venda:', saleError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar venda: ' + saleError.message },
        { status: 500 }
      );
    }

    // Criar itens da venda
    const saleItems = products.map((product: any) => {
      const subtotal = (Number(product.price) || 0) * (Number(product.quantity) || 0);

      const itemData: any = {
        sale_id: sale.id,
        tenant_id,
        user_id: '00000000-0000-0000-0000-000000000000',
        product_name: product.name || 'Produto',
        unit_price: Number(product.price) || 0,
        quantity: Number(product.quantity) || 0,
        subtotal,
        total_price: subtotal,
      };

      // Adicionar product_id se fornecido
      if (product.product_id !== null && product.product_id !== undefined) {
        itemData.product_id = Number(product.product_id);
      }

      return itemData;
    });

    const { error: itemsError } = await supabaseAdmin.from('sale_items').insert(saleItems);

    if (itemsError) {
      console.error('❌ Erro ao criar itens da venda:', itemsError);
      // Tentar deletar a venda criada
      await supabaseAdmin.from('sales').delete().eq('id', sale.id);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar itens da venda: ' + itemsError.message },
        { status: 500 }
      );
    }

    // Se for venda de entrega, criar registro de entrega automaticamente
    let delivery = null;
    if (sale_type === 'entrega') {
      const deliveryData: any = {
        tenant_id,
        user_id: '00000000-0000-0000-0000-000000000000',
        sale_id: sale.id,
        customer_name: customer_name || 'Cliente Avulso',
        delivery_address: delivery_address || 'Endereço não informado',
        neighborhood: delivery_neighborhood || null,
        phone: delivery_phone || null,
        delivery_fee: delivery_fee ? parseFloat(String(delivery_fee)) : 0,
        status: 'aguardando',
        notes: notes || `Venda de entrega criada via API - Venda #${saleNumber}`,
        created_at: createdAt,
        updated_at: createdAt,
      };

      // Adicionar customer_id se fornecido
      if (customer_id) {
        deliveryData.customer_id = Number(customer_id);
      }

      const { data: createdDelivery, error: deliveryError } = await supabaseAdmin
        .from('deliveries')
        .insert(deliveryData)
        .select()
        .single();

      if (deliveryError) {
        console.error('⚠️ Erro ao criar entrega automaticamente:', deliveryError);
        // Não falhar a venda se a entrega falhar, apenas logar o erro
      } else {
        delivery = createdDelivery;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        sale,
        delivery, // Incluir dados da entrega se foi criada
      },
    });
  } catch (error) {
    console.error('❌ Erro no handler de criação de venda:', error);
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
 * GET /api/v1/sales
 * Lista vendas do tenant
 */
async function listSalesHandler(
  request: NextRequest,
  context: { tenant_id: string; api_key_id: string; permissions: string[] }
) {
  try {
    const { tenant_id } = context;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sale_type = searchParams.get('sale_type');

    let query = supabaseAdmin
      .from('sales')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sale_type) {
      query = query.eq('sale_type', sale_type);
    }

    const { data: sales, error } = await query;

    if (error) {
      console.error('❌ Erro ao listar vendas:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao listar vendas: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sales || [],
      pagination: {
        limit,
        offset,
        count: sales?.length || 0,
      },
    });
  } catch (error) {
    console.error('❌ Erro no handler de listagem de vendas:', error);
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

export const POST = withApiKeyAuth(createSaleHandler, 'sales:create');
export const GET = withApiKeyAuth(listSalesHandler, 'sales:read');
