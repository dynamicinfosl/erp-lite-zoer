import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiKeyAuth, ApiKeyContext } from '@/lib/api-key-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * PATCH /api/v1/sales/[saleId]
 * Transforma uma venda de balcão em venda de entrega
 * Cria automaticamente o registro de entrega se não existir
 */
async function updateSaleHandler(
  request: NextRequest,
  context: ApiKeyContext
) {
  try {
    const { tenant_id } = context;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const saleId = pathParts[pathParts.length - 1];

    if (!saleId) {
      return NextResponse.json(
        { success: false, error: 'ID da venda é obrigatório' },
        { status: 400 }
      );
    }

    const saleIdNum = parseInt(saleId, 10);
    if (isNaN(saleIdNum)) {
      return NextResponse.json(
        { success: false, error: 'ID da venda inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      sale_type,
      delivery_address,
      delivery_neighborhood,
      delivery_phone,
      delivery_fee,
      notes,
    } = body;

    // Buscar a venda atual
    const { data: sale, error: saleError } = await supabaseAdmin
      .from('sales')
      .select('*, customer_id')
      .eq('id', saleIdNum)
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    if (saleError) {
      console.error('❌ Erro ao buscar venda:', saleError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar venda: ' + saleError.message },
        { status: 500 }
      );
    }

    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Venda não encontrada' },
        { status: 404 }
      );
    }

    // Se está transformando em entrega
    if (sale_type === 'entrega') {
      // Buscar dados do cliente se customer_id existir
      let customerData: any = null;
      if (sale.customer_id) {
        const { data: customer } = await supabaseAdmin
          .from('customers')
          .select('address, neighborhood, city, state, zipcode, phone')
          .eq('id', sale.customer_id)
          .eq('tenant_id', tenant_id)
          .maybeSingle();

        if (customer) {
          customerData = customer;
        }
      }

      // Priorizar endereço do cliente cadastrado, depois usar campos do body
      const finalDeliveryAddress = 
        delivery_address || 
        (customerData?.address ? `${customerData.address}${customerData.neighborhood ? `, ${customerData.neighborhood}` : ''}` : null) ||
        null;
      
      const finalNeighborhood = 
        delivery_neighborhood || 
        customerData?.neighborhood || 
        null;
      
      const finalPhone = 
        delivery_phone || 
        customerData?.phone || 
        null;

      // Atualizar a venda
      const updateData: any = {
        sale_type: 'entrega',
        updated_at: new Date().toISOString(),
      };

      if (delivery_address) {
        updateData.delivery_address = delivery_address;
      }

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { error: updateError } = await supabaseAdmin
        .from('sales')
        .update(updateData)
        .eq('id', saleIdNum)
        .eq('tenant_id', tenant_id);

      if (updateError) {
        console.error('❌ Erro ao atualizar venda:', updateError);
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar venda: ' + updateError.message },
          { status: 500 }
        );
      }

      // Verificar se já existe entrega para esta venda
      const { data: existingDelivery } = await supabaseAdmin
        .from('deliveries')
        .select('id')
        .eq('sale_id', saleIdNum)
        .eq('tenant_id', tenant_id)
        .maybeSingle();

      let delivery = null;

      // Se não existe entrega, criar
      if (!existingDelivery) {
        const deliveryData: any = {
          tenant_id,
          user_id: '00000000-0000-0000-0000-000000000000',
          sale_id: saleIdNum,
          customer_name: sale.customer_name || 'Cliente Avulso',
          delivery_address: finalDeliveryAddress,
          neighborhood: finalNeighborhood,
          phone: finalPhone,
          delivery_fee: delivery_fee ? parseFloat(String(delivery_fee)) : 0,
          status: 'aguardando',
          notes: notes || `Venda convertida para entrega via API - Venda #${sale.sale_number}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (sale.customer_id) {
          deliveryData.customer_id = sale.customer_id;
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
      } else {
        // Se já existe entrega, atualizar dados se fornecidos
        const deliveryUpdate: any = {
          updated_at: new Date().toISOString(),
        };

        if (finalDeliveryAddress) {
          deliveryUpdate.delivery_address = finalDeliveryAddress;
        }
        if (finalNeighborhood) {
          deliveryUpdate.neighborhood = finalNeighborhood;
        }
        if (finalPhone) {
          deliveryUpdate.phone = finalPhone;
        }
        if (delivery_fee !== undefined) {
          deliveryUpdate.delivery_fee = parseFloat(String(delivery_fee));
        }

        const { data: updatedDelivery, error: deliveryUpdateError } = await supabaseAdmin
          .from('deliveries')
          .update(deliveryUpdate)
          .eq('id', existingDelivery.id)
          .select()
          .single();

        if (deliveryUpdateError) {
          console.error('⚠️ Erro ao atualizar entrega:', deliveryUpdateError);
        } else {
          delivery = updatedDelivery;
        }
      }

      // Buscar venda atualizada
      const { data: updatedSale } = await supabaseAdmin
        .from('sales')
        .select('*')
        .eq('id', saleIdNum)
        .single();

      return NextResponse.json({
        success: true,
        data: {
          sale: updatedSale,
          delivery, // Incluir dados da entrega se foi criada/atualizada
        },
      });
    }

    // Para outros tipos de atualização (não transformar em entrega)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (sale_type) {
      updateData.sale_type = sale_type;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data: updatedSale, error: updateError } = await supabaseAdmin
      .from('sales')
      .update(updateData)
      .eq('id', saleIdNum)
      .eq('tenant_id', tenant_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar venda:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar venda: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedSale,
    });
  } catch (error) {
    console.error('❌ Erro no handler de atualização de venda:', error);
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

export const PATCH = withApiKeyAuth(updateSaleHandler, 'sales:update');
