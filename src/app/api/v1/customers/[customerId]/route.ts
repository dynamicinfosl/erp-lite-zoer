import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiKeyAuth, ApiKeyContext } from '@/lib/api-key-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/v1/customers/[customerId]
 * Busca um cliente específico por ID
 */
async function getCustomerHandler(
  request: NextRequest,
  context: ApiKeyContext
) {
  try {
    const { tenant_id } = context;
    // Extrair customerId da URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const customerId = pathParts[pathParts.length - 1];

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }

    const customerIdNum = parseInt(customerId, 10);
    if (isNaN(customerIdNum)) {
      return NextResponse.json(
        { success: false, error: 'ID do cliente inválido' },
        { status: 400 }
      );
    }

    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', customerIdNum)
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    if (error) {
      console.error('❌ Erro ao buscar cliente:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar cliente: ' + error.message },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('❌ Erro no handler de busca de cliente:', error);
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
 * PATCH /api/v1/customers/[customerId]
 * Atualiza dados de um cliente existente
 */
async function updateCustomerHandler(
  request: NextRequest,
  context: ApiKeyContext
) {
  try {
    const { tenant_id } = context;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const customerId = pathParts[pathParts.length - 1];

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }

    const customerIdNum = parseInt(customerId, 10);
    if (isNaN(customerIdNum)) {
      return NextResponse.json(
        { success: false, error: 'ID do cliente inválido' },
        { status: 400 }
      );
    }

    // Verificar se o cliente existe e pertence ao tenant
    const { data: existingCustomer, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('id', customerIdNum)
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Erro ao buscar cliente:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar cliente: ' + fetchError.message },
        { status: 500 }
      );
    }

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      document,
      address,
      neighborhood,
      city,
      state,
      zipcode,
      notes,
      is_active,
    } = body;

    // Preparar dados para atualização (apenas campos fornecidos)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      updateData.name = String(name).trim();
    }
    if (email !== undefined) {
      updateData.email = email ? String(email).trim() : null;
    }
    if (phone !== undefined) {
      updateData.phone = phone ? String(phone).trim() : null;
    }
    if (document !== undefined) {
      updateData.document = document ? String(document).trim() : null;
    }
    if (address !== undefined) {
      updateData.address = address ? String(address).trim() : null;
    }
    if (neighborhood !== undefined) {
      updateData.neighborhood = neighborhood ? String(neighborhood).trim() : null;
    }
    if (city !== undefined) {
      updateData.city = city ? String(city).trim() : null;
    }
    if (state !== undefined) {
      updateData.state = state ? String(state).trim().substring(0, 2).toUpperCase() : null;
    }
    if (zipcode !== undefined) {
      updateData.zipcode = zipcode ? String(zipcode).trim() : null;
    }
    if (notes !== undefined) {
      updateData.notes = notes ? String(notes).trim() : null;
    }
    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }

    const { data: updatedCustomer, error: updateError } = await supabaseAdmin
      .from('customers')
      .update(updateData)
      .eq('id', customerIdNum)
      .eq('tenant_id', tenant_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar cliente:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar cliente: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
    });
  } catch (error) {
    console.error('❌ Erro no handler de atualização de cliente:', error);
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

export const GET = withApiKeyAuth(getCustomerHandler, 'customers:read');
export const PATCH = withApiKeyAuth(updateCustomerHandler, 'customers:update');
