import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// GET - buscar entregas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const driver_id = searchParams.get('driver_id');
    const status = searchParams.get('status');
    const manifest_id = searchParams.get('manifest_id');
    const sale_id = searchParams.get('sale_id');

    if (!tenant_id) {
      return NextResponse.json(
        { success: false, errorMessage: "tenant_id é obrigatório" },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('deliveries')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Converter tipos corretamente para os filtros
    if (driver_id) {
      const driverIdNum = parseInt(driver_id, 10);
      if (!isNaN(driverIdNum)) {
        query = query.eq('driver_id', driverIdNum);
      }
    }
    if (status) query = query.eq('status', status);
    if (manifest_id) query = query.eq('manifest_id', manifest_id);
    if (sale_id) {
      const saleIdNum = parseInt(sale_id, 10);
      if (!isNaN(saleIdNum)) {
        query = query.eq('sale_id', saleIdNum);
      }
    }

    const { data: deliveries, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar entregas:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json(
        { 
          success: false, 
          errorMessage: "Erro ao buscar entregas",
          error: error.message,
          details: process.env.NODE_ENV === 'development' ? error.details : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: deliveries || [] });
  } catch (error: any) {
    console.error('❌ Erro ao buscar entregas (catch):', error);
    console.error('❌ Stack trace:', error?.stack);
    return NextResponse.json(
      { 
        success: false, 
        errorMessage: "Erro ao buscar entregas",
        error: error?.message || 'Erro desconhecido',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST - criar nova entrega
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validações
    if (!body.tenant_id) {
      return NextResponse.json(
        { success: false, errorMessage: "Tenant ID é obrigatório" },
        { status: 400 }
      );
    }

    // Preferência: endereço vem do cadastro do cliente
    let customerName = body.customer_name;
    let deliveryAddress = body.delivery_address;
    let neighborhood = body.neighborhood || null;
    let phone = body.phone || null;

    if (body.customer_id) {
      // Converter customer_id para número se necessário
      const customerId = typeof body.customer_id === 'string' ? parseInt(body.customer_id, 10) : body.customer_id;
      
      console.log('🔍 Buscando cliente para entrega:', { customer_id: customerId, original: body.customer_id });
      
      const { data: customer, error: customerError } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError || !customer) {
        console.error('❌ Erro ao buscar cliente:', customerError);
        return NextResponse.json(
          { success: false, errorMessage: "Cliente não encontrado (customer_id inválido)" },
          { status: 400 }
        );
      }

      console.log('✅ Cliente encontrado:', { id: customer.id, name: customer.name, address: customer.address });

      customerName = customer.name || customerName;
      neighborhood = customer.neighborhood || neighborhood;
      phone = customer.phone || phone;

      // Construir endereço de forma mais robusta
      const addressParts: string[] = [];
      
      // Endereço principal (rua, avenida, etc.) - obrigatório para ter um endereço válido
      const mainAddress = customer.address && customer.address.trim() ? customer.address.trim() : null;
      
      if (mainAddress) {
        addressParts.push(mainAddress);
        
        // Número (se houver campo separado)
        if (customer.address_number && customer.address_number.trim()) {
          addressParts.push(customer.address_number.trim());
        }
      }
      
      // Bairro
      if (customer.neighborhood && customer.neighborhood.trim()) {
        if (mainAddress) {
          addressParts.push(`Bairro: ${customer.neighborhood.trim()}`);
        } else {
          // Se não tem endereço principal, usar bairro como parte do endereço
          addressParts.push(customer.neighborhood.trim());
        }
      }
      
      // Cidade/Estado
      if (customer.city || customer.state) {
        const cityState = [customer.city, customer.state].filter(Boolean).join('/');
        if (cityState) {
          addressParts.push(cityState);
        }
      }
      
      // CEP
      if (customer.zipcode && customer.zipcode.trim()) {
        addressParts.push(`CEP: ${customer.zipcode.trim()}`);
      }

      // Só aceitar como endereço válido se tiver pelo menos o endereço principal OU (cidade E estado)
      const hasValidAddress = mainAddress || (customer.city && customer.state);
      
      deliveryAddress = hasValidAddress && addressParts.length > 0 ? addressParts.join(' - ') : null;
      
      console.log('📍 Endereço construído:', { deliveryAddress, parts: addressParts });
    }

    if (!customerName) {
      return NextResponse.json(
        { success: false, errorMessage: "Nome do cliente é obrigatório" },
        { status: 400 }
      );
    }

    if (!deliveryAddress || deliveryAddress.trim().length === 0) {
      console.error('❌ Endereço de entrega inválido:', { 
        deliveryAddress, 
        customer_id: body.customer_id,
        customer_name: customerName 
      });
      return NextResponse.json(
        { 
          success: false, 
          errorMessage: "Endereço de entrega é obrigatório. O cliente selecionado não possui endereço completo cadastrado. Por favor, cadastre o endereço do cliente (rua, número, bairro, cidade e estado) antes de marcar como entrega." 
        },
        { status: 400 }
      );
    }

    // Obter user_id: primeiro do body, depois da venda relacionada, ou usar fallback
    let userId: string | null = body.user_id || null;
    
    // Se não foi fornecido e temos sale_id, buscar da venda
    if (!userId && body.sale_id) {
      const saleId = typeof body.sale_id === 'number' ? body.sale_id : parseInt(body.sale_id, 10);
      if (!isNaN(saleId)) {
        console.log('🔍 Buscando user_id da venda:', { sale_id: saleId });
        const { data: sale, error: saleError } = await supabaseAdmin
          .from('sales')
          .select('user_id')
          .eq('id', saleId)
          .single();
        
        if (!saleError && sale?.user_id) {
          userId = sale.user_id;
          console.log('✅ user_id obtido da venda:', userId);
        } else {
          console.warn('⚠️ Não foi possível obter user_id da venda:', saleError);
        }
      }
    }
    
    // Fallback: usar UUID padrão se ainda não tiver user_id
    if (!userId) {
      userId = '00000000-0000-0000-0000-000000000000';
      console.log('⚠️ Usando user_id padrão (fallback):', userId);
    }

    const now = new Date().toISOString();
    const saleIdNum = body.sale_id ? (typeof body.sale_id === 'number' ? body.sale_id : parseInt(body.sale_id, 10)) : null;
    
    const deliveryData = {
      tenant_id: body.tenant_id,
      user_id: userId, // ✅ Adicionar user_id obrigatório
      sale_id: saleIdNum,
      customer_name: customerName,
      delivery_address: deliveryAddress,
      neighborhood,
      phone,
      delivery_fee: body.delivery_fee || 0,
      status: body.status || 'aguardando',
      notes: body.notes || null,
      driver_id: body.driver_id ? (typeof body.driver_id === 'number' ? body.driver_id : parseInt(body.driver_id, 10)) : null,
      manifest_id: body.manifest_id || null,
      created_at: now,
      updated_at: now,
    };

    // Upsert simples por sale_id (uma entrega por venda)
    if (deliveryData.sale_id) {
      try {
        const { data: existingList } = await supabaseAdmin
          .from('deliveries')
          .select('*')
          .eq('tenant_id', deliveryData.tenant_id)
          .eq('sale_id', deliveryData.sale_id)
          .limit(1);

        const existing = Array.isArray(existingList) && existingList.length > 0 ? existingList[0] : null;
        
        if (existing?.id) {
          const { data: updated, error: updateError } = await supabaseAdmin
            .from('deliveries')
            .update({
              ...deliveryData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (updateError) throw updateError;
          return NextResponse.json({ success: true, data: updated });
        }
      } catch (e) {
        console.warn('⚠️ Upsert deliveries falhou, criando novo registro:', e);
      }
    }

    console.log('💾 Tentando inserir entrega:', { 
      tenant_id: deliveryData.tenant_id,
      sale_id: deliveryData.sale_id,
      customer_name: deliveryData.customer_name,
      delivery_address: deliveryData.delivery_address?.substring(0, 50) + '...',
      data_keys: Object.keys(deliveryData)
    });

    // Verificar se tenant_id está presente antes de inserir
    if (!deliveryData.tenant_id) {
      console.error('❌ tenant_id está ausente nos dados:', deliveryData);
      return NextResponse.json(
        { 
          success: false, 
          errorMessage: "Tenant ID é obrigatório para criar entrega" 
        },
        { status: 400 }
      );
    }

    const { data: created, error } = await supabaseAdmin
      .from('deliveries')
      .insert([deliveryData])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar entrega:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      console.error('❌ Dados que tentaram ser inseridos:', deliveryData);
      
      // Mensagem de erro mais específica
      let errorMessage = "Erro ao criar entrega";
      if (error.message?.includes('tenant_id') || error.code === 'PGRST204') {
        errorMessage = "O cache do schema do Supabase não reconhece a coluna tenant_id. Isso geralmente acontece quando a coluna foi adicionada recentemente. Aguarde 2-5 minutos ou execute no Supabase SQL Editor: DROP INDEX IF EXISTS idx_deliveries_tenant; CREATE INDEX idx_deliveries_tenant ON public.deliveries(tenant_id);";
      } else if (error.message) {
        errorMessage = `Erro ao criar entrega: ${error.message}`;
      }
      
      return NextResponse.json(
        { 
          success: false, 
          errorMessage,
          error: error.message,
          details: process.env.NODE_ENV === 'development' ? error.details : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('Erro ao criar entrega:', error);
    return NextResponse.json(
      { success: false, errorMessage: "Erro ao criar entrega" },
      { status: 500 }
    );
  }
}

// PUT - atualizar status da entrega
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, errorMessage: "ID da entrega é obrigatório" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Verificar se a entrega existe
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('deliveries')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, errorMessage: "Entrega não encontrada" },
        { status: 404 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Validar status se fornecido
    if (body.status) {
      const validStatuses = ['aguardando', 'em_rota', 'entregue', 'cancelada'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, errorMessage: "Status inválido. Use: aguardando, em_rota, entregue ou cancelada" },
          { status: 400 }
        );
      }
      
      updateData.status = body.status;
      
      if (body.status === 'entregue' && !existing.delivered_at) {
        updateData.delivered_at = new Date().toISOString();
      }
    }

    if (body.driver_id !== undefined) {
      // Converter para número se for string
      updateData.driver_id = typeof body.driver_id === 'string' ? parseInt(body.driver_id, 10) : body.driver_id;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.customer_name) updateData.customer_name = body.customer_name;
    if (body.delivery_address) updateData.delivery_address = body.delivery_address;
    if (body.neighborhood !== undefined) updateData.neighborhood = body.neighborhood;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.delivery_fee !== undefined) updateData.delivery_fee = body.delivery_fee;
    if (body.manifest_id !== undefined) updateData.manifest_id = body.manifest_id;

    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar entrega:', error);
      return NextResponse.json(
        { success: false, errorMessage: "Erro ao atualizar entrega" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: delivery });
  } catch (error) {
    console.error('Erro ao atualizar entrega:', error);
    return NextResponse.json(
      { success: false, errorMessage: "Erro ao atualizar entrega" },
      { status: 500 }
    );
  }
}

// DELETE - deletar entrega
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, errorMessage: "ID da entrega é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a entrega existe
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('deliveries')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, errorMessage: "Entrega não encontrada" },
        { status: 404 }
      );
    }

    // Não permitir deletar entregas entregues
    if (existing.status === 'entregue') {
      return NextResponse.json(
        { success: false, errorMessage: "Não é possível deletar entregas já finalizadas" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('deliveries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar entrega:', error);
      return NextResponse.json(
        { success: false, errorMessage: "Erro ao deletar entrega" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Entrega deletada com sucesso" });
  } catch (error) {
    console.error('Erro ao deletar entrega:', error);
    return NextResponse.json(
      { success: false, errorMessage: "Erro ao deletar entrega" },
      { status: 500 }
    );
  }
}
