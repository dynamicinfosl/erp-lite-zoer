import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Buscar dados do cliente se customer_id estiver presente
    // (muitas vendas de balcão antigas podem ter só customer_name, então tem fallback por nome abaixo)
    let customerData: any = null;
    if (sale.customer_id) {
      console.log('🔍 Buscando dados do cliente:', sale.customer_id);
      const { data: customer, error: customerError } = await supabaseAdmin
        .from('customers')
        .select('id, name, address, neighborhood, city, state, zipcode, phone, document')
        .eq('id', Number(sale.customer_id))
        .eq('tenant_id', sale.tenant_id)
        .single();

      if (!customerError && customer) {
        customerData = customer;
        console.log('✅ Dados do cliente encontrados:', {
          id: customer.id,
          name: customer.name,
          hasAddress: !!customer.address,
          hasNeighborhood: !!customer.neighborhood,
        });
      } else {
        console.warn('⚠️ Cliente não encontrado:', sale.customer_id, customerError);
      }
    }

    // Fallback: se não tem customer_id na venda, tentar achar o cliente pelo nome
    // (melhora cupom de balcão com endereço quando o cliente está cadastrado)
    if (!customerData && sale.tenant_id && sale.customer_name) {
      const name = String(sale.customer_name || '').trim();
      const isAvulso = name.length === 0 || name.toLowerCase() === 'cliente avulso';
      if (!isAvulso) {
        console.log('🔎 Fallback: buscando cliente por nome:', name);

        // 1) tentar match “exato” (sem curingas)
        let { data: customerByName, error: byNameError } = await supabaseAdmin
          .from('customers')
          .select('id, name, address, neighborhood, city, state, zipcode, phone, document')
          .eq('tenant_id', sale.tenant_id)
          .ilike('name', name)
          .limit(1);

        // 2) se não achar, tentar match parcial (mais tolerante)
        if ((!byNameError && (!customerByName || customerByName.length === 0)) && name.length >= 3) {
          const pattern = `%${name}%`;
          console.log('🔎 Fallback: tentando match parcial:', pattern);
          const res = await supabaseAdmin
            .from('customers')
            .select('id, name, address, neighborhood, city, state, zipcode, phone, document')
            .eq('tenant_id', sale.tenant_id)
            .ilike('name', pattern)
            .limit(1);
          customerByName = res.data as any;
          byNameError = res.error as any;
        }

        if (!byNameError && customerByName && customerByName.length > 0) {
          customerData = customerByName[0];
          console.log('✅ Cliente encontrado por nome (fallback):', { id: customerData.id, name: customerData.name });
        } else {
          console.warn('⚠️ Fallback por nome não encontrou cliente:', byNameError);
        }
      }
    }

    // Formatar dados da venda
    const saleData = {
      id: sale.id,
      sale_number: sale.sale_number,
      customer_name: sale.customer_name,
      customer_id: sale.customer_id,
      customer: customerData ? {
        id: customerData.id,
        name: customerData.name,
        address: customerData.address,
        neighborhood: customerData.neighborhood,
        city: customerData.city,
        state: customerData.state,
        zipcode: customerData.zipcode,
        phone: customerData.phone,
        document: customerData.document,
      } : null,
      seller_name: sale.seller_name,
      total_amount: sale.total_amount,
      final_amount: sale.final_amount,
      payment_method: sale.payment_method,
      payment_condition: sale.payment_condition,
      created_at: sale.created_at,
      delivery_date: sale.delivery_date,
      carrier_name: sale.carrier_name,
      delivery_address: sale.delivery_address,
      notes: sale.notes,
      tenant_id: sale.tenant_id,
      sale_source: sale.sale_source,
      sale_type: sale.sale_type,
      items: items?.map(item => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal || item.total_price || (item.unit_price * item.quantity)
      })) || []
    };

    console.log('✅ Retornando dados da venda:', saleData);
    return NextResponse.json(
      { success: true, data: saleData },
      { headers: { 'Cache-Control': 'no-store' } },
    );

  } catch (error) {
    console.error('Erro no handler de busca:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const { saleId } = await params;
    const body = await request.json();
    
    console.log('✏️ API - Editando venda:', saleId);
    console.log('📝 Dados recebidos:', body);
    
    if (!saleId) {
      console.error('❌ ID da venda não fornecido');
      return NextResponse.json(
        { error: 'ID da venda é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a venda existe
    const isNumber = /^\d+$/.test(saleId);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(saleId);
    
    let query = supabaseAdmin
      .from('sales')
      .select('id, tenant_id, user_id');
    
    if (isNumber) {
      query = query.eq('id', parseInt(saleId));
    } else if (isUUID) {
      query = query.eq('id', saleId);
    } else {
      query = query.eq('sale_number', saleId);
    }
    
    const { data: sales, error: saleError } = await query;
    
    if (saleError || !sales || sales.length === 0) {
      console.error('❌ Venda não encontrada:', saleError);
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      );
    }

    const sale = sales[0] as any;
    
    // Preparar dados de atualização
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Adicionar apenas campos que foram enviados
    if (body.customer_name !== undefined) updateData.customer_name = body.customer_name;
    if (body.customer_id !== undefined) updateData.customer_id = body.customer_id === null ? null : body.customer_id;
    if (body.payment_method !== undefined) updateData.payment_method = body.payment_method;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    // Se vier total_amount explicitamente e não vier products, respeitar.
    // Se vier products, o total será recalculado a partir dos itens (mais confiável).
    const hasProductsArray = Array.isArray(body?.products);
    if (!hasProductsArray && body.total_amount !== undefined) {
      const total = parseFloat(body.total_amount);
      if (!isNaN(total) && total >= 0) {
        updateData.total_amount = total;
        updateData.final_amount = total;
      }
    }

    // ✅ Se vier products/items, atualizar também os itens da venda (sale_items) e recalcular total.
    if (hasProductsArray) {
      const products = body.products as any[];
      const cleaned = products
        .map((p) => ({
          id: p?.id === null || p?.id === undefined ? null : Number(p.id),
          name: String(p?.name || p?.product_name || '').trim(),
          price: Number(p?.price ?? p?.unit_price),
          quantity: Number(p?.quantity),
          discount: Number(p?.discount || 0),
        }))
        .filter((p) => p.name && Number.isFinite(p.price) && Number.isFinite(p.quantity) && p.quantity > 0);

      // Recalcular total a partir dos itens
      const computedTotal = cleaned.reduce((acc, p) => {
        const discountAmount = (p.price * p.quantity * (p.discount || 0)) / 100;
        const subtotal = (p.price * p.quantity) - discountAmount;
        return acc + subtotal;
      }, 0);

      updateData.total_amount = computedTotal;
      updateData.final_amount = computedTotal;

      // Substituir itens: apagar e inserir novamente
      const saleIdNum = Number(sale.id);
      await supabaseAdmin.from('sale_items').delete().eq('sale_id', saleIdNum);

      const tenantId = sale.tenant_id || body.tenant_id;
      const userId = sale.user_id || body.user_id || '00000000-0000-0000-0000-000000000000';
      const now = new Date().toISOString();

      const saleItems = cleaned.map((p) => {
        const discountAmount = (p.price * p.quantity * (p.discount || 0)) / 100;
        const subtotal = (p.price * p.quantity) - discountAmount;
        const itemData: any = {
          sale_id: saleIdNum,
          tenant_id: tenantId,
          user_id: userId,
          product_name: p.name,
          unit_price: p.price,
          quantity: p.quantity,
          subtotal: subtotal,
          total_price: subtotal,
          created_at: now,
          updated_at: now,
        };
        if (p.id !== null && Number.isFinite(p.id)) itemData.product_id = p.id;
        return itemData;
      });

      if (saleItems.length > 0) {
        const { error: itemsError } = await supabaseAdmin.from('sale_items').insert(saleItems);
        if (itemsError) {
          console.error('❌ Erro ao atualizar itens da venda:', itemsError);
          return NextResponse.json(
            { error: 'Erro ao atualizar itens da venda: ' + itemsError.message },
            { status: 400 }
          );
        }
      }
    }

    console.log('💾 Atualizando venda:', updateData);

    const { data: updatedSale, error: updateError } = await supabaseAdmin
      .from('sales')
      .update(updateData)
      .eq('id', sale.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar venda:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar venda: ' + updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Venda atualizada com sucesso:', updatedSale.id);
    return NextResponse.json({ 
      success: true, 
      message: 'Venda atualizada com sucesso',
      data: updatedSale
    });

  } catch (error: any) {
    console.error('❌ Erro no handler de atualização:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error?.message || 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const { saleId } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard_delete') === 'true';
    
    console.log('🗑️ API - ' + (hardDelete ? 'Excluindo' : 'Cancelando') + ' venda:', saleId);
    
    if (!saleId) {
      console.error('❌ ID da venda não fornecido');
      return NextResponse.json(
        { error: 'ID da venda é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a venda existe
    const isNumber = /^\d+$/.test(saleId);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(saleId);
    
    let query = supabaseAdmin
      .from('sales')
      .select('id, status');
    
    if (isNumber) {
      query = query.eq('id', parseInt(saleId));
    } else if (isUUID) {
      query = query.eq('id', saleId);
    } else {
      query = query.eq('sale_number', saleId);
    }
    
    const { data: sales, error: saleError } = await query;
    
    if (saleError || !sales || sales.length === 0) {
      console.error('❌ Venda não encontrada:', saleError);
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      );
    }

    const sale = sales[0];
    
    // Se hard_delete=true, excluir permanentemente (apenas se já estiver cancelada)
    if (hardDelete) {
      if (sale.status !== 'canceled' && sale.status !== 'cancelada') {
        return NextResponse.json(
          { error: 'Apenas vendas canceladas podem ser excluídas permanentemente' },
          { status: 400 }
        );
      }

      // Excluir itens da venda primeiro (devido à foreign key)
      const saleIdNum = Number(sale.id);
      await supabaseAdmin.from('sale_items').delete().eq('sale_id', saleIdNum);

      // Excluir a venda permanentemente
      const { error: deleteError } = await supabaseAdmin
        .from('sales')
        .delete()
        .eq('id', sale.id);

      if (deleteError) {
        console.error('❌ Erro ao excluir venda:', deleteError);
        return NextResponse.json(
          { error: 'Erro ao excluir venda: ' + deleteError.message },
          { status: 500 }
        );
      }

      console.log('✅ Venda excluída permanentemente:', sale.id);
      return NextResponse.json({ 
        success: true, 
        message: 'Venda excluída permanentemente',
        data: { id: sale.id }
      });
    }

    // Se não for hard_delete, apenas cancelar (comportamento padrão)
    // Verificar se já está cancelada
    if (sale.status === 'canceled' || sale.status === 'cancelada') {
      return NextResponse.json(
        { error: 'Venda já está cancelada' },
        { status: 400 }
      );
    }

    // Atualizar status para cancelada em vez de deletar (melhor prática)
    const { error: updateError } = await supabaseAdmin
      .from('sales')
      .update({ status: 'canceled' })
      .eq('id', sale.id);

    if (updateError) {
      console.error('❌ Erro ao cancelar venda:', updateError);
      return NextResponse.json(
        { error: 'Erro ao cancelar venda: ' + updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Venda cancelada com sucesso:', sale.id);
    return NextResponse.json({ 
      success: true, 
      message: 'Venda cancelada com sucesso',
      data: { id: sale.id, status: 'canceled' }
    });

  } catch (error: any) {
    console.error('❌ Erro no handler de cancelamento/exclusão:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error?.message || 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}